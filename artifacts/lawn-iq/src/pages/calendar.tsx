import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Leaf, CalendarDays, Droplets, Scissors, Sprout, Bug, FlaskConical, Wind, ListChecks } from "lucide-react";
import { useListDiagnoses } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
  addMonths,
  subMonths,
  differenceInDays,
} from "date-fns";

/* ── Types ── */
interface DiagnosisStep {
  title: string;
  detail: string;
  timing: string;
  priority?: "immediate" | "soon" | "ongoing";
}

interface CalendarEvent {
  date: Date;
  planId: string;
  planTitle: string;
  stepTitle: string;
  type: TreatmentType;
  timing: string;
}

/* ── Treatment type detection ── */
type TreatmentType =
  | "fertilize"
  | "fungicide"
  | "insecticide"
  | "water"
  | "mow"
  | "seed"
  | "aerate"
  | "weed"
  | "dethatch"
  | "soil"
  | "other";

interface TreatmentConfig {
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  dot: string;
}

const TREATMENT_CONFIG: Record<TreatmentType, TreatmentConfig> = {
  fertilize:   { label: "Fertilize",   icon: Sprout,       bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  fungicide:   { label: "Fungicide",   icon: FlaskConical, bg: "bg-purple-100 dark:bg-purple-900/40",   text: "text-purple-700 dark:text-purple-300",   dot: "bg-purple-500" },
  insecticide: { label: "Insecticide", icon: Bug,          bg: "bg-orange-100 dark:bg-orange-900/40",   text: "text-orange-700 dark:text-orange-300",   dot: "bg-orange-500" },
  water:       { label: "Water",       icon: Droplets,     bg: "bg-blue-100 dark:bg-blue-900/40",       text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500"   },
  mow:         { label: "Mow",         icon: Scissors,     bg: "bg-yellow-100 dark:bg-yellow-900/40",   text: "text-yellow-700 dark:text-yellow-300",   dot: "bg-yellow-500" },
  seed:        { label: "Seed",        icon: Leaf,         bg: "bg-lime-100 dark:bg-lime-900/40",       text: "text-lime-700 dark:text-lime-300",       dot: "bg-lime-500"   },
  aerate:      { label: "Aerate",      icon: Wind,         bg: "bg-stone-100 dark:bg-stone-800/60",     text: "text-stone-700 dark:text-stone-300",     dot: "bg-stone-500"  },
  weed:        { label: "Weed",        icon: Leaf,         bg: "bg-red-100 dark:bg-red-900/40",         text: "text-red-700 dark:text-red-300",         dot: "bg-red-500"    },
  dethatch:    { label: "Dethatch",    icon: Wind,         bg: "bg-amber-100 dark:bg-amber-900/40",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500"  },
  soil:        { label: "Soil",        icon: Leaf,         bg: "bg-yellow-100 dark:bg-yellow-900/40",   text: "text-yellow-800 dark:text-yellow-300",   dot: "bg-yellow-700" },
  other:       { label: "Treatment",   icon: ListChecks,   bg: "bg-gray-100 dark:bg-gray-800",          text: "text-gray-600 dark:text-gray-300",       dot: "bg-gray-500"   },
};

function detectType(title: string, detail: string): TreatmentType {
  const text = `${title} ${detail}`.toLowerCase();
  if (/fertiliz/.test(text)) return "fertilize";
  if (/fungicid/.test(text)) return "fungicide";
  if (/insecticid|pesticide/.test(text)) return "insecticide";
  if (/\bwater\b|irrigat/.test(text)) return "water";
  if (/\bmow\b|mowing|cut the grass/.test(text)) return "mow";
  if (/overseed|reseed|\bseed\b|seeding/.test(text)) return "seed";
  if (/aerat/.test(text)) return "aerate";
  if (/\bweed\b|herbicid/.test(text)) return "weed";
  if (/dethatch/.test(text)) return "dethatch";
  if (/soil|top.dress|compost/.test(text)) return "soil";
  return "other";
}

/* ── Timing parser: returns day offsets from diagnosis creation date ── */
function parseTiming(timing: string, priority?: string): number[] {
  const t = timing.toLowerCase().trim();

  // "immediately" or "right away"
  if (/immedi|right away|today/.test(t)) return [0];

  // "every N days for M applications"
  const everyDayApps = t.match(/every\s+(\d+)\s+days?\s+for\s+(\d+)\s+applications?/);
  if (everyDayApps) {
    const interval = parseInt(everyDayApps[1]);
    const count = parseInt(everyDayApps[2]);
    return Array.from({ length: count }, (_, i) => i * interval);
  }

  // "every N weeks for M weeks/applications"
  const everyWeekFor = t.match(/every\s+(\d+)\s+weeks?\s+for\s+(\d+)/);
  if (everyWeekFor) {
    const interval = parseInt(everyWeekFor[1]) * 7;
    const count = parseInt(everyWeekFor[2]);
    return Array.from({ length: count }, (_, i) => i * interval);
  }

  // "every N days"
  const everyNDays = t.match(/every\s+(\d+)\s+days?/);
  if (everyNDays) {
    const n = parseInt(everyNDays[1]);
    return Array.from({ length: 6 }, (_, i) => i * n); // 6 occurrences
  }

  // "every N weeks"
  const everyNWeeks = t.match(/every\s+(\d+)\s+weeks?/);
  if (everyNWeeks) {
    const n = parseInt(everyNWeeks[1]) * 7;
    return Array.from({ length: 5 }, (_, i) => i * n);
  }

  // "daily for N days"
  const dailyFor = t.match(/daily\s+for\s+(\d+)\s+days?/);
  if (dailyFor) {
    return Array.from({ length: parseInt(dailyFor[1]) }, (_, i) => i);
  }

  // "N times per week for M weeks"
  const timesPerWeek = t.match(/(\d+)\s+times?\s+per\s+week\s+for\s+(\d+)\s+weeks?/);
  if (timesPerWeek) {
    const perWeek = parseInt(timesPerWeek[1]);
    const weeks = parseInt(timesPerWeek[2]);
    const days: number[] = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < perWeek; d++) {
        days.push(w * 7 + Math.round((d / perWeek) * 7));
      }
    }
    return days;
  }

  // "for N weeks" / "N weeks"
  const forNWeeks = t.match(/for\s+(\d+)\s+weeks?/);
  if (forNWeeks) {
    const w = parseInt(forNWeeks[1]);
    return Array.from({ length: w }, (_, i) => i * 7);
  }

  // "weekly" or "once a week"
  if (/weekly|once\s+a\s+week/.test(t)) return [0, 7, 14, 21];

  // "bi-weekly" / "every other week"
  if (/bi.?weekly|every\s+other\s+week/.test(t)) return [0, 14, 28, 42];

  // "daily"
  if (/\bdaily\b/.test(t)) return Array.from({ length: 14 }, (_, i) => i);

  // "monthly"
  if (/monthly/.test(t)) return [0, 30, 60];

  // "once"
  if (/\bonce\b/.test(t) && !/week|day|month/.test(t)) {
    return [priority === "immediate" ? 0 : 7];
  }

  // "week N" — schedule N weeks after plan start
  const weekN = t.match(/week\s+(\d+)/);
  if (weekN) return [parseInt(weekN[1]) * 7];

  // "day N"
  const dayN = t.match(/day\s+(\d+)/);
  if (dayN) return [parseInt(dayN[1])];

  // Fall back based on priority
  if (priority === "immediate") return [0];
  if (priority === "soon") return [7];
  if (priority === "ongoing") return [0, 14, 28, 42, 56, 70];

  return [0]; // default: schedule from start
}

/* ── Main calendar event builder ── */
function buildEvents(
  plans: Array<{ id: string; title: string; steps: DiagnosisStep[]; createdAt: string }>
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const plan of plans) {
    const origin = new Date(plan.createdAt);
    for (const step of plan.steps) {
      const offsets = parseTiming(step.timing, step.priority);
      const type = detectType(step.title, step.detail);
      for (const offset of offsets) {
        events.push({
          date: addDays(origin, offset),
          planId: plan.id,
          planTitle: plan.title,
          stepTitle: step.title,
          type,
          timing: step.timing,
        });
      }
    }
  }
  return events;
}

/* ── Calendar grid ── */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DayCell({
  day,
  currentMonth,
  events,
  isSelected,
  onClick,
}: {
  day: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const inMonth = isSameMonth(day, currentMonth);
  const isToday = isSameDay(day, new Date());
  const MAX_DOTS = 4;
  const uniqueTypes = [...new Set(events.map((e) => e.type))];

  return (
    <button
      onClick={onClick}
      className={`relative min-h-[3.5rem] w-full rounded-xl p-1.5 flex flex-col items-center gap-0.5 transition-all text-left ${
        isSelected
          ? "bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-md"
          : isToday
          ? "bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-300 dark:ring-emerald-700"
          : inMonth
          ? "hover:bg-muted/60"
          : "opacity-30"
      }`}
    >
      <span
        className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
          isSelected
            ? "text-white"
            : isToday
            ? "bg-emerald-600 text-white"
            : inMonth
            ? "text-foreground"
            : "text-muted-foreground"
        }`}
      >
        {format(day, "d")}
      </span>

      {uniqueTypes.length > 0 && (
        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
          {uniqueTypes.slice(0, MAX_DOTS).map((type) => (
            <span
              key={type}
              className={`w-2 h-2 rounded-full ${
                isSelected ? "bg-white/80" : TREATMENT_CONFIG[type].dot
              }`}
            />
          ))}
          {uniqueTypes.length > MAX_DOTS && (
            <span className={`text-[9px] font-bold ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
              +{uniqueTypes.length - MAX_DOTS}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  const cfg = TREATMENT_CONFIG[event.type];
  const Icon = cfg.icon;
  return (
    <Link href={`/plans/${event.planId}`}>
      <div className={`flex items-start gap-2.5 p-2.5 rounded-xl border border-transparent hover:border-border/60 transition-colors cursor-pointer ${cfg.bg}`}>
        <div className={`mt-0.5 shrink-0 ${cfg.text}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold leading-tight ${cfg.text}`}>{event.stepTitle}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{event.planTitle}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{event.timing}</p>
        </div>
      </div>
    </Link>
  );
}

export default function Calendar() {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const { data: rawPlans = [], isLoading } = useListDiagnoses();

  const plans = (rawPlans as any[]).map((p) => ({
    id: p.id as string,
    title: (p.nickname ?? p.title) as string,
    steps: (p.steps ?? []) as DiagnosisStep[],
    createdAt: p.createdAt as string,
  }));

  const events = useMemo(() => buildEvents(plans), [rawPlans]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.date, day));

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const totalEvents = events.filter((e) =>
    isSameMonth(e.date, viewMonth)
  ).length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lawn Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Treatment schedule from your saved plans.
          </p>
        </div>
        {totalEvents > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{totalEvents}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">this month</p>
          </div>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-muted/40 border border-border/50 rounded-2xl px-4 py-3">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-bold text-base">{format(viewMonth, "MMMM yyyy")}</p>
        </div>
        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border/50 rounded-2xl p-3 shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {isLoading
            ? Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))
            : days.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  currentMonth={viewMonth}
                  events={eventsForDay(day)}
                  isSelected={!!selectedDay && isSameDay(day, selectedDay)}
                  onClick={() =>
                    setSelectedDay((prev) =>
                      prev && isSameDay(prev, day) ? null : day
                    )
                  }
                />
              ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(TREATMENT_CONFIG) as [TreatmentType, TreatmentConfig][])
          .filter(([type]) => type !== "other")
          .map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">
              {format(selectedDay, "EEEE, MMMM d")}
            </h2>
            {selectedEvents.length > 0 && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-full">
                {selectedEvents.length} {selectedEvents.length === 1 ? "treatment" : "treatments"}
              </span>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No treatments scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event, i) => (
                <EventChip key={`${event.planId}-${event.stepTitle}-${i}`} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state — no plans */}
      {!isLoading && plans.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-lg">No plans yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Run a lawn diagnosis and save your recovery plan — it will automatically populate your treatment calendar.
            </p>
          </div>
          <Link href="/">
            <button className="mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-medium transition-colors">
              Diagnose My Lawn
            </button>
          </Link>
        </div>
      )}

      {/* Plans sourcing section */}
      {!isLoading && plans.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-[11px]">
            Based on {plans.length} saved {plans.length === 1 ? "plan" : "plans"}
          </p>
          <div className="space-y-2">
            {plans.map((plan) => {
              const planEvents = events.filter((e) => e.planId === plan.id);
              const upcoming = planEvents.filter(
                (e) => differenceInDays(e.date, new Date()) >= 0
              ).length;
              return (
                <Link key={plan.id} href={`/plans/${plan.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/40 hover:border-border/70 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <Leaf className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{plan.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {planEvents.length} treatment events · {upcoming} upcoming
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
