import { BarChart3, CreditCard, Database, LayoutDashboard, PiggyBank, Settings, Waves } from "lucide-react";

const ITEMS = [
  { label: "Genel bakış", icon: LayoutDashboard, active: true },
  { label: "İşlemler", icon: CreditCard, active: false },
  { label: "Bütçeler", icon: PiggyBank, active: false },
  { label: "Raporlar", icon: BarChart3, active: false },
  { label: "Ayarlar", icon: Settings, active: false },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-black shadow-[0_0_24px_-4px_var(--accent)]">
          <Waves size={18} strokeWidth={2.5} />
        </span>
        <span className="text-lg font-semibold tracking-tight">PocketFlow</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {ITEMS.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            aria-disabled={!active}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              active ? "bg-accent/10 font-medium text-accent" : "cursor-not-allowed text-muted/60"
            }`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {!active && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">Yakında</span>
            )}
          </div>
        ))}
      </nav>

      <div className="rounded-2xl border border-border bg-background/60 p-4">
        <span className="mb-2 grid size-8 place-items-center rounded-lg bg-white/5 text-muted">
          <Database size={16} />
        </span>
        <p className="text-sm font-medium">Demo verisi</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">Veriler bu cihazın tarayıcısında saklanır.</p>
      </div>
    </aside>
  );
}