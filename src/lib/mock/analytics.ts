import type { AnalyticsSeries, DashboardMetrics, WeeklyPoint } from "@/lib/types";

function lastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function buildWeeklySeries(): WeeklyPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const base = [14, 18, 16, 21, 19, 8, 6];
  return days.map((day, i) => ({
    day,
    encounters: base[i],
    aiNotes: Math.max(4, base[i] - 2),
    timeSaved: base[i] * 12 + (i % 3) * 5,
  }));
}

export function buildDashboardMetrics(overrides?: Partial<DashboardMetrics>): DashboardMetrics {
  return {
    patientsToday: 24,
    aiNotesGenerated: 86,
    timeSavedMinutes: 312,
    codingAccuracy: 94.2,
    claimReadiness: 91.5,
    documentationQuality: 93.1,
    aiConfidence: 90.4,
    revenueLeakagePrevented: 18400,
    revenueProtected: 24800,
    revenueLeakage: 6200,
    denialRisk: 14.5,
    careGapClosure: 68,
    clinicalProductivity: 88,
    ...overrides,
  };
}

export function buildAnalyticsSeries(): AnalyticsSeries {
  const dates = lastNDays(30);
  return {
    encountersOverTime: dates.map((date, i) => ({
      date,
      count: 12 + ((i * 3) % 9) + (i % 5),
    })),
    codingAccuracy: dates.map((date, i) => ({
      date,
      value: 88 + ((i * 1.1) % 7),
    })),
    timeSaved: dates.map((date, i) => ({
      date,
      minutes: 180 + ((i * 17) % 120),
    })),
    revenueImprovement: dates.map((date, i) => ({
      date,
      amount: 400 + ((i * 53) % 500),
    })),
    claimReadiness: dates.map((date, i) => ({
      date,
      value: 82 + ((i * 0.9) % 12),
    })),
    documentationQuality: dates.map((date, i) => ({
      date,
      value: 85 + ((i * 1.2) % 10),
    })),
  };
}

export const SUGGESTED_PROMPTS = [
  "Summarize the latest encounter",
  "Explain the top ICD-10 codes",
  "What treatment plan is recommended?",
  "Any drug interactions I should watch?",
  "Missing documentation or labs?",
  "Generate a patient-friendly explanation",
] as const;
