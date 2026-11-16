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
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category } from "@/types/finance";

export interface CategoryMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
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