import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, professionalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  createProSession,
  deleteProSession,
  getProSessionId,
  clearProSession,
  PRO_SESSION_COOKIE,
  PRO_SESSION_TTL,
} from "../lib/proAuth";

const router: IRouter = Router();

const RegisterBody = z.object({
  businessName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(200),
  email: z.email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(30).optional(),
  serviceZipCodes: z.array(z.string().max(10)).min(1).max(50),
  servicesOffered: z.array(z.string().max(100)).min(1).max(20),
});

const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

router.post("/pro/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ id: professionalsTable.id })
    .from(professionalsTable)
    .where(eq(professionalsTable.email, data.email.toLowerCase()))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const [pro] = await db
    .insert(professionalsTable)
    .values({
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email.toLowerCase(),
      passwordHash,
      phone: data.phone,
      serviceZipCodes: data.serviceZipCodes,
      servicesOffered: data.servicesOffered,
      approved: false,
    })
    .returning();

  const sid = await createProSession({
    professionalId: pro.id,
    email: pro.email,
    businessName: pro.businessName,
  });

  res.cookie(PRO_SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PRO_SESSION_TTL,
    path: "/",
  });

  req.log.info({ professionalId: pro.id }, "Professional registered");
  res.status(201).json({
    token: sid,
    professional: {
      id: pro.id,
      email: pro.email,
      businessName: pro.businessName,
      ownerName: pro.ownerName,
      approved: pro.approved,
      subscriptionStatus: pro.subscriptionStatus,
    },
    message: "Registration submitted. Your account is pending approval.",
  });
});

router.post("/pro/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  const [pro] = await db
    .select()
    .from(professionalsTable)
    .where(eq(professionalsTable.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!pro) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, pro.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!pro.approved) {
    res.status(403).json({ error: "Your account is pending approval. You will be notified when approved." });
    return;
  }

  const sid = await createProSession({
    professionalId: pro.id,
    email: pro.email,
    businessName: pro.businessName,
  });

  res.cookie(PRO_SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PRO_SESSION_TTL,
    path: "/",
  });

  req.log.info({ professionalId: pro.id }, "Professional logged in");
  res.json({
    token: sid,
    professional: {
      id: pro.id,
      email: pro.email,
      businessName: pro.businessName,
      ownerName: pro.ownerName,
      subscriptionStatus: pro.subscriptionStatus,
    },
  });
});

router.post("/pro/auth/logout", async (req, res) => {
  const sid = getProSessionId(req);
  await clearProSession(res, sid);
  res.json({ success: true });
});

router.get("/pro/auth/me", async (req, res) => {
  const sid = getProSessionId(req);
  if (!sid) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { getProSession } = await import("../lib/proAuth");
  const session = await getProSession(sid);
  if (!session) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const [pro] = await db
    .select({
      id: professionalsTable.id,
      email: professionalsTable.email,
      businessName: professionalsTable.businessName,
      ownerName: professionalsTable.ownerName,
      phone: professionalsTable.phone,
      approved: professionalsTable.approved,
      subscriptionStatus: professionalsTable.subscriptionStatus,
      serviceZipCodes: professionalsTable.serviceZipCodes,
      servicesOffered: professionalsTable.servicesOffered,
      rating: professionalsTable.rating,
      createdAt: professionalsTable.createdAt,
    })
    .from(professionalsTable)
    .where(eq(professionalsTable.id, session.professionalId))
    .limit(1);

  if (!pro) {
    await deleteProSession(sid);
    res.status(401).json({ error: "Account not found" });
    return;
  }

  res.json(pro);
});

export default router;
