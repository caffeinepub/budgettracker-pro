import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import BottomNav from "./components/BottomNav";
import AddExpense from "./screens/AddExpense";
import Analytics from "./screens/Analytics";
import BudgetSetup from "./screens/BudgetSetup";
import Dashboard from "./screens/Dashboard";
import LinkedCards from "./screens/LinkedCards";
import OnboardingScreen from "./screens/OnboardingScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SplashScreen from "./screens/SplashScreen";
import UpcomingScreen from "./screens/UpcomingScreen";
import VIPUpgrade from "./screens/VIPUpgrade";
import type {
  Expense,
  Currency as ExpenseCurrency,
  ScheduledExpense,
} from "./types/expense";
import { inferCategory } from "./types/expense";
import type { Currency } from "./utils/currency";
import { type Lang, useLanguage } from "./utils/i18n";
import {
  requestNotificationPermission,
  scheduleDailyReminderViaSW,
  triggerImmediateNotificationIfNeeded,
} from "./utils/notifications";

export type Screen =
  | "dashboard"
  | "add"
  | "analytics"
  | "cards"
  | "vip"
  | "settings"
  | "upcoming";
type AppState = "splash" | "onboarding" | "budget-setup" | "main";

const APP_VERSION = "v30";

export interface BudgetData {
  amount: number;
  durationLabel: string;
  durationDays: number;
}

export interface BudgetEntry {
  id: string;
  name: string;
}

export interface SavingsGoal {
  name: string;
  target: number;
  saved: number;
}

function getBudget(key: string): BudgetData | null {
  try {
    const raw = localStorage.getItem(`wiz_budget_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBudget(key: string, budget: BudgetData) {
  localStorage.setItem(`wiz_budget_${key}`, JSON.stringify(budget));
}

function loadExpenses(key: string): Expense[] {
  try {
    const raw = localStorage.getItem(`wiz_expenses_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExpenses(key: string, expenses: Expense[]) {
  localStorage.setItem(`wiz_expenses_${key}`, JSON.stringify(expenses));
}

export function loadScheduled(key: string): ScheduledExpense[] {
  try {
    const raw = localStorage.getItem(`wiz_scheduled_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScheduled(key: string, items: ScheduledExpense[]) {
  localStorage.setItem(`wiz_scheduled_${key}`, JSON.stringify(items));
}

function applySmartCategories(expenses: Expense[]): {
  result: Expense[];
  changed: boolean;
} {
  let changed = false;
  const result = expenses.map((e) => {
    if (!e.category || e.category === "" || e.category === "Other") {
      const inferred = inferCategory(e.notes);
      changed = true;
      return { ...e, category: inferred };
    }
    return e;
  });
  return { result, changed };
}

function processScheduledExpenses(
  key: string,
  currentExpenses: Expense[],
  currentScheduled: ScheduledExpense[],
): {
  updatedExpenses: Expense[];
  updatedScheduled: ScheduledExpense[];
  deductedCount: number;
} {
  const today = new Date().toISOString().split("T")[0];
  const toDeduct = currentScheduled.filter(
    (s) => !s.cancelled && s.scheduledDate <= today,
  );
  const remaining = currentScheduled.filter(
    (s) => s.cancelled || s.scheduledDate > today,
  );

  if (toDeduct.length === 0) {
    return {
      updatedExpenses: currentExpenses,
      updatedScheduled: currentScheduled,
      deductedCount: 0,
    };
  }

  const newExpenses: Expense[] = toDeduct.map((s) => ({
    id: s.id,
    amount: s.amount,
    currency: s.currency,
    category: s.category,
    notes: s.notes,
    date: s.scheduledDate,
    recurring: true,
    paymentMethod: s.paymentMethod,
    scheduledParentId: s.parentId,
  }));

  const updatedExpenses = [...newExpenses, ...currentExpenses];
  saveExpenses(key, updatedExpenses);
  saveScheduled(key, remaining);

  return {
    updatedExpenses,
    updatedScheduled: remaining,
    deductedCount: toDeduct.length,
  };
}

// ─── What's New Carousel ───────────────────────────────────────────────────
const SLIDES = [
  {
    icon: "📁",
    title: "Multiple Budget Envelopes",
    body: "Create separate budgets for different parts of your life — College, Personal, Trips. Each envelope tracks its own expenses independently. Switch between them instantly.",
  },
  {
    icon: "📊",
    title: "Export Your Data",
    body: "Download all your transactions across every budget as a clean CSV file. Your financial data is yours — keep it safe or analyze it in Excel.",
  },
  {
    icon: "🎯",
    title: "Savings Goal",
    body: "Set a goal and watch your progress grow. Every time you add funds, it's automatically logged as a 'Savings' expense from your active budget — keeping your math perfectly accurate.",
  },
  {
    id: "updates",
    icon: "✨",
    title: "Always Getting Better",
    body: "WIZ is constantly improving. Every major update shows you exactly what's new so you never miss a feature. Dismiss once, never see again.",
  },
  { id: "future", icon: "", title: "", body: "" }, // Final special slide
];

function WhatsNewCarousel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const goTo = (next: number) => {
    setExiting(true);
    setTimeout(() => {
      setSlide(next);
      setExiting(false);
    }, 180);
  };

  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)" }}
      data-ocid="whats_new.modal"
    >
      <div
        className="w-full max-w-sm flex flex-col"
        style={{
          background: "#18181b",
          border: "1px solid #3f3f46",
          borderRadius: 22,
          padding: "28px 24px 24px",
          fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
          minHeight: 380,
        }}
      >
        {/* Logo — hidden on last slide */}
        {!isLast && (
          <div className="flex justify-center mb-4">
            <img
              src="/assets/uploads/IMG_20260323_010002-1.png"
              alt="WIZ"
              style={{
                width: 40,
                filter: "drop-shadow(0 0 8px rgba(220,38,38,0.6))",
              }}
            />
          </div>
        )}

        {/* Slide content */}
        <div
          className="flex-1 flex flex-col items-center justify-center"
          style={{
            opacity: exiting ? 0 : 1,
            transform: exiting ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
        >
          {isLast ? (
            // Final special slide
            <div className="flex flex-col items-center justify-center gap-5 py-8">
              <p
                style={{
                  fontFamily: "Cairo, 'Plus Jakarta Sans', sans-serif",
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: "0.08em",
                  textAlign: "center",
                  color: "#10b981",
                  textShadow:
                    "0 0 10px rgba(16,185,129,0.8), 0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.3)",
                  lineHeight: 1.4,
                }}
              >
                AURA ISN&apos;T A TREND, IT&apos;S THE FUTURE
              </p>
              <p
                style={{
                  color: "#71717a",
                  fontSize: 11,
                  textAlign: "center",
                  letterSpacing: "0.06em",
                }}
              >
                Powered by Aura
              </p>
            </div>
          ) : (
            <>
              <span style={{ fontSize: 44, lineHeight: 1, marginBottom: 14 }}>
                {SLIDES[slide].icon}
              </span>
              <h2
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 17,
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                {SLIDES[slide].title}
              </h2>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {SLIDES[slide].body}
              </p>
            </>
          )}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-5 mb-4">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === slide ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: i === slide ? "#dc2626" : "#3f3f46",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {!isLast && (
            <button
              type="button"
              onClick={onClose}
              style={{
                color: "#71717a",
                background: "transparent",
                border: "none",
                fontSize: 13,
                cursor: "pointer",
                padding: "10px 6px",
                fontFamily: "inherit",
              }}
            >
              Skip
            </button>
          )}
          <button
            type="button"
            data-ocid="whats_new.close.button"
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                goTo(slide + 1);
              }
            }}
            style={{
              flex: 1,
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "13px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {isLast ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [isVIP, setIsVIP] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [scheduledExpenses, setScheduledExpenses] = useState<
    ScheduledExpense[]
  >([]);
  const [aiTrackingEnabled, setAiTrackingEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("wiz_dark_mode") === "true",
  );
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [currency, setCurrency] = useState<Currency>(
    () => (localStorage.getItem("wiz_currency") as Currency) || "USD",
  );
  const [language, setLanguageState] = useState<Lang>(
    () => (localStorage.getItem("wiz_language") as Lang) || "en",
  );
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Multiple budgets
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);

  // Savings goal
  const [savingsGoal, setSavingsGoalState] = useState<SavingsGoal | null>(null);

  const _useLanguage = useLanguage;
  void _useLanguage;

  const handleLanguageChange = (lang: Lang) => {
    localStorage.setItem("wiz_language", lang);
    setLanguageState(lang);
  };

  const handleCurrencyChange = (c: Currency) => {
    localStorage.setItem("wiz_currency", c);
    setCurrency(c);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (appState !== "main") {
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [appState]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("wiz_dark_mode", String(next));
      return next;
    });
  };

  const handleToggleReminders = () => {
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    if (currentUser)
      localStorage.setItem(`wiz_reminders_${currentUser}`, String(next));
  };

  // Load expenses and scheduled for a given budget id
  const loadBudgetData = (budgetId: string) => {
    const rawExpenses = loadExpenses(budgetId);
    const { result: categorized, changed } = applySmartCategories(rawExpenses);
    if (changed) saveExpenses(budgetId, categorized);

    const loadedScheduled = loadScheduled(budgetId);
    const { updatedExpenses, updatedScheduled, deductedCount } =
      processScheduledExpenses(budgetId, categorized, loadedScheduled);

    setExpenses(updatedExpenses);
    setScheduledExpenses(updatedScheduled);

    if (deductedCount > 0) {
      setTimeout(() => {
        toast.success(
          `${deductedCount} scheduled expense${
            deductedCount > 1 ? "s were" : " was"
          } deducted today from your balance.`,
          { duration: 5000 },
        );
      }, 800);
    }
  };

  const addExpense = (expense: Expense, newScheduled?: ScheduledExpense[]) => {
    const storageKey = activeBudgetId ?? currentUser;
    if (!storageKey) return;

    if (newScheduled && newScheduled.length > 0) {
      const existing = loadScheduled(storageKey);
      const updated = [...existing, ...newScheduled];
      saveScheduled(storageKey, updated);
      setScheduledExpenses(updated);
    }

    const today = new Date().toISOString().split("T")[0];
    if (expense.date <= today) {
      setExpenses((prev) => {
        const next = [expense, ...prev];
        saveExpenses(storageKey, next);
        return next;
      });
    }

    setCurrentScreen("dashboard");
  };

  const cancelScheduled = (id: string) => {
    const storageKey = activeBudgetId ?? currentUser;
    if (!storageKey) return;
    setScheduledExpenses((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, cancelled: true } : s,
      );
      saveScheduled(storageKey, updated);
      return updated;
    });
    toast.success("Scheduled expense cancelled.");
  };

  const handleLogout = () => {
    localStorage.removeItem("wiz_session");
    setCurrentUser(null);
    setBudget(null);
    setExpenses([]);
    setScheduledExpenses([]);
    setRemindersEnabled(false);
    setBudgets([]);
    setActiveBudgetId(null);
    setSavingsGoalState(null);
    setAppState("onboarding");
    window.history.pushState(null, "", window.location.href);
  };

  const createBudget = (name: string) => {
    if (!currentUser) return;
    const id = `${currentUser}_${Date.now().toString(36)}`;
    const newEntry: BudgetEntry = { id, name };
    const updated = [...budgets, newEntry];
    setBudgets(updated);
    localStorage.setItem(`wiz_budgets_${currentUser}`, JSON.stringify(updated));
    // Switch to new budget (no expenses yet)
    localStorage.setItem(`wiz_active_budget_${currentUser}`, id);
    setActiveBudgetId(id);
    setExpenses([]);
    setScheduledExpenses([]);
    setBudget(null);
    toast.success(`Budget "${name}" created!`);
  };

  const switchBudget = (id: string) => {
    if (!currentUser || id === activeBudgetId) return;
    localStorage.setItem(`wiz_active_budget_${currentUser}`, id);
    setActiveBudgetId(id);
    loadBudgetData(id);
    const savedBudget = getBudget(id);
    setBudget(savedBudget);
  };

  const deleteBudget = (id: string) => {
    if (!currentUser) return;
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    localStorage.setItem(`wiz_budgets_${currentUser}`, JSON.stringify(updated));
    localStorage.removeItem(`wiz_budget_${id}`);
    localStorage.removeItem(`wiz_expenses_${id}`);
    localStorage.removeItem(`wiz_scheduled_${id}`);
    // Switch to first remaining budget
    if (updated.length > 0) {
      switchBudget(updated[0].id);
    } else {
      setActiveBudgetId(null);
      setExpenses([]);
      setScheduledExpenses([]);
      setBudget(null);
    }
  };
  void deleteBudget;

  const handleSetSavingsGoal = (goal: SavingsGoal) => {
    if (!currentUser) return;
    setSavingsGoalState(goal);
    localStorage.setItem(`wiz_goal_${currentUser}`, JSON.stringify(goal));
  };

  const handleAddFundsToGoal = (amount: number) => {
    if (!currentUser || !savingsGoal) return;
    const today = new Date().toISOString().split("T")[0];
    const goalExpense: Expense = {
      id: `goal_${Date.now()}`,
      amount,
      currency: currency as unknown as ExpenseCurrency,
      category: "Savings",
      notes: `Goal Transfer: ${savingsGoal.name}`,
      date: today,
      paymentMethod: "Cash",
    };
    const storageKey = activeBudgetId ?? currentUser;
    setExpenses((prev) => {
      const next = [goalExpense, ...prev];
      saveExpenses(storageKey, next);
      return next;
    });
    const updated: SavingsGoal = {
      ...savingsGoal,
      saved: savingsGoal.saved + amount,
    };
    setSavingsGoalState(updated);
    localStorage.setItem(`wiz_goal_${currentUser}`, JSON.stringify(updated));
    toast.success(`${amount} added to "${savingsGoal.name}"!`);
  };

  const exportAllData = () => {
    const today = new Date().toISOString().split("T")[0];
    const storedCurrency =
      (localStorage.getItem("wiz_currency") as Currency) || "USD";
    const rows: string[][] = [
      [
        "Date",
        "Budget Name",
        "Category",
        "Amount",
        "Currency",
        "Notes",
        "Recurring",
        "Payment Method",
      ],
    ];

    for (const b of budgets) {
      const exps = loadExpenses(b.id);
      for (const e of exps) {
        if (e.date <= today) {
          rows.push([
            e.date,
            b.name,
            e.category,
            e.amount.toString(),
            e.currency || storedCurrency,
            e.notes ?? "",
            e.recurring ? "Yes" : "No",
            e.paymentMethod ?? "",
          ]);
        }
      }
    }

    const csv = rows
      .map((r) =>
        r.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wiz-all-data-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported as CSV!");
  };

  const initUser = (name: string) => {
    setCurrentUser(name);

    const remindersRaw = localStorage.getItem(`wiz_reminders_${name}`);
    setRemindersEnabled(remindersRaw === "true");

    // VIP backward compat
    const vipStatus =
      localStorage.getItem("wiz_vip") ||
      localStorage.getItem(`wiz_vip_${name}`);
    if (vipStatus === "lifetime") setIsVIP(true);

    // Load saved language
    const savedLang = localStorage.getItem("wiz_language") as Lang;
    if (savedLang) setLanguageState(savedLang);

    // Load saved currency
    const savedCurrency = localStorage.getItem("wiz_currency") as Currency;
    if (savedCurrency) setCurrency(savedCurrency);

    // --- Multiple Budgets Migration & Init ---
    const budgetsRaw = localStorage.getItem(`wiz_budgets_${name}`);
    let budgetList: BudgetEntry[] = [];

    if (!budgetsRaw) {
      // Migration: check for legacy single budget
      const legacyBudget = getBudget(name);
      const defaultId = `${name}_default`;
      const defaultEntry: BudgetEntry = { id: defaultId, name: "Personal" };
      budgetList = [defaultEntry];
      localStorage.setItem(`wiz_budgets_${name}`, JSON.stringify(budgetList));

      if (legacyBudget) {
        // Copy legacy budget to new id key
        saveBudget(defaultId, legacyBudget);
        // Copy legacy expenses
        const legacyExpenses = loadExpenses(name);
        if (legacyExpenses.length > 0) {
          saveExpenses(defaultId, legacyExpenses);
        }
        // Copy legacy scheduled
        const legacyScheduled = loadScheduled(name);
        if (legacyScheduled.length > 0) {
          saveScheduled(defaultId, legacyScheduled);
        }
      }
    } else {
      try {
        budgetList = JSON.parse(budgetsRaw);
      } catch {
        budgetList = [];
      }
    }

    // Ensure at least one budget
    if (budgetList.length === 0) {
      const defaultId = `${name}_default`;
      budgetList = [{ id: defaultId, name: "Personal" }];
      localStorage.setItem(`wiz_budgets_${name}`, JSON.stringify(budgetList));
    }

    setBudgets(budgetList);

    // Determine active budget
    const savedActiveId = localStorage.getItem(`wiz_active_budget_${name}`);
    const validActive =
      savedActiveId && budgetList.some((b) => b.id === savedActiveId)
        ? savedActiveId
        : budgetList[0].id;
    localStorage.setItem(`wiz_active_budget_${name}`, validActive);
    setActiveBudgetId(validActive);

    // Load budget settings for active
    const activeBudget = getBudget(validActive);
    if (activeBudget) setBudget(activeBudget);

    // Load expenses/scheduled for active budget
    const rawExpenses = loadExpenses(validActive);
    const { result: categorizedExpenses, changed } =
      applySmartCategories(rawExpenses);
    if (changed) saveExpenses(validActive, categorizedExpenses);

    const loadedScheduled = loadScheduled(validActive);
    const { updatedExpenses, updatedScheduled, deductedCount } =
      processScheduledExpenses(
        validActive,
        categorizedExpenses,
        loadedScheduled,
      );

    setExpenses(updatedExpenses);
    setScheduledExpenses(updatedScheduled);

    if (deductedCount > 0) {
      setTimeout(() => {
        toast.success(
          `${deductedCount} scheduled expense${
            deductedCount > 1 ? "s were" : " was"
          } deducted today from your balance.`,
          { duration: 5000 },
        );
      }, 800);
    }

    // Load savings goal
    try {
      const goalRaw = localStorage.getItem(`wiz_goal_${name}`);
      if (goalRaw) setSavingsGoalState(JSON.parse(goalRaw));
    } catch {
      // ignore
    }
  };

  const checkAndShowWhatsNew = () => {
    if (localStorage.getItem("wiz_seen_version") !== APP_VERSION) {
      setShowWhatsNew(true);
    }
  };

  const handleSplashComplete = (name: string | null) => {
    if (name) {
      initUser(name);
      setAppState("main");
      checkAndShowWhatsNew();
      const lang = localStorage.getItem("wiz_language") || "en";
      triggerImmediateNotificationIfNeeded(name, lang);
      scheduleDailyReminderViaSW(lang);
    } else {
      setAppState("onboarding");
    }
  };

  const handleOnboardingComplete = (name: string) => {
    initUser(name);
    setAppState("main");
    checkAndShowWhatsNew();
    const lang = localStorage.getItem("wiz_language") || "en";
    triggerImmediateNotificationIfNeeded(name, lang);
    scheduleDailyReminderViaSW(lang);
    requestNotificationPermission();
  };

  const handleBudgetComplete = (newBudget: BudgetData) => {
    const storageKey = activeBudgetId ?? currentUser;
    if (storageKey) saveBudget(storageKey, newBudget);
    setBudget(newBudget);
    setAppState("main");
    checkAndShowWhatsNew();
    if (currentUser) {
      const lang = localStorage.getItem("wiz_language") || "en";
      triggerImmediateNotificationIfNeeded(currentUser, lang);
      scheduleDailyReminderViaSW(lang);
    }
  };

  const handleCloseWhatsNew = () => {
    localStorage.setItem("wiz_seen_version", APP_VERSION);
    setShowWhatsNew(false);
  };

  if (appState === "main" && !currentUser) {
    setAppState("onboarding");
    return null;
  }

  if (appState === "splash") {
    return (
      <div className={darkMode ? "dark" : ""}>
        <SplashScreen onComplete={handleSplashComplete} />
        <Toaster position="top-center" />
      </div>
    );
  }

  if (appState === "onboarding") {
    return (
      <div className={darkMode ? "dark" : ""}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <Toaster position="top-center" />
      </div>
    );
  }

  if (appState === "budget-setup") {
    if (!currentUser) {
      setAppState("onboarding");
      return null;
    }
    return (
      <div className={darkMode ? "dark" : ""}>
        <BudgetSetup
          isVIP={isVIP}
          onComplete={handleBudgetComplete}
          onUpgrade={() => setIsVIP(true)}
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
        />
        <Toaster position="top-center" />
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return (
          <Dashboard
            expenses={expenses}
            scheduledExpenses={scheduledExpenses}
            budget={budget}
            isVIP={isVIP}
            onAddExpense={() => setCurrentScreen("add")}
            onUpgrade={() => setCurrentScreen("vip")}
            onLogout={handleLogout}
            onEditBudget={() => setAppState("budget-setup")}
            darkMode={darkMode}
            onToggleDark={toggleDarkMode}
            currency={currency}
            currentUser={currentUser}
            onOpenSettings={() => setCurrentScreen("settings")}
            onOpenUpcoming={() => setCurrentScreen("upcoming")}
            budgets={budgets}
            activeBudgetId={activeBudgetId}
            onCreateBudget={createBudget}
            onSwitchBudget={switchBudget}
            savingsGoal={savingsGoal}
            onSetSavingsGoal={handleSetSavingsGoal}
            onAddFundsToGoal={handleAddFundsToGoal}
          />
        );
      case "add":
        return (
          <AddExpense
            onSave={addExpense}
            onCancel={() => setCurrentScreen("dashboard")}
            isVIP={isVIP}
            onUpgrade={() => setCurrentScreen("vip")}
            currentUser={currentUser}
          />
        );
      case "analytics":
        return (
          <Analytics
            expenses={expenses}
            isVIP={isVIP}
            onUpgrade={() => setCurrentScreen("vip")}
            currency={currency}
            darkMode={darkMode}
          />
        );
      case "cards":
        return (
          <LinkedCards
            isVIP={isVIP}
            aiTrackingEnabled={aiTrackingEnabled}
            onToggleAI={setAiTrackingEnabled}
            onUpgrade={() => setCurrentScreen("vip")}
          />
        );
      case "vip":
        return (
          <VIPUpgrade
            isVIP={isVIP}
            onUpgrade={() => {
              setIsVIP(true);
              localStorage.setItem("wiz_vip", "lifetime");
              if (currentUser)
                localStorage.setItem(`wiz_vip_${currentUser}`, "lifetime");
            }}
            onDowngrade={() => setIsVIP(false)}
            currentUser={currentUser}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            currentUser={currentUser}
            darkMode={darkMode}
            onToggleDark={toggleDarkMode}
            remindersEnabled={remindersEnabled}
            onToggleReminders={handleToggleReminders}
            onBack={() => setCurrentScreen("dashboard")}
            onLanguageChange={handleLanguageChange}
            language={language}
            onExportAllData={exportAllData}
          />
        );
      case "upcoming":
        return (
          <UpcomingScreen
            scheduledExpenses={scheduledExpenses}
            onCancel={cancelScheduled}
            onBack={() => setCurrentScreen("dashboard")}
            currency={currency}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-background flex items-start justify-center${
        darkMode ? " dark" : ""
      }`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm min-h-screen flex flex-col relative bg-background">
        <main className="flex-1 pb-20 overflow-y-auto">{renderScreen()}</main>
        <BottomNav
          current={currentScreen}
          isVIP={isVIP}
          onChange={setCurrentScreen}
          scheduledCount={scheduledExpenses.filter((s) => !s.cancelled).length}
        />
      </div>
      {showWhatsNew && <WhatsNewCarousel onClose={handleCloseWhatsNew} />}
      <Toaster position="top-center" />
    </div>
  );
}
