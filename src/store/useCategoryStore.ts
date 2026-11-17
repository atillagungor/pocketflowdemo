import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CustomCategory } from "@/types/finance";

interface CategoryState {
  custom: CustomCategory[];
  /** Adds a category and returns its generated id. */
  addCategory: (input: Omit<CustomCategory, "id">) => string;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      custom: [],
      addCategory: (input) => {
        const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
        set((state) => ({ custom: [...state.custom, { id, ...input }] }));
        return id;
      },
    }),
    {
      name: "pocketflow-categories",
      storage: createJSONStorage(() => localStorage),
    }
  )
);