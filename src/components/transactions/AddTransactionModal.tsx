"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { getCategoryMeta, listCategories } from "@/lib/categories";
import { useBudgetStore } from "@/store/useBudgetStore";
import type { Category, TransactionType } from "@/types/finance";
import { useCategoryStore } from "@/store/useCategoryStore";

const INCOME_CATEGORIES: Category[] = ["salary", "freelance", "other"];
const EXPENSE_CATEGORIES: Category[] = [
  "food",
  "rent",
  "transport",
  "bills",
  "entertainment",
  "health",
  "shopping",
  "other",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_OPTIONS = [
  "#22c55e",
  "#38bdf8",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#f43f5e",
  "#14b8a6",
  "#94a3b8",
];

const fieldClass =
  "h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent/60 [color-scheme:dark]";

// Local-time YYYY-MM-DD
function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({
  open,
  onClose,
}: AddTransactionModalProps) {
  if (typeof document === "undefined") return null;

  // Portal so the sticky header's backdrop-blur cannot trap the fixed overlay
  return createPortal(
    <AnimatePresence>
      {open && <ModalContent onClose={onClose} />}
    </AnimatePresence>,
    document.body,
  );
}

// Mounted only while open, so the form state (and today's date) is fresh on every open
function ModalContent({ onClose }: { onClose: () => void }) {
  const addTransaction = useBudgetStore((s) => s.addTransaction);

  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<Category>("food");
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => toISO(new Date()));
  const [error, setError] = useState("");
  const customCategories = useCategoryStore((s) => s.custom);
  const addCategory = useCategoryStore((s) => s.addCategory);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [catError, setCatError] = useState("");

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const changeType = (next: TransactionType) => {
    setType(next);
    // Keep the selected category valid for the new type
    setCategory(next === "income" ? "salary" : "food");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Accept both "1250,50" and "1250.50"
    const parsed = Number(amountText.trim().replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Geçerli bir tutar gir.");
      return;
    }
    if (!DATE_RE.test(date)) {
      setError("Bir tarih seç.");
      return;
    }

    addTransaction({
      type,
      amount: Math.round(parsed * 100) / 100,
      category,
      note: note.trim(),
      date,
    });
    onClose();
  };

  const createCategory = () => {
    const label = newLabel.trim();
    if (!label) {
      setCatError("Bir isim yaz.");
      return;
    }
    const taken = listCategories(customCategories).some(
      ([, meta]) =>
        meta.label.toLocaleLowerCase("tr-TR") ===
        label.toLocaleLowerCase("tr-TR"),
    );
    if (taken) {
      setCatError("Bu isimde bir kategori var.");
      return;
    }
    // The new category is selected right away
    setCategory(addCategory({ label, color: newColor, type }));
    setAdding(false);
    setNewLabel("");
    setCatError("");
  };

  const categories: Category[] = [
    ...(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    ...customCategories.filter((c) => c.type === type).map((c) => c.id),
  ];
  return (
    <>
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <motion.form
          key="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-transaction-title"
          onSubmit={handleSubmit}
          className="pointer-events-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <h2
              id="add-transaction-title"
              className="font-semibold tracking-tight"
            >
              Yeni işlem ekle
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card/60 p-1">
              <button
                type="button"
                onClick={() => changeType("expense")}
                className={`rounded-lg py-2 text-sm transition-colors ${
                  type === "expense"
                    ? "bg-danger/15 font-medium text-danger"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Gider
              </button>
              <button
                type="button"
                onClick={() => changeType("income")}
                className={`rounded-lg py-2 text-sm transition-colors ${
                  type === "income"
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Gelir
              </button>
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="tx-amount"
                className="mb-1.5 block text-xs text-muted"
              >
                Tutar
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  ₺
                </span>
                <input
                  id="tx-amount"
                  autoFocus
                  inputMode="decimal"
                  value={amountText}
                  onChange={(e) => {
                    setAmountText(e.target.value);
                    setError("");
                  }}
                  placeholder="0,00"
                  className={`${fieldClass} pl-8 tabular-nums`}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="mb-1.5 text-xs text-muted">Kategori</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((key) => {
                  const meta = getCategoryMeta(key);
                  const Icon = meta.icon;
                  const selected = category === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCategory(key)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "bg-white/5 font-medium"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                      style={selected ? { borderColor: meta.color } : undefined}
                    >
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-md"
                        style={{
                          backgroundColor: `${meta.color}1f`,
                          color: meta.color,
                        }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
              {adding ? (
                <div className="mt-3 rounded-xl border border-border bg-card/60 p-3">
                  <input
                    autoFocus
                    value={newLabel}
                    maxLength={20}
                    onChange={(e) => {
                      setNewLabel(e.target.value);
                      setCatError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createCategory();
                      }
                    }}
                    placeholder="Kategori adı"
                    aria-label="Yeni kategori adı"
                    className={fieldClass}
                  />
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label="Renk"
                  >
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={newColor === color}
                        aria-label={color}
                        onClick={() => setNewColor(color)}
                        className={`size-6 rounded-full border-2 ${newColor === color ? "border-foreground" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {catError && (
                    <p role="alert" className="mt-2 text-xs text-danger">
                      {catError}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdding(false);
                        setCatError("");
                      }}
                      className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-white/5"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={createCategory}
                      className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <Plus size={14} /> Yeni kategori ekle
                </button>
              )}
            </div>

            {/* Date and note */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tx-date"
                  className="mb-1.5 block text-xs text-muted"
                >
                  Tarih
                </label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setError("");
                  }}
                  className={fieldClass}
                />
              </div>
              <div>
                <label
                  htmlFor="tx-note"
                  className="mb-1.5 block text-xs text-muted"
                >
                  Not (isteğe bağlı)
                </label>
                <input
                  id="tx-note"
                  value={note}
                  maxLength={60}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn. Market"
                  className={fieldClass}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted hover:bg-white/5"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Kaydet
            </button>
          </div>
        </motion.form>
      </div>
    </>
  );
}
