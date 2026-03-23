import {
  BarChart2,
  Bell,
  Check,
  CreditCard,
  Crown,
  Headphones,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface VIPUpgradeProps {
  isVIP: boolean;
  onUpgrade: () => void;
  onDowngrade: () => void;
  currentUser?: string | null;
}

const VALID_CODES = ["AURA-VIP", "WIZ2026"];

const BENEFITS = [
  {
    id: "card-sync",
    icon: CreditCard,
    text: "Auto card sync — link credit & debit cards",
  },
  { id: "sms", icon: Bell, text: "SMS/notification payment detection" },
  { id: "ai", icon: Zap, text: "AI-powered spending insights" },
  {
    id: "analytics",
    icon: BarChart2,
    text: "Monthly analytics & trend reports",
  },
  { id: "support", icon: Headphones, text: "Priority customer support" },
];

const COMPARISON = [
  { id: "manual", feature: "Manual expense entry", free: true, vip: true },
  { id: "budget", feature: "Weekly budget tracker", free: true, vip: true },
  { id: "pie", feature: "Basic pie chart", free: true, vip: true },
  { id: "link", feature: "Card linking", free: false, vip: true },
  { id: "autosync", feature: "Auto card sync", free: false, vip: true },
  { id: "sms", feature: "SMS tracking", free: false, vip: true },
  { id: "aiinsight", feature: "AI insights", free: false, vip: true },
  { id: "monthly", feature: "Monthly analytics", free: false, vip: true },
];

export default function VIPUpgrade({
  isVIP,
  onUpgrade,
  onDowngrade,
  currentUser,
}: VIPUpgradeProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleApplyPromo = () => {
    if (VALID_CODES.includes(promoCode.toUpperCase().trim())) {
      onUpgrade();
      if (currentUser) {
        localStorage.setItem(`wiz_vip_${currentUser}`, "lifetime");
      }
      setPromoStatus("success");
    } else {
      setPromoStatus("error");
    }
  };

  if (isVIP) {
    return (
      <div
        className="flex flex-col gap-4 p-4 animate-fade-in"
        data-ocid="vip.status.page"
      >
        <div className="upgrade-hero-gradient rounded-3xl p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Crown size={32} className="text-vip" />
          </div>
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">
              Active Subscription
            </p>
            <h1 className="text-2xl font-bold text-white mt-1">
              You&apos;re VIP! 🎉
            </h1>
            <p className="text-white/70 text-sm mt-1">
              $2.50/month · All features unlocked
            </p>
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-card p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">
            Your VIP Benefits
          </h2>
          <ul className="flex flex-col gap-3">
            {BENEFITS.map(({ id, icon: Icon, text }, i) => (
              <li
                key={id}
                data-ocid={`vip.benefit.item.${i + 1}`}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-emerald/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-emerald" />
                </div>
                <span className="text-sm text-body">{text}</span>
                <Check
                  size={14}
                  className="text-emerald ml-auto flex-shrink-0"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card rounded-3xl shadow-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Subscription</p>
              <p className="text-xs text-muted-foreground">
                Next billing: Apr 22, 2026
              </p>
            </div>
            <span className="bg-emerald/10 text-emerald text-xs font-bold px-3 py-1.5 rounded-full">
              Active
            </span>
          </div>
        </div>

        <button
          type="button"
          data-ocid="vip.cancel.button"
          onClick={onDowngrade}
          className="text-muted-foreground text-sm text-center py-2 hover:text-destructive transition-colors"
        >
          Cancel subscription
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 animate-fade-in"
      data-ocid="vip.upgrade.page"
    >
      <div className="upgrade-hero-gradient rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
          <Crown size={32} className="text-vip" />
        </div>
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
            Premium Plan
          </p>
          <h1 className="text-3xl font-black text-white mt-1">Go VIP</h1>
          <p className="text-white/70 text-sm mt-1">
            Unlock the full power of BudgetTracker
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-3">
          <span className="text-4xl font-black text-white">$2.50</span>
          <span className="text-white/70 text-base">/6 months</span>
        </div>
      </div>

      <div className="bg-emerald/5 border border-emerald/20 rounded-3xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">The Key Benefit</p>
            <p className="text-sm text-body mt-1">
              Unlock automatic card linking and phone payment sync —{" "}
              <strong className="text-foreground">No more manual entry!</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-card p-5">
        <h2 className="text-sm font-bold text-foreground mb-4">
          Everything Included
        </h2>
        <ul className="flex flex-col gap-3">
          {BENEFITS.map(({ id, icon: Icon, text }, i) => (
            <li
              key={id}
              data-ocid={`vip.feature.item.${i + 1}`}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-emerald/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-emerald" />
              </div>
              <span className="text-sm text-body flex-1">{text}</span>
              <Check size={14} className="text-emerald flex-shrink-0" />
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card rounded-3xl shadow-card overflow-hidden">
        <div className="grid grid-cols-3 bg-secondary p-3 text-center">
          <p className="text-xs font-semibold text-muted-foreground text-left pl-2">
            Feature
          </p>
          <p className="text-xs font-semibold text-muted-foreground">Free</p>
          <p className="text-xs font-bold text-emerald">VIP ✨</p>
        </div>
        {COMPARISON.map((row, i) => (
          <div
            key={row.id}
            data-ocid={`vip.comparison.item.${i + 1}`}
            className={`grid grid-cols-3 p-3 text-center border-t border-border ${!row.free && row.vip ? "bg-emerald/[0.03]" : ""}`}
          >
            <p className="text-xs text-body text-left">{row.feature}</p>
            <p className="text-sm">
              {row.free ? (
                "✓"
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </p>
            <p className="text-sm text-emerald">{row.vip ? "✓" : "—"}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        data-ocid="vip.subscribe.primary_button"
        onClick={onUpgrade}
        className="w-full bg-emerald text-white font-black text-base py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all"
      >
        Subscribe Now — $2.50/6 months
      </button>

      {/* Promo Code Section */}
      <div
        className="bg-card rounded-3xl shadow-card p-5"
        data-ocid="vip.promo.panel"
      >
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
          Have a promo code?
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            data-ocid="vip.promo.input"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value);
              setPromoStatus("idle");
            }}
            placeholder="Enter code (e.g. AURA-VIP)"
            className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald/40 focus:border-emerald transition-all"
          />
          <button
            type="button"
            data-ocid="vip.promo.submit_button"
            onClick={handleApplyPromo}
            disabled={!promoCode.trim()}
            className="bg-emerald/10 border border-emerald/30 text-emerald text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-emerald hover:text-white active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Apply
          </button>
        </div>
        {promoStatus === "success" && (
          <p
            data-ocid="vip.promo.success_state"
            className="mt-2.5 text-sm text-emerald font-semibold flex items-center gap-1.5"
          >
            <Check size={14} /> Welcome to VIP! Enjoy lifetime access.
          </p>
        )}
        {promoStatus === "error" && (
          <p
            data-ocid="vip.promo.error_state"
            className="mt-2.5 text-sm text-destructive font-medium"
          >
            Invalid promo code. Please try again.
          </p>
        )}
      </div>

      <button
        type="button"
        data-ocid="vip.maybe_later.button"
        className="text-center text-muted-foreground text-sm pb-2 hover:text-body transition-colors"
      >
        Maybe Later
      </button>
    </div>
  );
}
