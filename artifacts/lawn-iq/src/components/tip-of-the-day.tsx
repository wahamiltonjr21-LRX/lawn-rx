import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const FALLBACK_TIPS = [
  "Mow at the highest setting for your grass type — taller grass shades soil, reduces evaporation, and crowds out weeds naturally.",
  "Water deeply and infrequently (1 inch per week). This trains roots to grow deeper and builds drought resilience.",
  "The best time to water is between 4–8 AM — less wind, cooler temps, and dry blades by nightfall reduce fungal pressure.",
  "Leave grass clippings on the lawn. They decompose quickly and return up to 25% of a lawn's nitrogen needs.",
  "Never remove more than one-third of the blade height in a single mow — scalping stresses the plant and invites weeds.",
  "A soil pH of 6.0–7.0 is the sweet spot for most turf. Test your soil before adding fertilizer or lime.",
];

export function TipOfTheDay() {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fallbackIndex] = useState(() => Math.floor(Math.random() * FALLBACK_TIPS.length));

  const fetchTip = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/tip`, { credentials: "include" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      if (data.tip) {
        setTip(data.tip);
      } else {
        setTip(FALLBACK_TIPS[fallbackIndex]);
      }
    } catch {
      setTip(FALLBACK_TIPS[fallbackIndex]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTip(); }, []);

  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
        <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            AI Pro Tip of the Day
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-800/60 font-semibold normal-case tracking-normal">AI</span>
          </p>
          <button
            onClick={fetchTip}
            disabled={loading}
            className="p-1 rounded-lg text-emerald-600/60 dark:text-emerald-400/60 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40"
            title="New tip"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-emerald-700/60 dark:text-emerald-300/60">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-sm">Generating today's tip…</span>
          </div>
        ) : (
          <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed">{tip}</p>
        )}
      </div>
    </div>
  );
}
