import crypto from "node:crypto";
import * as oidc from "openid-client";
import { z } from "zod";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  ExchangeMobileAuthorizationCodeBody,
  ExchangeMobileAuthorizationCodeResponse,
  LogoutMobileSessionResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  getOidcConfig,
  getSession,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;
const MOBILE_PKCE_TTL = 10 * 60 * 1000;
const COMPLETED_SESSION_TTL = 5 * 60 * 1000;

interface PendingMobileSession {
  codeVerifier: string;
  nonce: string;
  deviceCode: string;
  expiresAt: number;
}
interface CompletedMobileSession {
  sid: string;
  expiresAt: number;
}
const pendingMobileSessions = new Map<string, PendingMobileSession>();
const completedMobileSessions = new Map<string, CompletedMobileSession>();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingMobileSessions) {
    if (val.expiresAt < now) pendingMobileSessions.delete(key);
  }
  for (const [key, val] of completedMobileSessions) {
    if (val.expiresAt < now) completedMobileSessions.delete(key);
  }
}, 60_000);

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const returnTo = getSafeReturnTo(req.query.returnTo);
  const popup = req.query.popup === "1" ? "1" : "";

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);
  if (popup) setOidcCookie(res, "popup", "1");

  res.redirect(redirectTo.href);
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("/api/login");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  const isPopup = req.cookies?.popup === "1";

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });
  res.clearCookie("popup", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  if (isPopup) {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html><html><body><script>window.close();</script></body></html>`);
    return;
  }

  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const origin = getOrigin(req);

  const sid = getSessionId(req);
  await clearSession(res, sid);

  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: origin,
  });

  res.redirect(endSessionUrl.href);
});

router.post(
  "/mobile-auth/token-exchange",
  async (req: Request, res: Response) => {
    const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required parameters" });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("iss", ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: "No claims in ID token" });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json(ExchangeMobileAuthorizationCodeResponse.parse({ token: sid }));
    } catch (err) {
      req.log.error({ err }, "Mobile token exchange error");
      res.status(500).json({ error: "Token exchange failed" });
    }
  },
);

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
});

// ── Native mobile OAuth (Chrome Custom Tabs + server-side polling) ────────────
// No deep links or AndroidManifest intent filters required.
// Flow: begin → open Chrome Custom Tabs → OAuth → mobile-callback (stores sid)
//       → app polls /mobile-auth/poll until sid is ready → activate-cookie

router.get("/mobile-auth/begin", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const origin = getOrigin(req);
  const callbackUrl = `${origin}/api/mobile-callback`;

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const deviceCode = crypto.randomBytes(24).toString("hex");

  const authorizationUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  pendingMobileSessions.set(state, {
    codeVerifier,
    nonce,
    deviceCode,
    expiresAt: Date.now() + MOBILE_PKCE_TTL,
  });

  res.json({ authorizationUrl: authorizationUrl.href, deviceCode });
});

router.get("/mobile-callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const origin = getOrigin(req);
  const callbackUrl = `${origin}/api/mobile-callback`;

  const stateParam = req.query.state as string | undefined;
  const errorHtml = (msg: string) =>
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px">` +
    `<h2>Sign-in failed</h2><p>${msg}</p><p>Please close this tab and try again.</p></body></html>`;

  if (!stateParam) {
    res.setHeader("Content-Type", "text/html");
    res.send(errorHtml("Missing state parameter."));
    return;
  }

  const pending = pendingMobileSessions.get(stateParam);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingMobileSessions.delete(stateParam);
    res.setHeader("Content-Type", "text/html");
    res.send(errorHtml("Session expired or invalid. Please try again."));
    return;
  }
  pendingMobileSessions.delete(stateParam);

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: pending.codeVerifier,
      expectedNonce: pending.nonce,
      expectedState: stateParam,
      idTokenExpected: true,
    });
  } catch (err) {
    req.log.error({ err }, "Mobile OAuth callback error");
    res.setHeader("Content-Type", "text/html");
    res.send(errorHtml("Token exchange failed. Please try again."));
    return;
  }

  const claims = tokens.claims();
  if (!claims) {
    res.setHeader("Content-Type", "text/html");
    res.send(errorHtml("No identity claims returned."));
    return;
  }

  const dbUser = await upsertUser(claims as unknown as Record<string, unknown>);

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);

  completedMobileSessions.set(pending.deviceCode, {
    sid,
    expiresAt: Date.now() + COMPLETED_SESSION_TTL,
  });

  res.setHeader("Content-Type", "text/html");
  res.send(
    `<!DOCTYPE html><html><head><title>Signed in – LawnRX</title></head>` +
      `<body style="font-family:sans-serif;text-align:center;padding:60px 24px;background:#f0fdf4">` +
      `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` +
      `<h2 style="color:#15803d;margin-top:16px;font-size:22px">Signed in successfully</h2>` +
      `<p style="color:#374151;font-size:16px;margin-top:8px">Tap the <strong>✕ close button</strong> at the top of this screen to return to LawnRX.</p>` +
      `<div style="margin-top:32px;padding:16px 20px;background:#dcfce7;border-radius:12px;color:#166534;font-size:14px">` +
      `👆 Close this tab — your session is saved and ready.</div>` +
      `</body></html>`,
  );
});

router.get("/mobile-auth/poll", (req: Request, res: Response) => {
  const deviceCode = req.query.deviceCode as string | undefined;
  if (!deviceCode) {
    res.status(400).json({ error: "Missing deviceCode" });
    return;
  }

  const completed = completedMobileSessions.get(deviceCode);
  if (!completed || completed.expiresAt < Date.now()) {
    completedMobileSessions.delete(deviceCode);
    res.json({ ready: false });
    return;
  }

  completedMobileSessions.delete(deviceCode);
  res.json({ ready: true, sid: completed.sid });
});

const ActivateCookieBody = z.object({ sid: z.string().min(1) });

router.post(
  "/mobile-auth/activate-cookie",
  async (req: Request, res: Response) => {
    const parsed = ActivateCookieBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing sid" });
      return;
    }

    const session = await getSession(parsed.data.sid);
    if (!session) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    setSessionCookie(res, parsed.data.sid);
    res.json({ success: true });
  },
);

export default router;
