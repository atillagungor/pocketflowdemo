"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import BalanceTrendChart from "@/components/charts/BalanceTrendChart";
import CategoryDonut from "@/components/charts/CategoryDonut";
import MonthlyBarChart from "@/components/charts/MonthlyBarChart";
import Sparkline from "@/components/charts/Sparkline";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useHydrated } from "@/hooks/useHydrated";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryBreakdown, getDailySeries, getMonthlySeries, getSummary } from "@/lib/stats";
import { formatCurrency, formatShortDate } from "@/lib/format";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" as const },
});

const formatPercent = (value: number): string => `${value.toFixed(0)}%`;

/** Percent change between two values, or null when there is no baseline. */
const percentChange = (current: number, previous: number): number | null =>
  previous === 0 ? null : ((current - previous) / previous) * 100;

/** Chart area: fixed height on mobile, fills the remaining card height on desktop. */
const CHART_BOX = "h-56 lg:h-auto lg:min-h-0 lg:flex-1";

interface DeltaChipProps {
  change: number | null;
  /** When true, an increase is bad (e.g. expenses). */
  invert?: boolean;
}

function DeltaChip({ change, invert = false }: DeltaChipProps) {
  if (change === null) return null;
  const isUp = change >= 0;
  const isGood = invert ? !isUp : isUp;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      title="Önceki 30 güne göre"
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        isGood ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
      }`}
    >
      <Icon size={12} />
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  format: (value: number) => string;
  icon: LucideIcon;
  iconClass: string;
  spark: { value: number }[];
  sparkColor: string;
  sparkId: string;
  change?: number | null;
  invert?: boolean;
  highlight?: boolean;
  delay: number;
}

function StatCard({
  label,
  value,
  format,
  icon: Icon,
  iconClass,
  spark,
  sparkColor,
  sparkId,
  change = null,
  invert,
  highlight,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`rounded-2xl border border-border p-4 ${
        highlight ? "bg-gradient-to-br from-accent/15 via-card to-card" : "bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-muted">
          <span className={`grid size-8 place-items-center rounded-lg ${iconClass}`}>
            <Icon size={16} />
          </span>
          {label}
        </span>
        <DeltaChip change={change} invert={invert} />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      <div className="mt-2 h-9">
        <Sparkline data={spark} color={sparkColor} id={sparkId} />
      </div>
    </motion.div>
  );
}

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  delay?: number;
  className?: string;
  children: ReactNode;
}

function Panel({ title, subtitle, action, delay = 0, className = "", children }: PanelProps) {
  return (
    <motion.section
      {...fadeUp(delay)}
      className={`flex min-h-0 flex-col rounded-2xl border border-border bg-card p-5 ${className}`}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </motion.section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DashboardContent() {
  const transactions = useBudgetStore((s) => s.transactions);

  const summary = useMemo(() => getSummary(transactions), [transactions]);
  const daily = useMemo(() => getDailySeries(transactions, 60), [transactions]);
  const monthly = useMemo(() => getMonthlySeries(transactions, 6), [transactions]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions, 30), [transactions]);
  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7),
    [transactions]
  );

  // Sparkline series for the last 30 days (cumulative, so the lines stay smooth).
  const sparks = useMemo(() => {
    const last = daily.slice(-30);
    const income: { value: number }[] = [];
    const expense: { value: number }[] = [];
    const net: { value: number }[] = [];
    let incomeSum = 0;
    let expenseSum = 0;
    for (const day of last) {
      incomeSum += day.income;
      expenseSum += day.expense;
      income.push({ value: incomeSum });
      expense.push({ value: expenseSum });
      net.push({ value: incomeSum - expenseSum });
    }
    return { balance: last.map((d) => ({ value: d.balance })), income, expense, net };
  }, [daily]);

  if (transactions.length === 0) {
    return (
      <motion.div
        {...fadeUp()}
        className="grid place-items-center rounded-2xl border border-dashed border-border p-16 text-center lg:flex-1"
      >
        <div>
          <p className="text-lg font-medium">Henüz işlem yok</p>
          <p className="mt-1 text-sm text-muted">Eklediğin işlemler burada görünecek.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
        <StatCard
          label="Toplam bakiye"
          value={summary.balance}
          format={formatCurrency}
          icon={Wallet}
          iconClass="bg-accent/15 text-accent"
          spark={sparks.balance}
          sparkColor="#22c55e"
          sparkId="spark-balance"
          highlight
          delay={0}
        />
        <StatCard
          label="Gelir · 30 gün"
          value={summary.income}
          format={formatCurrency}
          icon={TrendingUp}
          iconClass="bg-accent/10 text-accent"
          spark={sparks.income}
          sparkColor="#22c55e"
          sparkId="spark-income"
          change={percentChange(summary.income, summary.prevIncome)}
          delay={0.08}
        />
        <StatCard
          label="Gider · 30 gün"
          value={summary.expense}
          format={formatCurrency}
          icon={TrendingDown}
          iconClass="bg-danger/10 text-danger"
          spark={sparks.expense}
          sparkColor="#f43f5e"
          sparkId="spark-expense"
          change={percentChange(summary.expense, summary.prevExpense)}
          invert
          delay={0.16}
        />
        <StatCard
          label="Tasarruf oranı"
          value={summary.savingsRate}
          format={formatPercent}
          icon={PiggyBank}
          iconClass="bg-violet-500/10 text-violet-400"
          spark={sparks.net}
          sparkColor="#a78bfa"
          sparkId="spark-net"
          delay={0.24}
        />
      </div>

      <Panel title="Bakiye trendi" subtitle="Son 60 gün" delay={0.3} className="lg:col-span-8">
        <div className={CHART_BOX}>
          <BalanceTrendChart data={daily} />
        </div>
      </Panel>

      <Panel title="Son işlemler" subtitle="En yeni 7 kayıt" delay={0.4} className="lg:col-span-4 lg:row-span-2">
        <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1 overflow-hidden">
          {recent.map((t) => {
            const meta = CATEGORIES[t.category];
            const Icon = meta.icon;
            const isIncome = t.type === "income";
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.note || meta.label}</p>
                  <p className="text-xs text-muted">
                    {meta.label} · {formatShortDate(t.date)}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${isIncome ? "text-accent" : "text-foreground"}`}>
                  {isIncome ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel
        title="Aylık gelir / gider"
        subtitle="Son 6 ay"
        delay={0.5}
        className="lg:col-span-4"
        action={
          <div className="flex gap-3">
            <LegendDot color="#22c55e" label="Gelir" />
            <LegendDot color="#f43f5e" label="Gider" />
          </div>
        }
      >
        <div className={CHART_BOX}>
          <MonthlyBarChart data={monthly} />
        </div>
      </Panel>

      <Panel title="Harcama dağılımı" subtitle="Son 30 gün" delay={0.6} className="lg:col-span-4">
        <div className={CHART_BOX}>
          <CategoryDonut data={breakdown} />
        </div>
      </Panel>
    </div>
  );
}

export default function Dashboard() {
  const hydrated = useHydrated();
  const seeded = useBudgetStore((s) => s.seeded);
  const seedDummyData = useBudgetStore((s) => s.seedDummyData);

  // First visit: load the dummy data once (after hydration, so localStorage is readable).
  useEffect(() => {
    if (hydrated && !seeded) seedDummyData();
  }, [hydrated, seeded, seedDummyData]);

  // Render nothing until hydrated and seeded: localStorage and the current date
  // are only available on the client.
  if (!hydrated || !seeded) return null;

  return (
    <main className="relative flex flex-col p-5 lg:h-[calc(100dvh-4rem)] lg:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(34,197,94,0.12),transparent)]" />
      <DashboardContent />
    </main>
  );
}