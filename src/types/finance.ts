export type TransactionType = "income" | "expense";

export type BuiltInCategory =
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

/** Built-in keys plus ids of user-defined categories. */
export type Category = BuiltInCategory | (string & {});

export interface CustomCategory {
  id: string;
  label: string;
  color: string;
  /** Which kind of transaction the category is offered for. */
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  /** ISO date string, format: YYYY-MM-DD */
  date: string;
}