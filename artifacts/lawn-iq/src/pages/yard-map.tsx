import { useState } from "react";
import { MapPin, Ruler, Package, Sprout, FlaskConical, Bug, Droplets, Scissors, Leaf, ChevronRight, ExternalLink, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";

/* ── Product coverage recommendations (per 1,000 sq ft) ── */
const PRODUCTS = [
  {
    type: "Fertilizer",
    icon: Sprout,
    color: "emerald",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    ratePerK: 1,
    unit: "lb",
    perK: "~1 lb per 1,000 sq ft",
    tip: "Apply slow-release granular in early spring and fall for best results.",
    frequency: "Every 6–8 weeks",
  },
  {
    type: "Fungicide",
    icon: FlaskConical,
    color: "purple",
    dot: "bg-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    ratePerK: 1,
    unit: "oz (liquid)",
    perK: "~1 oz per 1,000 sq ft",
    tip: "Apply at first sign of disease. Rotate fungicide families to prevent resistance.",
    frequency: "Every 14–21 days (active infection)",
  },
  {
    type: "Insecticide",
    icon: Bug,
    color: "orange",
    dot: "bg-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    ratePerK: 0.5,
    unit: "oz",
    perK: "~0.5 oz per 1,000 sq ft",
    tip: "Apply in early morning or evening to avoid harming pollinators.",
    frequency: "As needed / preventive",
  },
  {
    type: "Pre-emergent Herbicide",
    icon: Leaf,
    color: "red",
    dot: "bg-red-500",
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    ratePerK: 2.5,
    unit: "oz",
    perK: "~2.5 oz per 1,000 sq ft",
    tip: "Apply when soil temp reaches 55°F in spring. Timing is everything.",
    frequency: "Spring & fall",
  },
  {
    type: "Grass Seed (overseeding)",
    icon: Sprout,
    color: "lime",
    dot: "bg-lime-500",
    bg: "bg-lime-50 dark:bg-lime-900/30",
    text: "text-lime-700 dark:text-lime-300",
    border: "border-lime-200 dark:border-lime-800",
    ratePerK: 5,
    unit: "lbs",
    perK: "~5 lbs per 1,000 sq ft",
    tip: "Overseed in fall for cool-season grasses, spring for warm-season.",
    frequency: "Annually or as needed",
  },
  {
    type: "Water (irrigation)",
    icon: Droplets,
    color: "blue",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    ratePerK: 620,
    unit: "gal",
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

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
      ⭐ Pro
    </span>
  );
}

export default function YardMap() {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: subData } = useSubscription();
  const isPro = (subData as any)?.isPro === true;

  const savedSqFt = profile?.yardSquareFeet ?? null;
  const [inputSqFt, setInputSqFt] = useState<string>("");
  const [displaySqFt, setDisplaySqFt] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const sqFt = displaySqFt ?? savedSqFt ?? null;

  const handleCalc = () => {
    const n = parseInt(inputSqFt.replace(/[^0-9]/g, ""));
    if (!isNaN(n) && n >= 100) {
      setDisplaySqFt(n);
    }
  };

  const handleSave = async () => {
    const n = displaySqFt ?? parseInt(inputSqFt.replace(/[^0-9]/g, ""));
    if (isNaN(n) || n < 100) return;
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Yard Map</h1>
            <ProBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            Know your yard's square footage to buy exactly the right amount of product.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
        </div>
      </div>

      {/* Saved sq ft badge */}
      {savedSqFt && !profileLoading && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Saved yard size: <span className="font-bold">{savedSqFt.toLocaleString()} sq ft</span>
          </p>
          <button
            onClick={() => { setDisplaySqFt(null); setInputSqFt(String(savedSqFt)); }}
            className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
          >
            Edit
          </button>
        </div>
      )}

      {/* Square footage input */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base">Enter your yard size</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Square Feet
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={inputSqFt}
                  onChange={(e) => setInputSqFt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCalc()}
                  placeholder="e.g. 5000"
                  min={100}
                  max={500000}
                  className="flex-1 text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Or by dimensions
              </label>
              <DimensionHelper onResult={(n) => { setInputSqFt(String(n)); setDisplaySqFt(n); }} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCalc}
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={!inputSqFt}
            >
              Calculate
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800"
              disabled={(!displaySqFt && !inputSqFt) || updateProfile.isPending}
            >
              {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</> : <><Save className="w-4 h-4 mr-1.5" /> Save</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps integration card */}
      <Card className="border-dashed border-2 border-border/50 bg-muted/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">Google Maps Integration</p>
                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase">Coming soon</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Draw your yard boundary directly on a satellite map to get an exact sq footage calculation.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">To enable when ready:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <span className="font-mono bg-muted px-1 rounded">console.cloud.google.com</span></li>
                  <li>Enable the <span className="font-medium">Maps JavaScript API</span></li>
                  <li>Create an API key and add it as <span className="font-mono bg-muted px-1 rounded">GOOGLE_MAPS_API_KEY</span></li>
                </ol>
              </div>
              <a
                href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Open Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product recommendations */}
      {sqFt && (
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
                <div
                  key={p.type}
                  className={`p-4 rounded-2xl border ${p.bg} ${p.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/60 dark:bg-black/20 ${p.text}`}>
                      <Icon className="w-4.5 h-4.5" />
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
      )}

      {/* Empty state */}
      {!sqFt && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Ruler className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Enter your yard's square footage above and we'll show you exactly how much of each product to buy.
          </p>
        </div>
      )}
    </div>
  );
}

function DimensionHelper({ onResult }: { onResult: (sqFt: number) => void }) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const calc = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) onResult(Math.round(l * w));
  };
  return (
    <div className="flex gap-1.5 items-center">
      <input
        type="number"
        value={length}
        onChange={(e) => setLength(e.target.value)}
        placeholder="L (ft)"
        className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-0"
      />
      <span className="text-muted-foreground text-sm shrink-0">×</span>
      <input
        type="number"
        value={width}
        onChange={(e) => setWidth(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && calc()}
        placeholder="W (ft)"
        className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-0"
      />
      <button
        onClick={calc}
        className="shrink-0 px-2 py-2.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
