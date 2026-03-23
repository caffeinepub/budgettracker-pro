import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import type { BudgetData } from "../App";

interface BudgetSetupProps {
  isVIP: boolean;
  onComplete: (budget: BudgetData) => void;
  onUpgrade: () => void;
}

const FREE_DURATIONS = [
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
];

const VIP_DURATIONS = [
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
  { label: "Custom", days: 0 },
];

export default function BudgetSetup({
  isVIP,
  onComplete,
  onUpgrade,
}: BudgetSetupProps) {
  const [amountStr, setAmountStr] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("1 Month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleDurationClick = (label: string, isLocked: boolean) => {
    if (isLocked) {
      toast("Upgrade to VIP to unlock longer durations ✨", {
        action: { label: "Upgrade", onClick: onUpgrade },
      });
      return;
    }
    setSelectedLabel(label);
  };

  const handleSave = () => {
    // Sanitize: trim, validate numeric, prevent negative/zero
    const trimmed = amountStr.trim().replace(/[^0-9.]/g, "");
    const amount = Number.parseFloat(trimmed);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid budget amount.");
      return;
    }

    let days = 0;
    let durationLabel = selectedLabel;

    if (selectedLabel === "Custom") {
      if (!customStart || !customEnd) {
        toast.error("Please select both start and end dates.");
        return;
      }
      const start = new Date(customStart);
      const end = new Date(customEnd);
      if (end <= start) {
        toast.error("End date must be after start date.");
        return;
      }
      days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      durationLabel = `${customStart} – ${customEnd}`;
    } else {
      const all = [...FREE_DURATIONS, ...VIP_DURATIONS];
      const found = all.find((d) => d.label === selectedLabel);
      days = found?.days ?? 30;
    }

    onComplete({ amount, durationLabel, durationDays: days });
  };

  const amount = Number.parseFloat(amountStr);
  const canSave = amount > 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center overflow-y-auto px-6 py-10"
      style={{ background: "#0a0a0a" }}
      data-ocid="budget_setup.page"
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <img
            src="/assets/uploads/IMG_20260323_010002-1.png"
            alt="WIZ"
            style={{
              width: 56,
              filter: "drop-shadow(0 0 12px rgba(220,38,38,0.7))",
            }}
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Set Your Budget
            </h1>
            <p className="text-sm text-white/50 mt-1">Let's get you started</p>
          </div>
        </div>

        {/* Amount Input */}
        <div
          className="rounded-3xl p-5 flex flex-col gap-3"
          style={{ background: "#141414" }}
        >
          <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            Total Budget Amount
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/40">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              data-ocid="budget_setup.amount.input"
              className="text-2xl font-bold pl-9 py-5"
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 28,
                outline: "none",
              }}
            />
          </div>
          {amount > 0 && (
            <p className="text-xs text-emerald-400 font-medium">
              Budget set to ${amount.toFixed(2)}
            </p>
          )}
        </div>

        {/* Duration Selector */}
        <div
          className="rounded-3xl p-5 flex flex-col gap-4"
          style={{ background: "#141414" }}
        >
          <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            Budget Duration
          </Label>

          {/* Free durations */}
          <div className="grid grid-cols-3 gap-2">
            {FREE_DURATIONS.map((d) => (
              <button
                key={d.label}
                type="button"
                data-ocid={`budget_setup.duration.${d.label.toLowerCase().replace(" ", "_")}.button`}
                onClick={() => handleDurationClick(d.label, false)}
                className="py-2.5 px-3 rounded-2xl text-sm font-semibold text-center transition-all active:scale-[0.96]"
                style={{
                  background: selectedLabel === d.label ? "#10b981" : "#1e1e1e",
                  color:
                    selectedLabel === d.label
                      ? "#fff"
                      : "rgba(255,255,255,0.7)",
                  border:
                    selectedLabel === d.label ? "none" : "1px solid #2a2a2a",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* VIP durations */}
          <div className="grid grid-cols-2 gap-2">
            {VIP_DURATIONS.map((d) => {
              const locked = !isVIP;
              const isSelected = selectedLabel === d.label;
              return (
                <button
                  key={d.label}
                  type="button"
                  data-ocid={`budget_setup.duration.${d.label.toLowerCase().replace(" ", "_")}.button`}
                  onClick={() => handleDurationClick(d.label, locked)}
                  className="py-2.5 px-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.96]"
                  style={{
                    background: isSelected ? "#10b981" : "#1e1e1e",
                    color: isSelected
                      ? "#fff"
                      : locked
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(255,255,255,0.7)",
                    border: isSelected ? "none" : "1px solid #2a2a2a",
                  }}
                >
                  {locked && <span>🔒</span>}
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* VIP upgrade hint */}
          {!isVIP && (
            <button
              type="button"
              data-ocid="budget_setup.upgrade.button"
              onClick={onUpgrade}
              className="text-xs text-center font-medium"
              style={{ color: "#f59e0b" }}
            >
              ✨ Unlock 3+ months with VIP — $2.50/mo
            </button>
          )}

          {/* Custom date picker */}
          {selectedLabel === "Custom" && isVIP && (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-white/50">Start Date</Label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  data-ocid="budget_setup.start_date.input"
                  className="rounded-xl px-3 py-2 text-sm font-medium"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    color: "#fff",
                    colorScheme: "dark",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-white/50">End Date</Label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  data-ocid="budget_setup.end_date.input"
                  className="rounded-xl px-3 py-2 text-sm font-medium"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    color: "#fff",
                    colorScheme: "dark",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          type="button"
          data-ocid="budget_setup.save.primary_button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full font-bold py-5 rounded-2xl text-white text-base"
          style={{
            background: canSave ? "#10b981" : "#1a1a1a",
            color: canSave ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          Save Budget &amp; Continue
        </Button>

        <p className="text-xs text-center text-white/30">
          You can always edit your budget from the Dashboard
        </p>
      </div>
    </div>
  );
}
