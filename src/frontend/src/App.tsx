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
import type { Expense, ScheduledExpense } from "./types/expense";
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

const APP_VERSION = "v21";

export interface BudgetData {
  amount: number;
  durationLabel: string;
  durationDays: number;
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

// What's New Modal
function WhatsNewModal({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const items =
    lang === "ar"
      ? [
          "🌐 دعم ثنائي اللغة — عربي وإنجليزي",
          "🔔 تذكيرات إشعارات يومية حقيقية",
          "👤 تجربة تهيئة جديدة مبسطة",
          "🎨 لوحة تحكم محسّنة مع صورتك الشخصية",
        ]
      : [
          "🌐 Bilingual support — Arabic & English",
          "🔔 Native push notification reminders",
          "👤 New streamlined onboarding flow",
          "🎨 Redesigned dashboard with your avatar",
        ];
  const title = lang === "ar" ? "الجديد في v21" : "What's New in v21";
  const closeLabel = lang === "ar" ? "تم!" : "Got it!";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center"
        style={{
          background: "#18181b",
          border: "1px solid #3f3f46",
          borderRadius: 20,
          padding: 28,
          fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
        }}
        data-ocid="whats_new.modal"
      >
        <img
          src="/assets/uploads/IMG_20260323_010002-1.png"
          alt="WIZ"
          style={{
            width: 40,
            filter: "drop-shadow(0 0 8px rgba(220,38,38,0.6))",
          }}
        />
        <h2
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            textAlign: "center",
            marginTop: 14,
          }}
        >
          {title}
        </h2>
        <ul className="w-full mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item} style={{ color: "#d4d4d8", fontSize: 14 }}>
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          data-ocid="whats_new.close.button"
          onClick={onClose}
          style={{
            width: "100%",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "14px",
            marginTop: 22,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
          }}
        >
          {closeLabel}
        </button>
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

  // suppress unused warning — useLanguage used for RTL direction
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

  const addExpense = (expense: Expense, newScheduled?: ScheduledExpense[]) => {
    if (newScheduled && newScheduled.length > 0 && currentUser) {
      const existing = loadScheduled(currentUser);
      const updated = [...existing, ...newScheduled];
      saveScheduled(currentUser, updated);
      setScheduledExpenses(updated);
    }

    const today = new Date().toISOString().split("T")[0];
    if (expense.date <= today) {
      setExpenses((prev) => {
        const next = [expense, ...prev];
        if (currentUser) saveExpenses(currentUser, next);
        return next;
      });
    }

    setCurrentScreen("dashboard");
  };

  const cancelScheduled = (id: string) => {
    if (!currentUser) return;
    setScheduledExpenses((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, cancelled: true } : s,
      );
      saveScheduled(currentUser, updated);
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
    setAppState("onboarding");
    window.history.pushState(null, "", window.location.href);
  };

  const initUser = (name: string) => {
    setCurrentUser(name);

    const remindersRaw = localStorage.getItem(`wiz_reminders_${name}`);
    setRemindersEnabled(remindersRaw === "true");

    const rawExpenses = loadExpenses(name);
    const { result: categorizedExpenses, changed } =
      applySmartCategories(rawExpenses);
    if (changed) saveExpenses(name, categorizedExpenses);

    const loadedScheduled = loadScheduled(name);
    const { updatedExpenses, updatedScheduled, deductedCount } =
      processScheduledExpenses(name, categorizedExpenses, loadedScheduled);

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

    // Load budget
    const savedBudget = getBudget(name);
    if (savedBudget) setBudget(savedBudget);
  };

  const checkAndShowWhatsNew = () => {
    if (localStorage.getItem("wiz_seen_version") !== APP_VERSION) {
      setShowWhatsNew(true);
    }
  };

  const handleSplashComplete = (name: string | null) => {
    if (name) {
      initUser(name);
      const savedBudget = getBudget(name);
      if (savedBudget) setBudget(savedBudget);
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
    if (currentUser) saveBudget(currentUser, newBudget);
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
      {showWhatsNew && (
        <WhatsNewModal onClose={handleCloseWhatsNew} lang={language} />
      )}
      <Toaster position="top-center" />
    </div>
  );
}
