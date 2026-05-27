import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

let cachedTip: { tip: string; date: string } | null = null;

router.get("/tip", async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedTip && cachedTip.date === today) {
    res.json({ tip: cachedTip.tip });
    return;
  }
  try {
    const month = new Date().toLocaleString("en-US", { month: "long" });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional lawn care agronomist. Generate a single, specific, actionable lawn care tip for today. The tip should be relevant to the current month. Keep it to 1-2 sentences. Be direct and practical — no filler phrases like 'Remember to' or 'It is important to'. Do not include a title or label.",
        },
        {
          role: "user",
          content: `Generate a lawn care tip for ${month}.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.9,
    });
    const tip = completion.choices[0]?.message?.content?.trim() ?? "";
    if (tip) {
      cachedTip = { tip, date: today };
      res.json({ tip });
    } else {
      res.status(500).json({ error: "No tip generated" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to generate tip" });
  }
});

export default router;
