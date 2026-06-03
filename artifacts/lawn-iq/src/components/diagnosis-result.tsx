import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Droplets, Sun, AlertTriangle, Activity, Save, Leaf,
  FlaskConical, ShieldCheck, Clock, Microscope, CloudSun,
  ArrowRight, ChevronDown, ChevronUp, TriangleAlert, Info,
  CheckCircle2, Lock, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Diagnosis } from "@workspace/api-client-react";
import { TipOfTheDay } from "./tip-of-the-day";

interface Props {
  diagnosis: Diagnosis;
  onSave?: () => void;
  isSaving?: boolean;
  showSaveButton?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
}

const SEVERITY_CONFIG = {
  Low: {
    label: "Low Severity",
    ring: "from-emerald-400 to-green-500",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    glow: "shadow-emerald-200 dark:shadow-emerald-900/50",
  },
  Medium: {
    label: "Medium Severity",
    ring: "from-amber-400 to-orange-500",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    glow: "shadow-amber-200 dark:shadow-amber-900/50",
  },
  High: {
    label: "High Severity",
    ring: "from-rose-400 to-red-600",
    badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    glow: "shadow-rose-200 dark:shadow-rose-900/50",
  },
};

const PRIORITY_CONFIG = {
  immediate: { label: "Immediate", class: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800" },
  soon: { label: "Soon", class: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" },
  ongoing: { label: "Ongoing", class: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" },
};

function HealthRing({ score }: { score: number }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  const [displayed, setDisplayed] = useState(0);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplayed(Math.round(ease * score));
      setProgress(ease * (score / 100) * circumference);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score, circumference]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-muted/30"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold leading-none tabular-nums" style={{ color }}>{displayed}</div>
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">/ 100</div>
      </div>
    </motion.div>
  );
}

export function DiagnosisResult({ diagnosis, onSave, isSaving = false, showSaveButton = true, isPro = false, onUpgrade }: Props) {
  const sev = SEVERITY_CONFIG[diagnosis.severity];
  const [showDifferential, setShowDifferential] = useState(false);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-500">

      {/* ── Header card ── */}
      <Card className={`overflow-hidden border-2 border-primary/15 shadow-xl ${sev.glow}`}>
        <div className="bg-gradient-to-br from-primary/8 via-background to-amber-50/40 dark:from-primary/12 dark:via-background dark:to-amber-950/20 p-6 md:p-8">

          {/* Top row: badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${sev.badge}`}>
              <AlertTriangle className="w-3 h-3" />
              {sev.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50">
              <Activity className="w-3 h-3" />
              {diagnosis.confidence}% Confidence
            </span>
            {diagnosis.causativeAgent && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 italic">
                <Microscope className="w-3 h-3 not-italic" />
                {diagnosis.causativeAgent}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-6">
            {diagnosis.title}
          </h2>

          {/* Health + Recovery row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-5">
              <HealthRing score={diagnosis.healthScore} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Lawn Health</p>
                <p className="text-sm text-foreground/80 max-w-[140px]">
                  {diagnosis.healthScore >= 70 ? "Generally healthy with targeted issue" :
                   diagnosis.healthScore >= 40 ? "Moderate stress — act soon" :
                   "Significant stress — urgent care needed"}
                </p>
              </div>
            </div>

            {diagnosis.estimatedRecovery && (
              <div className="flex items-start gap-3 bg-background/70 rounded-2xl border border-border/60 px-5 py-4 flex-1">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Estimated Recovery</p>
                  <p className="text-sm font-semibold text-foreground">{diagnosis.estimatedRecovery}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <CardContent className="px-6 md:px-8 py-5 border-t border-border/50 bg-background/50">
          <p className="text-base leading-relaxed text-foreground/85">{diagnosis.summary}</p>
        </CardContent>
      </Card>

      {/* ── Contextual callouts ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {diagnosis.seasonalNote && (
          <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/40">
            <CloudSun className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">Seasonal Note</p>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80">{diagnosis.seasonalNote}</p>
            </div>
          </div>
        )}

        {diagnosis.differentialNote && (
          <div>
            <button
              className="w-full flex items-start gap-3 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/25 border border-violet-200/60 dark:border-violet-800/40 text-left transition-colors hover:bg-violet-100/50 dark:hover:bg-violet-950/40"
              onClick={() => setShowDifferential(!showDifferential)}
            >
              <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400 mb-1">Differential Diagnosis</p>
                {showDifferential ? (
                  <p className="text-sm text-violet-900/80 dark:text-violet-200/80">{diagnosis.differentialNote}</p>
                ) : (
                  <p className="text-sm text-violet-700/60 dark:text-violet-400/60">Tap to see what else was considered…</p>
                )}
              </div>
              {showDifferential
                ? <ChevronUp className="w-4 h-4 text-violet-500 shrink-0" />
                : <ChevronDown className="w-4 h-4 text-violet-500 shrink-0" />
              }
            </button>
          </div>
        )}
      </div>

      {/* ── 4-tile advice grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Droplets, label: "Water", text: diagnosis.waterAdvice, colors: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400" },
          { icon: Sun, label: "Light & Cut", text: diagnosis.lightAdvice, colors: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400" },
          { icon: Leaf, label: "Soil", text: diagnosis.soilAdvice || "Maintain healthy soil pH (6.0–7.0) with regular aeration.", colors: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400" },
          { icon: TriangleAlert, label: "Risk", text: diagnosis.riskAdvice, colors: "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400" },
        ].map(({ icon: Icon, label, text, colors }) => (
          <div key={label} className={`rounded-2xl border p-4 flex flex-col gap-2 ${colors}`}>
            <div className="flex items-center gap-1.5">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xs leading-relaxed text-foreground/75">{text}</p>
          </div>
        ))}
      </div>

      {/* ── Recovery plan steps ── */}
      <Card className="border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50 bg-muted/20">
          <ArrowRight className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Recovery Plan</h3>
          <span className="ml-auto text-xs text-muted-foreground">{diagnosis.steps.length} steps</span>
        </div>

        {isPro ? (
          <div className="divide-y divide-border/40">
            {diagnosis.steps.map((step, index) => {
              const pCfg = step.priority ? PRIORITY_CONFIG[step.priority] : PRIORITY_CONFIG.soon;
              return (
                <div key={index} className="flex gap-4 p-5 hover:bg-muted/20 transition-colors">
                  <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                      {index + 1}
                    </div>
                    {index < diagnosis.steps.length - 1 && (
                      <div className="w-px flex-1 bg-border/50 min-h-[12px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pCfg.class}`}>
                        {pCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                    {step.timing && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3 text-primary/60" />
                        <span className="text-xs font-medium text-primary/80">{step.timing}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Show first step only */}
            {diagnosis.steps[0] && (() => {
              const step = diagnosis.steps[0];
              const pCfg = step.priority ? PRIORITY_CONFIG[step.priority] : PRIORITY_CONFIG.soon;
              return (
                <div className="flex gap-4 p-5">
                  <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                      1
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pCfg.class}`}>
                        {pCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              );
            })()}

            {/* Paywall blur for remaining steps */}
            {diagnosis.steps.length > 1 && (
              <div className="relative">
                <div className="pointer-events-none select-none px-5 pb-4 space-y-4 opacity-30 blur-[3px]">
                  {diagnosis.steps.slice(1, 3).map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20 shrink-0">
                        {i + 2}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upgrade overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background via-background/80 to-transparent">
                  <div className="text-center px-6 py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-base">Unlock {diagnosis.steps.length - 1} more steps</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upgrade to Pro for the full recovery plan.
                      </p>
                    </div>
                    <Button
                      onClick={onUpgrade}
                      className="rounded-xl gap-2 px-6"
                    >
                      <Sparkles className="w-4 h-4" />
                      Upgrade to Pro — $7.99/mo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Treatment products ── */}
      {isPro && diagnosis.treatmentProducts && diagnosis.treatmentProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Recommended Treatment Types</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {diagnosis.treatmentProducts.map((product, i) => (
              <div key={i} className="bg-card border border-border/70 rounded-2xl p-4 space-y-2 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{product.type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{product.description}</p>
                  </div>
                </div>
                {product.caution && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                    <TriangleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800/80 dark:text-amber-200/80">{product.caution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prevention tips ── */}
      {isPro && diagnosis.preventionTips && diagnosis.preventionTips.length > 0 && (
        <Card className="border border-primary/15 bg-primary/3 dark:bg-primary/8 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Prevention</h3>
          </div>
          <div className="px-6 py-4 space-y-3">
            {diagnosis.preventionTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Tip of the Day ── */}
      <TipOfTheDay />

      {/* ── Save button ── */}
      {showSaveButton && onSave && isPro && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="lg"
          className="w-full rounded-xl py-6 text-base shadow-md"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? "Saving plan…" : "Save Recovery Plan"}
        </Button>
      )}

      {showSaveButton && !isPro && (
        <Button
          onClick={onUpgrade}
          size="lg"
          variant="outline"
          className="w-full rounded-xl py-6 text-base gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          Upgrade to Pro to Save This Plan
        </Button>
      )}
    </div>
  );
}
