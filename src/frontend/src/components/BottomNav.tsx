import { BarChart2, CreditCard, Home, PlusCircle, Star } from "lucide-react";
import type { Screen } from "../App";

interface BottomNavProps {
  current: Screen;
  isVIP: boolean;
  onChange: (screen: Screen) => void;
}

const tabs: {
  id: Screen;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "add", label: "Add", icon: PlusCircle },
  { id: "analytics", label: "Stats", icon: BarChart2 },
  { id: "cards", label: "Cards", icon: CreditCard },
  { id: "vip", label: "VIP", icon: Star },
];

export default function BottomNav({
  current,
  isVIP,
  onChange,
}: BottomNavProps) {
  return (
    <nav
      data-ocid="bottom_nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-card border-t border-border z-50"
      style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = current === tab.id;
          const isVIPTab = tab.id === "vip";
          const isCardsTab = tab.id === "cards";
          return (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-emerald"
                  : isVIPTab && !isVIP
                    ? "text-vip"
                    : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? "text-emerald" : ""} />
                {isCardsTab && !isVIP && (
                  <span className="absolute -top-1 -right-1 text-[8px]">
                    🔒
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  isActive
                    ? "text-emerald"
                    : isVIPTab && !isVIP
                      ? "text-vip"
                      : ""
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-8 bg-emerald rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
