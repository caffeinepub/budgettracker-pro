import { Input } from "@/components/ui/input";
import {
  CalendarClock,
  ChevronRight,
  Crown,
  Download,
  LogOut,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import type { BudgetData } from "../App";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import type { Expense, ScheduledExpense } from "../types/expense";
import { PAYMENT_METHOD_ICONS, getCategoryIcon } from "../types/expense";
import { type Currency, getCurrencySymbol } from "../utils/currency";
import { useLanguage } from "../utils/i18n";

interface DashboardProps {
  expenses: Expense[];
  scheduledExpenses: ScheduledExpense[];
  budget: BudgetData | null;
  isVIP: boolean;
  onAddExpense: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  onEditBudget: () => void;
  darkMode?: boolean;
  onToggleDark?: () => void;
  currency: Currency;
  currentUser: string | null;
  onOpenSettings: () => void;
  onOpenUpcoming: () => void;
}

function ProgressRing({
  spent,
  budget,
  currencySymbol,
}: {
  spent: number;
  budget: number;
  currencySymbol: string;
}) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const offset = circumference - pct * circumference;
  const isOver = budget > 0 && spent > budget;

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
          stroke="oklch(var(--border))"
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
          {currencySymbol}
          {spent.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          of {currencySymbol}
          {budget > 0 ? budget : 0}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">spent</span>
      </div>
    </div>
  );
}

export default function Dashboard({
  expenses,
  scheduledExpenses,
  budget,
  isVIP,
  onAddExpense,
  onUpgrade,
  onLogout,
  onEditBudget,
  darkMode = false,
  onToggleDark,
  currency,
  currentUser,
  onOpenSettings,
  onOpenUpcoming,
}: DashboardProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const {
    showBanner: showInstallBanner,
    install,
    dismiss: dismissInstall,
  } = useInstallPrompt();

  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekFromNowStr = weekFromNow.toISOString().split("T")[0];

  const [reminderDismissed, setReminderDismissed] = useState(() => {
    if (!currentUser) return true;
    return (
      localStorage.getItem(`wiz_reminder_dismissed_${currentUser}`) === today
    );
  });

  const hasExpenseToday = expenses.some((e) => e.date === today);
  const showReminder = !hasExpenseToday && !reminderDismissed;

  const handleDismissReminder = () => {
    if (currentUser) {
      localStorage.setItem(`wiz_reminder_dismissed_${currentUser}`, today);
    }
    setReminderDismissed(true);
  };

  const totalBudget = budget?.amount ?? 0;
  const spent = expenses
    .filter((e) => e.date <= today)
    .reduce((s, e) => s + e.amount, 0);
  const remaining = totalBudget - spent;
  const sym = getCurrencySymbol(currency);

  const dueThisWeek = scheduledExpenses.filter(
    (s) =>
      !s.cancelled &&
      s.scheduledDate > today &&
      s.scheduledDate <= weekFromNowStr,
  );
  const dueThisWeekTotal = dueThisWeek.reduce((s, e) => s + e.amount, 0);

  const filteredExpenses =
    search.trim() === ""
      ? expenses.slice(0, 5)
      : expenses.filter(
          (exp) =>
            exp.category.toLowerCase().includes(search.toLowerCase()) ||
            exp.notes?.toLowerCase().includes(search.toLowerCase()),
        );

  // Avatar
  const avatarSrc = localStorage.getItem("wiz_user_avatar");
  const displayName = currentUser ?? "Chief";

  return (
    <div
      className="flex flex-col gap-4 p-4 pt-10 animate-fade-in"
      data-ocid="dashboard.page"
    >
      {/* Header with avatar + greeting */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(220,38,38,0.4)",
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#1a1a1a",
                border: "2px solid #2a2a2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 18 }}>👤</span>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard_greeting")}
            </p>
            <p className="text-sm font-bold text-foreground leading-tight">
              {displayName}! 👋
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isVIP ? (
            <span className="flex items-center gap-1 bg-vip/10 text-vip border border-vip/20 text-xs font-bold px-2.5 py-1 rounded-full">
              <Crown size={11} /> VIP
            </span>
          ) : (
            <button
              type="button"
              onClick={onUpgrade}
              className="text-xs font-semibold text-emerald border border-emerald/30 px-2.5 py-1 rounded-full hover:bg-emerald/5 transition-colors"
            >
              VIP ✨
            </button>
          )}
          <button
            type="button"
            onClick={onToggleDark}
            title={darkMode ? "Light mode" : "Dark mode"}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground border border-border px-2 py-1 rounded-full transition-colors"
          >
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground border border-border px-2 py-1 rounded-full transition-colors"
          >
            <Settings size={13} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground border border-border px-2 py-1 rounded-full transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.25)",
          }}
        >
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{
              width: 34,
              height: 34,
              background: "rgba(220, 38, 38, 0.12)",
            }}
          >
            <Download size={16} color="#dc2626" />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-bold leading-tight"
              style={{ color: "#f87171" }}
            >
              {t("dashboard_install_title")}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(248,113,113,0.7)" }}
            >
              {t("dashboard_install_sub")}
            </p>
          </div>
          <button
            type="button"
            onClick={install}
            data-ocid="dashboard.install.button"
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: "#dc2626", color: "#ffffff" }}
          >
            {t("dashboard_install_btn")}
          </button>
          <button
            type="button"
            onClick={dismissInstall}
            style={{ color: "#dc2626" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Daily Reminder Banner */}
      {showReminder && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.28)",
          }}
          data-ocid="dashboard.reminder.panel"
        >
          <span className="text-base leading-none select-none">🎯</span>
          <p
            className="flex-1 text-xs font-semibold"
            style={{ color: "#f59e0b" }}
          >
            {t("dashboard_reminder")}
          </p>
          <button
            type="button"
            onClick={handleDismissReminder}
            style={{ color: "#f59e0b" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Progress Ring Card */}
      <div className="bg-card rounded-3xl shadow-card p-6 flex flex-col items-center gap-4">
        <ProgressRing spent={spent} budget={totalBudget} currencySymbol={sym} />
        {budget && (
          <p className="text-xs text-muted-foreground -mt-2">
            {t("dashboard_budget")}: {budget.durationLabel}
          </p>
        )}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="bg-background rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              {t("dashboard_budget")}
            </p>
            <p className="text-lg font-bold text-foreground">
              {sym}
              {totalBudget.toFixed(0)}
            </p>
          </div>
          <div className="bg-background rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              {t("dashboard_remaining")}
            </p>
            <p
              className={`text-lg font-bold ${
                remaining < 0 ? "text-destructive" : "text-emerald"
              }`}
            >
              {sym}
              {Math.abs(remaining).toFixed(0)}
              {remaining < 0 ? " over" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Due This Week Card */}
      {dueThisWeek.length > 0 && (
        <button
          type="button"
          onClick={onOpenUpcoming}
          className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all active:scale-[0.98]"
          style={{
            background: "rgba(99, 102, 241, 0.07)",
            border: "1px solid rgba(99, 102, 241, 0.22)",
          }}
        >
          <span
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{
              width: 36,
              height: 36,
              background: "rgba(99, 102, 241, 0.12)",
            }}
          >
            <CalendarClock size={17} color="#818cf8" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: "#818cf8" }}>
              {t("dashboard_due_week")}
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "rgba(129,140,248,0.7)" }}
            >
              {dueThisWeek.length} · {sym}
              {dueThisWeekTotal.toFixed(2)}
            </p>
          </div>
          <ChevronRight size={15} color="#818cf8" className="opacity-60" />
        </button>
      )}

      {/* Edit Budget Button */}
      <button
        type="button"
        onClick={onEditBudget}
        data-ocid="dashboard.edit_budget.button"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-border/60 transition-colors"
      >
        <Pencil size={12} />
        {t("dashboard_edit_budget")}
      </button>

      {/* Add Expense Button */}
      <button
        type="button"
        data-ocid="dashboard.add_expense.primary_button"
        onClick={onAddExpense}
        className="w-full flex items-center justify-center gap-2 bg-emerald text-white font-bold py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all"
      >
        <Plus size={20} />
        Add Expense
      </button>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9 bg-secondary border-0 rounded-2xl text-sm"
          data-ocid="dashboard.search_input"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Recent Expenses */}
      <div className="bg-card rounded-3xl shadow-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {search ? `Results for "${search}"` : t("dashboard_recent")}
        </h2>
        {filteredExpenses.length === 0 ? (
          <p
            className="text-center text-muted-foreground text-sm py-4"
            data-ocid="dashboard.expenses.empty_state"
          >
            {t("dashboard_no_expenses")}
          </p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            data-ocid="dashboard.expenses.list"
          >
            {filteredExpenses.map((exp, i) => (
              <li
                key={exp.id}
                data-ocid={`dashboard.expenses.item.${i + 1}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors"
              >
                <span className="text-xl w-8 h-8 flex items-center justify-center bg-background rounded-xl">
                  {getCategoryIcon(exp.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                    {exp.category}
                    {exp.recurring && (
                      <RefreshCw
                        size={10}
                        className="text-emerald flex-shrink-0"
                      />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {exp.paymentMethod && (
                      <span>{PAYMENT_METHOD_ICONS[exp.paymentMethod]}</span>
                    )}
                    {exp.notes || exp.date}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {sym}
                  {exp.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* VIP Upgrade Banner */}
      {!isVIP && (
        <div className="vip-banner-gradient rounded-3xl p-5 flex flex-col gap-3">
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
            onClick={onUpgrade}
            className="w-full bg-white text-emerald-dark font-bold text-sm py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            Upgrade — $2.50 / 6 months ✨
          </button>
        </div>
      )}

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
