import type { EncounterStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const MAP: Record<EncounterStatus, { label: string; variant: "warning" | "success" | "accent" }> = {
  draft: { label: "Draft", variant: "warning" },
  reviewed: { label: "Reviewed", variant: "success" },
  exported: { label: "Exported", variant: "accent" },
};

export function StatusBadge({ status }: { status: EncounterStatus }) {
  const cfg = MAP[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
