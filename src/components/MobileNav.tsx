"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Database, Menu, Waves, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

// Hydration gate so the portal only renders on the client
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function MobileNav() {
  const mounted = useMounted();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on Escape and lock body scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-xl py-1 pr-2 lg:hidden"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-black">
          <Waves size={16} strokeWidth={2.5} />
        </span>
        <span className="font-semibold tracking-tight">PocketFlow</span>
        <Menu size={16} className="text-muted" />
      </button>

      {/* Portal: the header's backdrop-blur would otherwise trap fixed children */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="backdrop"
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <motion.aside
                  key="drawer"
                  className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-background p-4 lg:hidden"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "tween", duration: 0.22 }}
                >
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-accent text-black shadow-[0_0_24px_-4px_var(--accent)]">
                        <Waves size={18} strokeWidth={2.5} />
                      </span>
                      <span className="text-lg font-semibold tracking-tight">PocketFlow</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Menüyü kapat"
                      className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
                    >
                      <X size={18} />
                    </button>
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
                          onClick={() => setOpen(false)}
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

                  <div className="rounded-2xl border border-border bg-card/60 p-4">
                    <span className="mb-2 grid size-8 place-items-center rounded-lg bg-white/5 text-muted">
                      <Database size={16} />
                    </span>
                    <p className="text-sm font-medium">Demo verisi</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">Veriler bu cihazın tarayıcısında saklanır.</p>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}