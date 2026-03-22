import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import BottomNav from "./components/BottomNav";
import AddExpense from "./screens/AddExpense";
import Analytics from "./screens/Analytics";
import Dashboard from "./screens/Dashboard";
import LinkedCards from "./screens/LinkedCards";
import OnboardingScreen from "./screens/OnboardingScreen";
import SplashScreen from "./screens/SplashScreen";
import VIPUpgrade from "./screens/VIPUpgrade";
import { type Expense, SEED_EXPENSES } from "./types/expense";

export type Screen = "dashboard" | "add" | "analytics" | "cards" | "vip";
type AppState = "splash" | "onboarding" | "main";

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [isVIP, setIsVIP] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>(SEED_EXPENSES);
  const [weeklyBudget] = useState(200);
  const [aiTrackingEnabled, setAiTrackingEnabled] = useState(false);

  const addExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("wiz_session");
    setAppState("onboarding");
  };

  if (appState === "splash") {
    return (
      <>
        <SplashScreen
          onComplete={(isNew) => setAppState(isNew ? "onboarding" : "main")}
        />
        <Toaster position="top-center" />
      </>
    );
  }

  if (appState === "onboarding") {
    return (
      <>
        <OnboardingScreen onComplete={() => setAppState("main")} />
        <Toaster position="top-center" />
      </>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return (
          <Dashboard
            expenses={expenses}
            weeklyBudget={weeklyBudget}
            isVIP={isVIP}
            onAddExpense={() => setCurrentScreen("add")}
            onUpgrade={() => setCurrentScreen("vip")}
            onLogout={handleLogout}
          />
        );
      case "add":
        return (
          <AddExpense
            onSave={addExpense}
            onCancel={() => setCurrentScreen("dashboard")}
            isVIP={isVIP}
            onUpgrade={() => setCurrentScreen("vip")}
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
            onUpgrade={() => setIsVIP(true)}
            onDowngrade={() => setIsVIP(false)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
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
