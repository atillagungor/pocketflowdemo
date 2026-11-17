"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ListChecks,
  Search,
  SearchX,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  SlidersHorizontal,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryMeta } from "@/lib/categories";
import { useBudgetStore } from "@/store/useBudgetStore";
import type { Category, Transaction, TransactionType } from "@/types/finance";

type TypeFilter = "all" | TransactionType;
type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";
type DatePreset = "all" | "month" | "30d" | "90d" | "year" | "custom";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "income", label: "Gelir" },
  { value: "expense", label: "Gider" },
];

const DATE_PRESETS: { value: Exclude<DatePreset, "custom">; label: string }[] =
  [
    { value: "all", label: "Tüm zamanlar" },
    { value: "month", label: "Bu ay" },
    { value: "30d", label: "Son 30 gün" },
    { value: "90d", label: "Son 3 ay" },
    { value: "year", label: "Bu yıl" },
  ];

const moneyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

// Local-time YYYY-MM-DD (toISOString would shift the day because of UTC)
function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Parse YYYY-MM-DD manually to avoid timezone shifts
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Start date for a preset. Only called from click handlers (never during render).
function getPresetStart(preset: Exclude<DatePreset, "custom">) {
  const now = new Date();
  switch (preset) {
    case "month":
      return toISO(new Date(now.getFullYear(), now.getMonth(), 1));
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return toISO(d);
    }
    case "90d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return toISO(d);
    }
    case "year":
      return toISO(new Date(now.getFullYear(), 0, 1));
    default:
      return "";
  }
}

// Hydration gate: false on the server and on the first client render
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const inputClass =
  "h-9 rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent/60 [color-scheme:dark]";

export default function TransactionsView() {
  const mounted = useMounted();
  const transactions = useBudgetStore((s) => s.transactions);
  const seeded = useBudgetStore((s) => s.seeded);
  const seedDummyData = useBudgetStore((s) => s.seedDummyData);
  const removeTransaction = useBudgetStore((s) => s.removeTransaction);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load demo data once when the user lands here first
  useEffect(() => {
    if (mounted && !seeded) seedDummyData();
  }, [mounted, seeded, seedDummyData]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const min = minAmount !== "" ? Number(minAmount) : null;
    const max = maxAmount !== "" ? Number(maxAmount) : null;

    const filtered = transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter)
        return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (min !== null && !Number.isNaN(min) && t.amount < min) return false;
      if (max !== null && !Number.isNaN(max) && t.amount > max) return false;
      if (!q) return true;
      const haystack =
        `${t.note} ${CATEGORIES[t.category].label}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(q);
    });

    return filtered.sort((a, b) => {
      const diff =
        sortKey === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount;
      return sortDir === "asc" ? diff : -diff;
    });
  }, [
    transactions,
    query,
    typeFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    sortKey,
    sortDir,
  ]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of rows) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [rows]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const selectPreset = (preset: Exclude<DatePreset, "custom">) => {
    setDatePreset(preset);
    setDateFrom(getPresetStart(preset));
    setDateTo("");
  };

  const hasActiveFilter =
    query !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    minAmount !== "" ||
    maxAmount !== "";

  const activeFilterCount = [
    typeFilter !== "all",
    categoryFilter !== "all",
    dateFrom !== "" || dateTo !== "",
    minAmount !== "" || maxAmount !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
  };

  if (!mounted) {
    return <main className="flex-1 p-5 lg:p-6" aria-busy="true" />;
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-5 lg:h-[calc(100dvh-4rem)] lg:flex-none lg:p-6">
      {/* Summary tiles (react to the active filters) */}
      <section className="grid shrink-0 grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="İşlem sayısı"
          value={String(rows.length)}
          icon={ListChecks}
          tone="neutral"
        />
        <StatTile
          label="Toplam gelir"
          value={moneyFormatter.format(totals.income)}
          icon={TrendingUp}
          tone="income"
        />
        <StatTile
          label="Toplam gider"
          value={moneyFormatter.format(totals.expense)}
          icon={TrendingDown}
          tone="expense"
        />
        <StatTile
          label="Net"
          value={moneyFormatter.format(totals.net)}
          icon={Wallet}
          tone={totals.net >= 0 ? "income" : "expense"}
        />
      </section>

      {/* Table card: fixed height, only the table body scrolls */}
      <section className="flex h-[75dvh] min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/60 lg:h-auto lg:flex-1 lg:shrink">
        {/* Toolbar */}
        {/* Toolbar */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 md:flex-row md:flex-wrap md:items-center">
          {/* Search + mobile filter toggle */}
          <div className="flex gap-2 md:contents">
            <label className="relative min-w-0 flex-1 md:w-64 md:flex-none">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Açıklama veya kategori ara…"
                className={`${inputClass} w-full pl-9`}
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm md:hidden ${
                filtersOpen || activeFilterCount > 0
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-muted"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtreler
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-black">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel: collapsible on mobile, inline on md+ */}
          <div
            className={`${filtersOpen ? "flex flex-col gap-3" : "hidden"} md:contents`}
          >
            <div className="grid grid-cols-3 rounded-xl border border-border bg-background/60 p-1 md:inline-flex">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeFilter(opt.value)}
                  className={`rounded-lg px-3 py-1 text-center text-sm transition-colors ${
                    typeFilter === opt.value
                      ? "bg-accent/15 font-medium text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="relative">
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as Category | "all")
                }
                className={`${inputClass} w-full appearance-none pr-9 md:w-auto`}
              >
                <option value="all">Tüm kategoriler</option>
                {(Object.entries(CATEGORIES) as [Category, CategoryMeta][]).map(
                  ([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
            </label>

            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => selectPreset(p.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    datePreset === p.value
                      ? "border-accent/40 bg-accent/10 font-medium text-accent"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted md:flex md:items-center">
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDatePreset("custom");
                }}
                aria-label="Başlangıç tarihi"
                className={`${inputClass} w-full min-w-0 text-foreground md:w-auto`}
              />
              <span className="hidden md:inline">–</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDatePreset("custom");
                }}
                aria-label="Bitiş tarihi"
                className={`${inputClass} w-full min-w-0 text-foreground md:w-auto`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted md:flex md:items-center">
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="Min ₺"
                aria-label="Minimum tutar"
                className={`${inputClass} w-full min-w-0 text-foreground md:w-24`}
              />
              <span className="hidden md:inline">–</span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="Max ₺"
                aria-label="Maksimum tutar"
                className={`${inputClass} w-full min-w-0 text-foreground md:w-24`}
              />
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="self-start text-sm text-muted underline-offset-4 hover:text-foreground hover:underline md:ml-auto"
              >
                Filtreleri temizle
              </button>
            )}
          </div>
        </div>
        {/* Scrollable table body */}
        <div className="min-h-0 flex-1 overflow-auto">
          {rows.length === 0 ? (
            <EmptyState filtered={hasActiveFilter} onReset={resetFilters} />
          ) : (
            <table className="w-full md:min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-card text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <SortableTh
                    label="Tarih"
                    active={sortKey === "date"}
                    dir={sortDir}
                    onClick={() => toggleSort("date")}
                  />
                  <th className="px-4 py-3 text-left font-medium">Açıklama</th>
                  <th className="px-4 py-3 text-left font-medium">Kategori</th>
                  <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                    Tür
                  </th>
                  <SortableTh
                    label="Tutar"
                    align="right"
                    active={sortKey === "amount"}
                    dir={sortDir}
                    onClick={() => toggleSort("amount")}
                  />
                  <th className="w-12 px-4 py-3" aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <Row
                    key={t.id}
                    transaction={t}
                    onRemove={() => removeTransaction(t.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-2.5 text-xs text-muted">
          {rows.length} / {transactions.length} işlem gösteriliyor
        </div>
      </section>
    </main>
  );
}

/* ---------- Helpers ---------- */

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "neutral" | "income" | "expense";
}) {
  const toneClasses = {
    neutral: "bg-white/5 text-muted",
    income: "bg-accent/15 text-accent",
    expense: "bg-danger/15 text-danger",
  }[tone];

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4">
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-xl ${toneClasses}`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-lg font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 uppercase tracking-wide transition-colors hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon size={13} />
      </button>
    </th>
  );
}

function Row({ transaction: t, onRemove }: { transaction: Transaction; onRemove: () => void }) {
  const meta = CATEGORIES[t.category];
  const CategoryIcon = meta.icon;
  const isIncome = t.type === "income";

  return (
    <tr className="group border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.03]">
      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(t.date)}</td>
      <td className="max-w-[110px] truncate px-4 py-3 font-medium md:max-w-[280px]">{t.note || "—"}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span
            title={meta.label}
            className="grid size-7 place-items-center rounded-lg"
            style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
          >
            <CategoryIcon size={15} />
          </span>
          <span className="hidden md:inline">{meta.label}</span>
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isIncome ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
          }`}
        >
          {isIncome ? "Gelir" : "Gider"}
        </span>
      </td>
      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${isIncome ? "text-accent" : "text-danger"}`}>
        {isIncome ? "+" : "−"}
        {moneyFormatter.format(t.amount)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onRemove}
          aria-label="İşlemi sil"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

function EmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="grid h-full min-h-60 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white/5 text-muted">
          <SearchX size={22} />
        </span>
        <p className="font-medium">
          {filtered ? "Sonuç bulunamadı" : "Henüz işlem yok"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {filtered
            ? "Aramayı veya filtreleri değiştirmeyi dene."
            : "İlk işlemini ekleyince burada görünecek."}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={onReset}
            className="mt-4 rounded-xl border border-border px-4 py-2 text-sm hover:bg-white/5"
          >
            Filtreleri temizle
          </button>
        )}
      </div>
    </div>
  );
}
