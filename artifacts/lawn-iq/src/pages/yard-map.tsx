import { useState } from "react";
import { Ruler, Package, Sprout, FlaskConical, Bug, Droplets, Leaf, Save, Check } from "lucide-react";
import YardMapIcon from "@/components/icons/yard-map-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MapboxYardMap from "@/components/mapbox-yard-map";

/* ── Product coverage recommendations (per 1,000 sq ft) ── */
const PRODUCTS = [
  {
    type: "Fertilizer",
    icon: Sprout,
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    ratePerK: 1, unit: "lb",
    perK: "~1 lb per 1,000 sq ft",
    tip: "Apply slow-release granular in early spring and fall for best results.",
    frequency: "Every 6–8 weeks",
  },
  {
    type: "Fungicide",
    icon: FlaskConical,
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    ratePerK: 1, unit: "oz (liquid)",
    perK: "~1 oz per 1,000 sq ft",
    tip: "Apply at first sign of disease. Rotate fungicide families to prevent resistance.",
    frequency: "Every 14–21 days (active infection)",
  },
  {
    type: "Insecticide",
    icon: Bug,
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    ratePerK: 0.5, unit: "oz",
    perK: "~0.5 oz per 1,000 sq ft",
    tip: "Apply in early morning or evening to avoid harming pollinators.",
    frequency: "As needed / preventive",
  },
  {
    type: "Pre-emergent Herbicide",
    icon: Leaf,
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    ratePerK: 2.5, unit: "oz",
    perK: "~2.5 oz per 1,000 sq ft",
    tip: "Apply when soil temp reaches 55°F in spring. Timing is everything.",
    frequency: "Spring & fall",
  },
  {
    type: "Grass Seed (overseeding)",
    icon: Sprout,
    bg: "bg-lime-50 dark:bg-lime-900/30",
    text: "text-lime-700 dark:text-lime-300",
    border: "border-lime-200 dark:border-lime-800",
    ratePerK: 5, unit: "lbs",
    perK: "~5 lbs per 1,000 sq ft",
    tip: "Overseed in fall for cool-season grasses, spring for warm-season.",
    frequency: "Annually or as needed",
  },
  {
    type: "Water (irrigation)",
    icon: Droplets,
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    ratePerK: 620, unit: "gal",
    perK: "~620 gal per 1,000 sq ft (1 inch)",
    tip: "Water deeply and infrequently — 1 inch per week total including rainfall.",
    frequency: "2–3× per week",
  },
];

function formatAmount(ratePerK: number, sqFt: number, unit: string): string {
  const amount = (ratePerK * sqFt) / 1000;
  if (amount >= 1000) return `${Math.round(amount / 100) / 10}K ${unit}`;
  if (Number.isInteger(amount) || amount >= 10) return `${Math.round(amount)} ${unit}`;
  return `${amount.toFixed(1)} ${unit}`;
}

export default function YardMap() {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const savedSqFt = profile?.yardSquareFeet ?? null;
  const [displaySqFt, setDisplaySqFt] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const sqFt = displaySqFt ?? savedSqFt ?? null;

  const handleAreaCalculated = (n: number) => {
    setDisplaySqFt(n);
  };

  const handleSave = async () => {
    const n = displaySqFt ?? savedSqFt;
    if (!n) return;
    try {
      await updateProfile.mutateAsync({ data: { yardSquareFeet: n } });
      queryClient.invalidateQueries({ queryKey: ["getUserProfile"] });
      setSaved(true);
      toast({ title: `Yard size saved: ${n.toLocaleString()} sq ft` });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yard Map</h1>
          <p className="text-sm text-muted-foreground">
            Trace your yard on the satellite map to calculate exact square footage.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <YardMapIcon className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
        </div>
      </div>

      {/* Saved badge */}
      {savedSqFt && !profileLoading && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Saved yard size: <span className="font-bold">{savedSqFt.toLocaleString()} sq ft</span>
          </p>
        </div>
      )}

      {/* Interactive satellite map */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base">Draw your yard boundary</h2>
          </div>
          <MapboxYardMap onAreaCalculated={handleAreaCalculated} />
        </CardContent>
      </Card>

      {/* Calculated area + save */}
      {displaySqFt && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <div className="flex-1">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wide">Drawn area</p>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{displaySqFt.toLocaleString()} <span className="text-base font-semibold">sq ft</span></p>
          </div>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 shrink-0"
            disabled={updateProfile.isPending}
          >
            {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</> : <><Save className="w-4 h-4 mr-1.5" /> Save</>}
          </Button>
        </div>
      )}

      {/* Product recommendations */}
      {sqFt ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base">Product amounts for {sqFt.toLocaleString()} sq ft</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated quantities based on typical label rates. Always read product labels for exact dosing.
          </p>
          <div className="space-y-3">
            {PRODUCTS.map((p) => {
              const Icon = p.icon;
              const amount = formatAmount(p.ratePerK, sqFt, p.unit);
              return (
                <div key={p.type} className={`p-4 rounded-2xl border ${p.bg} ${p.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/60 dark:bg-black/20 ${p.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${p.text}`}>{p.type}</p>
                        <span className={`font-black text-lg leading-none ${p.text}`}>{amount}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.perK} · {p.frequency}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">{p.tip}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground text-center italic pt-2">
            Rates are guidelines only. Soil type, grass species, and product concentration vary.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Ruler className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Search your address above, then trace your yard boundary on the satellite map. Product recommendations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
