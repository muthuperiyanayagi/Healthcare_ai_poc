import { ShieldCheck, FileJson2, Network, ScrollText, UserRoundCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  { label: "HIPAA Ready", icon: ShieldCheck },
  { label: "FHIR Compatible", icon: FileJson2 },
  { label: "HL7 Integration Ready", icon: Network },
  { label: "Audit Trail Enabled", icon: ScrollText },
  { label: "Human Review Required", icon: UserRoundCheck },
] as const;

export function ComplianceBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {BADGES.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
        >
          <Icon className="h-3.5 w-3.5 text-accent" />
          {label}
        </span>
      ))}
    </div>
  );
}
