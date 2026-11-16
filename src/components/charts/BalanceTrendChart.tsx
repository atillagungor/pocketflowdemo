"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/lib/stats";import { formatCompact, formatCurrency } from "@/lib/format";
import { AXIS_TICK, GRID_STROKE, TOOLTIP_PROPS } from "./theme";

export default function BalanceTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={36} />
        <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={AXIS_TICK} width={48} />
        <Tooltip {...TOOLTIP_PROPS} formatter={(value) => [formatCurrency(Number(value)), "Bakiye"]} />
        <Area type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2.5} fill="url(#balanceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}