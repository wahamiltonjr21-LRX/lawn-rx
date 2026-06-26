import crypto from "crypto";
import { type Request, type Response } from "express";
import { db, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const PRO_SESSION_COOKIE = "pro_sid";
export const PRO_SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface ProSessionData {
  professionalId: string;
  email: string;
  businessName: string;
}

export async function createProSession(data: ProSessionData): Promise<string> {
  const sid = `pro_${crypto.randomBytes(32).toString("hex")}`;
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + PRO_SESSION_TTL),
  });
  return sid;
}

export async function getProSession(sid: string): Promise<ProSessionData | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteProSession(sid);
    return null;
  }

  const data = row.sess as unknown as Record<string, unknown>;
  if (!data.professionalId) return null;

  return data as unknown as ProSessionData;
}

export async function deleteProSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearProSession(res: Response, sid?: string): Promise<void> {
  if (sid) await deleteProSession(sid);
  res.clearCookie(PRO_SESSION_COOKIE, { path: "/" });
}

export function getProSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer pro_")) {
    return authHeader.slice(7);
  }
  if (authHeader?.startsWith("Bearer ") && authHeader.slice(7).startsWith("pro_")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[PRO_SESSION_COOKIE];
}
