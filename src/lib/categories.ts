import {
  Briefcase,
  CircleEllipsis,
  Car,
  Film,
  HeartPulse,
  House,
  Laptop,
  ReceiptText,
  ShoppingBag,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCategoryStore } from "@/store/useCategoryStore";
import type { BuiltInCategory, Category, CustomCategory } from "@/types/finance";

export interface CategoryMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: Record<BuiltInCategory, CategoryMeta> = {
  salary: { label: "Maaş", color: "#22c55e", icon: Briefcase },
  freelance: { label: "Serbest iş", color: "#14b8a6", icon: Laptop },
  food: { label: "Yemek", color: "#f59e0b", icon: UtensilsCrossed },
  rent: { label: "Kira", color: "#8b5cf6", icon: House },
  transport: { label: "Ulaşım", color: "#38bdf8", icon: Car },
  bills: { label: "Faturalar", color: "#f43f5e", icon: ReceiptText },
  entertainment: { label: "Eğlence", color: "#ec4899", icon: Film },
  health: { label: "Sağlık", color: "#10b981", icon: HeartPulse },
  shopping: { label: "Alışveriş", color: "#fb923c", icon: ShoppingBag },
  other: { label: "Diğer", color: "#94a3b8", icon: CircleEllipsis },
};

export function isBuiltInCategory(key: string): key is BuiltInCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORIES, key);
}

/** True for built-in keys and for custom categories that exist in the store. */
export function isKnownCategory(key: string): boolean {
  return isBuiltInCategory(key) || useCategoryStore.getState().custom.some((c) => c.id === key);
}

/** Single lookup for label, color and icon. Unknown ids fall back to "Diğer". */
export function getCategoryMeta(key: Category): CategoryMeta {
  if (isBuiltInCategory(key)) return CATEGORIES[key];
  const custom = useCategoryStore.getState().custom.find((c) => c.id === key);
  return custom ? { label: custom.label, color: custom.color, icon: Tag } : CATEGORIES.other;
}

/** Built-in categories followed by the custom ones. */
export function listCategories(custom: CustomCategory[]): [Category, CategoryMeta][] {
  const builtIn = Object.entries(CATEGORIES) as [BuiltInCategory, CategoryMeta][];
  const extra = custom.map(
    (c): [Category, CategoryMeta] => [c.id, { label: c.label, color: c.color, icon: Tag }]
  );
  return [...builtIn, ...extra];
}