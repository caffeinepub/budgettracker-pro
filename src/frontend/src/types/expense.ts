export type Category = string;

export type Currency = "USD" | "EGP" | "EUR" | "GBP" | "CAD" | "AED";

export type PaymentMethod =
  | "Cash"
  | "Bank Account"
  | "Mobile Wallet"
  | "Credit Card"
  | "Debit Card";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Bank Account",
  "Mobile Wallet",
  "Credit Card",
  "Debit Card",
];

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  Cash: "💵",
  "Bank Account": "🏦",
  "Mobile Wallet": "📱",
  "Credit Card": "💳",
  "Debit Card": "💳",
};

export interface Expense {
  id: string;
  amount: number;
  currency: Currency;
  category: Category;
  notes?: string;
  date: string;
  recurring?: boolean;
  paymentMethod?: PaymentMethod;
}

export const CATEGORY_ICONS: Record<string, string> = {
  Transportation: "🚗",
  Food: "🍔",
  "Lab Supplies": "🔬",
  Entertainment: "🎮",
  Health: "💊",
  Shopping: "🛍️",
  Other: "📦",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Transportation: "#10b981",
  Food: "#f59e0b",
  "Lab Supplies": "#3b82f6",
  Entertainment: "#8b5cf6",
  Health: "#ef4444",
  Shopping: "#ec4899",
  Other: "#6b7280",
};

export function getCategoryIcon(cat: string): string {
  return CATEGORY_ICONS[cat] ?? "📌";
}

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#6b7280";
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * - Strips HTML tags (< and > characters)
 * - Removes javascript: protocol patterns
 * - Removes on*= event handler patterns
 * - Trims whitespace
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

export const SEED_EXPENSES: Expense[] = [
  {
    id: "1",
    amount: 12.5,
    currency: "USD",
    category: "Food",
    notes: "Lunch at café",
    date: "2026-03-22",
    paymentMethod: "Cash",
  },
  {
    id: "2",
    amount: 8.0,
    currency: "USD",
    category: "Transportation",
    notes: "Uber to office",
    date: "2026-03-22",
    paymentMethod: "Mobile Wallet",
  },
  {
    id: "3",
    amount: 24.99,
    currency: "USD",
    category: "Lab Supplies",
    notes: "Microscope slides",
    date: "2026-03-21",
    paymentMethod: "Bank Account",
  },
  {
    id: "4",
    amount: 5.0,
    currency: "USD",
    category: "Entertainment",
    notes: "Netflix subscription",
    date: "2026-03-21",
    paymentMethod: "Credit Card",
  },
  {
    id: "5",
    amount: 18.75,
    currency: "USD",
    category: "Shopping",
    notes: "New notebook",
    date: "2026-03-20",
    paymentMethod: "Debit Card",
  },
  {
    id: "6",
    amount: 9.0,
    currency: "USD",
    category: "Health",
    notes: "Vitamins",
    date: "2026-03-20",
    paymentMethod: "Cash",
  },
  {
    id: "7",
    amount: 3.5,
    currency: "USD",
    category: "Food",
    notes: "Morning coffee",
    date: "2026-03-19",
    paymentMethod: "Mobile Wallet",
  },
  {
    id: "8",
    amount: 15.0,
    currency: "USD",
    category: "Transportation",
    notes: "Weekly metro pass",
    date: "2026-03-19",
    paymentMethod: "Cash",
  },
];
