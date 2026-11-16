import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { generateDummyTransactions } from "@/data/dummy-data";
import type { Transaction } from "@/types/finance";

interface BudgetState {
  transactions: Transaction[];
  /** True once the dummy data has been loaded on the first visit. */
  seeded: boolean;
  addTransaction: (input: Omit<Transaction, "id">) => void;
  removeTransaction: (id: string) => void;
  seedDummyData: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      transactions: [],
      seeded: false,
      addTransaction: (input) =>
        set((state) => ({
          transactions: [{ id: crypto.randomUUID(), ...input }, ...state.transactions],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      seedDummyData: () => set({ transactions: generateDummyTransactions(), seeded: true }),
    }),
    {
      name: "pocketflow-budget",
      storage: createJSONStorage(() => localStorage),
    }
  )
);