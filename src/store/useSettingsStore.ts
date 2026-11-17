import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  /** Monthly spending limit in TRY, 0 means no limit. */
  monthlyLimit: number;
  /** When true the topbar balance is masked. */
  hideBalance: boolean;
  setMonthlyLimit: (limit: number) => void;
  toggleHideBalance: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      monthlyLimit: 0,
      hideBalance: false,
      setMonthlyLimit: (monthlyLimit) => set({ monthlyLimit }),
      toggleHideBalance: () => set((state) => ({ hideBalance: !state.hideBalance })),
    }),
    {
      name: "pocketflow-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);