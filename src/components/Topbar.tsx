import { CalendarRange, UserRound, Waves } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/70 px-5 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-black">
          <Waves size={16} strokeWidth={2.5} />
        </span>
        <span className="font-semibold tracking-tight">PocketFlow</span>
      </div>

      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold tracking-tight">Genel bakış</h1>
        <p className="text-xs text-muted">Hesap özeti ve nakit akışı</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm text-muted sm:inline-flex">
          <CalendarRange size={16} /> Son 30 gün
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-border py-1 pl-1 pr-3 text-sm">
          <span className="grid size-7 place-items-center rounded-lg bg-accent/15 text-accent">
            <UserRound size={16} />
          </span>
          Demo hesap
        </span>
      </div>
    </header>
  );
}