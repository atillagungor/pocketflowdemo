import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Settings,
} from "lucide-react";

// Items without href are disabled and show the "Yakında" badge
export const NAV_ITEMS = [
  { label: "Genel bakış", icon: LayoutDashboard, href: "/" },
  { label: "İşlemler", icon: CreditCard, href: "/transactions" },
  { label: "Bütçeler", icon: PiggyBank },
  { label: "Raporlar", icon: BarChart3 },
  { label: "Ayarlar", icon: Settings, href: "/settings" },
] as const;
