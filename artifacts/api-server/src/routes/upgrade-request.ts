import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, upgradeRequestsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/upgrade-request", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rawMessage = req.body?.message;
  const message = typeof rawMessage === "string" ? rawMessage.slice(0, 1000) : "";

  const [existing] = await db
    .select()
    .from(upgradeRequestsTable)
    .where(eq(upgradeRequestsTable.userId, req.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(upgradeRequestsTable)
      .set({ message, updatedAt: new Date() })
      .where(eq(upgradeRequestsTable.userId, req.user.id))
      .returning();
    res.json({
      submitted: true,
      status: updated.status,
      message: updated.message,
      createdAt: updated.createdAt.toISOString(),
    });
  } else {
    const [created] = await db
      .insert(upgradeRequestsTable)
      .values({ userId: req.user.id, message })
      .returning();
    res.json({
      submitted: true,
      status: created.status,
      message: created.message,
      createdAt: created.createdAt.toISOString(),
    });
  }
});

router.get("/upgrade-request", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [row] = await db
    .select()
    .from(upgradeRequestsTable)
    .where(eq(upgradeRequestsTable.userId, req.user.id))
    .limit(1);

  if (!row) {
    res.json({ submitted: false, status: null, message: null, createdAt: null });
    return;
  }

  res.json({
    submitted: true,
    status: row.status,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
