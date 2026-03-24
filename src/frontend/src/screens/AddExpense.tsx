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
import { ArrowLeft, CalendarRange, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DurationSelector, {
  type DurationValue,
} from "../components/DurationSelector";
import type {
  Currency,
  Expense,
  PaymentMethod,
  RecurringFrequency,
  ScheduledExpense,
} from "../types/expense";
import {
  CATEGORY_ICONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICONS,
  generateScheduledInstances,
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

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

interface AddExpenseProps {
  onSave: (expense: Expense, scheduledInstances?: ScheduledExpense[]) => void;
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
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [category, setCategory] = useState<string | null>(null);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>(() =>
    getCustomCategories(currentUser),
  );
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState<DurationValue | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

  // Recurring/Fixed expense state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [recurringStart, setRecurringStart] = useState(today);
  const [recurringEnd, setRecurringEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split("T")[0];
  });

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c)),
  ];

  const selectedCategory = customCategoryInput.trim()
    ? customCategoryInput.trim()
    : category;

  // Preview: count of scheduled instances
  const previewInstances = (() => {
    if (!isRecurring || !recurringStart || !recurringEnd) return 0;
    if (recurringEnd < recurringStart) return 0;
    // Rough count
    const start = new Date(recurringStart);
    const end = new Date(recurringEnd);
    const diffDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (frequency === "daily") return diffDays + 1;
    if (frequency === "weekly") return Math.floor(diffDays / 7) + 1;
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return months + 1;
  })();

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
    if (isRecurring && recurringEnd < recurringStart) {
      toast.error("End date must be after start date");
      return;
    }

    const sanitizedNotes = sanitizeInput(notes);
    const sanitizedCustomCat = sanitizeInput(customCategoryInput);
    const finalCategory = sanitizedCustomCat || category || "";

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

    if (isRecurring) {
      // Generate all scheduled instances
      const parentId = `parent_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const base: Omit<ScheduledExpense, "id" | "scheduledDate"> = {
        parentId,
        amount: Number(amount),
        currency,
        category: finalCategory,
        notes: sanitizedNotes,
        frequency,
        paymentMethod,
      };
      const instances = generateScheduledInstances(
        base,
        recurringStart,
        recurringEnd,
      );

      // The "anchor" expense for today (or the start date if it's today/past)
      const anchorDate =
        recurringStart <= today ? recurringStart : recurringStart;
      const anchorExpense: Expense = {
        id: `${parentId}_anchor`,
        amount: Number(amount),
        currency,
        category: finalCategory,
        notes: sanitizedNotes,
        date: anchorDate,
        recurring: true,
        paymentMethod,
        scheduledParentId: parentId,
      };

      // Future instances only (date > today)
      const futureInstances = instances.filter((s) => s.scheduledDate > today);

      onSave(anchorExpense, futureInstances);
      toast.success(
        `Recurring expense set! ${futureInstances.length} future instance${
          futureInstances.length !== 1 ? "s" : ""
        } scheduled.`,
      );
    } else {
      const expense: Expense = {
        id: Date.now().toString(),
        amount: Number(amount),
        currency,
        category: finalCategory,
        notes: sanitizedNotes,
        date,
        recurring: false,
        paymentMethod,
      };
      onSave(expense);
      toast.success("Expense saved!");
    }
  };

  const numAmount = Number(amount);
  const showProrated = numAmount > 0 && duration !== null && !isRecurring;
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
            className="flex-1 text-3xl font-bold text-center h-14 rounded-xl border-border text-foreground"
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
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              📌
            </span>
            <Input
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
            onClick={handleAddCustomCategory}
            disabled={!customCategoryInput.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald/10 text-emerald hover:bg-emerald/20 disabled:opacity-40 transition-colors flex-shrink-0"
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
      <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Payment Method
        </Label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PAYMENT_METHODS.map((method) => (
            <button
              type="button"
              key={method}
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
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Notes (optional)
        </Label>
        <Textarea
          placeholder="What did you spend on?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl resize-none border-border"
          rows={2}
        />
      </div>

      {/* Fixed/Recurring Toggle */}
      <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-emerald flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Fixed / Recurring Expense
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Schedule automatic future deductions
              </p>
            </div>
          </div>
          <Switch
            data-ocid="add_expense.recurring.switch"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
        </div>

        {isRecurring && (
          <div className="flex flex-col gap-4 pt-2 border-t border-border">
            {/* Frequency */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Frequency
              </Label>
              <div className="flex gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setFrequency(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      frequency === opt.value
                        ? "bg-emerald text-white border-emerald"
                        : "bg-background text-body border-border hover:border-emerald/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <CalendarRange size={11} /> Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Start Date
                  </span>
                  <Input
                    type="date"
                    value={recurringStart}
                    onChange={(e) => setRecurringStart(e.target.value)}
                    className="rounded-xl border-border text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    End Date
                  </span>
                  <Input
                    type="date"
                    value={recurringEnd}
                    min={recurringStart}
                    onChange={(e) => setRecurringEnd(e.target.value)}
                    className="rounded-xl border-border text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview count */}
            {previewInstances > 0 && Number(amount) > 0 && (
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: "rgba(16,185,129,0.07)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <div>
                  <p className="text-xs font-bold text-emerald">
                    {previewInstances} payment
                    {previewInstances !== 1 ? "s" : ""} will be scheduled
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Total: {CURRENCY_SYMBOLS[currency]}
                    {(Number(amount) * previewInstances).toFixed(2)}
                  </p>
                </div>
                <RefreshCw size={16} className="text-emerald opacity-60" />
              </div>
            )}
          </div>
        )}

        {/* Date (only for non-recurring) */}
        {!isRecurring && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-border"
            />
          </div>
        )}
      </div>

      {/* Budget Duration (non-recurring only) */}
      {!isRecurring && (
        <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
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
      )}

      {/* Pro-rated breakdown */}
      {showProrated && (
        <div className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
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

      {/* Submit */}
      <button
        type="button"
        data-ocid="add_expense.save.submit_button"
        onClick={handleSubmit}
        className="w-full bg-emerald text-white font-bold py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all"
      >
        {isRecurring ? "Schedule Recurring Expense" : "Save Expense"}
      </button>
    </div>
  );
}
