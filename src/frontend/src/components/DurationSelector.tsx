import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useState } from "react";

export type DurationValue =
  | { type: "preset"; label: string; days: number }
  | { type: "custom"; startDate: string; endDate: string; days: number };

interface DurationSelectorProps {
  isVIP: boolean;
  value: DurationValue | null;
  onChange: (v: DurationValue | null) => void;
  onUpgradeRequest: () => void;
}

const PRESETS = [
  { label: "1 Week", days: 7, vip: false },
  { label: "2 Weeks", days: 14, vip: false },
  { label: "1 Month", days: 30, vip: false },
  { label: "3 Months", days: 90, vip: true },
  { label: "6 Months", days: 180, vip: true },
  { label: "1 Year", days: 365, vip: true },
];

export default function DurationSelector({
  isVIP,
  value,
  onChange,
  onUpgradeRequest,
}: DurationSelectorProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isCustomSelected = value?.type === "custom";

  const handlePreset = (preset: (typeof PRESETS)[0]) => {
    if (preset.vip && !isVIP) {
      setShowUpgradeDialog(true);
      return;
    }
    setShowCustom(false);
    if (value?.type === "preset" && value.label === preset.label) {
      onChange(null);
    } else {
      onChange({ type: "preset", label: preset.label, days: preset.days });
    }
  };

  const handleCustomClick = () => {
    if (!isVIP) {
      setShowUpgradeDialog(true);
      return;
    }
    setShowCustom(true);
    onChange(null);
  };

  const handleCustomApply = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) return;
    const days = Math.ceil((end - start) / 86400000);
    onChange({ type: "custom", startDate, endDate, days });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => {
            const locked = preset.vip && !isVIP;
            const selected =
              value?.type === "preset" && value.label === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                data-ocid={`duration.${preset.label.toLowerCase().replace(/ /g, "_")}.toggle`}
                onClick={() => handlePreset(preset)}
                className={`relative flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold border transition-all ${
                  selected
                    ? "bg-emerald text-white border-emerald shadow-emerald"
                    : locked
                      ? "bg-background text-muted-foreground border-border opacity-60"
                      : "bg-background text-body border-border hover:border-emerald/40"
                }`}
              >
                {locked && (
                  <Lock
                    size={10}
                    className="absolute top-1.5 right-1.5 text-muted-foreground"
                  />
                )}
                <span>{preset.label}</span>
                {locked && (
                  <span className="text-[10px] text-yellow-500 font-bold">
                    VIP
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom button */}
          <button
            type="button"
            data-ocid="duration.custom.toggle"
            onClick={handleCustomClick}
            className={`relative flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold border transition-all ${
              isCustomSelected
                ? "bg-emerald text-white border-emerald shadow-emerald"
                : !isVIP
                  ? "bg-background text-muted-foreground border-border opacity-60"
                  : "bg-background text-body border-border hover:border-emerald/40"
            }`}
          >
            {!isVIP && (
              <Lock
                size={10}
                className="absolute top-1.5 right-1.5 text-muted-foreground"
              />
            )}
            <span>Custom</span>
            {!isVIP && (
              <span className="text-[10px] text-yellow-500 font-bold">VIP</span>
            )}
          </button>
        </div>

        {/* Custom date pickers */}
        {showCustom && isVIP && (
          <div className="flex flex-col gap-3 p-3 rounded-xl bg-background border border-border">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">
                Start Date
              </Label>
              <Input
                data-ocid="duration.start_date.input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border-border"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input
                data-ocid="duration.end_date.input"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border-border"
              />
            </div>
            <Button
              data-ocid="duration.apply_custom.button"
              onClick={handleCustomApply}
              disabled={!startDate || !endDate || endDate <= startDate}
              className="w-full bg-emerald text-white rounded-xl hover:bg-emerald-dark"
            >
              Apply Custom Range
            </Button>
          </div>
        )}
      </div>

      {/* VIP Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent
          data-ocid="duration.vip_upgrade.dialog"
          className="rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle>VIP Feature 👑</DialogTitle>
            <DialogDescription>
              Budgets longer than 1 month are exclusive to VIP members. Upgrade
              for just $2.50/month to unlock extended timeframes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              data-ocid="duration.vip_cancel.cancel_button"
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="duration.vip_upgrade.confirm_button"
              className="bg-emerald text-white hover:bg-emerald-dark"
              onClick={() => {
                setShowUpgradeDialog(false);
                onUpgradeRequest();
              }}
            >
              Upgrade to VIP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
