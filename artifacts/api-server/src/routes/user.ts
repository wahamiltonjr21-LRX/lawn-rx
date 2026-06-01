import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const LAWN_RX_NAME_RE = /^[a-zA-Z0-9 _\-.]{3,30}$/;

const UpdateProfileBody = z.object({
  lawnRxName: z.string().min(3).max(30).regex(LAWN_RX_NAME_RE, {
    message: "Name may only contain letters, numbers, spaces, hyphens, underscores, and dots.",
  }).optional(),
  yardSquareFeet: z.number().int().min(100).max(500000).optional(),
});

router.get("/user/profile", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db
    .select({ lawnRxName: usersTable.lawnRxName, yardSquareFeet: usersTable.yardSquareFeet })
    .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  res.json({ lawnRxName: row?.lawnRxName ?? null, yardSquareFeet: row?.yardSquareFeet ?? null });
});

router.put("/user/profile", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid data" });
    return;
  }
  const update: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.lawnRxName !== undefined) update.lawnRxName = parsed.data.lawnRxName.trim();
  if (parsed.data.yardSquareFeet !== undefined) update.yardSquareFeet = parsed.data.yardSquareFeet;
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  await db.update(usersTable).set(update).where(eq(usersTable.id, req.user.id));
  const [updated] = await db
    .select({ lawnRxName: usersTable.lawnRxName, yardSquareFeet: usersTable.yardSquareFeet })
    .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  res.json({ lawnRxName: updated?.lawnRxName ?? null, yardSquareFeet: updated?.yardSquareFeet ?? null });
});

export default router;
