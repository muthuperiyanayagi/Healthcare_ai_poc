import type { CdsSeverity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const PRIORITY: Record<
  string,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  critical: { label: "Critical", variant: "destructive" },
  high: { label: "High", variant: "destructive" },
  warning: { label: "High", variant: "warning" },
  moderate: { label: "Moderate", variant: "warning" },
  medium: { label: "Moderate", variant: "warning" },
  info: { label: "Routine", variant: "secondary" },
  low: { label: "Low", variant: "secondary" },
};

export function CareGapPriorityBadge({ severity }: { severity: string }) {
  const normSeverity = (severity || "").toLowerCase().trim();
  const cfg = PRIORITY[normSeverity] || {
    label: severity || "Routine",
    variant: "secondary" as const,
  };

  return (
    <Badge variant={cfg.variant} className="capitalize">
      {cfg.label}
    </Badge>
  );
}
