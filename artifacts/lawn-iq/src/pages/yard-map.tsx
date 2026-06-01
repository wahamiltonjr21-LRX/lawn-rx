import { useState } from "react";
import { Ruler, Package, Sprout, FlaskConical, Bug, Droplets, Leaf, Save, Check, Map, PenLine, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import YardMapIcon from "@/components/icons/yard-map-icon";
import MapboxYardMap from "@/components/mapbox-yard-map";

/* ── Products ── */
const PRODUCTS = [
  { type: "Fertilizer",             icon: Sprout,      bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", ratePerK: 1,   unit: "lb",          perK: "~1 lb per 1,000 sq ft",          tip: "Apply slow-release granular in early spring and fall for best results.",               frequency: "Every 6–8 weeks" },
  { type: "Fungicide",              icon: FlaskConical, bg: "bg-purple-50 dark:bg-purple-900/30",   text: "text-purple-700 dark:text-purple-300",   border: "border-purple-200 dark:border-purple-800",   ratePerK: 1,   unit: "oz (liquid)", perK: "~1 oz per 1,000 sq ft",          tip: "Apply at first sign of disease. Rotate fungicide families to prevent resistance.",    frequency: "Every 14–21 days" },
  { type: "Insecticide",            icon: Bug,          bg: "bg-orange-50 dark:bg-orange-900/30",   text: "text-orange-700 dark:text-orange-300",   border: "border-orange-200 dark:border-orange-800",   ratePerK: 0.5, unit: "oz",          perK: "~0.5 oz per 1,000 sq ft",        tip: "Apply in early morning or evening to avoid harming pollinators.",                     frequency: "As needed" },
  { type: "Pre-emergent Herbicide", icon: Leaf,         bg: "bg-red-50 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-300",         border: "border-red-200 dark:border-red-800",         ratePerK: 2.5, unit: "oz",          perK: "~2.5 oz per 1,000 sq ft",        tip: "Apply when soil temp reaches 55°F in spring. Timing is everything.",                  frequency: "Spring & fall" },
  { type: "Grass Seed (overseed)", icon: Sprout,        bg: "bg-lime-50 dark:bg-lime-900/30",       text: "text-lime-700 dark:text-lime-300",       border: "border-lime-200 dark:border-lime-800",       ratePerK: 5,   unit: "lbs",         perK: "~5 lbs per 1,000 sq ft",         tip: "Overseed in fall for cool-season grasses, spring for warm-season.",                  frequency: "Annually" },
  { type: "Water (irrigation)",     icon: Droplets,     bg: "bg-blue-50 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-300",       border: "border-blue-200 dark:border-blue-800",       ratePerK: 620, unit: "gal",         perK: "~620 gal per 1,000 sq ft (1\")", tip: "Water deeply and infrequently — 1 inch per week total including rainfall.",           frequency: "2–3× per week" },
];

function formatAmount(ratePerK: number, sqFt: number, unit: string): string {
  const amount = (ratePerK * sqFt) / 1000;
  if (amount >= 1000) return `${Math.round(amount / 100) / 10}K ${unit}`;
  if (Number.isInteger(amount) || amount >= 10) return `${Math.round(amount)} ${unit}`;
  return `${amount.toFixed(1)} ${unit}`;
}

/* ── Manual input tab ── */
function ManualInput({ onResult }: { onResult: (n: number) => void }) {
  const [sqFt, setSqFt] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth]   = useState("");

  const applyDirect = () => {
    const n = parseInt(sqFt.replace(/[^0-9]/g, ""));
    if (!isNaN(n) && n >= 100) onResult(n);
  };

  const applyDimensions = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
      const n = Math.round(l * w);
      setSqFt(String(n));
      onResult(n);
    }
  };

  return (
    <div className="space-y-5 pt-1">
      {/* Direct sq ft */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Total Square Feet
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={sqFt}
            onChange={(e) => setSqFt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyDirect()}
            placeholder="e.g. 5000"
            min={100}
            max={500000}
            className="flex-1 text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            onClick={applyDirect}
            disabled={!sqFt}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            Use
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs font-medium">or calculate from dimensions</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* L × W */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Length × Width (feet)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="Length"
            className="flex-1 text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-0"
          />
          <span className="text-muted-foreground font-bold shrink-0">×</span>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyDimensions()}
            placeholder="Width"
            className="flex-1 text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-0"
          />
          <button
            onClick={applyDimensions}
            disabled={!length || !width}
            className="shrink-0 px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {length && width && parseFloat(length) > 0 && parseFloat(width) > 0 && (
          <p className="text-xs text-muted-foreground pl-1">
            = {Math.round(parseFloat(length) * parseFloat(width)).toLocaleString()} sq ft
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
type InputMethod = "manual" | "map";

export default function YardMap() {
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const queryClient   = useQueryClient();
  const { toast }     = useToast();

  const savedSqFt = profile?.yardSquareFeet ?? null;
  const [method, setMethod]       = useState<InputMethod>("manual");
  const [displaySqFt, setDisplay] = useState<number | null>(null);
  const [saved, setSaved]         = useState(false);

  const sqFt = displaySqFt ?? savedSqFt ?? null;

  const handleResult = (n: number) => setDisplay(n);

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
            Measure your yard to get exact product amounts.
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
            Saved: <span className="font-bold">{savedSqFt.toLocaleString()} sq ft</span>
          </p>
          {savedSqFt && (
            <button
              onClick={() => setDisplay(null)}
              className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
            >
              Update
            </button>
          )}
        </div>
      )}

      {/* Method selector card */}
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setMethod("manual")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
              method === "manual"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-b-2 border-emerald-600"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Ruler className="w-4 h-4" />
            Enter manually
          </button>
          <button
            onClick={() => setMethod("map")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
              method === "map"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-b-2 border-emerald-600"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Map className="w-4 h-4" />
            Draw on map
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {method === "manual" ? (
            <ManualInput onResult={handleResult} />
          ) : (
            <MapboxYardMap onAreaCalculated={handleResult} />
          )}
        </div>
      </div>

      {/* Result + save */}
      {(displaySqFt !== null) && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <div className="flex-1">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wide">
              {method === "map" ? "Drawn area" : "Entered area"}
            </p>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
              {displaySqFt.toLocaleString()} <span className="text-base font-semibold">sq ft</span>
            </p>
          </div>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 shrink-0"
            disabled={updateProfile.isPending}
          >
            {saved
              ? <><Check className="w-4 h-4 mr-1.5" /> Saved!</>
              : <><Save className="w-4 h-4 mr-1.5" /> Save</>}
          </Button>
        </div>
      )}

      {/* Product recommendations */}
      {sqFt ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-base">
              Product amounts for {sqFt.toLocaleString()} sq ft
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated quantities based on typical label rates. Always read product labels.
          </p>
          <div className="space-y-3">
            {PRODUCTS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.type} className={`p-4 rounded-2xl border ${p.bg} ${p.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/60 dark:bg-black/20 ${p.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${p.text}`}>{p.type}</p>
                        <span className={`font-black text-lg leading-none ${p.text}`}>
                          {formatAmount(p.ratePerK, sqFt, p.unit)}
                        </span>
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
            <PenLine className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Enter your square footage or draw your yard on the map — product recommendations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
