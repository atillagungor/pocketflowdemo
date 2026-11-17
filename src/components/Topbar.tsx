"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CalendarRange, Eye, EyeOff, UserRound, Wallet } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import MobileNav from "./MobileNav";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Genel bakış", subtitle: "Hesap özeti ve nakit akışı" },
  "/transactions": { title: "İşlemler", subtitle: "Tüm gelir ve giderlerin" },
  "/settings": { title: "Ayarlar", subtitle: "Limit, veri ve yedekleme" },
};

const moneyFormatter = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const MASK = "₺••••••";

export default function Topbar() {
  const pathname = usePathname();
  const { title, subtitle } = TITLES[pathname] ?? TITLES["/"];

  const mounted = useMounted();
  const transactions = useBudgetStore((s) => s.transactions);
  const hideBalance = useSettingsStore((s) => s.hideBalance);
  const toggleHideBalance = useSettingsStore((s) => s.toggleHideBalance);

  // Current balance = all income minus all expenses
  const balance = useMemo(
    () => transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
    [transactions]
  );

  // Masked until hydration so server and first client render match
  const masked = !mounted || hideBalance;

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/70 px-5 backdrop-blur-xl lg:px-6">
      {/* Mobile: logo opens the drawer */}
      <MobileNav />

      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm text-muted md:inline-flex">
          <CalendarRange size={16} /> Son 30 gün
        </span>

        {/* Balance with show/hide toggle */}
        <span className="flex items-center gap-2 rounded-xl border border-border py-1 pl-3 pr-1 text-sm">
          <Wallet size={16} className="hidden text-muted sm:block" />
          <span className="hidden text-xs text-muted sm:inline">Bakiye</span>
          <span
            className={`font-semibold tabular-nums ${!masked && balance < 0 ? "text-danger" : ""}`}
          >
            {masked ? MASK : moneyFormatter.format(balance)}
          </span>
          <button
            type="button"
            onClick={toggleHideBalance}
            disabled={!mounted}
            aria-label={hideBalance ? "Bakiyeyi göster" : "Bakiyeyi gizle"}
            aria-pressed={hideBalance}
            className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            {masked ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>

        {/* Placeholder account, will be replaced by the signed-in user later */}
        <span className="flex items-center gap-2 rounded-xl border border-border py-1 pl-1 pr-1 text-sm sm:pr-3">
          <span className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent">
            <UserRound size={16} />
          </span>
          <span className="hidden sm:inline">Demo hesap</span>
        </span>
      </div>
    </header>
  );
}