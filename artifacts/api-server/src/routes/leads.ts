import { Router, type IRouter } from "express";
import { db, leadsTable, diagnosesTable, professionalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { computeLeadScore } from "../lib/leadScoring";
import { findMatchingProfessionalIds } from "../lib/zipMatcher";
import { sendLeadNotificationEmail, sendLeadConfirmationEmail } from "../lib/emailService";

const router: IRouter = Router();

const CaptureLeadBody = z.object({
  name: z.string().min(2).max(200),
  email: z.email(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  zipCode: z.string().min(5).max(10),
  diagnosisId: z.string().uuid().optional(),
  serviceType: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

router.post("/leads", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CaptureLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;

  let diagnosisTitle: string | null = null;
  let severity = "Medium";
  let resolvedDiagnosisId: string | null = null;

  if (data.diagnosisId) {
    const [diag] = await db
      .select({ title: diagnosesTable.title, severity: diagnosesTable.severity, userId: diagnosesTable.userId })
      .from(diagnosesTable)
      .where(eq(diagnosesTable.id, data.diagnosisId))
      .limit(1);

    if (diag && diag.userId === req.user.id) {
      diagnosisTitle = diag.title;
      severity = diag.severity;
      resolvedDiagnosisId = data.diagnosisId;
    }
  }

  const leadScore = computeLeadScore({
    severity,
    diagnosisTitle: diagnosisTitle ?? undefined,
    hasPhone: !!data.phone,
    hasAddress: !!data.address,
  });

  const matchingProfessionalIds = await findMatchingProfessionalIds(data.zipCode);
  const professionalId = matchingProfessionalIds[0] ?? null;

  const [lead] = await db
    .insert(leadsTable)
    .values({
      userId: req.user.id,
      diagnosisId: resolvedDiagnosisId,
      professionalId,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      address: data.address ?? null,
      zipCode: data.zipCode,
      serviceType: data.serviceType ?? null,
      leadScore,
      notes: data.notes ?? null,
      status: "New",
    })
    .returning();

  req.log.info({ leadId: lead.id, professionalId, leadScore }, "Lead captured");

  if (professionalId) {
    const [pro] = await db
      .select({
        email: professionalsTable.email,
        businessName: professionalsTable.businessName,
      })
      .from(professionalsTable)
      .where(eq(professionalsTable.id, professionalId))
      .limit(1);

    if (pro) {
      void sendLeadNotificationEmail({
        toProfessionalEmail: pro.email,
        businessName: pro.businessName,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        zipCode: lead.zipCode,
        diagnosisTitle,
        leadScore,
        leadId: lead.id,
      });

      void sendLeadConfirmationEmail({
        toHomeownerEmail: lead.email,
        homeownerName: lead.name,
        businessName: pro.businessName,
      });
    }
  } else {
    void sendLeadConfirmationEmail({
      toHomeownerEmail: lead.email,
      homeownerName: lead.name,
      businessName: "a local LawnRX partner",
    });
  }

  res.status(201).json({
    id: lead.id,
    leadScore,
    matchedProfessional: !!professionalId,
    message: professionalId
      ? "Your request has been sent to a local pro. Expect contact soon."
      : "Request submitted. We'll connect you with a pro in your area soon.",
  });
});

router.get("/leads", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select({
      id: leadsTable.id,
      diagnosisId: leadsTable.diagnosisId,
      name: leadsTable.name,
      email: leadsTable.email,
      phone: leadsTable.phone,
      zipCode: leadsTable.zipCode,
      status: leadsTable.status,
      leadScore: leadsTable.leadScore,
      createdAt: leadsTable.createdAt,
    })
    .from(leadsTable)
    .where(eq(leadsTable.userId, req.user.id));

  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
