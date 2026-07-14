"use client";

import { motion } from "framer-motion";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueQualityPoint, RevenueTrendPoint } from "@/lib/services/revenue.service";
import { formatCurrency } from "@/lib/utils";

const tipStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 12px 30px rgba(11, 60, 90, 0.12)",
};

export function RevenueCharts({
  trends,
  qualityTrends,
}: {
  trends: RevenueTrendPoint[];
  qualityTrends: RevenueQualityPoint[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protected vs leakage</CardTitle>
            <CardDescription>Weekly revenue defense and residual exposure</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${Number(v) / 1000}k`}
                />
                <Tooltip
                  contentStyle={tipStyle}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    String(name),
                  ]}
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="protected"
                  name="Protected"
                  fill="var(--chart-3)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="leakage"
                  name="Leakage"
                  fill="var(--chart-4)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={32}
                />
                <Line
                  type="monotone"
                  dataKey="reimbursement"
                  name="Reimbursement"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coding & claim quality</CardTitle>
            <CardDescription>Accuracy, readiness, and documentation trend</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={qualityTrends}>
                <defs>
                  <linearGradient id="readinessFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[70, 100]}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={tipStyle}
                  formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name)]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="readiness"
                  name="Claim readiness"
                  stroke="var(--chart-1)"
                  fill="url(#readinessFill)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Coding accuracy"
                  stroke="var(--chart-2)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="documentationQuality"
                  name="Doc quality"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
