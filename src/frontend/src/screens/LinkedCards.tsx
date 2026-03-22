import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Crown, Lock, Plus, Shield } from "lucide-react";

interface LinkedCardsProps {
  isVIP: boolean;
  aiTrackingEnabled: boolean;
  onToggleAI: (val: boolean) => void;
  onUpgrade: () => void;
}

const MOCK_CARDS = [
  {
    gradient: "card-gradient-charcoal",
    bank: "Chase",
    last4: "4532",
    type: "Visa",
    name: "John D.",
  },
  {
    gradient: "card-gradient-emerald",
    bank: "Citi",
    last4: "7891",
    type: "Mastercard",
    name: "John D.",
  },
  {
    gradient: "card-gradient-navy",
    bank: "Barclays",
    last4: "3310",
    type: "Visa",
    name: "John D.",
  },
];

function CreditCardViz({ card }: { card: (typeof MOCK_CARDS)[0] }) {
  return (
    <div
      className={`${card.gradient} rounded-2xl p-5 flex flex-col gap-6 flex-shrink-0`}
      style={{ width: 240, height: 140 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
            {card.bank}
          </p>
          <p className="text-white font-bold text-sm">{card.type}</p>
        </div>
        <div className="w-8 h-8 bg-white/20 rounded-full" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/60 text-[10px] mb-0.5">Card Number</p>
          <p className="text-white font-bold tracking-widest text-sm">
            •••• •••• •••• {card.last4}
          </p>
        </div>
        <p className="text-white/80 text-xs font-medium">{card.name}</p>
      </div>
    </div>
  );
}

export default function LinkedCards({
  isVIP,
  aiTrackingEnabled,
  onToggleAI,
  onUpgrade,
}: LinkedCardsProps) {
  if (!isVIP) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-fade-in"
        data-ocid="cards.locked.card"
      >
        <div className="bg-card rounded-3xl shadow-card p-8 flex flex-col items-center gap-5 w-full">
          <div className="w-20 h-20 bg-charcoal/5 rounded-full flex items-center justify-center">
            <Lock size={36} className="text-charcoal" />
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-vip/10 text-vip border border-vip/20 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Crown size={10} /> VIP ONLY
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Card Management
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Upgrade to VIP to link your credit &amp; debit cards and enable
              automatic expense tracking.
            </p>
          </div>
          <button
            type="button"
            data-ocid="cards.upgrade.primary_button"
            onClick={onUpgrade}
            className="w-full bg-emerald text-white font-bold py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all"
          >
            Go VIP — $2.50/mo
          </button>
          <p className="text-xs text-muted-foreground">
            Unlock all premium features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 animate-fade-in"
      data-ocid="cards.page"
    >
      <header className="pt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Linked Cards</h1>
          <span className="bg-vip/10 text-vip text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Crown size={10} /> VIP
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Manage your connected cards
        </p>
      </header>

      <div className="bg-card rounded-3xl shadow-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Your Cards</h2>
        <div className="flex gap-3 overflow-x-auto pb-2" data-ocid="cards.list">
          {MOCK_CARDS.map((card) => (
            <div key={card.last4} data-ocid={`cards.item.${card.last4}`}>
              <CreditCardViz card={card} />
            </div>
          ))}
        </div>
        <button
          type="button"
          data-ocid="cards.add_card.button"
          className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-border text-muted-foreground text-sm font-semibold py-3 rounded-2xl hover:border-emerald hover:text-emerald transition-all"
        >
          <Plus size={16} /> Add New Card
        </button>
      </div>

      <div className="bg-card rounded-3xl shadow-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-sm font-bold text-foreground">
                AI Payment Tracking
              </p>
              <span className="text-[10px] bg-emerald/10 text-emerald font-bold px-1.5 py-0.5 rounded-md">
                NEW
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically detect payments from SMS &amp; notifications
            </p>
          </div>
          <Switch
            data-ocid="cards.ai_tracking.switch"
            checked={aiTrackingEnabled}
            onCheckedChange={onToggleAI}
            className="data-[state=checked]:bg-emerald mt-0.5"
          />
        </div>
        {aiTrackingEnabled && (
          <div className="mt-3 bg-emerald/5 border border-emerald/20 rounded-xl p-3">
            <p className="text-xs text-emerald font-semibold">
              ✓ AI Tracking Active — monitoring SMS &amp; notifications
            </p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-3xl shadow-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-emerald" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            Bank-Grade Security
          </p>
          <p className="text-xs text-muted-foreground">
            256-bit encrypted · Read-only access · PCI DSS compliant
          </p>
        </div>
      </div>

      <Label className="sr-only">
        Enable AI Payment Tracking from SMS/Notifications
      </Label>
    </div>
  );
}
