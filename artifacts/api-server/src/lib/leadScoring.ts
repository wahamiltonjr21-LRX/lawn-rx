type Severity = "Low" | "Medium" | "High";

const SEVERITY_BASE: Record<Severity, number> = {
  High: 85,
  Medium: 65,
  Low: 35,
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
  let score = SEVERITY_BASE[severity] ?? 50;

  const titleLower = (input.diagnosisTitle ?? "").toLowerCase();
  const hasHighValueKeyword = HIGH_VALUE_KEYWORDS.some((kw) => titleLower.includes(kw));
  if (hasHighValueKeyword) score = Math.min(100, score + 10);

  if (input.hasPhone) score = Math.min(100, score + 5);
  if (input.hasAddress) score = Math.min(100, score + 5);

  return Math.max(0, Math.min(100, Math.round(score)));
}
