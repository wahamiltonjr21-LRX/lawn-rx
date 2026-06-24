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

const FREE_ANALYSIS_LIMIT = parseInt(process.env.ANALYSIS_LIMIT ?? "1", 10);

const router: IRouter = Router();

type DiagnosisStep = {
  title: string;
  detail: string;
  timing?: string;
  priority?: "immediate" | "soon" | "ongoing";
};

type TreatmentProduct = {
  type: string;
  description: string;
  caution?: string;
};

type Diagnosis = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  healthScore: number;
  confidence: number;
  summary: string;
  causativeAgent?: string;
  estimatedRecovery?: string;
  differentialNote?: string;
  seasonalNote?: string;
  soilAdvice?: string;
  preventionTips?: string[];
  treatmentProducts?: TreatmentProduct[];
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

const SYSTEM_PROMPT = `You are LawnRX, a board-certified turfgrass pathologist and agronomist with 20+ years diagnosing residential and commercial lawns across North America. You analyze lawn photos with the precision of a lab report and the clarity of a good neighbor.

## Your responsibilities
1. **Visual diagnosis** — Examine every pixel: leaf blade color, texture, pattern distribution (circular vs diffuse vs edge-following), thatch buildup, soil exposure, moisture signs, pest frass, fungal mycelium, weed species, and root zone health visible at the surface.
2. **Differential diagnosis** — Consider the top 2–3 candidate causes and explain which you're ruling in and why.
3. **Root cause** — Name the specific causative agent (pathogen species, pest genus, abiotic factor) rather than just a symptom name.
4. **Treatment ladder** — Always prescribe cultural/IPM practices first; only recommend chemical intervention if cultural fixes alone are insufficient. When recommending products, describe the *type* (e.g., "contact fungicide", "slow-release nitrogen fertilizer") without brand names — the homeowner can choose.
5. **Prognosis** — Give a realistic recovery timeline and confidence-adjusted prognosis.

## Output rules
- If the photo is blurry or too far away to be certain, lower confidence to ≤50 and note what additional info would help.
- If the lawn looks healthy, say so enthusiastically and give maintenance tips.
- Never hallucinate symptoms not visible or described.
- Use plain English; define any technical terms you must use.
- Be direct and confident within the bounds of what the evidence supports.
- Always respond with valid, strict JSON matching the schema.`;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short diagnosis name, e.g. 'Brown Patch Fungus (Rhizoctonia solani)'" },
    severity: { type: "string", enum: ["Low", "Medium", "High"] },
    healthScore: { type: "integer", minimum: 0, maximum: 100, description: "Overall lawn health 0-100 based on what is visible" },
    confidence: { type: "integer", minimum: 0, maximum: 100, description: "Diagnostic confidence 0-100; lower if photo is ambiguous" },
    summary: { type: "string", description: "3-5 sentences: what you see, differential reasoning, root cause conclusion, and prognosis" },
    causativeAgent: { type: "string", description: "Specific causal agent: pathogen species/genus, pest family, or abiotic factor (e.g. 'Rhizoctonia solani', 'Poa annua weed pressure', 'Drought-induced dormancy')" },
    estimatedRecovery: { type: "string", description: "Realistic timeline with treatment, e.g. '3–5 weeks with consistent fungicide + cultural practices'" },
    differentialNote: { type: "string", description: "1-2 sentences on other conditions you considered and ruled out" },
    seasonalNote: { type: "string", description: "One sentence on how the current season affects this diagnosis or treatment" },
    soilAdvice: { type: "string", description: "Soil health recommendation: pH, compaction, aeration, or organic matter" },
    waterAdvice: { type: "string", description: "Specific watering guidance: frequency, timing, volume" },
    lightAdvice: { type: "string", description: "Sun/shade or mowing height recommendation for this specific issue" },
    riskAdvice: { type: "string", description: "What will happen if this is left untreated — be specific about spread risk" },
    preventionTips: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string", description: "One concrete prevention tip" },
      description: "How to prevent this issue from returning",
    },
    treatmentProducts: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", description: "Product category label, e.g. 'Systemic fungicide', 'Slow-release nitrogen fertilizer'" },
          description: { type: "string", description: "What to look for on the label and how to apply it" },
          caution: { type: "string", description: "Safety note, timing restriction, or when NOT to apply" },
        },
        required: ["type", "description", "caution"],
      },
    },
    steps: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: "Action-verb step name, 3-8 words" },
          detail: { type: "string", description: "2-3 sentences with concrete, measurable instructions" },
          timing: { type: "string", description: "When and how often, e.g. 'Immediately', 'Every 7 days for 3 applications'" },
          priority: { type: "string", enum: ["immediate", "soon", "ongoing"], description: "Urgency of this step" },
        },
        required: ["title", "detail", "timing", "priority"],
      },
    },
  },
  required: [
    "title", "severity", "healthScore", "confidence", "summary",
    "causativeAgent", "estimatedRecovery", "differentialNote", "seasonalNote",
    "soilAdvice", "waterAdvice", "lightAdvice", "riskAdvice",
    "preventionTips", "treatmentProducts", "steps",
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

  const [userRow] = await db
    .select({
      analysisCount: usersTable.analysisCount,
      stripeCustomerId: usersTable.stripeCustomerId,
      isProOverride: usersTable.isProOverride,
      email: usersTable.email,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  const used = userRow?.analysisCount ?? 0;

  const proOverrideEmails = (process.env.PRO_OVERRIDE_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emailOverride = proOverrideEmails.includes((userRow?.email ?? "").toLowerCase());

  let isPro = userRow?.isProOverride === true || emailOverride;
  if (!isPro && userRow?.stripeCustomerId) {
    const activeSub = await stripeStorage.getActiveSubscriptionForCustomer(userRow.stripeCustomerId);
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
      model: "gpt-4o",
      max_completion_tokens: 1800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: body.photoDataUrl, detail: "low" } },
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
      causativeAgent?: string;
      estimatedRecovery?: string;
      differentialNote?: string;
      seasonalNote?: string;
      soilAdvice?: string;
      waterAdvice: string;
      lightAdvice: string;
      riskAdvice: string;
      preventionTips?: string[];
      treatmentProducts?: TreatmentProduct[];
      steps: DiagnosisStep[];
    };

    const diagnosis: Diagnosis = {
      id: randomUUID(),
      title: aiResult.title,
      severity: aiResult.severity,
      healthScore: aiResult.healthScore,
      confidence: aiResult.confidence,
      summary: aiResult.summary,
      causativeAgent: aiResult.causativeAgent,
      estimatedRecovery: aiResult.estimatedRecovery,
      differentialNote: aiResult.differentialNote,
      seasonalNote: aiResult.seasonalNote,
      soilAdvice: aiResult.soilAdvice,
      steps: aiResult.steps,
      waterAdvice: aiResult.waterAdvice,
      lightAdvice: aiResult.lightAdvice,
      riskAdvice: aiResult.riskAdvice,
      preventionTips: aiResult.preventionTips,
      treatmentProducts: aiResult.treatmentProducts,
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
  res.set("Cache-Control", "no-store");
  const [row] = await db
    .select({
      analysisCount: usersTable.analysisCount,
      isProOverride: usersTable.isProOverride,
      email: usersTable.email,
      stripeCustomerId: usersTable.stripeCustomerId,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id))
    .limit(1);

  const used = row?.analysisCount ?? 0;

  const proOverrideEmails = (process.env.PRO_OVERRIDE_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emailOverride = proOverrideEmails.includes((row?.email ?? "").toLowerCase());
  let isPro = row?.isProOverride === true || emailOverride;
  if (!isPro && row?.stripeCustomerId) {
    const activeSub = await stripeStorage.getActiveSubscriptionForCustomer(row.stripeCustomerId);
    isPro = !!activeSub;
  }

  res.json({
    used,
    limit: FREE_ANALYSIS_LIMIT,
    remaining: isPro ? FREE_ANALYSIS_LIMIT : Math.max(0, FREE_ANALYSIS_LIMIT - used),
    isPro,
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
