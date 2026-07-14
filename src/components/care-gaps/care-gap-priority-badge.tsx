import type { CdsSeverity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const PRIORITY: Record<
  CdsSeverity,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  critical: { label: "Critical", variant: "destructive" },
  warning: { label: "High", variant: "warning" },
  info: { label: "Routine", variant: "secondary" },
};

export function CareGapPriorityBadge({ severity }: { severity: CdsSeverity }) {
  const cfg = PRIORITY[severity];
  return (
    <Badge variant={cfg.variant} className="capitalize">
      {cfg.label}
    </Badge>
  );
}
