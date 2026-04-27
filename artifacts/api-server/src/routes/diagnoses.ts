import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, diagnosesTable, usersTable } from "@workspace/db";
import {
  AnalyzeLawnBody,
  SaveDiagnosisBody,
  GetDiagnosisParams,
  DeleteDiagnosisParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { stripeStorage } from "../stripeStorage";

const FREE_ANALYSIS_LIMIT = 5;

const router: IRouter = Router();

type DiagnosisStep = {
  title: string;
  detail: string;
  timing?: string;
};

type Diagnosis = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  healthScore: number;
  confidence: number;
  summary: string;
  steps: DiagnosisStep[];
  waterAdvice: string;
  lightAdvice: string;
  riskAdvice: string;
  grassType?: string;
  issueAppearance?: string;
  description?: string;
  photoDataUrl?: string;
  createdAt: string;
};

function rowToDiagnosis(row: typeof diagnosesTable.$inferSelect): Diagnosis {
  return {
    id: row.id,
    title: row.title,
    severity: row.severity as Diagnosis["severity"],
    healthScore: row.healthScore,
    confidence: row.confidence,
    summary: row.summary,
    steps: (row.steps as DiagnosisStep[]) ?? [],
    waterAdvice: row.waterAdvice,
    lightAdvice: row.lightAdvice,
    riskAdvice: row.riskAdvice,
    grassType: row.grassType ?? undefined,
    issueAppearance: row.issueAppearance ?? undefined,
    description: row.description ?? undefined,
    photoDataUrl: row.photoDataUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

const SYSTEM_PROMPT = `You are LawnIQ, a friendly but rigorous turfgrass and home-lawn expert. You help homeowners diagnose what is wrong with their lawn from a photo plus a few details, and you give them a clear, actionable recovery plan.

Always respond with valid JSON matching the requested schema. Be specific, use plain English, avoid jargon. Don't claim certainty when the photo is ambiguous — lower the confidence and explain what would help. Never invent product names. Recommend cultural practices first (mowing height, watering, aeration, overseeding) before chemicals. If the lawn looks healthy in the photo, say so.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short diagnosis name, e.g. 'Likely Brown Patch Fungus'" },
    severity: { type: "string", enum: ["Low", "Medium", "High"] },
    healthScore: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string", description: "2-4 sentences explaining what is happening and why" },
    waterAdvice: { type: "string", description: "One short sentence about watering for this lawn right now" },
    lightAdvice: { type: "string", description: "One short sentence about sun/shade for this lawn right now" },
    riskAdvice: { type: "string", description: "One short sentence about what could go wrong if ignored" },
    steps: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "Short step name, 2-6 words" },
          detail: { type: "string", description: "1-2 sentences with concrete instructions" },
          timing: { type: "string", description: "When to do this, e.g. 'This week', 'Next 2 weeks', 'Once weekly'" },
        },
        required: ["title", "detail", "timing"],
      },
    },
  },
  required: [
    "title",
    "severity",
    "healthScore",
    "confidence",
    "summary",
    "waterAdvice",
    "lightAdvice",
    "riskAdvice",
    "steps",
  ],
} as const;

router.post("/diagnoses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = AnalyzeLawnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const body = parsed.data;

  const [usageRow] = await db
    .select({ analysisCount: usersTable.analysisCount, stripeCustomerId: usersTable.stripeCustomerId })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  const used = usageRow?.analysisCount ?? 0;

  let isPro = false;
  if (usageRow?.stripeCustomerId) {
    const activeSub = await stripeStorage.getActiveSubscriptionForCustomer(usageRow.stripeCustomerId);
    isPro = !!activeSub;
  }

  if (!isPro && used >= FREE_ANALYSIS_LIMIT) {
    res.status(403).json({
      error: `You've used all ${FREE_ANALYSIS_LIMIT} of your free AI lawn analyses.`,
      used,
      limit: FREE_ANALYSIS_LIMIT,
    });
    return;
  }

  const userText = `Lawn details from the homeowner:
- Visual appearance: ${body.issueAppearance}
- Grass type: ${body.grassType}
- Description: ${body.description?.trim() || "(none provided)"}
- Location / climate: ${body.location?.trim() || "(not provided)"}

Look at the attached photo carefully. Diagnose the most likely cause and produce the recovery plan as JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: body.photoDataUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lawn_diagnosis",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      req.log.error({ completion }, "AI returned no content");
      res.status(502).json({ error: "AI returned empty response" });
      return;
    }

    const aiResult = JSON.parse(content) as {
      title: string;
      severity: "Low" | "Medium" | "High";
      healthScore: number;
      confidence: number;
      summary: string;
      waterAdvice: string;
      lightAdvice: string;
      riskAdvice: string;
      steps: DiagnosisStep[];
    };

    const diagnosis: Diagnosis = {
      id: randomUUID(),
      title: aiResult.title,
      severity: aiResult.severity,
      healthScore: aiResult.healthScore,
      confidence: aiResult.confidence,
      summary: aiResult.summary,
      steps: aiResult.steps,
      waterAdvice: aiResult.waterAdvice,
      lightAdvice: aiResult.lightAdvice,
      riskAdvice: aiResult.riskAdvice,
      grassType: body.grassType,
      issueAppearance: body.issueAppearance,
      description: body.description,
      photoDataUrl: body.photoDataUrl,
      createdAt: new Date().toISOString(),
    };

    await db
      .update(usersTable)
      .set({ analysisCount: sql`${usersTable.analysisCount} + 1` })
      .where(eq(usersTable.id, req.user.id));

    res.json(diagnosis);
  } catch (err) {
    req.log.error({ err }, "Failed to analyze lawn");
    res.status(502).json({ error: "Failed to analyze lawn photo. Please try again." });
  }
});

router.get("/diagnoses/usage", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [row] = await db
    .select({ analysisCount: usersTable.analysisCount })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);
  const used = row?.analysisCount ?? 0;
  res.json({
    used,
    limit: FREE_ANALYSIS_LIMIT,
    remaining: Math.max(0, FREE_ANALYSIS_LIMIT - used),
  });
});

router.get("/diagnoses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(diagnosesTable)
    .where(eq(diagnosesTable.userId, req.user.id))
    .orderBy(desc(diagnosesTable.createdAt));
  res.json(rows.map(rowToDiagnosis));
});

router.get("/diagnoses/summary", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(diagnosesTable)
    .where(eq(diagnosesTable.userId, req.user.id));
  const totalSaved = rows.length;
  const averageHealthScore = totalSaved
    ? Math.round(rows.reduce((acc, r) => acc + r.healthScore, 0) / totalSaved)
    : 0;
  const severityCounts: { Low: number; Medium: number; High: number } = {
    Low: 0,
    Medium: 0,
    High: 0,
  };
  for (const r of rows) {
    if (r.severity === "Low" || r.severity === "Medium" || r.severity === "High") {
      severityCounts[r.severity as "Low" | "Medium" | "High"] += 1;
    }
  }

  const issueTally = new Map<string, number>();
  for (const r of rows) {
    if (r.issueAppearance) {
      issueTally.set(r.issueAppearance, (issueTally.get(r.issueAppearance) ?? 0) + 1);
    }
  }
  const topIssue = [...issueTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const latestSavedAt = rows
    .map((r) => r.createdAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  res.json({
    totalSaved,
    averageHealthScore,
    severityCounts,
    latestSavedAt: latestSavedAt ? latestSavedAt.toISOString() : null,
    topIssue,
  });
});

router.post("/diagnoses/save", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SaveDiagnosisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { diagnosis, nickname } = parsed.data;

  const [row] = await db
    .insert(diagnosesTable)
    .values({
      userId: req.user.id,
      title: diagnosis.title,
      severity: diagnosis.severity,
      healthScore: diagnosis.healthScore,
      confidence: diagnosis.confidence,
      summary: diagnosis.summary,
      steps: diagnosis.steps,
      waterAdvice: diagnosis.waterAdvice,
      lightAdvice: diagnosis.lightAdvice,
      riskAdvice: diagnosis.riskAdvice,
      grassType: diagnosis.grassType ?? null,
      issueAppearance: diagnosis.issueAppearance ?? null,
      description: diagnosis.description ?? null,
      photoDataUrl: diagnosis.photoDataUrl ?? null,
      nickname: nickname ?? null,
    })
    .returning();

  res.json(rowToDiagnosis(row));
});

router.get("/diagnoses/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = GetDiagnosisParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(diagnosesTable)
    .where(and(eq(diagnosesTable.id, parsed.data.id), eq(diagnosesTable.userId, req.user.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rowToDiagnosis(row));
});

router.delete("/diagnoses/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = DeleteDiagnosisParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .delete(diagnosesTable)
    .where(and(eq(diagnosesTable.id, parsed.data.id), eq(diagnosesTable.userId, req.user.id)));
  res.status(204).send();
});

export default router;
