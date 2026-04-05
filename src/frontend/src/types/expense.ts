export type Category = string;

export type Currency = "USD" | "EGP" | "EUR" | "GBP" | "CAD" | "AED";

export type PaymentMethod =
  | "Cash"
  | "Bank Account"
  | "Mobile Wallet"
  | "Credit Card"
  | "Debit Card";

export type RecurringFrequency = "daily" | "weekly" | "monthly";

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
  date: string; // ISO date YYYY-MM-DD
  recurring?: boolean;
  paymentMethod?: PaymentMethod;
  scheduledParentId?: string;
}

export interface ScheduledExpense {
  id: string;
  parentId: string;
  amount: number;
  currency: Currency;
  category: Category;
  notes?: string;
  scheduledDate: string;
  frequency: RecurringFrequency;
  paymentMethod?: PaymentMethod;
  cancelled?: boolean;
}

export const CATEGORY_ICONS: Record<string, string> = {
  Rent: "🏠",
  Transportation: "🚗",
  Food: "🍔",
  "Lab Supplies": "🔬",
  Entertainment: "🎮",
  Health: "💊",
  Shopping: "🛍️",
  Utilities: "⚡",
  Uncategorized: "📌",
  Other: "📦",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Rent: "#f97316",
  Transportation: "#10b981",
  Food: "#f59e0b",
  "Lab Supplies": "#3b82f6",
  Entertainment: "#8b5cf6",
  Health: "#ef4444",
  Shopping: "#ec4899",
  Utilities: "#06b6d4",
  Uncategorized: "#6b7280",
  Other: "#6b7280",
};

export function getCategoryIcon(cat: string): string {
  return CATEGORY_ICONS[cat] ?? "📌";
}

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#6b7280";
}

/**
 * Silently infer a category from the expense notes/description.
 * Returns a best-guess category string, or "Uncategorized" if unclear.
 */
export function inferCategory(notes?: string): string {
  if (!notes) return "Uncategorized";
  const n = notes.toLowerCase();
  if (
    /food|lunch|dinner|breakfast|restaurant|cafe|coffee|pizza|burger|groceries|supermarket|meal|snack|drink/.test(
      n,
    )
  )
    return "Food";
  if (
    /uber|taxi|bus|metro|train|fuel|gas|petrol|transport|car|parking|ride/.test(
      n,
    )
  )
    return "Transportation";
  if (
    /netflix|spotify|game|movie|cinema|music|concert|entertainment|subscription/.test(
      n,
    )
  )
    return "Entertainment";
  if (/doctor|pharmacy|medicine|health|hospital|clinic|gym|fitness/.test(n))
    return "Health";
  if (/shop|mall|clothes|amazon|online|store|purchase|buy/.test(n))
    return "Shopping";
  if (/electric|water|internet|phone|bill|utility|utilities|rent|wifi/.test(n))
    return "Utilities";
  return "Uncategorized";
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

export function generateScheduledInstances(
  base: Omit<ScheduledExpense, "id" | "scheduledDate">,
  startDate: string,
  endDate: string,
): ScheduledExpense[] {
  const instances: ScheduledExpense[] = [];
  const end = new Date(endDate);
  let current = new Date(startDate);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    instances.push({
      ...base,
      id: `${base.parentId}_${dateStr}_${Math.random().toString(36).slice(2, 7)}`,
      scheduledDate: dateStr,
    });

    if (base.frequency === "daily") {
      current.setDate(current.getDate() + 1);
    } else if (base.frequency === "weekly") {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return instances;
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
];
