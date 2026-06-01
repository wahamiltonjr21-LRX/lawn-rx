import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const LAWN_RX_NAME_RE = /^[a-zA-Z0-9 _\-.]{3,30}$/;

const UpdateProfileBody = z.object({
  lawnRxName: z.string().min(3).max(30).regex(LAWN_RX_NAME_RE, {
    message: "Name may only contain letters, numbers, spaces, hyphens, underscores, and dots.",
  }),
});

router.get("/user/profile", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [row] = await db.select({ lawnRxName: usersTable.lawnRxName })
    .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  res.json({ lawnRxName: row?.lawnRxName ?? null });
});

router.put("/user/profile", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid name" });
    return;
  }
  const name = parsed.data.lawnRxName.trim();
  await db.update(usersTable).set({ lawnRxName: name }).where(eq(usersTable.id, req.user.id));
  res.json({ lawnRxName: name });
});

export default router;
