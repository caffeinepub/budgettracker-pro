import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DurationSelector, {
  type DurationValue,
} from "../components/DurationSelector";
import type { Currency, Expense, PaymentMethod } from "../types/expense";
import {
  CATEGORY_ICONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICONS,
  getCategoryIcon,
  sanitizeInput,
} from "../types/expense";

const DEFAULT_CATEGORIES = [
  "Transportation",
  "Food",
  "Lab Supplies",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

const CURRENCIES: Currency[] = ["USD", "EGP", "EUR", "GBP", "CAD", "AED"];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EGP: "E£",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AED: "د.إ",
};

interface AddExpenseProps {
  onSave: (expense: Expense) => void;
  onCancel: () => void;
  isVIP?: boolean;
  onUpgrade?: () => void;
  currentUser?: string | null;
}

function formatCurrency(amount: number, currency: Currency, decimals = 2) {
  return `${CURRENCY_SYMBOLS[currency]}${amount.toFixed(decimals)}`;
}

function getCustomCategories(email: string | null | undefined): string[] {
  if (!email) return [];
  try {
    const raw = localStorage.getItem(`wiz_custom_categories_${email}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(email: string, cats: string[]) {
  localStorage.setItem(`wiz_custom_categories_${email}`, JSON.stringify(cats));
}

export default function AddExpense({
  onSave,
  onCancel,
  isVIP = false,
  onUpgrade,
  currentUser,
}: AddExpenseProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [category, setCategory] = useState<string | null>(null);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>(() =>
    getCustomCategories(currentUser),
  );
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState<DurationValue | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c)),
  ];

  const selectedCategory = customCategoryInput.trim()
    ? customCategoryInput.trim()
    : category;

  const handlePresetClick = (cat: string) => {
    setCategory(cat);
    setCustomCategoryInput("");
  };

  const handleAddCustomCategory = () => {
    const val = sanitizeInput(customCategoryInput);
    if (
      !val ||
      DEFAULT_CATEGORIES.includes(val) ||
      customCategories.includes(val)
    )
      return;
    const updated = [...customCategories, val];
    setCustomCategories(updated);
    if (currentUser) saveCustomCategories(currentUser, updated);
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    const sanitizedNotes = sanitizeInput(notes);
    const sanitizedCustomCat = sanitizeInput(customCategoryInput);
    const finalCategory = sanitizedCustomCat || category || "";

    // Save custom category to storage if it's new
    if (
      sanitizedCustomCat &&
      !DEFAULT_CATEGORIES.includes(sanitizedCustomCat) &&
      !customCategories.includes(sanitizedCustomCat) &&
      currentUser
    ) {
      const updated = [...customCategories, sanitizedCustomCat];
      setCustomCategories(updated);
      saveCustomCategories(currentUser, updated);
    }

    const expense: Expense = {
      id: Date.now().toString(),
      amount: Number(amount),
      currency,
      category: finalCategory,
      notes: sanitizedNotes,
      date,
      recurring,
      paymentMethod,
    };
    onSave(expense);
    toast.success("Expense saved!");
  };

  const numAmount = Number(amount);
  const showProrated = numAmount > 0 && duration !== null;
  const days = duration?.days ?? 1;
  const dailyLimit = numAmount / days;
  const weeklyLimit = dailyLimit * 7;
  const monthlyLimit = dailyLimit * 30;

  return (
    <div
      className="flex flex-col gap-5 p-4 animate-fade-in"
      data-ocid="add_expense.page"
    >
      <header className="flex items-center gap-3 pt-2">
        <button
          type="button"
          data-ocid="add_expense.back.button"
          onClick={onCancel}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Add Expense</h1>
      </header>

      {/* Amount + Currency */}
      <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Amount
        </Label>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as Currency)}
            >
              <SelectTrigger
                data-ocid="add_expense.currency.select"
                className="rounded-xl font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            data-ocid="add_expense.amount.input"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 text-3xl font-bold text-center h-14 rounded-xl border-border"
          />
        </div>
      </div>

      {/* Category Tags */}
      <div className="bg-card rounded-3xl shadow-card p-5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Category
        </Label>
        <div
          className="grid grid-cols-2 gap-2 mt-3"
          data-ocid="add_expense.category.select"
        >
          {allCategories.map((cat) => (
            <button
              type="button"
              key={cat}
              data-ocid={`add_expense.category.${cat.toLowerCase().replace(/[^a-z0-9]/g, "_")}.toggle`}
              onClick={() => handlePresetClick(cat)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                !customCategoryInput.trim() && category === cat
                  ? "bg-emerald text-white border-emerald shadow-emerald"
                  : "bg-background text-body border-border hover:border-emerald/40"
              }`}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span className="truncate">{cat}</span>
            </button>
          ))}
        </div>

        {/* Custom category input */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              📌
            </span>
            <Input
              data-ocid="add_expense.custom_category.input"
              placeholder="Or type a custom category…"
              value={customCategoryInput}
              onChange={(e) => {
                setCustomCategoryInput(e.target.value);
                if (e.target.value.trim()) setCategory(null);
              }}
              className="pl-9 rounded-xl border-border text-sm"
            />
          </div>
          <button
            type="button"
            data-ocid="add_expense.add_custom_category.button"
            onClick={handleAddCustomCategory}
            disabled={!customCategoryInput.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald/10 text-emerald hover:bg-emerald/20 disabled:opacity-40 transition-colors flex-shrink-0"
            title="Save custom category"
          >
            <Plus size={16} />
          </button>
        </div>
        {customCategoryInput.trim() && (
          <p className="text-xs text-emerald mt-1.5 ml-1">
            Using "{customCategoryInput.trim()}" as category
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div
        className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3"
        data-ocid="add_expense.payment_method.section"
      >
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Payment Method
        </Label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PAYMENT_METHODS.map((method) => (
            <button
              type="button"
              key={method}
              data-ocid={`add_expense.payment.${method.toLowerCase().replace(/[^a-z0-9]/g, "_")}.toggle`}
              onClick={() => setPaymentMethod(method)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                paymentMethod === method
                  ? "bg-emerald text-white border-emerald"
                  : "bg-background text-body border-border hover:border-emerald/40"
              }`}
            >
              <span>{PAYMENT_METHOD_ICONS[method]}</span>
              <span>{method}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
        <Label
          htmlFor="notes"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
        >
          Notes (optional)
        </Label>
        <Textarea
          id="notes"
          data-ocid="add_expense.notes.textarea"
          placeholder="What did you spend on?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl resize-none border-border"
          rows={2}
        />
      </div>

      {/* Date */}
      <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
        <Label
          htmlFor="date"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
        >
          Date
        </Label>
        <Input
          id="date"
          data-ocid="add_expense.date.input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border-border"
        />
      </div>

      {/* Budget Duration */}
      <div
        className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3"
        data-ocid="add_expense.duration.section"
      >
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Budget Duration
        </Label>
        <p className="text-xs text-muted-foreground">
          Set how long this budget applies. Free users: up to 1 month.
        </p>
        <DurationSelector
          isVIP={isVIP}
          value={duration}
          onChange={setDuration}
          onUpgradeRequest={() => onUpgrade?.()}
        />
      </div>

      {/* Pro-rated breakdown */}
      {showProrated && (
        <div
          className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3"
          data-ocid="add_expense.prorated.card"
        >
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Pro-Rated Spending Limits
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Based on {formatCurrency(numAmount, currency)} over {days} days
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: "Daily Limit", value: dailyLimit },
              { label: "Weekly Limit", value: weeklyLimit },
              { label: "Monthly Limit", value: monthlyLimit },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-sm text-body">{label}</span>
                <span className="text-sm font-bold text-emerald">
                  {formatCurrency(value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring toggle */}
      <div className="bg-card rounded-3xl shadow-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Recurring monthly expense
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Auto-deduct this amount every month
            </p>
          </div>
          <Switch
            data-ocid="add_expense.recurring.switch"
            checked={recurring}
            onCheckedChange={setRecurring}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        data-ocid="add_expense.save.submit_button"
        onClick={handleSubmit}
        className="w-full bg-emerald text-white font-bold py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all"
      >
        Save Expense
      </button>
    </div>
  );
}
