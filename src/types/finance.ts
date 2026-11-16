export type TransactionType = "income" | "expense";

export type Category =
  | "salary"
  | "freelance"
  | "food"
  | "rent"
  | "transport"
  | "bills"
  | "entertainment"
  | "health"
  | "shopping"
  | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  /** ISO date string, format: YYYY-MM-DD */
  date: string;
}