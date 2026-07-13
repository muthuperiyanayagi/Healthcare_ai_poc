"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ScoreGauge({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
