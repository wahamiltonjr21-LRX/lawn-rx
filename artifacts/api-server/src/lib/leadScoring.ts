type Severity = "Low" | "Medium" | "High";

const SEVERITY_BAND: Record<Severity, [number, number]> = {
  High:   [80, 100],
  Medium: [50,  79],
  Low:    [20,  49],
};

const SEVERITY_BASE: Record<Severity, number> = {
  High:   85,
  Medium: 62,
  Low:    32,
};

const HIGH_VALUE_KEYWORDS = [
  "fungus",
  "disease",
  "grub",
  "chinch",
  "armyworm",
  "brown patch",
  "dollar spot",
  "pythium",
  "rhizoctonia",
  "sod webworm",
  "overseeding",
  "renovation",
  "aeration",
];

export interface ScoringInput {
  severity: string;
  diagnosisTitle?: string;
  hasPhone?: boolean;
  hasAddress?: boolean;
}

export function computeLeadScore(input: ScoringInput): number {
  const severity = (input.severity ?? "Medium") as Severity;
  const [min, max] = SEVERITY_BAND[severity] ?? [30, 70];
  let score = SEVERITY_BASE[severity] ?? 50;

  const titleLower = (input.diagnosisTitle ?? "").toLowerCase();
  const hasHighValueKeyword = HIGH_VALUE_KEYWORDS.some((kw) => titleLower.includes(kw));
  if (hasHighValueKeyword) score += 8;
  if (input.hasPhone) score += 4;
  if (input.hasAddress) score += 3;

  return Math.max(min, Math.min(max, Math.round(score)));
}
