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
import VIPUpgrade from "./screens/VIPUpgrade";
import type { Expense } from "./types/expense";

export type Screen =
  | "dashboard"
  | "add"
  | "analytics"
  | "cards"
  | "vip"
  | "settings";
type AppState = "splash" | "onboarding" | "budget-setup" | "main";

export interface BudgetData {
  amount: number;
  durationLabel: string;
  durationDays: number;
}

function getBudget(email: string): BudgetData | null {
  try {
    const raw = localStorage.getItem(`wiz_budget_${email}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveBudget(email: string, budget: BudgetData) {
  localStorage.setItem(`wiz_budget_${email}`, JSON.stringify(budget));
}

function loadExpenses(email: string): Expense[] {
  try {
    const raw = localStorage.getItem(`wiz_expenses_${email}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExpenses(email: string, expenses: Expense[]) {
  localStorage.setItem(`wiz_expenses_${email}`, JSON.stringify(expenses));
}

function processRecurring(email: string, current: Expense[]): Expense[] {
  try {
    const recurringRaw = localStorage.getItem(`wiz_recurring_${email}`);
    if (!recurringRaw) return current;
    const recurring: Expense[] = JSON.parse(recurringRaw);
    if (!recurring.length) return current;

    const lastRaw = localStorage.getItem(`wiz_recurring_last_${email}`);
    const lastDate = lastRaw ? new Date(lastRaw) : null;
    const now = new Date();
    const daysSinceLast = lastDate
      ? (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSinceLast >= 30) {
      const newExpenses = recurring.map((e) => ({
        ...e,
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        date: now.toISOString().split("T")[0],
      }));
      localStorage.setItem(`wiz_recurring_last_${email}`, now.toISOString());
      return [...newExpenses, ...current];
    }
    return current;
  } catch {
    return current;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [isVIP, setIsVIP] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [aiTrackingEnabled, setAiTrackingEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("wiz_dark_mode") === "true",
  );
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Route guard: prevent back-button re-entry after logout
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

  const addExpense = (expense: Expense) => {
    setExpenses((prev) => {
      const next = [expense, ...prev];
      if (currentUser) saveExpenses(currentUser, next);
      return next;
    });
    // Store recurring separately
    if (expense.recurring && currentUser) {
      try {
        const raw = localStorage.getItem(`wiz_recurring_${currentUser}`);
        const existing: Expense[] = raw ? JSON.parse(raw) : [];
        const updated = [
          ...existing.filter(
            (e) =>
              e.category !== expense.category || e.amount !== expense.amount,
          ),
          expense,
        ];
        localStorage.setItem(
          `wiz_recurring_${currentUser}`,
          JSON.stringify(updated),
        );
        if (!localStorage.getItem(`wiz_recurring_last_${currentUser}`)) {
          localStorage.setItem(
            `wiz_recurring_last_${currentUser}`,
            new Date().toISOString(),
          );
        }
      } catch {
        // ignore
      }
    }
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("wiz_session");
    setCurrentUser(null);
    setBudget(null);
    setExpenses([]);
    setRemindersEnabled(false);
    setAppState("onboarding");
    // Push two history entries to prevent back-button returning to the app
    window.history.pushState(null, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
  };

  const initUser = (email: string) => {
    setCurrentUser(email);

    // Load reminders preference
    const remindersRaw = localStorage.getItem(`wiz_reminders_${email}`);
    setRemindersEnabled(remindersRaw === "true");

    let loaded = loadExpenses(email);
    loaded = processRecurring(email, loaded);
    if (loaded.length !== loadExpenses(email).length) {
      saveExpenses(email, loaded);
    }
    setExpenses(loaded);

    // Restore VIP status from localStorage
    const vipStatus = localStorage.getItem(`wiz_vip_${email}`);
    if (vipStatus === "lifetime") setIsVIP(true);

    // Check if daily reminder should show (24+ hours since last)
    const remindersEnabledNow = remindersRaw === "true";
    if (remindersEnabledNow) {
      const lastReminderRaw = localStorage.getItem(
        `wiz_last_reminder_${email}`,
      );
      const lastReminder = lastReminderRaw ? new Date(lastReminderRaw) : null;
      const now = new Date();
      const hoursSinceLast = lastReminder
        ? (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60)
        : 999;
      if (hoursSinceLast >= 24) {
        setTimeout(() => {
          toast("💰 WIZ Reminder: Log your expenses to stay on track!");
        }, 1500);
        localStorage.setItem(`wiz_last_reminder_${email}`, now.toISOString());
      }
    }
  };

  const handleSplashComplete = (email: string | null) => {
    if (email) {
      const savedBudget = getBudget(email);
      initUser(email);
      if (savedBudget) {
        setBudget(savedBudget);
        setAppState("main");
      } else {
        setAppState("budget-setup");
      }
    } else {
      setAppState("onboarding");
    }
  };

  const handleOnboardingComplete = (email: string) => {
    initUser(email);
    const savedBudget = getBudget(email);
    if (savedBudget) {
      setBudget(savedBudget);
      setAppState("main");
    } else {
      setAppState("budget-setup");
    }
  };

  const handleBudgetComplete = (newBudget: BudgetData) => {
    if (currentUser) {
      saveBudget(currentUser, newBudget);
    }
    setBudget(newBudget);
    setAppState("main");
  };

  // Route guard: never render main app without a valid session
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
    // Guard: budget-setup also requires a user
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
            budget={budget}
            isVIP={isVIP}
            onAddExpense={() => setCurrentScreen("add")}
            onUpgrade={() => setCurrentScreen("vip")}
            onLogout={handleLogout}
            onEditBudget={() => setAppState("budget-setup")}
            darkMode={darkMode}
            onToggleDark={toggleDarkMode}
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
    >
      <div className="w-full max-w-sm min-h-screen flex flex-col relative bg-background">
        <main className="flex-1 pb-20 overflow-y-auto">{renderScreen()}</main>
        <BottomNav
          current={currentScreen}
          isVIP={isVIP}
          onChange={setCurrentScreen}
        />
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
