"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSeries } from "@/lib/types";

function shortDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ChartCard({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-72">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

const tipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 8px 24px rgba(15, 36, 48, 0.12)",
};

export function AnalyticsCharts({ series }: { series: AnalyticsSeries }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Encounters over time" description="30-day visit volume" delay={0}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.encountersOverTime}>
            <defs>
              <linearGradient id="encountersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 12 }} width={36} />
            <Tooltip
              contentStyle={tipStyle}
              labelFormatter={(label) => shortDate(String(label))}
            />
            <Area
              type="monotone"
              dataKey="count"
              name="Encounters"
              stroke="var(--chart-1)"
              fill="url(#encountersFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Coding accuracy" description="Suggested code confidence trend" delay={0.05}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.codingAccuracy}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} width={36} unit="%" />
            <Tooltip
              contentStyle={tipStyle}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Accuracy"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Accuracy"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Time saved" description="Clinician minutes recovered daily" delay={0.1}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series.timeSaved}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={tipStyle}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value) => [`${Number(value)} min`, "Time saved"]}
            />
            <Bar dataKey="minutes" name="Minutes" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Revenue improvement"
        description="Estimated leakage prevented ($)"
        delay={0.15}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series.revenueImprovement}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />
            <YAxis tick={{ fontSize: 12 }} width={44} />
            <Tooltip
              contentStyle={tipStyle}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Revenue"
              stroke="var(--chart-4)"
              fill="url(#revenueFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Claim readiness" description="Documentation readiness for claims" delay={0.2}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.claimReadiness}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} width={36} unit="%" />
            <Tooltip
              contentStyle={tipStyle}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Readiness"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Readiness"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Documentation quality"
        description="AI quality score trend"
        delay={0.25}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.documentationQuality}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              minTickGap={28}
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} width={36} unit="%" />
            <Tooltip
              contentStyle={tipStyle}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Quality"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Quality"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
