import type { AnalyticsSeries, DashboardMetrics, WeeklyPoint } from "@/lib/types";
import {
  buildAnalyticsSeries,
  buildDashboardMetrics,
  buildWeeklySeries,
} from "@/lib/mock/analytics";
import { getEncounters } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/** FastAPI-shaped: GET /api/v1/analytics/dashboard */
export async function getDashboardMetrics(): Promise<{
  metrics: DashboardMetrics;
  weekly: WeeklyPoint[];
}> {
  await randomDelay(600, 1200);
  const encounters = getEncounters();
  const today = new Date().toISOString().slice(0, 10);
  const patientsToday = encounters.filter((e) => e.createdAt.slice(0, 10) === today).length;
  const withAi = encounters.filter((e) => e.documentation);
  const timeSaved = encounters.reduce((sum, e) => sum + (e.timeSavedMinutes ?? 0), 0);
  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  return {
    metrics: buildDashboardMetrics({
      patientsToday: Math.max(patientsToday, 8),
      aiNotesGenerated: Math.max(withAi.length, 40),
      timeSavedMinutes: Math.max(timeSaved, 240),
      codingAccuracy: Number(
        avg(withAi.map((e) => e.coding?.confidence ?? e.aiConfidence ?? 90)).toFixed(1)
      ),
      claimReadiness: Number(
        avg(withAi.map((e) => e.coding?.claimReadiness ?? 88)).toFixed(1)
      ),
      documentationQuality: Number(
        avg(withAi.map((e) => e.documentationQuality ?? 90)).toFixed(1)
      ),
      aiConfidence: Number(avg(withAi.map((e) => e.aiConfidence ?? 90)).toFixed(1)),
      revenueLeakagePrevented: 12000 + withAi.length * 280,
    }),
    weekly: buildWeeklySeries(),
  };
}

/** FastAPI-shaped: GET /api/v1/analytics/series */
export async function getAnalyticsSeries(): Promise<AnalyticsSeries> {
  await randomDelay(700, 1400);
  return buildAnalyticsSeries();
}
