import { ChevronDown, ChevronUp, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { ScheduledExpense } from "../types/expense";
import { getCategoryIcon } from "../types/expense";
import { type Currency, getCurrencySymbol } from "../utils/currency";

interface UpcomingScreenProps {
  scheduledExpenses: ScheduledExpense[];
  onCancel: (id: string) => void;
  onBack: () => void;
  currency: Currency;
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default function UpcomingScreen({
  scheduledExpenses,
  onCancel,
  onBack,
  currency,
}: UpcomingScreenProps) {
  const [dueLaterOpen, setDueLaterOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekFromNowStr = weekFromNow.toISOString().split("T")[0];

  const active = scheduledExpenses
    .filter((s) => !s.cancelled && s.scheduledDate > today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const dueThisWeek = active.filter((s) => s.scheduledDate <= weekFromNowStr);
  const dueLater = active.filter((s) => s.scheduledDate > weekFromNowStr);

  const sym = getCurrencySymbol(currency);
  const thisWeekTotal = dueThisWeek.reduce((s, e) => s + e.amount, 0);
  const laterTotal = dueLater.reduce((s, e) => s + e.amount, 0);

  const ExpenseRow = ({ item }: { item: ScheduledExpense }) => {
    const days = daysUntil(item.scheduledDate);
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-background">
        <span className="text-xl w-9 h-9 flex items-center justify-center bg-card rounded-xl flex-shrink-0">
          {getCategoryIcon(item.category)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {item.category}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(item.scheduledDate)}
            <span className="ml-1 opacity-60">
              ({days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-foreground">
            {sym}
            {item.amount.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => onCancel(item.id)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-destructive/10"
            style={{ color: "#ef4444" }}
            title="Cancel scheduled expense"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 p-4 pt-10 animate-fade-in">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <X size={20} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Upcoming</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scheduled future expenses
          </p>
        </div>
        <RefreshCw size={14} className="text-emerald" />
      </header>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-5xl">📅</span>
          <p className="text-base font-semibold text-foreground">
            No upcoming expenses
          </p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Add a recurring expense to see future deductions here.
          </p>
        </div>
      ) : (
        <>
          {/* Due This Week */}
          {dueThisWeek.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Due This Week
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {dueThisWeek.length} expense
                    {dueThisWeek.length !== 1 ? "s" : ""} · {sym}
                    {thisWeekTotal.toFixed(2)}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    color: "#818cf8",
                  }}
                >
                  Next 7 days
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {dueThisWeek.map((item) => (
                  <ExpenseRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Due Later (collapsible) */}
          {dueLater.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setDueLaterOpen((prev) => !prev)}
                className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-left">
                  <h2 className="text-sm font-bold text-foreground">
                    Due Later
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {dueLater.length} expense{dueLater.length !== 1 ? "s" : ""}{" "}
                    · {sym}
                    {laterTotal.toFixed(2)}
                  </p>
                </div>
                {dueLaterOpen ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>
              {dueLaterOpen && (
                <div className="flex flex-col gap-2">
                  {dueLater.map((item) => (
                    <ExpenseRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
