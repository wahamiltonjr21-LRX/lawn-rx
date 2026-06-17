import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Leaf, CalendarDays, Droplets, Scissors,
  Sprout, Bug, FlaskConical, Wind, ListChecks, CheckCircle2, Trash2,
  Bell, BellOff, History, X, Plus, PenLine, Clock, CheckCheck, StickyNote,
  Edit2,
} from "lucide-react";
import {
  useListDiagnoses, useListTreatmentLogs, useLogTreatment, useDeleteTreatmentLog,
  getListTreatmentLogsQueryKey,
  useListJournalEntries, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry,
  getListJournalEntriesQueryKey,
  type LawnNote, type CreateLawnNoteBody,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import {
  addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, format, addMonths,
  subMonths, differenceInDays, isToday, isTomorrow,
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

type TreatmentType =
  | "fertilize" | "fungicide" | "insecticide" | "water"
  | "mow" | "seed" | "aerate" | "weed" | "dethatch" | "soil" | "other";

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

const ENTRY_TYPE_CONFIG = {
  completed: { label: "Completed", icon: CheckCheck, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", dot: "bg-emerald-400" },
  scheduled: { label: "Scheduled", icon: Clock,      color: "text-sky-700 dark:text-sky-400",        bg: "bg-sky-50 dark:bg-sky-900/30",          dot: "bg-sky-400"     },
  note:      { label: "Note",      icon: StickyNote, color: "text-amber-700 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-900/30",       dot: "bg-amber-400"   },
} as const;

type EntryType = keyof typeof ENTRY_TYPE_CONFIG;

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

function parseTiming(timing: string, priority?: string): number[] {
  const t = timing.toLowerCase().trim();
  if (/immedi|right away|today/.test(t)) return [0];
  const everyDayApps = t.match(/every\s+(\d+)\s+days?\s+for\s+(\d+)\s+applications?/);
  if (everyDayApps) {
    const interval = parseInt(everyDayApps[1]);
    const count = parseInt(everyDayApps[2]);
    return Array.from({ length: count }, (_, i) => i * interval);
  }
  const everyWeekFor = t.match(/every\s+(\d+)\s+weeks?\s+for\s+(\d+)/);
  if (everyWeekFor) {
    const interval = parseInt(everyWeekFor[1]) * 7;
    const count = parseInt(everyWeekFor[2]);
    return Array.from({ length: count }, (_, i) => i * interval);
  }
  const everyNDays = t.match(/every\s+(\d+)\s+days?/);
  if (everyNDays) { const n = parseInt(everyNDays[1]); return Array.from({ length: 6 }, (_, i) => i * n); }
  const everyNWeeks = t.match(/every\s+(\d+)\s+weeks?/);
  if (everyNWeeks) { const n = parseInt(everyNWeeks[1]) * 7; return Array.from({ length: 5 }, (_, i) => i * n); }
  const dailyFor = t.match(/daily\s+for\s+(\d+)\s+days?/);
  if (dailyFor) return Array.from({ length: parseInt(dailyFor[1]) }, (_, i) => i);
  const forNWeeks = t.match(/for\s+(\d+)\s+weeks?/);
  if (forNWeeks) { const w = parseInt(forNWeeks[1]); return Array.from({ length: w }, (_, i) => i * 7); }
  if (/weekly|once\s+a\s+week/.test(t)) return [0, 7, 14, 21];
  if (/bi.?weekly|every\s+other\s+week/.test(t)) return [0, 14, 28, 42];
  if (/\bdaily\b/.test(t)) return Array.from({ length: 14 }, (_, i) => i);
  if (/monthly/.test(t)) return [0, 30, 60];
  if (/\bonce\b/.test(t) && !/week|day|month/.test(t)) return [priority === "immediate" ? 0 : 7];
  const weekN = t.match(/week\s+(\d+)/);
  if (weekN) return [parseInt(weekN[1]) * 7];
  const dayN = t.match(/day\s+(\d+)/);
  if (dayN) return [parseInt(dayN[1])];
  if (priority === "immediate") return [0];
  if (priority === "soon") return [7];
  if (priority === "ongoing") return [0, 14, 28, 42, 56, 70];
  return [0];
}

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
        events.push({ date: addDays(origin, offset), planId: plan.id, planTitle: plan.title, stepTitle: step.title, type, timing: step.timing });
      }
    }
  }
  return events;
}

/* ── Journal Entry Modal ── */
interface JournalModalProps {
  defaultDate: Date;
  entry?: LawnNote;
  onClose: () => void;
  onSaved: () => void;
}

function JournalModal({ defaultDate, entry, onClose, onSaved }: JournalModalProps) {
  const [date, setDate] = useState(entry?.date ?? format(defaultDate, "yyyy-MM-dd"));
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [entryType, setEntryType] = useState<EntryType>((entry?.entryType as EntryType) ?? "completed");
  const [treatmentType, setTreatmentType] = useState(entry?.treatmentType ?? "");
  const [productUsed, setProductUsed] = useState(entry?.productUsed ?? "");
  const create = useCreateJournalEntry();
  const update = useUpdateJournalEntry();
  const { toast } = useToast();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: CreateLawnNoteBody = {
      date,
      title: title.trim(),
      body: body.trim() || undefined,
      entryType,
      treatmentType: treatmentType.trim() || undefined,
      productUsed: productUsed.trim() || undefined,
    };
    try {
      if (entry) {
        await update.mutateAsync({ id: entry.id, data: payload });
        toast({ title: "Entry updated" });
      } else {
        await create.mutateAsync({ data: payload });
        toast({ title: "Entry saved" });
      }
      onSaved();
      onClose();
    } catch {
      toast({ title: "Failed to save entry", variant: "destructive" });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 pb-20 sm:pb-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-600" />
            <p className="font-bold text-sm">{entry ? "Edit Entry" : "Add Journal Entry"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {/* Entry type tabs */}
          <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl">
            {(Object.entries(ENTRY_TYPE_CONFIG) as [EntryType, typeof ENTRY_TYPE_CONFIG[EntryType]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEntryType(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    entryType === key ? "bg-card shadow-sm " + cfg.color : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {entryType === "completed" ? "What did you do?" : entryType === "scheduled" ? "What are you planning?" : "Title"}
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                entryType === "completed" ? "e.g. Mowed the back yard, applied fertilizer..."
                  : entryType === "scheduled" ? "e.g. Aerate lawn, overseed thin spots..."
                  : "e.g. Noticed brown patch near fence..."
              }
              className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Additional details, observations, or reminders..."
              rows={3}
              className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
            />
          </div>

          {/* Treatment type + Product used — side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Treatment type</label>
              <select
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value)}
                className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="">— None —</option>
                {Object.entries(TREATMENT_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Product used</label>
              <input
                type="text"
                value={productUsed}
                onChange={(e) => setProductUsed(e.target.value)}
                placeholder="e.g. Scotts..."
                className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {pending ? "Saving…" : entry ? "Save Changes" : "Save Entry"}
          </button>
        </form>
      </div>
    </div>
  );

}

/* ── Mark Done button (plan treatments) ── */
function MarkDoneButton({ event, logs, onDone }: { event: CalendarEvent; logs: any[]; onDone: () => void }) {
  const logTreatment = useLogTreatment();
  const deleteLog = useDeleteTreatmentLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const existingLog = logs.find(
    (l) => l.planId === event.planId &&
      l.stepTitle === event.stepTitle &&
      isSameDay(new Date(l.scheduledDate ?? l.completedAt), event.date)
  );

  const handleMark = async () => {
    if (existingLog) {
      await deleteLog.mutateAsync({ id: existingLog.id });
      queryClient.invalidateQueries({ queryKey: getListTreatmentLogsQueryKey() });
      toast({ title: "Marked as not done" });
    } else {
      await logTreatment.mutateAsync({ data: { planId: event.planId, planTitle: event.planTitle, stepTitle: event.stepTitle, treatmentType: event.type, scheduledDate: event.date.toISOString() } });
      queryClient.invalidateQueries({ queryKey: getListTreatmentLogsQueryKey() });
      toast({ title: `✓ Logged: ${event.stepTitle}` });
      onDone();
    }
  };

  const pending = logTreatment.isPending || deleteLog.isPending;
  if (existingLog) {
    return (
      <button onClick={handleMark} disabled={pending} className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 px-2 py-1 rounded-lg transition-colors shrink-0">
        <CheckCircle2 className="w-3 h-3" /> Done
      </button>
    );
  }
  return (
    <button onClick={handleMark} disabled={pending} className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-2 py-1 rounded-lg border border-border/40 hover:border-emerald-300 transition-colors shrink-0">
      <CheckCircle2 className="w-3 h-3" /> Mark done
    </button>
  );
}

/* ── Event chip (plan treatments) ── */
function EventChip({ event, logs }: { event: CalendarEvent; logs: any[] }) {
  const cfg = TREATMENT_CONFIG[event.type];
  const Icon = cfg.icon;
  const queryClient = useQueryClient();
  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-xl ${cfg.bg}`}>
      <div className={`mt-0.5 shrink-0 ${cfg.text}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <Link href={`/plans/${event.planId}`}>
          <p className={`text-xs font-semibold leading-tight hover:underline cursor-pointer ${cfg.text}`}>{event.stepTitle}</p>
        </Link>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{event.planTitle}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{event.timing}</p>
      </div>
      <MarkDoneButton event={event} logs={logs} onDone={() => queryClient.invalidateQueries({ queryKey: getListTreatmentLogsQueryKey() })} />
    </div>
  );
}

/* ── Journal chip ── */
function JournalChip({ note, onEdit, onDelete }: { note: LawnNote; onEdit: (n: LawnNote) => void; onDelete: (id: string) => void }) {
  const cfg = ENTRY_TYPE_CONFIG[note.entryType as EntryType] ?? ENTRY_TYPE_CONFIG.note;
  const Icon = cfg.icon;
  const treatCfg = note.treatmentType ? TREATMENT_CONFIG[note.treatmentType as TreatmentType] : null;
  const TreatIcon = treatCfg?.icon;
  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-xl border border-border/30 ${cfg.bg}`}>
      <div className={`mt-0.5 shrink-0 ${cfg.color}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold leading-tight ${cfg.color}`}>{note.title}</p>
        {note.body && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{note.body}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {treatCfg && TreatIcon && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${treatCfg.text}`}>
              <TreatIcon className="w-3 h-3" />{treatCfg.label}
            </span>
          )}
          {note.productUsed && (
            <span className="text-[10px] text-muted-foreground">{note.productUsed}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={() => onEdit(note)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onClick={() => onDelete(note.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Day cell ── */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DayCell({ day, currentMonth, events, journalNotes, isSelected, onClick }: {
  day: Date; currentMonth: Date; events: CalendarEvent[]; journalNotes: LawnNote[];
  isSelected: boolean; onClick: () => void;
}) {
  const inMonth = isSameMonth(day, currentMonth);
  const todayDay = isSameDay(day, new Date());
  const MAX_DOTS = 3;
  const uniqueTypes = [...new Set(events.map((e) => e.type))];
  const hasNotes = journalNotes.length > 0;

  return (
    <button
      onClick={onClick}
      className={`relative min-h-[3.5rem] w-full rounded-xl p-1.5 flex flex-col items-center gap-0.5 transition-all ${
        isSelected ? "bg-emerald-700 text-white ring-2 ring-emerald-500 shadow-md"
          : todayDay ? "bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-300 dark:ring-emerald-700"
          : inMonth ? "hover:bg-muted/60"
          : "opacity-30"
      }`}
    >
      <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
        isSelected ? "text-white" : todayDay ? "bg-emerald-600 text-white" : inMonth ? "text-foreground" : "text-muted-foreground"
      }`}>
        {format(day, "d")}
      </span>
      {(uniqueTypes.length > 0 || hasNotes) && (
        <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
          {uniqueTypes.slice(0, MAX_DOTS).map((type) => (
            <span key={type} className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : TREATMENT_CONFIG[type].dot}`} />
          ))}
          {hasNotes && (
            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/60" : "bg-amber-400"}`} />
          )}
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

/* ── Notification panel ── */
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { prefs, permission, enable, disable, updatePrefs } = useNotifications();
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <p className="font-bold text-sm">Treatment Reminders</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      {permission === "denied" && (
        <div className="text-xs bg-destructive/10 text-destructive rounded-lg px-3 py-2">
          Notifications are blocked in your browser. Enable them in browser settings to use reminders.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Enable reminders</p>
          <p className="text-xs text-muted-foreground">Get notified before upcoming treatments</p>
        </div>
        <button onClick={() => prefs.enabled ? disable() : enable()} className={`relative w-11 h-6 rounded-full transition-colors ${prefs.enabled ? "bg-emerald-600" : "bg-muted-foreground/30"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      {prefs.enabled && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remind me</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 7].map((d) => (
                <button key={d} onClick={() => updatePrefs({ daysAhead: d })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${prefs.daysAhead === d ? "bg-emerald-700 text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}>
                  {d === 1 ? "Day before" : d === 7 ? "1 week before" : `${d} days before`}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preferred time</p>
            <div className="flex gap-2">
              {[{ label: "Morning", hour: 8 }, { label: "Afternoon", hour: 13 }, { label: "Evening", hour: 18 }].map((opt) => (
                <button key={opt.hour} onClick={() => updatePrefs({ reminderHour: opt.hour })} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${prefs.reminderHour === opt.hour ? "bg-emerald-700 text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Note: Reminders fire when the app is open. For background alerts, keep LawnRX open in a browser tab.</p>
        </>
      )}
    </div>
  );
}

/* ── Treatment history item ── */
function HistoryItem({ log, onDelete }: { log: any; onDelete: (id: string) => void }) {
  const cfg = TREATMENT_CONFIG[(log.treatmentType as TreatmentType) ?? "other"];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 py-2 group">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}><Icon className="w-3.5 h-3.5" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{log.stepTitle}</p>
        <p className="text-[11px] text-muted-foreground">{log.planTitle} · {format(new Date(log.completedAt), "MMM d")}</p>
      </div>
      <button onClick={() => onDelete(log.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

/* ── Journal history item ── */
function JournalHistoryItem({ note, onEdit, onDelete }: { note: LawnNote; onEdit: (n: LawnNote) => void; onDelete: (id: string) => void }) {
  const cfg = ENTRY_TYPE_CONFIG[note.entryType as EntryType] ?? ENTRY_TYPE_CONFIG.note;
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 py-2 group">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}><Icon className="w-3.5 h-3.5" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{note.title}</p>
        <p className="text-[11px] text-muted-foreground">{format(new Date(note.date), "MMM d, yyyy")} · {cfg.label}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(note)} className="text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
        <button onClick={() => onDelete(note.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

/* ── Main calendar page ── */
export default function Calendar() {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingNote, setEditingNote] = useState<LawnNote | undefined>(undefined);

  const { data: rawPlans = [], isLoading } = useListDiagnoses();
  const { data: rawLogs = [] } = useListTreatmentLogs();
  const { data: rawNotes = [] } = useListJournalEntries();
  const deleteLog = useDeleteTreatmentLog();
  const deleteNote = useDeleteJournalEntry();
  const queryClient = useQueryClient();
  const { prefs, notifyUpcoming } = useNotifications();
  const { toast } = useToast();

  const plans = (rawPlans as any[]).map((p) => ({
    id: p.id as string,
    title: (p.nickname ?? p.title) as string,
    steps: (p.steps ?? []) as DiagnosisStep[],
    createdAt: p.createdAt as string,
  }));

  const logs = rawLogs as any[];
  const notes = rawNotes as LawnNote[];

  const events = useMemo(() => buildEvents(plans), [rawPlans]);

  useEffect(() => {
    if (prefs.enabled && events.length > 0) {
      notifyUpcoming(events.map((e) => ({ stepTitle: e.stepTitle, planTitle: e.planTitle, date: e.date })));
    }
  }, [prefs.enabled, events.length]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const eventsForDay = (day: Date) => events.filter((e) => isSameDay(e.date, day));
  const notesForDay = (day: Date) => notes.filter((n) => n.date === format(day, "yyyy-MM-dd"));

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];
  const selectedNotes = selectedDay ? notesForDay(selectedDay) : [];

  const totalThisMonth = events.filter((e) => isSameMonth(e.date, viewMonth)).length;
  const notesThisMonth = notes.filter((n) => n.date.startsWith(format(viewMonth, "yyyy-MM"))).length;
  const urgent = events.filter((e) => isToday(e.date) || isTomorrow(e.date));
  const todayCount = events.filter((e) => isToday(e.date)).length;
  const tomorrowCount = events.filter((e) => isTomorrow(e.date)).length;

  const handleDeleteLog = async (id: string) => {
    await deleteLog.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListTreatmentLogsQueryKey() });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
    toast({ title: "Entry deleted" });
  };

  const handleEditNote = (note: LawnNote) => {
    setEditingNote(note);
    setShowJournalModal(true);
  };

  const openAddEntry = () => {
    setEditingNote(undefined);
    setShowJournalModal(true);
  };

  const handleModalClose = () => {
    setShowJournalModal(false);
    setEditingNote(undefined);
  };

  const handleModalSaved = () => {
    queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey() });
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lawn Calendar</h1>
          <p className="text-sm text-muted-foreground">Track treatments, log work, and keep notes.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(logs.length > 0 || notes.length > 0) && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${showHistory ? "bg-emerald-700 text-white border-emerald-700" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"}`}
            >
              <History className="w-3.5 h-3.5" />
              {logs.length + notes.length}
            </button>
          )}
          <button
            onClick={() => setShowNotifPanel((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${prefs.enabled ? "bg-emerald-700 text-white border-emerald-700" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"}`}
            title="Notification settings"
          >
            {prefs.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={openAddEntry}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </button>
        </div>
      </div>

      {/* Month stats */}
      {(totalThisMonth > 0 || notesThisMonth > 0) && (
        <div className="flex gap-3">
          {totalThisMonth > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">{totalThisMonth} treatment{totalThisMonth > 1 ? "s" : ""} this month</span>
            </div>
          )}
          {notesThisMonth > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground">{notesThisMonth} journal {notesThisMonth === 1 ? "entry" : "entries"} this month</span>
            </div>
          )}
        </div>
      )}

      {/* Today/tomorrow banner */}
      {urgent.length > 0 && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
          <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm flex-1">
            {todayCount > 0 && <span className="font-semibold text-emerald-800 dark:text-emerald-300">{todayCount} treatment{todayCount > 1 ? "s" : ""} today</span>}
            {todayCount > 0 && tomorrowCount > 0 && <span className="text-muted-foreground"> · </span>}
            {tomorrowCount > 0 && <span className="text-muted-foreground">{tomorrowCount} tomorrow</span>}
          </p>
          <button onClick={() => setSelectedDay(new Date())} className="text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline shrink-0">View</button>
        </div>
      )}

      {/* Notification panel */}
      {showNotifPanel && <NotificationPanel onClose={() => setShowNotifPanel(false)} />}

      {/* History panel */}
      {showHistory && (logs.length > 0 || notes.length > 0) && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <p className="font-bold text-sm">Activity History</p>
            </div>
            <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          {notes.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">Journal Entries</p>
              <div className="divide-y divide-border/40">
                {notes.slice(0, 15).map((note) => (
                  <JournalHistoryItem key={note.id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} />
                ))}
              </div>
            </>
          )}

          {logs.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-3">Plan Treatments</p>
              <div className="divide-y divide-border/40">
                {logs.slice(0, 15).map((log: any) => (
                  <HistoryItem key={log.id} log={log} onDelete={handleDeleteLog} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-muted/40 border border-border/50 rounded-2xl px-4 py-3">
        <button onClick={() => setViewMonth((m) => subMonths(m, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="font-bold text-base">{format(viewMonth, "MMMM yyyy")}</p>
        <button onClick={() => setViewMonth((m) => addMonths(m, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border/50 rounded-2xl p-3 shadow-sm">
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {isLoading
            ? Array.from({ length: 35 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)
            : days.map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  currentMonth={viewMonth}
                  events={eventsForDay(day)}
                  journalNotes={notesForDay(day)}
                  isSelected={!!selectedDay && isSameDay(day, selectedDay)}
                  onClick={() => setSelectedDay((prev) => prev && isSameDay(prev, day) ? null : day)}
                />
              ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {(Object.entries(TREATMENT_CONFIG) as [TreatmentType, TreatmentConfig][])
          .filter(([type]) => type !== "other")
          .map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[11px] text-muted-foreground">Journal entry</span>
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">{format(selectedDay, "EEEE, MMMM d")}</h2>
            <button
              onClick={openAddEntry}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Entry
            </button>
          </div>

          {/* Journal entries for this day */}
          {selectedNotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <PenLine className="w-3 h-3" /> Journal
              </p>
              {selectedNotes.map((note) => (
                <JournalChip key={note.id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} />
              ))}
            </div>
          )}

          {/* Treatment events for this day */}
          {selectedEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ListChecks className="w-3 h-3" /> Scheduled Treatments
              </p>
              {selectedEvents.map((event, i) => (
                <EventChip key={`${event.planId}-${event.stepTitle}-${i}`} event={event} logs={logs} />
              ))}
            </div>
          )}

          {selectedEvents.length === 0 && selectedNotes.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm text-muted-foreground">Nothing logged for this day.</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Tap "Add Entry" to record work or a note.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && plans.length === 0 && notes.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-lg">Your lawn journal starts here</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Log work you've completed, schedule upcoming tasks, or leave notes about your lawn — all in one place.
            </p>
          </div>
          <button
            onClick={openAddEntry}
            className="mt-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Your First Entry
          </button>
        </div>
      )}

      {/* Plans sourcing */}
      {!isLoading && plans.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Based on {plans.length} saved {plans.length === 1 ? "plan" : "plans"}
          </p>
          <div className="space-y-2">
            {plans.map((plan) => {
              const planEvents = events.filter((e) => e.planId === plan.id);
              const planLogs = logs.filter((l: any) => l.planId === plan.id);
              const upcoming = planEvents.filter((e) => differenceInDays(e.date, new Date()) >= 0).length;
              return (
                <Link key={plan.id} href={`/plans/${plan.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-border/40 hover:border-border/70 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{plan.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {planEvents.length} events · {upcoming} upcoming
                        {planLogs.length > 0 && ` · ${planLogs.length} logged ✓`}
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

      {/* Journal entry modal */}
      {showJournalModal && (
        <JournalModal
          defaultDate={selectedDay ?? new Date()}
          entry={editingNote}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}
