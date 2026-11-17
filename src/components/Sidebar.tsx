"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Waves } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

export default function Sidebar() {
  const pathname = usePathname();

  // "/" must match exactly, other routes match by prefix
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4 lg:flex">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-black shadow-[0_0_24px_-4px_var(--accent)]">
          <Waves size={18} strokeWidth={2.5} />
        </span>
        <span className="text-lg font-semibold tracking-tight">PocketFlow</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = "href" in item ? item.href : undefined;

          if (!href) {
            return (
              <div
                key={item.label}
                aria-disabled
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted/60"
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">Yakında</span>
              </div>
            );
          }

          const active = isActive(href);
          return (
            <Link
              key={item.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-accent/10 font-medium text-accent" : "text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
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