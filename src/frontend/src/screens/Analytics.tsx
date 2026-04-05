import { Download, FileText, Lock, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ArchivedCycle } from "../App";
import type { Expense } from "../types/expense";
import { getCategoryColor, getCategoryIcon } from "../types/expense";
import { type Currency, getCurrencySymbol } from "../utils/currency";

const RED = "#E50914";

interface AnalyticsProps {
  expenses: Expense[];
  isVIP: boolean;
  onUpgrade: () => void;
  currency: Currency;
  darkMode?: boolean;
  archivedCycles?: ArchivedCycle[];
}

type TimePeriod = "week" | "month" | "custom";

function filterByPeriod(
  expenses: Expense[],
  period: TimePeriod,
  startDate: string,
  endDate: string,
): Expense[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (period === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    const from = weekAgo.toISOString().split("T")[0];
    return expenses.filter((e) => e.date >= from);
  }

  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const from = start.toISOString().split("T")[0];
    return expenses.filter((e) => e.date >= from);
  }

  // custom
  if (startDate && endDate) {
    return expenses.filter((e) => e.date >= startDate && e.date <= endDate);
  }
  return expenses;
}

function computeMonthlyTrend(
  allExpenses: Expense[],
): { month: string; amount: number }[] {
  const months: { month: string; amount: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleString("default", { month: "short" });
    const total = allExpenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === year && ed.getMonth() === month;
      })
      .reduce((s, e) => s + e.amount, 0);
    months.push({ month: label, amount: Math.round(total * 100) / 100 });
  }
  return months;
}

function exportCSV(expenses: Expense[]) {
  const header = [
    "Date",
    "Category",
    "Amount",
    "Currency",
    "Notes",
    "Recurring",
  ].join(",");
  const rows = expenses.map((e) =>
    [
      e.date,
      `"${e.category}"`,
      e.amount.toFixed(2),
      e.currency,
      `"${(e.notes ?? "").replace(/"/g, '""')}"`,
      e.recurring ? "Yes" : "No",
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wiz-expenses-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Custom center label for doughnut
function DonutCenterLabel({
  viewBox,
  total,
  sym,
  darkMode,
}: {
  viewBox?: { cx?: number; cy?: number };
  total: number;
  sym: string;
  darkMode?: boolean;
}) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={cx}
        dy="-6"
        style={{
          fontSize: 11,
          fill: darkMode ? "#9ca3af" : "#6b7280",
          fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
          fontWeight: 500,
        }}
      >
        Total
      </tspan>
      <tspan
        x={cx}
        dy="18"
        style={{
          fontSize: 15,
          fill: darkMode ? "#ffffff" : "#111111",
          fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
          fontWeight: 700,
        }}
      >
        {sym}
        {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
      </tspan>
    </text>
  );
}

// Animated progress bar row
function CategoryRow({
  cat,
  amt,
  pct,
  sym,
  isTop,
  index,
  darkMode,
}: {
  cat: string;
  amt: number;
  pct: number;
  sym: string;
  isTop: boolean;
  index: number;
  darkMode?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 100 + index * 60);
    return () => clearTimeout(timer);
  }, [pct, index]);

  const color = isTop ? RED : getCategoryColor(cat);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: darkMode ? "#e5e7eb" : "#111111",
            fontWeight: 500,
          }}
        >
          {getCategoryIcon(cat)} {cat}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: darkMode ? "#ffffff" : "#111111",
          }}
        >
          {sym}
          {amt.toFixed(2)}
        </span>
        <span
          style={{
            fontSize: 11,
            color: darkMode ? "#6b7280" : "#4b5563",
            width: 36,
            textAlign: "right",
          }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: darkMode ? "#1f1f1f" : "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            backgroundColor: color,
            width: `${width}%`,
            transition: "width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>
    </div>
  );
}

// Custom tooltip for pie (always dark — floating overlay)
function CustomPieTooltip({
  active,
  payload,
  total,
  sym,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  total: number;
  sym: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        color: "#ffffff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {getCategoryIcon(name)} {name}
      </div>
      <div style={{ color: RED, fontWeight: 700, fontSize: 14 }}>
        {sym}
        {value.toFixed(2)}
      </div>
      <div style={{ color: "#9ca3af", marginTop: 2 }}>{pct}% of total</div>
    </div>
  );
}

// Custom tooltip for bar (always dark — floating overlay)
function CustomBarTooltip({
  active,
  payload,
  sym,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  sym: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 12,
        color: "#ffffff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
      }}
    >
      <span style={{ fontWeight: 700, color: RED }}>
        {sym}
        {payload[0].value.toFixed(2)}
      </span>
    </div>
  );
}

export default function Analytics({
  expenses,
  isVIP,
  onUpgrade,
  currency,
  darkMode = false,
  archivedCycles = [],
}: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "insights">("summary");
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCycleIdx, setSelectedCycleIdx] = useState<number | null>(null);
  const sym = getCurrencySymbol(currency);

  // Theme tokens
  const bg = darkMode ? "#0a0a0a" : "#ffffff";
  const cardBg = darkMode ? "#111111" : "#f8f8f8";
  const border = darkMode ? "#1f1f1f" : "#e5e5e5";
  const textPrimary = darkMode ? "#ffffff" : "#111111";
  const textMuted = darkMode ? "#6b7280" : "#4b5563";
  const textSecondary = darkMode ? "#9ca3af" : "#6b7280";
  const inputBg = darkMode ? "#1a1a1a" : "#ffffff";
  const inputBorder = darkMode ? "#333" : "#d1d5db";
  const gridStroke = darkMode ? "rgba(255,255,255,0.1)" : "#d1d5db";
  const axisFill = darkMode ? "#9ca3af" : "#374151";
  const barInactiveFill = darkMode ? "#2a2a2a" : "#d1d5db";
  const tooltipCursor = darkMode
    ? "rgba(255,255,255,0.03)"
    : "rgba(0,0,0,0.04)";
  const colorScheme = darkMode ? "dark" : "light";

  const filtered = filterByPeriod(expenses, period, startDate, endDate);

  const categoryTotals = filtered.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a,
  );
  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const topCategory = sortedCategories[0];

  const pieData = sortedCategories.map(([name, value], i) => ({
    name,
    value,
    fill: i === 0 ? RED : getCategoryColor(name),
  }));

  // Monthly trend (all expenses, not filtered by period)
  const monthlyData = computeMonthlyTrend(expenses);
  const maxMonthIdx = monthlyData.reduce(
    (maxI, cur, i, arr) => (cur.amount > arr[maxI].amount ? i : maxI),
    0,
  );

  // Determine which expenses to use for insights (archived cycle or current)
  const insightsExpenses =
    selectedCycleIdx !== null && archivedCycles[selectedCycleIdx]
      ? archivedCycles[selectedCycleIdx].expenses
      : expenses;

  // Insights all-time category totals (uses insightsExpenses)
  const insightsCategoryTotals = insightsExpenses.reduce<
    Record<string, number>
  >((acc, e) => {
    const cat = e.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {});
  const insightsSortedCategories = Object.entries(insightsCategoryTotals).sort(
    ([, a], [, b]) => b - a,
  );
  const insightsTopCategory = insightsSortedCategories[0];
  const insightsTotalSpent = insightsExpenses.reduce((s, e) => s + e.amount, 0);
  const selectedCycle =
    selectedCycleIdx !== null ? archivedCycles[selectedCycleIdx] : null;

  // Days in the period for avg/day
  let periodDays = 30;
  if (period === "week") periodDays = 7;
  else if (period === "custom" && startDate && endDate) {
    const diff =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000;
    periodDays = Math.max(1, Math.ceil(diff) + 1);
  }

  const avgPerDay = periodDays > 0 ? totalSpent / periodDays : 0;

  const PILL_STYLE = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "8px 0",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    background: active ? RED : "transparent",
    color: active ? "#ffffff" : textMuted,
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "16px 16px 8px",
        minHeight: "100%",
        background: bg,
      }}
      data-ocid="analytics.page"
    >
      {/* Header */}
      <header style={{ paddingTop: 8 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: textPrimary,
            margin: 0,
            letterSpacing: "-0.03em",
            fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
          }}
        >
          Spending Insights
        </h1>
        <p style={{ fontSize: 12, color: textMuted, margin: "4px 0 0" }}>
          Track, analyze, and understand your spending
        </p>
      </header>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 24,
          padding: 4,
          gap: 2,
        }}
        data-ocid="analytics.tab"
      >
        <button
          type="button"
          data-ocid="analytics.summary.tab"
          onClick={() => setActiveTab("summary")}
          style={PILL_STYLE(activeTab === "summary")}
        >
          Summary
        </button>
        <button
          type="button"
          data-ocid="analytics.insights.tab"
          onClick={() => setActiveTab("insights")}
          style={PILL_STYLE(activeTab === "insights")}
        >
          Insights
        </button>
      </div>

      {activeTab === "summary" && (
        <>
          {/* Period filter */}
          <div
            style={{
              display: "flex",
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 24,
              padding: 4,
              gap: 2,
            }}
            data-ocid="analytics.period.tab"
          >
            {(["week", "month", "custom"] as TimePeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                data-ocid={`analytics.period.${p}.tab`}
                onClick={() => setPeriod(p)}
                style={PILL_STYLE(period === p)}
              >
                {p === "week"
                  ? "This Week"
                  : p === "month"
                    ? "This Month"
                    : "Custom Range"}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          {period === "custom" && (
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  htmlFor="analytics-start-date"
                  style={{
                    fontSize: 11,
                    color: textMuted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  id="analytics-start-date"
                  data-ocid="analytics.start_date.input"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 10,
                    color: textPrimary,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                    width: "100%",
                    fontFamily: "inherit",
                    colorScheme,
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <label
                  htmlFor="analytics-end-date"
                  style={{
                    fontSize: 11,
                    color: textMuted,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  id="analytics-end-date"
                  data-ocid="analytics.end_date.input"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 10,
                    color: textPrimary,
                    padding: "10px 12px",
                    fontSize: 13,
                    outline: "none",
                    width: "100%",
                    fontFamily: "inherit",
                    colorScheme,
                  }}
                />
              </div>
            </div>
          )}

          {/* Doughnut Chart */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 20,
              padding: "20px 16px 16px",
            }}
            data-ocid="analytics.chart_point"
          >
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: textPrimary,
                margin: "0 0 12px",
                letterSpacing: "-0.01em",
              }}
            >
              Spending Breakdown
            </h2>
            {pieData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: textMuted,
                  fontSize: 13,
                }}
                data-ocid="analytics.chart_point.empty_state"
              >
                No expenses in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    {/* @ts-ignore */}
                    <DonutCenterLabel
                      total={totalSpent}
                      sym={sym}
                      darkMode={darkMode}
                    />
                  </Pie>
                  <Tooltip
                    content={<CustomPieTooltip total={totalSpent} sym={sym} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            {pieData.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px 14px",
                  marginTop: 8,
                  justifyContent: "center",
                }}
              >
                {pieData.map((entry) => (
                  <div
                    key={entry.name}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: entry.fill,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11, color: textSecondary }}>
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {sortedCategories.length > 0 && (
            <div
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: textPrimary,
                  margin: 0,
                }}
              >
                Category Breakdown
              </h2>
              {sortedCategories.map(([cat, amt], i) => (
                <CategoryRow
                  key={cat}
                  cat={cat}
                  amt={amt}
                  pct={totalSpent > 0 ? (amt / totalSpent) * 100 : 0}
                  sym={sym}
                  isTop={i === 0}
                  index={i}
                  darkMode={darkMode}
                  data-ocid={`analytics.category.item.${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Weekly Wrap-up Card */}
          {topCategory && (
            <div
              style={{
                background: cardBg,
                borderLeft: `4px solid ${RED}`,
                borderRadius: 16,
                padding: "18px 18px 18px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                border: `1px solid ${border}`,
                borderLeftColor: RED,
                borderLeftWidth: 4,
              }}
              data-ocid="analytics.summary.card"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: RED,
                    animation: "pulse 2s infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: RED,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Period Wrap-up
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: textMuted,
                    marginBottom: 2,
                    fontWeight: 500,
                  }}
                >
                  Your Top Spend
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: textPrimary,
                    letterSpacing: "-0.02em",
                    fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                  }}
                >
                  {getCategoryIcon(topCategory[0])} {topCategory[0]}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  borderTop: `1px solid ${border}`,
                  paddingTop: 12,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: textMuted,
                      marginBottom: 2,
                      fontWeight: 500,
                    }}
                  >
                    Total Spent
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: textPrimary,
                    }}
                  >
                    {sym}
                    {totalSpent.toFixed(0)}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    borderLeft: `1px solid ${border}`,
                    borderRight: `1px solid ${border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: textMuted,
                      marginBottom: 2,
                      fontWeight: 500,
                    }}
                  >
                    Transactions
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: textPrimary,
                    }}
                  >
                    {filtered.length}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: textMuted,
                      marginBottom: 2,
                      fontWeight: 500,
                    }}
                  >
                    Avg/Day
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: textPrimary,
                    }}
                  >
                    {sym}
                    {avgPerDay.toFixed(1)}
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: textSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                  borderTop: `1px solid ${border}`,
                  paddingTop: 10,
                }}
              >
                You spent{" "}
                <span style={{ color: RED, fontWeight: 700 }}>
                  {totalSpent > 0
                    ? ((topCategory[1] / totalSpent) * 100).toFixed(0)
                    : 0}
                  %
                </span>{" "}
                of your budget on{" "}
                <span style={{ color: textPrimary, fontWeight: 600 }}>
                  {topCategory[0]}
                </span>{" "}
                — more than any other category.
              </p>
            </div>
          )}

          {/* Export Section */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 20,
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
            data-ocid="analytics.export.card"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={15} color="#10b981" />
              <span
                style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}
              >
                Export Data
              </span>
              {!isVIP && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "rgba(245,158,11,0.15)",
                    color: "#f59e0b",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  VIP
                </span>
              )}
            </div>

            {isVIP ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  data-ocid="analytics.export_csv.button"
                  onClick={() => exportCSV(expenses)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: "#10b981",
                    color: "#ffffff",
                    fontWeight: 700,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  type="button"
                  data-ocid="analytics.export_pdf.button"
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    background: darkMode ? "#1a1a1a" : "#f3f4f6",
                    color: darkMode ? "#e5e7eb" : "#111111",
                    fontWeight: 700,
                    padding: "12px 0",
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  <FileText size={14} /> Export PDF
                </button>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    disabled
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      background: darkMode ? "#1a1a1a" : "#f3f4f6",
                      color: darkMode ? "#4b5563" : "#9ca3af",
                      fontWeight: 700,
                      padding: "12px 0",
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      fontSize: 13,
                      cursor: "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    <Lock size={13} /> Export CSV
                  </button>
                  <button
                    type="button"
                    disabled
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      background: darkMode ? "#1a1a1a" : "#f3f4f6",
                      color: darkMode ? "#4b5563" : "#9ca3af",
                      fontWeight: 700,
                      padding: "12px 0",
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      fontSize: 13,
                      cursor: "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    <Lock size={13} /> Export PDF
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    background: "rgba(245,158,11,0.05)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <p style={{ fontSize: 11, color: textSecondary, margin: 0 }}>
                    <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                      VIP Feature
                    </span>{" "}
                    — Upgrade to export your data
                  </p>
                  <button
                    type="button"
                    data-ocid="analytics.export.upgrade.button"
                    onClick={onUpgrade}
                    style={{
                      background: "#10b981",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontFamily: "inherit",
                    }}
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "insights" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
          data-ocid="analytics.insights.panel"
        >
          {/* Cycle Selector / Time Travel */}
          {archivedCycles && archivedCycles.length > 0 && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: textMuted,
                  marginBottom: 8,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                Time Travel
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                  scrollbarWidth: "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCycleIdx(null)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid",
                    background:
                      selectedCycleIdx === null
                        ? "#10b981"
                        : "rgba(255,255,255,0.04)",
                    borderColor:
                      selectedCycleIdx === null
                        ? "#10b981"
                        : "rgba(255,255,255,0.08)",
                    color: selectedCycleIdx === null ? "#fff" : "#a1a1aa",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  Current
                </button>
                {archivedCycles.map((cycle, idx) => {
                  const label = `${cycle.budgetName} · ${new Date(cycle.endDate).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}`;
                  return (
                    <button
                      key={cycle.archivedAt}
                      type="button"
                      onClick={() => setSelectedCycleIdx(idx)}
                      style={{
                        flexShrink: 0,
                        padding: "6px 14px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        border: "1px solid",
                        background:
                          selectedCycleIdx === idx
                            ? "#dc2626"
                            : "rgba(255,255,255,0.04)",
                        borderColor:
                          selectedCycleIdx === idx
                            ? "#dc2626"
                            : "rgba(255,255,255,0.08)",
                        color: selectedCycleIdx === idx ? "#fff" : "#a1a1aa",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedCycle && (
                <p
                  style={{
                    fontSize: 11,
                    color: textMuted,
                    marginTop: 8,
                    fontStyle: "italic",
                  }}
                >
                  Viewing: {selectedCycle.budgetName} ·{" "}
                  {new Date(selectedCycle.startDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}{" "}
                  –{" "}
                  {new Date(selectedCycle.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}

          {/* 6-Month Trend */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 20,
              padding: "20px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <TrendingUp size={15} color="#10b981" />
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: textPrimary,
                  margin: 0,
                }}
              >
                6-Month Spending Trend
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={monthlyData}
                barSize={22}
                margin={{ top: 4, right: 4, bottom: 0, left: -10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: axisFill,
                    fontFamily: "inherit",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: axisFill,
                    fontFamily: "inherit",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomBarTooltip sym={sym} />}
                  cursor={{ fill: tooltipCursor }}
                />
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={entry.month}
                      fill={i === maxMonthIdx ? RED : barInactiveFill}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p
              style={{
                fontSize: 11,
                color: textMuted,
                margin: "12px 0 0",
                textAlign: "center",
              }}
            >
              Red bar = highest spending month
            </p>
          </div>

          {/* AI Insight Card */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderLeft: `4px solid ${RED}`,
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: RED,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              🤖 Smart Insight
            </span>
            {insightsExpenses.length > 0 && insightsTopCategory ? (
              <p
                style={{
                  fontSize: 13,
                  color: textSecondary,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Your highest spending category overall is{" "}
                <span style={{ color: textPrimary, fontWeight: 600 }}>
                  {getCategoryIcon(insightsTopCategory[0])}{" "}
                  {insightsTopCategory[0]}
                </span>
                . You've logged{" "}
                <span style={{ color: RED, fontWeight: 700 }}>
                  {sym}
                  {insightsTotalSpent.toFixed(0)}
                </span>{" "}
                in total across{" "}
                <span style={{ color: textPrimary, fontWeight: 600 }}>
                  {insightsExpenses.length} transactions
                </span>
                . Consider setting a category-specific budget to stay on track.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: textMuted, margin: 0 }}>
                Add some expenses to unlock personalized insights.
              </p>
            )}
          </div>

          {/* All-time category totals */}
          {insightsExpenses.length > 0 && (
            <div
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: textPrimary,
                  margin: 0,
                }}
              >
                {selectedCycle
                  ? `${selectedCycle.budgetName} — Breakdown`
                  : "All-Time Category Totals"}
              </h2>
              {insightsSortedCategories.map(([cat, amt], i) => {
                return (
                  <CategoryRow
                    key={cat}
                    cat={cat}
                    amt={amt}
                    pct={
                      insightsTotalSpent > 0
                        ? (amt / insightsTotalSpent) * 100
                        : 0
                    }
                    sym={sym}
                    isTop={i === 0}
                    index={i}
                    darkMode={darkMode}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: textMuted,
          paddingBottom: 8,
          paddingTop: 4,
        }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: textMuted }}
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
