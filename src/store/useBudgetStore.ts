import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Transaction } from "@/types/finance";

interface BudgetState {
  transactions: Transaction[];
  addTransaction: (input: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  setTransactions: (items: Transaction[]) => void;
  clearAll: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (input) =>
        set((state) => ({
          transactions: [{ id: crypto.randomUUID(), ...input }, ...state.transactions],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      setTransactions: (items) => set({ transactions: items }),
      clearAll: () => set({ transactions: [] }),
    }),
    {
      name: "pocketflow-budget",
      storage: createJSONStorage(() => localStorage),
    }
  )
);