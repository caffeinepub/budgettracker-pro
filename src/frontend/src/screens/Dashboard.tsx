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
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { BudgetData, BudgetEntry, SavingsGoal } from "../App";
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
  // Multiple budgets
  budgets: BudgetEntry[];
  activeBudgetId: string | null;
  onCreateBudget: (name: string) => void;
  onSwitchBudget: (id: string) => void;
  // Savings goal
  savingsGoal: SavingsGoal | null;
  onSetSavingsGoal: (goal: SavingsGoal) => void;
  onAddFundsToGoal: (amount: number) => void;
  // Quick-tap expenses
  onQuickTapExpense: (amount: number, label: string, icon: string) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (
    id: string,
    updates: { amount: number; category: string; notes: string },
  ) => void;
  auraScore?: number;
}

const DEFAULT_CHIPS = [
  { id: "1", icon: "☕", label: "Coffee", amount: 30 },
  { id: "2", icon: "🚌", label: "Transport", amount: 10 },
  { id: "3", icon: "🖨️", label: "Print", amount: 20 },
];

interface QuickChip {
  id: string;
  icon: string;
  label: string;
  amount: number;
}

function QuickTapRow({
  currentUser,
  sym,
  onTap,
}: {
  currentUser: string | null;
  sym: string;
  onTap: (amount: number, label: string, icon: string) => void;
}) {
  const { t } = useLanguage();
  const storageKey = currentUser ? `wiz_quick_chips_${currentUser}` : null;
  const [chips, setChips] = useState<QuickChip[]>(() => {
    if (!storageKey) return DEFAULT_CHIPS;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CHIPS;
      }
    }
    return DEFAULT_CHIPS;
  });
  const [showForm, setShowForm] = useState(false);
  const [newIcon, setNewIcon] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const saveChips = (updated: QuickChip[]) => {
    setChips(updated);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveChips(chips.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    const amt = Number.parseFloat(newAmount);
    if (!newLabel.trim() || Number.isNaN(amt) || amt <= 0) return;
    const chip: QuickChip = {
      id: `${Date.now()}`,
      icon: newIcon.trim() || "💡",
      label: newLabel.trim(),
      amount: amt,
    };
    saveChips([...chips, chip]);
    setNewIcon("");
    setNewLabel("");
    setNewAmount("");
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          overflowX: "auto",
          gap: 8,
          paddingBottom: 4,
          scrollbarWidth: "none",
        }}
      >
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onTap(chip.amount, chip.label, chip.icon)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 999,
              padding: "7px 10px 7px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#e4e4e7",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
            <span style={{ color: "#a1a1aa" }}>·</span>
            <span style={{ color: "#10b981" }}>
              {sym}
              {chip.amount}
            </span>
            <button
              type="button"
              onClick={(e) => handleDelete(chip.id, e)}
              style={{
                marginLeft: 2,
                color: "#71717a",
                fontSize: 11,
                lineHeight: 1,
                cursor: "pointer",
                padding: "0 2px",
                background: "none",
                border: "none",
              }}
              aria-label={`Remove ${chip.label}`}
            >
              ×
            </button>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            flexShrink: 0,
            gap: 4,
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 999,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#10b981",
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>
      {showForm && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "10px 12px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
          }}
        >
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value.slice(0, 2))}
            placeholder="🏷️"
            style={{
              width: 36,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 6px",
              color: "#fff",
              fontSize: 14,
              textAlign: "center",
            }}
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={t("quick_tap_placeholder_label")}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 10px",
              color: "#fff",
              fontSize: 12,
              minWidth: 0,
            }}
          />
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder={t("quick_tap_placeholder_amount")}
            style={{
              width: 64,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 8px",
              color: "#fff",
              fontSize: 12,
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            style={{
              background: "#10b981",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {t("quick_tap_add_btn")}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{
              background: "none",
              border: "none",
              color: "#71717a",
              fontSize: 16,
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
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
  const { t } = useLanguage();
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
          {t("dashboard_of_label")} {currencySymbol}
          {budget > 0 ? budget : 0}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {t("dashboard_spent_label")}
        </span>
      </div>
    </div>
  );
}

// Budget Switcher
function BudgetSwitcher({
  budgets,
  activeBudgetId,
  onSwitch,
  onCreate,
}: {
  budgets: BudgetEntry[];
  activeBudgetId: string | null;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
        data-ocid="dashboard.budgets.list"
      >
        {budgets.map((b) => (
          <button
            key={b.id}
            type="button"
            data-ocid="dashboard.budget.tab"
            onClick={() => onSwitch(b.id)}
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: "1px solid",
              transition: "all 0.18s ease",
              background:
                b.id === activeBudgetId ? "#dc2626" : "rgba(255,255,255,0.04)",
              borderColor:
                b.id === activeBudgetId ? "#dc2626" : "rgba(255,255,255,0.08)",
              color: b.id === activeBudgetId ? "#fff" : "#a1a1aa",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {b.name}
          </button>
        ))}
        {creating ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setCreating(false);
              }}
              placeholder="Budget name"
              data-ocid="dashboard.budget_name.input"
              style={{
                background: "#1a1a1a",
                border: "1px solid #3f3f46",
                borderRadius: 10,
                padding: "5px 10px",
                fontSize: 12,
                color: "#fff",
                width: 110,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              type="button"
              data-ocid="dashboard.budget_create.confirm_button"
              onClick={handleCreate}
              style={{
                background: "#10b981",
                border: "none",
                borderRadius: 8,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-ocid="dashboard.budget_add.button"
            onClick={() => {
              setCreating(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
              border: "1px dashed rgba(255,255,255,0.15)",
              cursor: "pointer",
              color: "#71717a",
            }}
            title="Create new budget"
          >
            <Plus size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// Savings Goal Card
function SavingsGoalCard({
  goal,
  sym,
  onSetGoal,
  onAddFunds,
}: {
  goal: SavingsGoal | null;
  sym: string;
  onSetGoal: (g: SavingsGoal) => void;
  onAddFunds: (amount: number) => void;
}) {
  const { t } = useLanguage();
  const [settingGoal, setSettingGoal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [addingFunds, setAddingFunds] = useState(false);
  const [fundsAmount, setFundsAmount] = useState("");

  const handleSaveGoal = () => {
    const name = goalName.trim();
    const target = Number.parseFloat(goalTarget);
    if (!name || Number.isNaN(target) || target <= 0) return;
    onSetGoal({ name, target, saved: goal?.saved ?? 0 });
    setSettingGoal(false);
    setGoalName("");
    setGoalTarget("");
  };

  const handleAddFunds = () => {
    const amount = Number.parseFloat(fundsAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    onAddFunds(amount);
    setAddingFunds(false);
    setFundsAmount("");
  };

  const progress = goal ? Math.min(goal.saved / goal.target, 1) : 0;
  const pct = Math.round(progress * 100);
  const isComplete = goal !== null && goal.saved >= goal.target;

  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-3"
      style={{
        background: "oklch(var(--card))",
        border: "1px solid oklch(var(--border))",
      }}
      data-ocid="dashboard.savings_goal.card"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>🐷</span>
          <span
            style={{
              color: "oklch(var(--foreground))",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {t("savings_goal_title")}
          </span>
        </div>
        {goal && (
          <button
            type="button"
            data-ocid="dashboard.savings_goal.edit_button"
            onClick={() => {
              setGoalName(goal.name);
              setGoalTarget(String(goal.target));
              setSettingGoal(true);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#71717a",
              padding: 4,
            }}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {/* Set Goal Form */}
      {settingGoal && (
        <div className="flex flex-col gap-2 mt-1">
          <input
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder={t("savings_goal_name_placeholder")}
            data-ocid="dashboard.savings_goal_name.input"
            style={{
              background: "#1a1a1a",
              border: "1px solid #3f3f46",
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 13,
              color: "#fff",
              width: "100%",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <input
            type="number"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            placeholder={`Target amount (${sym})`}
            data-ocid="dashboard.savings_goal_target.input"
            style={{
              background: "#1a1a1a",
              border: "1px solid #3f3f46",
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 13,
              color: "#fff",
              width: "100%",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="dashboard.savings_goal.save_button"
              onClick={handleSaveGoal}
              style={{
                flex: 1,
                background: "#10b981",
                border: "none",
                borderRadius: 10,
                padding: "10px",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t("savings_goal_save")}
            </button>
            <button
              type="button"
              data-ocid="dashboard.savings_goal.cancel_button"
              onClick={() => setSettingGoal(false)}
              style={{
                padding: "10px 14px",
                background: "transparent",
                border: "1px solid #3f3f46",
                borderRadius: 10,
                fontSize: 13,
                color: "#71717a",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t("savings_goal_cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Goal content */}
      {!settingGoal && goal && (
        <>
          <p
            style={{
              color: "oklch(var(--foreground))",
              fontWeight: 700,
              fontSize: 15,
              marginTop: -4,
            }}
          >
            {goal.name}
          </p>
          {isComplete ? (
            <p style={{ color: "#10b981", fontWeight: 700, fontSize: 15 }}>
              {t("savings_goal_reached")}
            </p>
          ) : (
            <>
              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "#1f1f1f",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: "#10b981",
                    borderRadius: 3,
                    transition: "width 0.5s ease",
                  }}
                  data-ocid="dashboard.savings_goal.loading_state"
                />
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#a1a1aa", fontSize: 12 }}>
                  {sym}
                  {goal.saved.toFixed(2)} of {sym}
                  {goal.target.toFixed(2)}
                </span>
                <span
                  style={{ color: "#10b981", fontSize: 12, fontWeight: 700 }}
                >
                  {pct}%
                </span>
              </div>
            </>
          )}
          {/* Add Funds */}
          {!isComplete &&
            (addingFunds ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(e.target.value)}
                  placeholder="Amount"
                  data-ocid="dashboard.savings_goal_funds.input"
                  style={{
                    flex: 1,
                    background: "#1a1a1a",
                    border: "1px solid #3f3f46",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "#fff",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  data-ocid="dashboard.savings_goal_funds.confirm_button"
                  onClick={handleAddFunds}
                  style={{
                    background: "#10b981",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("savings_goal_add_funds_confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingFunds(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#71717a",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="dashboard.savings_goal_add_funds.button"
                onClick={() => setAddingFunds(true)}
                style={{
                  alignSelf: "flex-end",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 10,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#10b981",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                + Add Funds
              </button>
            ))}
        </>
      )}

      {/* No goal set */}
      {!settingGoal && !goal && (
        <>
          <p style={{ color: "#71717a", fontSize: 13 }}>No goal set yet</p>
          <button
            type="button"
            data-ocid="dashboard.savings_goal_set.button"
            onClick={() => setSettingGoal(true)}
            style={{
              alignSelf: "flex-start",
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 10,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#10b981",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("savings_goal_set")}
          </button>
        </>
      )}
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
  budgets,
  activeBudgetId,
  onCreateBudget,
  onSwitchBudget,
  savingsGoal,
  onSetSavingsGoal,
  onAddFundsToGoal,
  onQuickTapExpense,
  onDeleteExpense,
  onEditExpense,
  auraScore = 0,
}: DashboardProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
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

  const avatarSrc = localStorage.getItem("wiz_user_avatar");
  const displayName = currentUser ?? "Chief";

  return (
    <div
      className="flex flex-col gap-4 p-4 pt-10 animate-fade-in"
      data-ocid="dashboard.page"
    >
      {/* Header */}
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
            {(() => {
              const glowStyle =
                auraScore >= 200
                  ? {
                      boxShadow:
                        "0 0 24px rgba(16,185,129,0.9), 0 0 40px rgba(16,185,129,0.4)",
                      border: "1px solid rgba(16,185,129,0.8)",
                    }
                  : auraScore >= 100
                    ? {
                        boxShadow: "0 0 16px rgba(16,185,129,0.6)",
                        border: "1px solid rgba(16,185,129,0.5)",
                      }
                    : auraScore >= 50
                      ? {
                          boxShadow: "0 0 10px rgba(16,185,129,0.4)",
                          border: "1px solid rgba(16,185,129,0.35)",
                        }
                      : {
                          boxShadow: "0 0 6px rgba(16,185,129,0.2)",
                          border: "1px solid rgba(16,185,129,0.25)",
                        };
              return (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 3,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "'Courier New', 'Roboto Mono', monospace",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#10b981",
                    background: "rgba(16,185,129,0.08)",
                    animation: "aura-pulse 2.5s ease-in-out infinite",
                    ...glowStyle,
                  }}
                >
                  ◆ {t("aura_label")}: {auraScore}
                </span>
              );
            })()}
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

      {/* Budget Switcher */}
      {budgets.length > 0 && (
        <BudgetSwitcher
          budgets={budgets}
          activeBudgetId={activeBudgetId}
          onSwitch={onSwitchBudget}
          onCreate={onCreateBudget}
        />
      )}

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

      {/* Quick-Tap Expenses */}
      <QuickTapRow
        currentUser={currentUser}
        sym={sym}
        onTap={onQuickTapExpense}
      />

      {/* Savings Goal Card */}
      <SavingsGoalCard
        goal={savingsGoal}
        sym={sym}
        onSetGoal={onSetSavingsGoal}
        onAddFunds={onAddFundsToGoal}
      />

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
        {t("dashboard_add_expense")}
      </button>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          placeholder={t("dashboard_search_placeholder")}
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
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors group"
              >
                <span className="text-xl w-8 h-8 flex items-center justify-center bg-background rounded-xl flex-shrink-0">
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
                <span className="text-sm font-bold text-foreground mr-1">
                  {sym}
                  {exp.amount.toFixed(2)}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    aria-label={t("tx_edit")}
                    onClick={() => {
                      setEditTarget(exp);
                      setEditAmount(String(exp.amount));
                      setEditCategory(exp.category);
                      setEditNotes(exp.notes || "");
                    }}
                    style={{
                      background: "rgba(99,102,241,0.10)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: 8,
                      padding: "5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#818cf8",
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("tx_delete")}
                    onClick={() => setDeleteTarget(exp)}
                    style={{
                      background: "rgba(220,38,38,0.10)",
                      border: "1px solid rgba(220,38,38,0.25)",
                      borderRadius: 8,
                      padding: "5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f87171",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setDeleteTarget(null)}
          onKeyDown={(e) => e.key === "Escape" && setDeleteTarget(null)}
          role="presentation"
          tabIndex={-1}
        >
          <div
            style={{
              background: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: 20,
              padding: "24px",
              maxWidth: 340,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(220,38,38,0.15)",
                  border: "1px solid rgba(220,38,38,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={17} color="#f87171" />
              </div>
              <h3
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                }}
              >
                {t("tx_delete_confirm_title")}
              </h3>
            </div>
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              {t("tx_delete_confirm_msg")}
            </p>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: "10px 14px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#9ca3af", fontSize: 13 }}>
                {deleteTarget.category}
              </span>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                {sym}
                {deleteTarget.amount.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid #2a2a2a",
                  color: "#9ca3af",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("tx_delete_confirm_no")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteExpense(deleteTarget.id);
                  setDeleteTarget(null);
                  toast.success(t("tx_deleted_toast"), { duration: 2000 });
                }}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(220,38,38,0.85)",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("tx_delete_confirm_yes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Transaction Modal ── */}
      {editTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setEditTarget(null)}
          onKeyDown={(e) => e.key === "Escape" && setEditTarget(null)}
          role="presentation"
          tabIndex={-1}
        >
          <div
            style={{
              background: "#141414",
              border: "1px solid #2a2a2a",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: "24px 20px 32px",
              width: "100%",
              maxWidth: 480,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Pencil size={17} color="#818cf8" />
              </div>
              <h3
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  margin: 0,
                }}
              >
                {t("tx_edit_title")}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Amount */}
              <div>
                <label
                  htmlFor="edit-amount"
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {t("tx_edit_amount")}
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: 12,
                    padding: "0 14px",
                    height: 48,
                  }}
                >
                  <span
                    style={{
                      color: "#9ca3af",
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {sym}
                  </span>
                  <input
                    id="edit-amount"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="edit-category"
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {t("tx_edit_category")}
                </label>
                <input
                  id="edit-category"
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    width: "100%",
                    height: 48,
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: 12,
                    padding: "0 14px",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="edit-notes"
                  style={{
                    color: "#9ca3af",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {t("tx_edit_notes")}
                </label>
                <input
                  id="edit-notes"
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{
                    width: "100%",
                    height: 48,
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: 12,
                    padding: "0 14px",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid #2a2a2a",
                  color: "#9ca3af",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("tx_edit_cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const newAmt = Number.parseFloat(editAmount);
                  if (
                    Number.isNaN(newAmt) ||
                    newAmt <= 0 ||
                    !editCategory.trim()
                  )
                    return;
                  onEditExpense(editTarget.id, {
                    amount: newAmt,
                    category: editCategory.trim(),
                    notes: editNotes.trim(),
                  });
                  setEditTarget(null);
                  toast.success(t("tx_updated_toast"), { duration: 2000 });
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  background: "#10b981",
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("tx_edit_save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Upgrade Banner */}
      {!isVIP && (
        <div className="vip-banner-gradient rounded-3xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-white font-bold text-sm">
                {t("dashboard_vip_title")}
              </p>
              <p className="text-white/70 text-xs mt-0.5">
                {t("dashboard_vip_sub")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full bg-white text-emerald-dark font-bold text-sm py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            {t("dashboard_upgrade_btn")}
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
