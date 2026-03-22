import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DurationSelector, {
  type DurationValue,
} from "../components/DurationSelector";
import type { Category, Currency, Expense } from "../types/expense";
import { CATEGORY_ICONS } from "../types/expense";

const CATEGORIES: Category[] = [
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
}

function formatCurrency(amount: number, currency: Currency, decimals = 2) {
  return `${CURRENCY_SYMBOLS[currency]}${amount.toFixed(decimals)}`;
}

export default function AddExpense({
  onSave,
  onCancel,
  isVIP = false,
  onUpgrade,
}: AddExpenseProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [category, setCategory] = useState<Category | null>(null);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState<DurationValue | null>(null);

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    const expense: Expense = {
      id: Date.now().toString(),
      amount: Number(amount),
      currency,
      category,
      notes,
      date,
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
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              data-ocid={`add_expense.category.${cat.toLowerCase().replace(/ /g, "_")}.toggle`}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                category === cat
                  ? "bg-emerald text-white border-emerald shadow-emerald"
                  : "bg-background text-body border-border hover:border-emerald/40"
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{cat}</span>
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
