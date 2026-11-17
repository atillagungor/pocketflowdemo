"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CalendarDays,
  FileJson,
  FileSpreadsheet,
  Gauge,
  HardDrive,
  ListChecks,
  RotateCcw,
  Target,
  Trash2,
  TrendingDown,
  Upload,
} from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { CATEGORIES } from "@/lib/categories";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Category, Transaction } from "@/types/finance";

type PendingAction = "reseed" | "clear" | null;

const moneyFormatter = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Local-time YYYY-MM-DD
function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Escape a CSV cell (semicolon-separated, which is what Turkish Excel expects)
function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

// Validate one imported record, returns null for anything malformed
function sanitizeTransaction(item: unknown): Transaction | null {
  if (typeof item !== "object" || item === null) return null;
  const o = item as Record<string, unknown>;
  if (o.type !== "income" && o.type !== "expense") return null;
  if (typeof o.amount !== "number" || !Number.isFinite(o.amount) || o.amount <= 0) return null;
  if (typeof o.category !== "string" || !CATEGORY_KEYS.includes(o.category as Category)) return null;
  if (typeof o.date !== "string" || !DATE_RE.test(o.date)) return null;
  return {
    id: typeof o.id === "string" && o.id ? o.id : crypto.randomUUID(),
    type: o.type,
    amount: o.amount,
    category: o.category as Category,
    note: typeof o.note === "string" ? o.note : "",
    date: o.date,
  };
}

const fieldClass =
  "h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent/60";
const ghostButton =
  "rounded-xl border border-border px-4 py-2 text-sm transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40";

export default function SettingsView() {
  const mounted = useMounted();
  const transactions = useBudgetStore((s) => s.transactions);
  const seedDummyData = useBudgetStore((s) => s.seedDummyData);
  const monthlyLimit = useSettingsStore((s) => s.monthlyLimit);
  const setMonthlyLimit = useSettingsStore((s) => s.setMonthlyLimit);

  const fileInput = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  // Short-lived toast message
  const notify = (text: string, ok = true) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setStatus({ text, ok });
    toastTimer.current = setTimeout(() => setStatus(null), 3500);
  };

  // Approximate size of the stored data in KB
  const sizeKb = useMemo(() => {
    if (!mounted) return 0;
    return new Blob([JSON.stringify(transactions)]).size / 1024;
  }, [mounted, transactions]);

  // Current month stats (only computed after hydration)
  const month = useMemo(() => {
    if (!mounted) {
      return { expense: 0, daily: 0, projected: 0, daysLeft: 0, top: [] as { category: Category; amount: number }[] };
    }
    const now = new Date();
    const key = toISO(now).slice(0, 7);
    const day = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const byCategory = new Map<Category, number>();
    let expense = 0;
    for (const t of transactions) {
      if (t.type !== "expense" || !t.date.startsWith(key)) continue;
      expense += t.amount;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    }
    const top = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, amount]) => ({ category, amount }));

    return {
      expense,
      daily: expense / day,
      projected: (expense / day) * daysInMonth,
      daysLeft: daysInMonth - day,
      top,
    };
  }, [mounted, transactions]);

  const exportJson = () => {
    downloadFile(
      `pocketflow-islemler-${toISO(new Date())}.json`,
      JSON.stringify(transactions, null, 2),
      "application/json"
    );
    notify("JSON dosyası indirildi.");
  };

  const exportCsv = () => {
    const header = ["Tarih", "Açıklama", "Kategori", "Tür", "Tutar"].join(";");
    const lines = transactions.map((t) =>
      [
        t.date,
        csvCell(t.note),
        csvCell(CATEGORIES[t.category].label),
        t.type === "income" ? "Gelir" : "Gider",
        String(t.amount).replace(".", ","),
      ].join(";")
    );
    // BOM keeps Turkish characters intact when opened in Excel
    downloadFile(
      `pocketflow-islemler-${toISO(new Date())}.csv`,
      `\uFEFF${[header, ...lines].join("\n")}`,
      "text/csv;charset=utf-8"
    );
    notify("CSV dosyası indirildi.");
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again
    e.target.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("Expected an array");

      const current = useBudgetStore.getState().transactions;
      const existingIds = new Set(current.map((t) => t.id));
      const valid = parsed
        .map(sanitizeTransaction)
        .filter((t): t is Transaction => t !== null && !existingIds.has(t.id));
      const skipped = parsed.length - valid.length;

      if (valid.length === 0) {
        notify("Eklenecek yeni işlem bulunamadı.", false);
        return;
      }
      // seeded stays true so the dashboard does not reload the demo data
      useBudgetStore.setState({ transactions: [...valid, ...current], seeded: true });
      notify(`${valid.length} işlem eklendi${skipped > 0 ? `, ${skipped} kayıt atlandı` : ""}.`);
    } catch {
      notify("Dosya okunamadı, geçerli bir JSON değil.", false);
    }
  };

  const confirmAction = () => {
    if (pending === "reseed") {
      seedDummyData();
      notify("Demo veri yeniden yüklendi.");
    } else if (pending === "clear") {
      // seeded stays true so the dashboard does not reload the demo data
      useBudgetStore.setState({ transactions: [], seeded: true });
      notify("Tüm veriler silindi.");
    }
    setPending(null);
  };

  if (!mounted) {
    return <main className="flex-1 p-5 lg:p-6" aria-busy="true" />;
  }

  const hasLimit = monthlyLimit > 0;
  const usage = hasLimit ? (month.expense / monthlyLimit) * 100 : 0;
  const barColor = usage >= 100 ? "bg-danger" : usage >= 75 ? "bg-amber-500" : "bg-accent";
  const willExceed = hasLimit && usage < 100 && month.projected > monthlyLimit;
  const topMax = month.top[0]?.amount ?? 0;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-5 lg:h-[calc(100dvh-4rem)] lg:flex-none lg:p-6">
      {/* Summary tiles */}
      <section className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoTile icon={ListChecks} label="Kayıtlı işlem" value={String(transactions.length)} />
        <InfoTile icon={HardDrive} label="Depolama boyutu" value={`${sizeKb.toFixed(1)} KB`} />
        <InfoTile icon={TrendingDown} label="Bu ay gider" value={moneyFormatter.format(month.expense)} />
      </section>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        {/* Left column: monthly limit fills the full height */}
        <Card icon={Target} title="Aylık harcama limiti" description="Bu ayki giderlerini limitine göre takip et." className="lg:h-full">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-5">
            <div>
              <label htmlFor="monthly-limit" className="mb-1.5 block text-xs text-muted">
                Limit (₺), boş bırakırsan limit kapalı
              </label>
              <input
                id="monthly-limit"
                type="number"
                min={0}
                inputMode="decimal"
                value={monthlyLimit || ""}
                onChange={(e) => setMonthlyLimit(Math.max(0, Number(e.target.value) || 0))}
                placeholder="Örn. 25000"
                className={fieldClass}
              />
            </div>

            {hasLimit ? (
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="tabular-nums">
                    {moneyFormatter.format(month.expense)}
                    <span className="text-muted"> / {moneyFormatter.format(monthlyLimit)}</span>
                  </span>
                  <span className={`text-xs font-medium tabular-nums ${usage >= 100 ? "text-danger" : "text-muted"}`}>
                    %{Math.round(usage)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, usage)}%` }} />
                </div>
                <p className={`mt-2 text-xs ${willExceed ? "text-amber-500" : "text-muted"}`}>
                  {usage >= 100
                    ? `Limiti ${moneyFormatter.format(month.expense - monthlyLimit)} aştın.`
                    : willExceed
                      ? `Bu gidişle ay sonunda limiti yaklaşık ${moneyFormatter.format(month.projected - monthlyLimit)} aşacaksın.`
                      : `Kalan: ${moneyFormatter.format(monthlyLimit - month.expense)}`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">Bir limit girdiğinde burada ilerleme çubuğu görünür.</p>
            )}

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Gauge} label="Günlük ort." value={moneyFormatter.format(month.daily)} />
              <MiniStat icon={CalendarClock} label="Ay sonu tahmini" value={moneyFormatter.format(month.projected)} />
              <MiniStat icon={CalendarDays} label="Kalan gün" value={String(month.daysLeft)} />
            </div>

            {/* Top spending categories this month */}
            <div className="flex min-h-0 flex-1 flex-col">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Bu ay en çok harcanan</p>
              {month.top.length === 0 ? (
                <p className="text-xs text-muted">Bu ay henüz gider yok.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {month.top.map(({ category, amount }) => {
                    const meta = CATEGORIES[category];
                    const CategoryIcon = meta.icon;
                    return (
                      <li key={category} className="flex items-center gap-3">
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-lg"
                          style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                        >
                          <CategoryIcon size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex justify-between text-sm">
                            <span>{meta.label}</span>
                            <span className="tabular-nums text-muted">{moneyFormatter.format(amount)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${topMax ? (amount / topMax) * 100 : 0}%`, backgroundColor: meta.color }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Card>

        {/* Right column: data and danger zone share the height */}
        <div className="flex min-h-0 flex-col gap-4">
          <Card icon={HardDrive} title="Veri" description="Yedekle, aktar ya da dışarı al." className="flex-[3]">
            <ActionRow icon={FileSpreadsheet} title="CSV (Excel)" description="Tablo olarak Excel'de açılır.">
              <button type="button" onClick={exportCsv} disabled={transactions.length === 0} className={ghostButton}>
                İndir
              </button>
            </ActionRow>
            <ActionRow icon={FileJson} title="JSON yedeği" description="Ham veri, içe aktarmak için de bu dosya kullanılır.">
              <button type="button" onClick={exportJson} disabled={transactions.length === 0} className={ghostButton}>
                İndir
              </button>
            </ActionRow>
            <ActionRow icon={Upload} title="JSON içe aktar" description="Yedeği mevcut işlemlerine ekler, aynı kayıtları atlar.">
              <button type="button" onClick={() => fileInput.current?.click()} className={ghostButton}>
                Dosya seç
              </button>
              <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
            </ActionRow>
          </Card>

          <Card icon={Trash2} title="Tehlikeli bölge" description="Veriler yalnızca bu tarayıcıda saklanır." tone="danger" className="flex-[2]">
            <ActionRow icon={RotateCcw} title="Demo veriyi yeniden yükle" description="Mevcut işlemler silinir, 6 aylık demo veri gelir.">
              <DangerButton
                label="Yeniden yükle"
                active={pending === "reseed"}
                onAsk={() => setPending("reseed")}
                onConfirm={confirmAction}
                onCancel={() => setPending(null)}
              />
            </ActionRow>
            <ActionRow icon={Trash2} title="Tüm verileri sil" description="Bütün işlemler kalıcı olarak silinir.">
              <DangerButton
                label="Sil"
                active={pending === "clear"}
                onAsk={() => setPending("clear")}
                onConfirm={confirmAction}
                onCancel={() => setPending(null)}
              />
            </ActionRow>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {status && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg ${
            status.ok ? "border-accent/40 text-accent" : "border-danger/40 text-danger"
          }`}
        >
          {status.text}
        </div>
      )}
    </main>
  );
}

/* ---------- Helpers ---------- */

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-muted">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <Icon size={16} className="mb-2 text-muted" />
      <p className="text-[11px] text-muted">{label}</p>
      <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  tone = "default",
  className = "",
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "default" | "danger";
  className?: string;
  children: ReactNode;
}) {
  const danger = tone === "danger";
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/60 ${
        danger ? "border-danger/25" : "border-border"
      } ${className}`}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-border p-4">
        <span className={`mt-0.5 grid size-8 place-items-center rounded-lg ${danger ? "bg-danger/10 text-danger" : "bg-white/5 text-muted"}`}>
          <Icon size={16} />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-border/60">{children}</div>
    </section>
  );
}

function ActionRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-muted">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="shrink-0 self-start sm:self-auto">{children}</div>
    </div>
  );
}

// Two-step button: first click asks for confirmation, second click runs the action
function DangerButton({
  label,
  active,
  onAsk,
  onConfirm,
  onCancel,
}: {
  label: string;
  active: boolean;
  onAsk: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!active) {
    return (
      <button
        type="button"
        onClick={onAsk}
        className="rounded-xl border border-danger/30 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Emin misin?
      </button>
      <button type="button" onClick={onCancel} className="rounded-xl border border-border px-3 py-2 text-sm text-muted hover:bg-white/5">
        Vazgeç
      </button>
    </div>
  );
}