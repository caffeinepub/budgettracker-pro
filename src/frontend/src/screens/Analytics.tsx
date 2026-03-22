import { Crown, Lock, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Expense } from "../types/expense";
import { CATEGORY_COLORS } from "../types/expense";

interface AnalyticsProps {
  expenses: Expense[];
  isVIP: boolean;
  onUpgrade: () => void;
}

const MONTHLY_DATA = [
  { month: "Oct", amount: 142 },
  { month: "Nov", amount: 198 },
  { month: "Dec", amount: 225 },
  { month: "Jan", amount: 167 },
  { month: "Feb", amount: 189 },
  { month: "Mar", amount: 96 },
];

export default function Analytics({
  expenses,
  isVIP,
  onUpgrade,
}: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "insights">("summary");

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const topCategory = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a,
  )[0];

  return (
    <div
      className="flex flex-col gap-4 p-4 animate-fade-in"
      data-ocid="analytics.page"
    >
      <header className="pt-2">
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-xs text-muted-foreground">
          {isVIP ? "VIP Member — Full access" : "Free Plan — Summary view"}
        </p>
      </header>

      {/* Tab switcher */}
      <div
        className="flex bg-secondary rounded-2xl p-1"
        data-ocid="analytics.tab"
      >
        <button
          type="button"
          data-ocid="analytics.summary.tab"
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "summary"
              ? "bg-card shadow-card text-foreground"
              : "text-muted-foreground"
          }`}
        >
          Summary
        </button>
        <button
          type="button"
          data-ocid="analytics.insights.tab"
          onClick={() => (isVIP ? setActiveTab("insights") : onUpgrade())}
          className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "insights"
              ? "bg-card shadow-card text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {!isVIP && <Crown size={12} className="text-vip" />}
          Insights
          {!isVIP && <Lock size={10} className="text-vip" />}
        </button>
      </div>

      {activeTab === "summary" && (
        <>
          <div className="bg-card rounded-3xl shadow-card p-4 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Total Spent
              </p>
              <p className="text-lg font-bold text-foreground">
                ${totalSpent.toFixed(0)}
              </p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-xs text-muted-foreground font-medium">
                Transactions
              </p>
              <p className="text-lg font-bold text-foreground">
                {expenses.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">
                Top Category
              </p>
              <p className="text-sm font-bold text-emerald">
                {topCategory?.[0] ?? "—"}
              </p>
            </div>
          </div>

          <div
            className="bg-card rounded-3xl shadow-card p-4"
            data-ocid="analytics.chart_point"
          >
            <h2 className="text-sm font-bold text-foreground mb-3">
              Spending Breakdown
            </h2>
            {pieData.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          CATEGORY_COLORS[
                            entry.name as keyof typeof CATEGORY_COLORS
                          ] ?? "#6b7280"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const pct = (
                        ((entry.payload as { value: number }).value /
                          totalSpent) *
                        100
                      ).toFixed(0);
                      return `${value} (${pct}%)`;
                    }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card rounded-3xl shadow-card p-4">
            <h2 className="text-sm font-bold text-foreground mb-3">
              By Category
            </h2>
            <ul className="flex flex-col gap-2">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt], i) => (
                  <li
                    key={cat}
                    data-ocid={`analytics.category.item.${i + 1}`}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[
                            cat as keyof typeof CATEGORY_COLORS
                          ] ?? "#6b7280",
                      }}
                    />
                    <span className="flex-1 text-sm text-body">{cat}</span>
                    <span className="text-sm font-bold text-foreground">
                      ${amt.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {((amt / totalSpent) * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}

      {activeTab === "insights" &&
        (isVIP ? (
          <div
            className="flex flex-col gap-4"
            data-ocid="analytics.insights.panel"
          >
            <div className="bg-card rounded-3xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-emerald" />
                <h2 className="text-sm font-bold text-foreground">
                  6-Month Trend
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MONTHLY_DATA} barSize={20}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v: number) => [`$${v}`, "Spent"]} />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-emerald/5 border border-emerald/20 rounded-3xl p-4">
              <p className="text-sm font-semibold text-emerald">
                🤖 AI Insight
              </p>
              <p className="text-sm text-body mt-1">
                Your spending peaked in December. Food &amp; Transportation are
                your top 2 categories — consider setting category-specific
                budgets.
              </p>
            </div>
          </div>
        ) : (
          <div
            data-ocid="analytics.insights.locked.card"
            className="bg-card rounded-3xl shadow-card p-8 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-16 h-16 bg-vip/10 rounded-full flex items-center justify-center">
              <Crown size={28} className="text-vip" />
            </div>
            <div>
              <p className="font-bold text-foreground">VIP Exclusive</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to unlock monthly trend charts and AI-powered spending
                insights.
              </p>
            </div>
            <button
              type="button"
              data-ocid="analytics.insights.upgrade.button"
              onClick={onUpgrade}
              className="bg-emerald text-white font-bold px-6 py-3 rounded-xl shadow-emerald hover:bg-emerald-dark transition-all"
            >
              Upgrade to VIP
            </button>
          </div>
        ))}
    </div>
  );
}
