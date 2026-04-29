import { useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";

const TIPS = [
  "Mow at the highest recommended setting for your grass type — taller grass shades soil, reduces evaporation, and crowds out weeds naturally.",
  "Water deeply and infrequently (1 inch per week) rather than a little every day. This trains roots to grow deeper and builds drought resilience.",
  "The best time to water is between 4–8 AM. Less wind, cooler temps, and dry blades by nightfall all reduce fungal disease pressure.",
  "Leave grass clippings on the lawn. They decompose quickly and return up to 25% of a lawn's nitrogen needs — free fertilizer.",
  "Aerate compacted soil every 1–2 years in fall (cool-season grasses) or late spring (warm-season). Oxygen, water, and nutrients reach the root zone faster.",
  "Never remove more than one-third of the blade height in a single mow. 'Scalping' stresses the plant and invites weeds and disease.",
  "A soil pH of 6.0–7.0 is the sweet spot for most turf. Outside this range, nutrients lock up in the soil even if you've fertilized — test your soil before adding anything.",
  "Overseed thin or bare patches in early fall for cool-season grasses, or late spring for warm-season varieties. Soil temperature matters more than calendar date.",
  "Sharpen your mower blade at least once per season. Dull blades tear grass instead of cutting it cleanly, leaving ragged brown tips and entry points for disease.",
  "Apply a pre-emergent herbicide when soil temperatures reach 50–55°F (usually early spring) to prevent crabgrass before it germinates.",
  "Fertilize cool-season grasses most heavily in fall, not spring — fall feeding builds deep roots and carbohydrate reserves for winter survival.",
  "Spot-treat weeds with a targeted herbicide rather than broadcasting across the whole lawn. Healthier turf naturally out-competes most weeds without chemicals.",
  "Thatch buildup over ½ inch blocks water, air, and nutrients. Dethatch with a power rake in early spring or fall when grass is actively growing.",
  "During heat stress above 90°F, cool-season grasses go dormant naturally. Stop fertilizing and reduce foot traffic — dormancy is survival, not death.",
  "If you see mushrooms appearing in a ring pattern, that's fairy ring caused by soil fungi. Improve drainage and aerate the affected area to break the cycle.",
  "Dog spots (bright green rings around yellow/dead areas) are nitrogen burn from urine. Dilute with water immediately after exposure to limit damage.",
  "Edges along driveways and sidewalks dry out faster. Adjust your irrigation to give these high-stress borders slightly more coverage.",
  "Grub damage in late summer feels like loose turf that rolls up like carpet. Treat with a grub control product in late June–July before grubs feed deeply.",
  "After overseeding, keep the top ¼ inch of soil consistently moist for 2–3 weeks until germination. New seedlings can't tolerate drying out even once.",
  "A healthy lawn needs 4–6 hours of direct sunlight minimum. Persistently thin or bare patches in shade may call for shade-tolerant seed blends or a ground cover instead.",
  "Raise your mowing height by ½ inch going into summer heat. Taller canopy = cooler soil surface = less stress on the entire plant.",
  "Test your irrigation system at the start of each season. Clogged or misaligned heads create dry spots that look like disease but are just uneven coverage.",
];

export function TipOfTheDay() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  const refresh = () => {
    setTipIndex((prev) => {
      let next = Math.floor(Math.random() * TIPS.length);
      if (next === prev) next = (prev + 1) % TIPS.length;
      return next;
    });
  };

  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
        <Lightbulb className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Tip of the Day
          </p>
          <button
            onClick={refresh}
            className="p-1 rounded-lg text-emerald-600/60 dark:text-emerald-400/60 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            title="New tip"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed">
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
