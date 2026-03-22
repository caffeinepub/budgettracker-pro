import { Crown, Plus } from "lucide-react";
import type { Expense } from "../types/expense";
import { CATEGORY_ICONS } from "../types/expense";

interface DashboardProps {
  expenses: Expense[];
  weeklyBudget: number;
  isVIP: boolean;
  onAddExpense: () => void;
  onUpgrade: () => void;
}

function ProgressRing({ spent, budget }: { spent: number; budget: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(spent / budget, 1);
  const offset = circumference - pct * circumference;
  const isOver = spent > budget;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 180, height: 180 }}
    >
      <svg width="180" height="180" className="-rotate-90" aria-hidden="true">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={isOver ? "#ef4444" : "#10b981"}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">
          ${spent.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          of ${budget}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">spent</span>
      </div>
    </div>
  );
}

export default function Dashboard({
  expenses,
  weeklyBudget,
  isVIP,
  onAddExpense,
  onUpgrade,
}: DashboardProps) {
  const weeklyExpenses = expenses.slice(0, 8);
  const spent = weeklyExpenses.reduce((s, e) => s + e.amount, 0);
  const recent = expenses.slice(0, 5);
  const remaining = weeklyBudget - spent;

  return (
    <div
      className="flex flex-col gap-4 p-4 animate-fade-in"
      data-ocid="dashboard.page"
    >
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            BudgetTracker
          </h1>
          <p className="text-xs text-muted-foreground">
            {isVIP ? "VIP Member ✨" : "Free Plan"}
          </p>
        </div>
        {isVIP ? (
          <span className="flex items-center gap-1 bg-vip/10 text-vip border border-vip/20 text-xs font-bold px-3 py-1.5 rounded-full">
            <Crown size={12} /> VIP
          </span>
        ) : (
          <button
            type="button"
            data-ocid="dashboard.upgrade.button"
            onClick={onUpgrade}
            className="text-xs font-semibold text-emerald border border-emerald/30 px-3 py-1.5 rounded-full hover:bg-emerald/5 transition-colors"
          >
            Go VIP ✨
          </button>
        )}
      </header>

      {/* Progress Ring Card */}
      <div className="bg-card rounded-3xl shadow-card p-6 flex flex-col items-center gap-4">
        <ProgressRing spent={spent} budget={weeklyBudget} />
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-background rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Weekly Budget
            </p>
            <p className="text-lg font-bold text-foreground">${weeklyBudget}</p>
          </div>
          <div className="bg-background rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Remaining
            </p>
            <p
              className={`text-lg font-bold ${remaining < 0 ? "text-destructive" : "text-emerald"}`}
            >
              ${Math.abs(remaining).toFixed(0)}
              {remaining < 0 ? " over" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Add Cash Expense Button */}
      <button
        type="button"
        data-ocid="dashboard.add_expense.primary_button"
        onClick={onAddExpense}
        className="w-full flex items-center justify-center gap-2 bg-emerald text-white font-bold py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all"
      >
        <Plus size={20} />
        Add Cash Expense
      </button>

      {/* Recent Expenses */}
      <div className="bg-card rounded-3xl shadow-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          Recent Expenses
        </h2>
        {recent.length === 0 ? (
          <p
            data-ocid="expenses.empty_state"
            className="text-center text-muted-foreground text-sm py-4"
          >
            No expenses yet
          </p>
        ) : (
          <ul className="flex flex-col gap-2" data-ocid="expenses.list">
            {recent.map((exp, i) => (
              <li
                key={exp.id}
                data-ocid={`expenses.item.${i + 1}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors"
              >
                <span className="text-xl w-8 h-8 flex items-center justify-center bg-background rounded-xl">
                  {CATEGORY_ICONS[exp.category]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {exp.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exp.notes || exp.date}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {exp.currency === "USD"
                    ? "$"
                    : exp.currency === "EGP"
                      ? "E£"
                      : exp.currency === "EUR"
                        ? "€"
                        : exp.currency}
                  {exp.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* VIP Upgrade Banner */}
      {!isVIP && (
        <div
          data-ocid="dashboard.vip_banner.card"
          className="vip-banner-gradient rounded-3xl p-5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-white font-bold text-sm">
                Go VIP — Sync cards &amp; track automatically!
              </p>
              <p className="text-white/70 text-xs mt-0.5">
                No more manual entry. Link your cards now.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-ocid="dashboard.vip_upgrade.button"
            onClick={onUpgrade}
            className="w-full bg-white text-emerald-dark font-bold text-sm py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Upgrade — $2.50/mo ✨
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center pb-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-emerald"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
