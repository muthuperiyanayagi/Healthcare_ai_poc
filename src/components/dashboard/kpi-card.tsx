"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Accent = "primary" | "accent" | "success" | "warning";

const ACCENT_STYLES: Record<Accent, { icon: string; bar: string }> = {
  primary: {
    icon: "from-primary/25 to-primary/5 text-primary",
    bar: "bg-primary/80",
  },
  accent: {
    icon: "from-accent/25 to-accent/5 text-accent",
    bar: "bg-accent/80",
  },
  success: {
    icon: "from-success/25 to-success/5 text-success",
    bar: "bg-success/80",
  },
  warning: {
    icon: "from-warning/25 to-warning/5 text-warning",
    bar: "bg-warning/80",
  },
};

function parseNumericTarget(value: string | number): { numeric: number; prefix: string; suffix: string } | null {
  if (typeof value === "number") {
    return { numeric: value, prefix: "", suffix: "" };
  }
  const match = value.trim().match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  return { numeric: Number(match[2]), prefix: match[1], suffix: match[3] };
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "primary",
  delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: Accent;
  delay?: number;
}) {
  const parsed = parseNumericTarget(value);
  const [animated, setAnimated] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setAnimated(null);
  }

  useEffect(() => {
    const target = parseNumericTarget(value);
    if (!target) return;

    const start = performance.now();
    const duration = 800;
    let raf = 0;
    const digits = Number.isInteger(target.numeric) ? 0 : 1;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = target.numeric * eased;
      const formatted =
        digits === 0 ? Math.round(current).toString() : current.toFixed(digits);
      setAnimated(`${target.prefix}${formatted}${target.suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setAnimated(String(value));
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const display = !parsed
    ? value
    : (animated ?? `${parsed.prefix}0${parsed.suffix}`);

  const styles = ACCENT_STYLES[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
    >
      <Card className="relative overflow-hidden">
        <div className={cn("absolute inset-x-0 top-0 h-0.5", styles.bar)} />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={cn("rounded-xl bg-gradient-to-br p-2.5", styles.icon)}>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-display text-2xl font-bold tracking-tight tabular-nums md:text-[1.65rem]">
            {display}
          </div>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
