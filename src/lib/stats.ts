import type { Category, Transaction } from "@/types/finance";
import { CATEGORIES } from "@/lib/categories";
import { formatMonthShort, formatShortDate, toISODate, toMonthKey } from "@/lib/format";

/** Returns the ISO date (YYYY-MM-DD) for `days` days before today. */
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISODate(date);
};

const signedAmount = (t: Transaction): number => (t.type === "income" ? t.amount : -t.amount);

export interface Summary {
  balance: number;
  income: number;
  expense: number;
  savingsRate: number;
  prevIncome: number;
  prevExpense: number;
}

/** Totals for the last 30 days, plus the 30 days before for comparison. */
export function getSummary(transactions: Transaction[]): Summary {
  const from30 = daysAgo(30);
  const from60 = daysAgo(60);
  let balance = 0;
  let income = 0;
  let expense = 0;
  let prevIncome = 0;
  let prevExpense = 0;

  for (const t of transactions) {
    balance += signedAmount(t);
    if (t.date > from30) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    } else if (t.date > from60) {
      if (t.type === "income") prevIncome += t.amount;
      else prevExpense += t.amount;
    }
  }

  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  return { balance, income, expense, savingsRate, prevIncome, prevExpense };
}

export interface DailyPoint {
  label: string;
  income: number;
  expense: number;
  balance: number;
}

/** Income, expense and running balance for each of the last `days` days. */
export function getDailySeries(transactions: Transaction[], days = 60): DailyPoint[] {
  const dates = Array.from({ length: days }, (_, i) => daysAgo(days - 1 - i));
  const byDate = new Map<string, { income: number; expense: number }>(
    dates.map((d) => [d, { income: 0, expense: 0 }])
  );
  const firstDate = dates[0];
  let running = 0;

  for (const t of transactions) {
    if (t.date < firstDate) {
      running += signedAmount(t);
      continue;
    }
    const bucket = byDate.get(t.date);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return dates.map((date) => {
    const bucket = byDate.get(date)!;
    running += bucket.income - bucket.expense;
    return { label: formatShortDate(date), ...bucket, balance: running };
  });
}

export interface MonthlyPoint {
  label: string;
  income: number;
  expense: number;
}

/** Income and expense totals per month for the last `months` months. */
export function getMonthlySeries(transactions: Transaction[], months = 6): MonthlyPoint[] {
  const now = new Date();
  const keys = Array.from({ length: months }, (_, i) =>
    toMonthKey(new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1))
  );
  const totals = new Map<string, { income: number; expense: number }>(
    keys.map((key) => [key, { income: 0, expense: 0 }])
  );

  for (const t of transactions) {
    const bucket = totals.get(t.date.slice(0, 7));
    if (!bucket) continue;
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return keys.map((key) => ({ label: formatMonthShort(key), ...totals.get(key)! }));
}

export interface CategorySlice {
  category: Category;
  label: string;
  color: string;
  value: number;
}

/** Expense totals per category for the last `days` days, largest first. */
export function getCategoryBreakdown(transactions: Transaction[], days = 30): CategorySlice[] {
  const from = daysAgo(days);
  const totals = new Map<Category, number>();

  for (const t of transactions) {
    if (t.type === "expense" && t.date > from) {
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
  }

  return [...totals.entries()]
    .map(([category, value]) => ({
      category,
      label: CATEGORIES[category].label,
      color: CATEGORIES[category].color,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}