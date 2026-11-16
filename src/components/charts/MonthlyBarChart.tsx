"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyPoint } from "@/lib/stats";
import { formatCompact, formatCurrency } from "@/lib/format";
import { AXIS_TICK, GRID_STROKE, TOOLTIP_PROPS } from "./theme";

export default function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={AXIS_TICK} width={44} />
        <Tooltip
          {...TOOLTIP_PROPS}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(value, name) => [formatCurrency(Number(value)), name]}
        />
        <Bar dataKey="income" name="Gelir" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expense" name="Gider" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}