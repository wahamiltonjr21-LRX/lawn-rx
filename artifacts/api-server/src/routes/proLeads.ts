import { Router, type IRouter } from "express";
import { db, leadsTable, leadNotesTable, professionalsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { proAuthMiddleware } from "../middlewares/proAuthMiddleware";

const router: IRouter = Router();

router.use(proAuthMiddleware);

const LeadStatusValues = ["New", "Accepted", "Contacted", "Quoted", "Completed", "Closed"] as const;

const UpdateLeadStatusBody = z.object({
  status: z.enum(LeadStatusValues),
});

const AddLeadNoteBody = z.object({
  note: z.string().min(1).max(2000),
});

function requirePro(req: Parameters<typeof proAuthMiddleware>[0], res: Parameters<typeof proAuthMiddleware>[1]): boolean {
  if (!req.isProAuthenticated()) {
    res.status(401).json({ error: "Pro authentication required" });
    return false;
  }
  return true;
}

router.get("/pro/leads", async (req, res) => {
  if (!requirePro(req, res)) return;

  const rows = await db
    .select({
      id: leadsTable.id,
      name: leadsTable.name,
      email: leadsTable.email,
      phone: leadsTable.phone,
      address: leadsTable.address,
      zipCode: leadsTable.zipCode,
      status: leadsTable.status,
      leadScore: leadsTable.leadScore,
      diagnosisId: leadsTable.diagnosisId,
      notes: leadsTable.notes,
      createdAt: leadsTable.createdAt,
      updatedAt: leadsTable.updatedAt,
    })
    .from(leadsTable)
    .where(eq(leadsTable.professionalId, req.professional!.id))
    .orderBy(desc(leadsTable.createdAt));

  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.get("/pro/leads/:id", async (req, res) => {
  if (!requirePro(req, res)) return;

  const { id } = req.params;
  const [row] = await db
    .select()
    .from(leadsTable)
    .where(and(eq(leadsTable.id, id), eq(leadsTable.professionalId, req.professional!.id)))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const notes = await db
    .select()
    .from(leadNotesTable)
    .where(eq(leadNotesTable.leadId, id))
    .orderBy(desc(leadNotesTable.createdAt));

  res.json({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    leadNotes: notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

router.patch("/pro/leads/:id/status", async (req, res) => {
  if (!requirePro(req, res)) return;

  const { id } = req.params;
  const parsed = UpdateLeadStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [existing] = await db
    .select({ id: leadsTable.id })
    .from(leadsTable)
    .where(and(eq(leadsTable.id, id), eq(leadsTable.professionalId, req.professional!.id)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const [updated] = await db
    .update(leadsTable)
    .set({ status: parsed.data.status })
    .where(eq(leadsTable.id, id))
    .returning({ id: leadsTable.id, status: leadsTable.status });

  req.log.info({ leadId: id, status: parsed.data.status }, "Lead status updated");
  res.json(updated);
});

router.post("/pro/leads/:id/notes", async (req, res) => {
  if (!requirePro(req, res)) return;

  const { id } = req.params;
  const parsed = AddLeadNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid note" });
    return;
  }

  const [existing] = await db
    .select({ id: leadsTable.id })
    .from(leadsTable)
    .where(and(eq(leadsTable.id, id), eq(leadsTable.professionalId, req.professional!.id)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const [note] = await db
    .insert(leadNotesTable)
    .values({
      leadId: id,
      professionalId: req.professional!.id,
      note: parsed.data.note,
    })
    .returning();

  res.status(201).json({
    ...note,
    createdAt: note.createdAt.toISOString(),
  });
});

router.get("/pro/profile", async (req, res) => {
  if (!requirePro(req, res)) return;

  const [pro] = await db
    .select({
      id: professionalsTable.id,
      businessName: professionalsTable.businessName,
      ownerName: professionalsTable.ownerName,
      email: professionalsTable.email,
      phone: professionalsTable.phone,
      approved: professionalsTable.approved,
      subscriptionStatus: professionalsTable.subscriptionStatus,
      serviceZipCodes: professionalsTable.serviceZipCodes,
      servicesOffered: professionalsTable.servicesOffered,
      rating: professionalsTable.rating,
      createdAt: professionalsTable.createdAt,
    })
    .from(professionalsTable)
    .where(eq(professionalsTable.id, req.professional!.id))
    .limit(1);

  if (!pro) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({
    ...pro,
    createdAt: pro.createdAt.toISOString(),
  });
});

router.patch("/pro/profile", async (req, res) => {
  if (!requirePro(req, res)) return;

  const UpdateProfileBody = z.object({
    phone: z.string().max(30).optional(),
    serviceZipCodes: z.array(z.string().max(10)).min(1).max(50).optional(),
    servicesOffered: z.array(z.string().max(100)).min(1).max(20).optional(),
  });

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.serviceZipCodes !== undefined) updateData.serviceZipCodes = parsed.data.serviceZipCodes;
  if (parsed.data.servicesOffered !== undefined) updateData.servicesOffered = parsed.data.servicesOffered;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  await db
    .update(professionalsTable)
    .set(updateData)
    .where(eq(professionalsTable.id, req.professional!.id));

  const [updated] = await db
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
    .where(eq(professionalsTable.id, req.professional!.id))
    .limit(1);

  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
