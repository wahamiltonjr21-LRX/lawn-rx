import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, treatmentLogsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const LogTreatmentBody = z.object({
  planId: z.string().uuid().optional(),
  planTitle: z.string().min(1).max(200),
  stepTitle: z.string().min(1).max(200),
  treatmentType: z.string().min(1).max(50),
  scheduledDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  productUsed: z.string().max(200).optional(),
});

router.get("/treatments", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const logs = await db
    .select()
    .from(treatmentLogsTable)
    .where(eq(treatmentLogsTable.userId, req.user.id))
    .orderBy(desc(treatmentLogsTable.completedAt));
  res.json(logs.map((l) => ({
    ...l,
    completedAt: l.completedAt.toISOString(),
    scheduledDate: l.scheduledDate?.toISOString() ?? null,
  })));
});

router.post("/treatments", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = LogTreatmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const [log] = await db.insert(treatmentLogsTable).values({
    userId: req.user.id,
    planId: parsed.data.planId ?? null,
    planTitle: parsed.data.planTitle,
    stepTitle: parsed.data.stepTitle,
    treatmentType: parsed.data.treatmentType,
    scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
    notes: parsed.data.notes ?? null,
    productUsed: parsed.data.productUsed ?? null,
  }).returning();
  res.status(201).json({ ...log, completedAt: log.completedAt.toISOString(), scheduledDate: log.scheduledDate?.toISOString() ?? null });
});

router.delete("/treatments/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(treatmentLogsTable)
    .where(and(eq(treatmentLogsTable.id, req.params.id), eq(treatmentLogsTable.userId, req.user.id)));
  res.status(204).send();
});

export default router;
