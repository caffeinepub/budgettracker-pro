export type Category =
  | "Transportation"
  | "Food"
  | "Lab Supplies"
  | "Entertainment"
  | "Health"
  | "Shopping"
  | "Other";

export type Currency = "USD" | "EGP" | "EUR" | "GBP" | "CAD" | "AED";

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  notes?: string;
  date: string;
}

export const CATEGORY_ICONS: Record<Category, string> = {
  Transportation: "🚗",
  Food: "🍔",
  "Lab Supplies": "🔬",
  Entertainment: "🎮",
  Health: "💊",
  Shopping: "🛍️",
  Other: "📦",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Transportation: "#10b981",
  Food: "#f59e0b",
  "Lab Supplies": "#3b82f6",
  Entertainment: "#8b5cf6",
  Health: "#ef4444",
  Shopping: "#ec4899",
  Other: "#6b7280",
};

export const SEED_EXPENSES: Expense[] = [
  {
    id: "1",
    amount: 12.5,
    currency: "USD",
    category: "Food",
    notes: "Lunch at café",
    date: "2026-03-22",
  },
  {
    id: "2",
    amount: 8.0,
    currency: "USD",
    category: "Transportation",
    notes: "Uber to office",
    date: "2026-03-22",
  },
  {
    id: "3",
    amount: 24.99,
    currency: "USD",
    category: "Lab Supplies",
    notes: "Microscope slides",
    date: "2026-03-21",
  },
  {
    id: "4",
    amount: 5.0,
    currency: "USD",
    category: "Entertainment",
    notes: "Netflix subscription",
    date: "2026-03-21",
  },
  {
    id: "5",
    amount: 18.75,
    currency: "USD",
    category: "Shopping",
    notes: "New notebook",
    date: "2026-03-20",
  },
  {
    id: "6",
    amount: 9.0,
    currency: "USD",
    category: "Health",
    notes: "Vitamins",
    date: "2026-03-20",
  },
  {
    id: "7",
    amount: 3.5,
    currency: "USD",
    category: "Food",
    notes: "Morning coffee",
    date: "2026-03-19",
  },
  {
    id: "8",
    amount: 15.0,
    currency: "USD",
    category: "Transportation",
    notes: "Weekly metro pass",
    date: "2026-03-19",
  },
];
