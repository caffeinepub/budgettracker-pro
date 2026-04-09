import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import BottomNav from "./components/BottomNav";
import AddExpense from "./screens/AddExpense";
import Analytics from "./screens/Analytics";
import BudgetSetup from "./screens/BudgetSetup";
import Dashboard from "./screens/Dashboard";
import DebtScreen from "./screens/DebtScreen";
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
import { getCurrencySymbol } from "./utils/currency";
import type { Currency } from "./utils/currency";
import { type Lang, useLanguage } from "./utils/i18n";
import {
  requestNotificationPermission,
  scheduleDailyReminderViaSW,
  triggerImmediateNotificationIfNeeded,
} from "./utils/notifications";

// Injected at build time by Vite (see vite.config.js → define.__BUILD_TS__)
// The declare tells TypeScript the global exists; Vite replaces it with the
// actual timestamp string at compile time.
declare const __BUILD_TS__: string;

// Resolve APP_VERSION with a runtime fallback so the modal never misbehaves
// even if the build-time injection somehow fails (e.g. local dev without Vite).
//   - typeof guard: prevents ReferenceError if __BUILD_TS__ is not defined at all
//   - truthy + numeric check: rejects "undefined", "", or non-timestamp garbage
//   - fallback "dev": treated as a valid version string so the modal won't
//     fire on every refresh in local dev, but WILL fire on the first real deploy
const _rawBuildTs =
  typeof __BUILD_TS__ !== "undefined" &&
  __BUILD_TS__ &&
  /^\d+$/.test(__BUILD_TS__)
    ? __BUILD_TS__
    : "dev";

const APP_VERSION: string = _rawBuildTs;

export type Screen =
  | "dashboard"
  | "add"
  | "analytics"
  | "debts"
  | "vip"
  | "settings"
  | "upcoming";
type AppState = "splash" | "onboarding" | "budget-setup" | "main";

export interface BudgetData {
  amount: number;
  durationLabel: string;
  durationDays: number;
  startDate?: string;
  endDate?: string;
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

export interface ArchivedCycle {
  budgetId: string;
  budgetName: string;
  startDate: string;
  endDate: string;
  amount: number;
  totalSpent: number;
  savedAmount: number;
  expenses: Expense[];
  archivedAt: string;
  topCategory: string;
  topCategoryAmount: number;
  topCategoryPercent: number;
  auraPointsDelta: number;
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

function loadArchivedCycles(user: string): ArchivedCycle[] {
  try {
    const raw = localStorage.getItem(`wiz_archived_cycles_${user}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveArchivedCycles(user: string, cycles: ArchivedCycle[]) {
  localStorage.setItem(`wiz_archived_cycles_${user}`, JSON.stringify(cycles));
}

function computeAuraScore(cycles: ArchivedCycle[]): number {
  if (!cycles || cycles.length === 0) return 0;

  // Sort cycles by archivedAt ascending (oldest first) for correct streak calc
  const sorted = [...cycles].sort(
    (a, b) =>
      new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime(),
  );

  let score = 0;
  let consecutiveUnderBudget = 0;

  for (const cycle of sorted) {
    const savedAmount = cycle.savedAmount ?? cycle.amount - cycle.totalSpent;
    if (savedAmount > 0) {
      // Under budget: +10 base, +5 streak bonus for consecutive cycles
      score += 10;
      if (consecutiveUnderBudget > 0) {
        score += 5; // consistency bonus
      }
      consecutiveUnderBudget++;
    } else {
      // Over budget: -5, reset streak
      score -= 5;
      consecutiveUnderBudget = 0;
    }
    // Hard floor at 0
    if (score < 0) score = 0;
  }

  return score;
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
    icon: "📅",
    title: "Budget Cycle Tracking",
    body: "WIZ now tracks your budget cycles automatically. When a cycle ends, you'll see a summary of what you spent and saved — then choose when to start fresh.",
  },
  {
    icon: "🕰️",
    title: "Historical Insights",
    body: "Go back in time. The Insights tab now lets you browse past budget cycles and see exactly how you spent in previous months.",
  },
  {
    icon: "⚡",
    title: "Auto Updates",
    body: "WIZ now detects new versions automatically. No more manual refreshes — just open the app and you'll always be on the latest version.",
  },
  {
    icon: "🌍",
    title: "Full Arabic Support",
    body: "Every text in the app — from Quick-Tap chips to Insights charts — is now fully translated. Zero mixed English/Arabic text.",
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
              key={s.id ?? s.icon}
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

// ─── Cycle Review Modal ────────────────────────────────────────────────────
function CycleCompletedModal({
  cycle,
  auraScore,
  onStartNewCycle,
  lang,
}: {
  cycle: ArchivedCycle;
  auraScore: number;
  onStartNewCycle: () => void;
  lang: string;
}) {
  const isAr = lang === "ar";

  const t = (key: string, fallback: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      cycle_review_title: { en: "Cycle Review", ar: "مراجعة الدورة" },
      cycle_date_range: { en: "Budget Period", ar: "فترة الميزانية" },
      cycle_budget_label: { en: "Total Budget", ar: "إجمالي الميزانية" },
      cycle_spent_label: { en: "Total Spent", ar: "إجمالي المصروف" },
      cycle_net_savings: { en: "Net Savings", ar: "صافي التوفير" },
      cycle_under_budget: { en: "Under budget! 🎉", ar: "دون الميزانية! 🎉" },
      cycle_over_budget: { en: "Over budget", ar: "تجاوز الميزانية" },
      cycle_top_category: { en: "Top Category", ar: "أعلى فئة إنفاق" },
      cycle_top_category_pct: { en: "% of spending", ar: "٪ من الإنفاق" },
      cycle_aura_impact: { en: "Aura Impact", ar: "تأثير الأورا" },
      cycle_aura_earned: {
        en: "Points earned this cycle!",
        ar: "نقاط مكتسبة هذه الدورة!",
      },
      cycle_aura_lost: {
        en: "Points lost this cycle",
        ar: "نقاط مفقودة هذه الدورة",
      },
      cycle_aura_new_total: {
        en: "New Aura Score:",
        ar: "رصيد الأورا الجديد:",
      },
      cycle_archive_start: {
        en: "Archive & Start New Cycle",
        ar: "أرشفة وبدء دورة جديدة",
      },
    };
    if (map[key]) return isAr ? map[key].ar : map[key].en;
    return fallback;
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const fmtNum = (n: number) =>
    isAr
      ? n.toLocaleString("ar-EG", { maximumFractionDigits: 0 })
      : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  const isUnder = cycle.savedAmount >= 0;
  const delta = cycle.auraPointsDelta ?? (isUnder ? 10 : -5);
  const topCatName = cycle.topCategory || "—";
  const topCatPct = cycle.topCategoryPercent ?? 0;

  // Translate category name
  const catKeyMap: Record<string, { en: string; ar: string }> = {
    food: { en: "Food", ar: "طعام" },
    transport: { en: "Transport", ar: "مواصلات" },
    entertainment: { en: "Entertainment", ar: "ترفيه" },
    health: { en: "Health", ar: "صحة" },
    shopping: { en: "Shopping", ar: "تسوق" },
    rent: { en: "Rent", ar: "الإيجار" },
    savings: { en: "Savings", ar: "ادخار" },
    education: { en: "Education", ar: "تعليم" },
    bills: { en: "Bills", ar: "فواتير" },
    other: { en: "Other", ar: "أخرى" },
  };
  const catKey = topCatName.toLowerCase().replace(/\s+/g, "_");
  const translatedCat = catKeyMap[catKey]?.[isAr ? "ar" : "en"] || topCatName;

  // Category emoji map
  const catEmoji: Record<string, string> = {
    Food: "🍔",
    Transport: "🚌",
    Entertainment: "🎬",
    Health: "💊",
    Shopping: "🛍️",
    Rent: "🏠",
    Savings: "💰",
    Education: "📚",
    Bills: "📄",
    Other: "📦",
  };
  const catIcon = catEmoji[topCatName] ?? "📊";

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)", zIndex: 60 }}
      data-ocid="cycle_completed.dialog"
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{
          fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            margin: "0 auto",
            padding: "40px 20px 24px",
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>
              📊
            </div>
            <h1
              style={{
                color: "#fff",
                fontWeight: 900,
                fontSize: 24,
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              {t("cycle_review_title", "Cycle Review")}
            </h1>
            <p
              style={{
                color: "#a1a1aa",
                fontSize: 13,
                margin: 0,
                fontWeight: 500,
              }}
            >
              <span style={{ color: "#10b981" }}>{cycle.budgetName}</span>
              {" · "}
              {fmtDate(cycle.startDate)} – {fmtDate(cycle.endDate)}
            </p>
          </div>

          {/* Stats 2×2 Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {/* Card: Total Budget */}
            <div
              style={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 16,
                padding: "16px 14px",
                textAlign: isAr ? "right" : "left",
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: 11,
                  margin: "0 0 6px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("cycle_budget_label", "Total Budget")}
              </p>
              <p
                style={{
                  color: "#e4e4e7",
                  fontSize: 22,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                {fmtNum(cycle.amount)}
              </p>
            </div>

            {/* Card: Total Spent */}
            <div
              style={{
                background: "#18181b",
                border: `1px solid ${isUnder ? "#3f3f46" : "#ef444450"}`,
                borderRadius: 16,
                padding: "16px 14px",
                textAlign: isAr ? "right" : "left",
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: 11,
                  margin: "0 0 6px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("cycle_spent_label", "Total Spent")}
              </p>
              <p
                style={{
                  color: isUnder ? "#e4e4e7" : "#ef4444",
                  fontSize: 22,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                {fmtNum(cycle.totalSpent)}
              </p>
            </div>

            {/* Card: Net Savings */}
            <div
              style={{
                background: "#18181b",
                border: `1px solid ${isUnder ? "#10b98140" : "#ef444440"}`,
                borderRadius: 16,
                padding: "16px 14px",
                textAlign: isAr ? "right" : "left",
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: 11,
                  margin: "0 0 6px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("cycle_net_savings", "Net Savings")}
              </p>
              <p
                style={{
                  color: isUnder ? "#10b981" : "#ef4444",
                  fontSize: 22,
                  fontWeight: 800,
                  margin: "0 0 4px",
                }}
              >
                {isUnder ? "+" : "-"}
                {fmtNum(Math.abs(cycle.savedAmount))}
              </p>
              <p
                style={{
                  color: isUnder ? "#10b981" : "#ef4444",
                  fontSize: 11,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {isUnder
                  ? t("cycle_under_budget", "Under budget! 🎉")
                  : t("cycle_over_budget", "Over budget")}
              </p>
            </div>

            {/* Card: Top Category */}
            <div
              style={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 16,
                padding: "16px 14px",
                textAlign: isAr ? "right" : "left",
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: 11,
                  margin: "0 0 6px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("cycle_top_category", "Top Category")}
              </p>
              <p
                style={{
                  color: "#e4e4e7",
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 4px",
                }}
              >
                {catIcon} {translatedCat}
              </p>
              <p style={{ color: "#71717a", fontSize: 11, margin: 0 }}>
                {topCatPct}
                {t("cycle_top_category_pct", "% of spending")}
              </p>
            </div>
          </div>

          {/* Aura Impact Section */}
          <div
            style={{
              background: "#0d1f18",
              border: "1px solid #10b981",
              borderRadius: 20,
              padding: "20px 18px",
              boxShadow:
                "0 0 24px rgba(16,185,129,0.15), inset 0 0 24px rgba(16,185,129,0.04)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#10b981",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 12px",
              }}
            >
              {t("cycle_aura_impact", "Aura Impact")}
            </p>

            {/* Points delta */}
            <p
              style={{
                fontSize: 52,
                fontWeight: 900,
                margin: "0 0 4px",
                lineHeight: 1,
                color: delta >= 0 ? "#10b981" : "#ef4444",
                textShadow:
                  delta >= 0
                    ? "0 0 20px rgba(16,185,129,0.7), 0 0 40px rgba(16,185,129,0.4)"
                    : "0 0 20px rgba(239,68,68,0.7), 0 0 40px rgba(239,68,68,0.4)",
                letterSpacing: "-0.02em",
              }}
            >
              {delta >= 0 ? "+" : ""}
              {delta}
            </p>

            <p
              style={{
                color: delta >= 0 ? "#6ee7b7" : "#fca5a5",
                fontSize: 13,
                fontWeight: 600,
                margin: "0 0 14px",
              }}
            >
              {delta >= 0
                ? t("cycle_aura_earned", "Points earned this cycle!")
                : t("cycle_aura_lost", "Points lost this cycle")}
            </p>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: 1,
                background: "#10b98130",
                margin: "0 0 14px",
              }}
            />

            {/* New total */}
            <p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>
              {t("cycle_aura_new_total", "New Aura Score:")}{" "}
              <span
                style={{
                  color: "#10b981",
                  fontWeight: 800,
                  fontSize: 16,
                  textShadow: "0 0 10px rgba(16,185,129,0.5)",
                }}
              >
                {fmtNum(auraScore)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Action Button */}
      <div
        style={{
          padding: "16px 20px",
          background: "rgba(10,10,10,0.95)",
          borderTop: "1px solid #27272a",
          maxWidth: 420,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          data-ocid="cycle_completed.confirm_button"
          onClick={onStartNewCycle}
          style={{
            width: "100%",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            padding: "16px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
            boxShadow:
              "0 0 20px rgba(16,185,129,0.4), 0 4px 16px rgba(16,185,129,0.2)",
            letterSpacing: "0.01em",
          }}
        >
          {t("cycle_archive_start", "Archive & Start New Cycle")}
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
  const [_aiTrackingEnabled, _setAiTrackingEnabled] = useState(false);
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

  // Aura score
  const [auraScore, setAuraScore] = useState<number>(0);

  // Archived cycles & cycle completed modal
  const [archivedCycles, setArchivedCycles] = useState<ArchivedCycle[]>([]);
  const [pendingCycleCompletion, setPendingCycleCompletion] =
    useState<ArchivedCycle | null>(null);

  // Recompute aura score whenever archived cycles change
  useEffect(() => {
    setAuraScore(computeAuraScore(archivedCycles));
  }, [archivedCycles]);

  // ─── SW Update Prompt ────────────────────────────────────────────────────
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const showPrompt = (worker: ServiceWorker) => {
      waitingWorkerRef.current = worker;
      setShowUpdatePrompt(true);
    };

    navigator.serviceWorker.ready.then((registration) => {
      // Already waiting on load (user had tab open during deploy)
      if (registration.waiting) {
        showPrompt(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showPrompt(installing);
          }
        });
      });
    });

    // When the new SW takes control → reload to get fresh assets
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  const handleRefreshNow = () => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };
  // ────────────────────────────────────────────────────────────────────────

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

  // ─── Budget Lifecycle ─────────────────────────────────────────────────
  const checkBudgetLifecycle = (
    budgetId: string,
    budgetName: string,
    budgetData: BudgetData,
    currentExpenses: Expense[],
    user: string,
  ) => {
    if (!budgetData.startDate || !budgetData.durationDays) return;

    // Don't re-archive if already done
    const existingArchived = loadArchivedCycles(user);
    const alreadyArchived = existingArchived.some(
      (c) => c.budgetId === budgetId && c.startDate === budgetData.startDate,
    );
    if (alreadyArchived) return;

    // Compute end date — prefer stored endDate, else calculate from startDate + durationDays
    const endDate = budgetData.endDate
      ? new Date(budgetData.endDate)
      : new Date(
          new Date(budgetData.startDate).getTime() +
            budgetData.durationDays * 24 * 60 * 60 * 1000,
        );

    // Compare against midnight today to avoid time-of-day false negatives
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate > today) return; // cycle not done yet

    const endDateStr = endDate.toISOString().split("T")[0];

    // Compute spent from expenses within this cycle's date range
    const cycleExpenses = currentExpenses.filter(
      (e) => e.date >= (budgetData.startDate as string) && e.date <= endDateStr,
    );
    const totalSpent = cycleExpenses.reduce((s, e) => s + e.amount, 0);
    const savedAmount = budgetData.amount - totalSpent;

    // Calculate top spending category
    const categoryTotals: Record<string, number> = {};
    for (const e of cycleExpenses) {
      const cat = e.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + e.amount;
    }
    let topCategory = "Other";
    let topCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    }
    const topCategoryPercent =
      totalSpent > 0 ? Math.round((topCategoryAmount / totalSpent) * 100) : 0;

    // Calculate aura points delta for this cycle
    // Check consecutive under-budget streak from existing archive (oldest first)
    const sortedExisting = [...existingArchived].sort(
      (a, b) =>
        new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime(),
    );
    let streak = 0;
    for (let i = sortedExisting.length - 1; i >= 0; i--) {
      const c = sortedExisting[i];
      const cSaved = c.savedAmount ?? c.amount - c.totalSpent;
      if (cSaved >= 0) streak++;
      else break;
    }
    const basePoints = savedAmount >= 0 ? 10 : -5;
    const streakBonus = savedAmount >= 0 && streak > 0 ? streak * 5 : 0;
    const auraPointsDelta = basePoints + streakBonus;

    const archived: ArchivedCycle = {
      budgetId,
      budgetName,
      startDate: budgetData.startDate,
      endDate: endDateStr,
      amount: budgetData.amount,
      totalSpent,
      savedAmount,
      expenses: [...currentExpenses], // copy, not reference
      archivedAt: new Date().toISOString(),
      topCategory,
      topCategoryAmount,
      topCategoryPercent,
      auraPointsDelta,
    };

    // Save to archived cycles (cap at 12) BEFORE showing modal
    const updated = [archived, ...existingArchived].slice(0, 12);
    saveArchivedCycles(user, updated);
    setArchivedCycles(updated);
    // Recompute aura AFTER archiving so "New Aura Score" in modal is accurate
    setAuraScore(computeAuraScore(updated));
    setPendingCycleCompletion(archived);
  };

  const handleStartNewCycle = () => {
    if (!pendingCycleCompletion || !currentUser) return;
    const { budgetId } = pendingCycleCompletion;
    const today = new Date().toISOString().split("T")[0];

    // Get current budget and update startDate
    const existingBudget = getBudget(budgetId);
    if (existingBudget) {
      const refreshed: BudgetData = { ...existingBudget, startDate: today };
      saveBudget(budgetId, refreshed);
      if (budgetId === activeBudgetId) setBudget(refreshed);
    }

    // Clear expenses for this budget
    saveExpenses(budgetId, []);
    saveScheduled(budgetId, []);
    if (budgetId === activeBudgetId) {
      setExpenses([]);
      setScheduledExpenses([]);
    }

    setPendingCycleCompletion(null);
    toast.success("New cycle started! Fresh start today.");
  };
  // ─────────────────────────────────────────────────────────────────────

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

    return updatedExpenses;
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
    setArchivedCycles([]);
    setPendingCycleCompletion(null);
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
    const freshExpenses = loadBudgetData(id);
    const savedBudget = getBudget(id);
    setBudget(savedBudget);
    if (savedBudget) {
      const budgetName = budgets.find((b) => b.id === id)?.name ?? "Budget";
      checkBudgetLifecycle(
        id,
        budgetName,
        savedBudget,
        freshExpenses,
        currentUser,
      );
    }
  };

  const deleteBudget = (id: string) => {
    if (!currentUser) return;

    // Remove from budgets list
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    localStorage.setItem(`wiz_budgets_${currentUser}`, JSON.stringify(updated));

    // Remove all budget-specific data
    localStorage.removeItem(`wiz_budget_${id}`);
    localStorage.removeItem(`wiz_expenses_${id}`);
    localStorage.removeItem(`wiz_scheduled_${id}`);

    // Remove any archived cycles that belong to this budget
    const remainingCycles = archivedCycles.filter((c) => c.budgetId !== id);
    if (remainingCycles.length !== archivedCycles.length) {
      saveArchivedCycles(currentUser, remainingCycles);
      setArchivedCycles(remainingCycles);
    }

    // Was this the active budget?
    if (activeBudgetId === id) {
      localStorage.removeItem(`wiz_active_budget_${currentUser}`);
      if (updated.length > 0) {
        // Switch to first remaining budget
        const nextId = updated[0].id;
        localStorage.setItem(`wiz_active_budget_${currentUser}`, nextId);
        setActiveBudgetId(nextId);
        const freshExpenses = loadBudgetData(nextId);
        const savedBudget = getBudget(nextId);
        setBudget(savedBudget);
        if (savedBudget) {
          const budgetName =
            updated.find((b) => b.id === nextId)?.name ?? "Budget";
          checkBudgetLifecycle(
            nextId,
            budgetName,
            savedBudget,
            freshExpenses,
            currentUser,
          );
        }
      } else {
        // No budgets left — redirect to budget setup
        setActiveBudgetId(null);
        setBudget(null);
        setExpenses([]);
        setScheduledExpenses([]);
        setPendingCycleCompletion(null);
        setAppState("budget-setup");
      }
    }

    toast.success("Budget deleted successfully");
  };

  const deleteArchivedCycle = (archivedAt: string) => {
    if (!currentUser) return;
    const remaining = archivedCycles.filter((c) => c.archivedAt !== archivedAt);
    saveArchivedCycles(currentUser, remaining);
    setArchivedCycles(remaining);
    toast.success("Archived cycle removed");
  };

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

    const vipStatus =
      localStorage.getItem("wiz_vip") ||
      localStorage.getItem(`wiz_vip_${name}`);
    if (vipStatus === "lifetime") setIsVIP(true);

    const savedLang = localStorage.getItem("wiz_language") as Lang;
    if (savedLang) setLanguageState(savedLang);

    const savedCurrency = localStorage.getItem("wiz_currency") as Currency;
    if (savedCurrency) setCurrency(savedCurrency);

    const budgetsRaw = localStorage.getItem(`wiz_budgets_${name}`);
    let budgetList: BudgetEntry[] = [];

    if (!budgetsRaw) {
      const legacyBudget = getBudget(name);
      const defaultId = `${name}_default`;
      const defaultEntry: BudgetEntry = { id: defaultId, name: "Personal" };
      budgetList = [defaultEntry];
      localStorage.setItem(`wiz_budgets_${name}`, JSON.stringify(budgetList));

      if (legacyBudget) {
        saveBudget(defaultId, legacyBudget);
        const legacyExpenses = loadExpenses(name);
        if (legacyExpenses.length > 0) saveExpenses(defaultId, legacyExpenses);
        const legacyScheduled = loadScheduled(name);
        if (legacyScheduled.length > 0)
          saveScheduled(defaultId, legacyScheduled);
      }
    } else {
      try {
        budgetList = JSON.parse(budgetsRaw);
      } catch {
        budgetList = [];
      }
    }

    if (budgetList.length === 0) {
      const defaultId = `${name}_default`;
      budgetList = [{ id: defaultId, name: "Personal" }];
      localStorage.setItem(`wiz_budgets_${name}`, JSON.stringify(budgetList));
    }

    setBudgets(budgetList);

    const savedActiveId = localStorage.getItem(`wiz_active_budget_${name}`);
    const validActive =
      savedActiveId && budgetList.some((b) => b.id === savedActiveId)
        ? savedActiveId
        : budgetList[0].id;
    localStorage.setItem(`wiz_active_budget_${name}`, validActive);
    setActiveBudgetId(validActive);

    const activeBudget = getBudget(validActive);
    if (activeBudget) setBudget(activeBudget);

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

    try {
      const goalRaw = localStorage.getItem(`wiz_goal_${name}`);
      if (goalRaw) setSavingsGoalState(JSON.parse(goalRaw));
    } catch {
      // ignore
    }

    // Load archived cycles
    const archived = loadArchivedCycles(name);
    setArchivedCycles(archived);
    setAuraScore(computeAuraScore(archived));

    // Check budget lifecycle for active budget
    if (activeBudget) {
      const budgetName =
        budgetList.find((b) => b.id === validActive)?.name ?? "Budget";
      checkBudgetLifecycle(
        validActive,
        budgetName,
        activeBudget,
        updatedExpenses,
        name,
      );
    }
  };

  const checkAndShowWhatsNew = () => {
    // Guard: never show the modal if we're running in an unknown version state.
    // APP_VERSION === "dev" means the build-time injection failed; skip silently.
    if (APP_VERSION === "dev") return;
    try {
      const seen = localStorage.getItem("wiz_seen_version");
      if (seen !== APP_VERSION) {
        setShowWhatsNew(true);
      }
    } catch {
      // localStorage unavailable (e.g. private browsing with storage blocked) — skip silently
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
    // Only persist the version if it's a real build timestamp.
    // Writing "dev" or "undefined" here would suppress the modal forever
    // on the next real deploy, which is the worst possible failure mode.
    try {
      if (APP_VERSION !== "dev") {
        localStorage.setItem("wiz_seen_version", APP_VERSION);
      }
    } catch {
      // localStorage write failed — not fatal, modal may re-show next launch
    }
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

  const handleQuickTapExpense = (
    amount: number,
    label: string,
    icon: string,
  ) => {
    const storageKey = activeBudgetId ?? currentUser;
    if (!storageKey) return;
    const today = new Date().toISOString().split("T")[0];
    const expense: Expense = {
      id: `qt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      amount,
      currency: currency as unknown as ExpenseCurrency,
      category: label,
      notes: "Quick tap",
      date: today,
      paymentMethod: "Cash",
    };
    setExpenses((prev) => {
      const next = [expense, ...prev];
      saveExpenses(storageKey, next);
      return next;
    });
    toast.success(
      `${icon} ${label} — ${getCurrencySymbol(currency)}${amount} logged`,
      { duration: 2000 },
    );
  };

  const handleDeleteExpense = (id: string) => {
    const storageKey = activeBudgetId ?? currentUser;
    if (!storageKey) return;
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveExpenses(storageKey, next);
      return next;
    });
  };

  const handleEditExpense = (
    id: string,
    updates: { amount: number; category: string; notes: string },
  ) => {
    const storageKey = activeBudgetId ?? currentUser;
    if (!storageKey) return;
    setExpenses((prev) => {
      const next = prev.map((e) =>
        e.id === id
          ? {
              ...e,
              amount: updates.amount,
              category: updates.category,
              notes: updates.notes,
            }
          : e,
      );
      saveExpenses(storageKey, next);
      return next;
    });
  };
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
            onQuickTapExpense={handleQuickTapExpense}
            onDeleteExpense={handleDeleteExpense}
            onEditExpense={handleEditExpense}
            auraScore={auraScore}
            onDeleteBudget={deleteBudget}
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
            archivedCycles={archivedCycles}
            onDeleteArchivedCycle={deleteArchivedCycle}
          />
        );
      case "debts":
        return <DebtScreen currentUser={currentUser} currency={currency} />;
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

      {/* Cycle Review Modal — shown above everything including bottom nav */}
      {pendingCycleCompletion && (
        <CycleCompletedModal
          cycle={pendingCycleCompletion}
          auraScore={auraScore}
          onStartNewCycle={handleStartNewCycle}
          lang={language}
        />
      )}

      {/* What's New Carousel — z-index 50 */}
      {!pendingCycleCompletion && showWhatsNew && (
        <WhatsNewCarousel onClose={handleCloseWhatsNew} />
      )}

      {/* SW Update Banner — z-index 60, sits above everything except modals */}
      {showUpdatePrompt && (
        <div
          data-ocid="update.banner"
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: 358,
            zIndex: 60,
            background: "#18181b",
            border: "1px solid #10b981",
            borderRadius: 16,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow:
              "0 0 20px rgba(16,185,129,0.25), 0 4px 20px rgba(0,0,0,0.5)",
            fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>✨</span>
          <p
            style={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              flex: 1,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            A new version is available!
          </p>
          <button
            type="button"
            data-ocid="update.primary_button"
            onClick={handleRefreshNow}
            style={{
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "inherit",
              boxShadow: "0 0 10px rgba(16,185,129,0.4)",
            }}
          >
            Refresh Now
          </button>
        </div>
      )}

      <Toaster position="top-center" />
    </div>
  );
}
