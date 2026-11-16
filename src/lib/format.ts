const currency = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export const formatCurrency = (value: number): string => currency.format(value);

/** Builds a "YYYY-MM" key from a Date using local time. */
export const toMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/** Builds a "YYYY-MM-DD" string from a Date using local time. */
export const toISODate = (date: Date): string =>
  `${toMonthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;

/** Formats a "YYYY-MM-DD" string as a short Turkish label, e.g. "14 Kas". */
export const formatShortDate = (iso: string): string => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
    new Date(year, month - 1, day)
  );
};

/** Formats a "YYYY-MM" key as a short month name, e.g. "Kas". */
export const formatMonthShort = (key: string): string => {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date(year, month - 1, 1));
};

const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });

/** Compact number for chart axes, e.g. 52000 -> "52 B". */
export const formatCompact = (value: number): string => compact.format(value);