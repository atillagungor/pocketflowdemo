"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySlice } from "@/lib/stats";
import { formatCompact, formatCurrency } from "@/lib/format";
import { TOOLTIP_PROPS } from "./theme";

export default function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const chartData = data.map((slice) => ({ ...slice, fill: slice.color }));

  return (
    <div className="flex h-full items-center gap-4">
      <div className="relative h-full min-h-36 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip {...TOOLTIP_PROPS} formatter={(value, name) => [formatCurrency(Number(value)), name]} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] text-muted">Toplam</p>
            <p className="text-sm font-semibold">{formatCompact(total)} ₺</p>
          </div>
        </div>
      </div>

      <ul className="w-2/5 space-y-2 text-xs">
        {data.slice(0, 5).map((slice) => (
          <li key={slice.category} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="flex-1 truncate text-muted">{slice.label}</span>
            <span className="font-medium">{total > 0 ? Math.round((slice.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}