import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, lawnNotesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const NoteBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  entryType: z.enum(["completed", "scheduled", "note"]).default("note"),
  treatmentType: z.string().max(50).optional(),
  productUsed: z.string().max(200).optional(),
});

const UpdateNoteBody = NoteBody.partial().extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().min(1).max(200).optional(),
});

router.get("/journal", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const notes = await db
    .select()
    .from(lawnNotesTable)
    .where(eq(lawnNotesTable.userId, req.user.id))
    .orderBy(desc(lawnNotesTable.date), desc(lawnNotesTable.createdAt));
  res.json(notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  })));
});

router.post("/journal", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = NoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error.issues }); return; }
  const [note] = await db.insert(lawnNotesTable).values({
    userId: req.user.id,
    date: parsed.data.date,
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    entryType: parsed.data.entryType,
    treatmentType: parsed.data.treatmentType ?? null,
    productUsed: parsed.data.productUsed ?? null,
  }).returning();
  res.status(201).json({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() });
});

router.put("/journal/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error.issues }); return; }
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (parsed.data.date !== undefined) updates.date = parsed.data.date;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.body !== undefined) updates.body = parsed.data.body;
  if (parsed.data.entryType !== undefined) updates.entryType = parsed.data.entryType;
  if (parsed.data.treatmentType !== undefined) updates.treatmentType = parsed.data.treatmentType;
  if (parsed.data.productUsed !== undefined) updates.productUsed = parsed.data.productUsed;
  const [note] = await db.update(lawnNotesTable)
    .set(updates)
    .where(and(eq(lawnNotesTable.id, req.params.id), eq(lawnNotesTable.userId, req.user.id)))
    .returning();
  if (!note) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() });
});

router.delete("/journal/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.delete(lawnNotesTable)
    .where(and(eq(lawnNotesTable.id, req.params.id), eq(lawnNotesTable.userId, req.user.id)));
  res.status(204).send();
});

export default router;
