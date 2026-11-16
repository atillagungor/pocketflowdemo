import type { Category, Transaction } from "@/types/finance";
import { toISODate } from "@/lib/format";

/** Small deterministic PRNG so the demo data looks the same on every run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SpendingTemplate {
  category: Category;
  note: string;
  min: number;
  max: number;
}

const SPENDING: SpendingTemplate[] = [
  { category: "food", note: "Market alışverişi", min: 150, max: 900 },
  { category: "food", note: "Restoran", min: 250, max: 1200 },
  { category: "transport", note: "Akaryakıt ve toplu taşıma", min: 100, max: 900 },
  { category: "entertainment", note: "Sinema ve oyun", min: 150, max: 1200 },
  { category: "health", note: "Eczane", min: 100, max: 600 },
  { category: "shopping", note: "Giyim ve teknoloji", min: 300, max: 3500 },
];

/** Generates realistic transactions for the last `months` months, newest first. */
export function generateDummyTransactions(months = 6): Transaction[] {
  const rand = mulberry32(27);
  const today = new Date();
  const items: Transaction[] = [];

  const push = (
    date: Date,
    type: Transaction["type"],
    category: Category,
    amount: number,
    note: string
  ) => {
    if (date > today) return; // never create future transactions
    items.push({
      id: crypto.randomUUID(),
      type,
      category,
      amount: Math.round(amount),
      note,
      date: toISODate(date),
    });
  };

  for (let i = months - 1; i >= 0; i--) {
    const year = today.getFullYear();
    const month = today.getMonth() - i;
    const at = (day: number) => new Date(year, month, day);

    push(at(1), "income", "salary", 52000, "Maaş");
    if (rand() > 0.45) {
      push(at(10 + Math.floor(rand() * 10)), "income", "freelance", 4000 + rand() * 9000, "Serbest proje");
    }
    push(at(3), "expense", "rent", 14000, "Kira");
    push(at(8), "expense", "bills", 900 + rand() * 600, "Elektrik & internet");

    const count = 18 + Math.floor(rand() * 8);
    for (let n = 0; n < count; n++) {
      const tpl = SPENDING[Math.floor(rand() * SPENDING.length)];
      const amount = tpl.min + rand() * (tpl.max - tpl.min);
      push(at(1 + Math.floor(rand() * 28)), "expense", tpl.category, amount, tpl.note);
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}