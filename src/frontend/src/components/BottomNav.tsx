import {
  BarChart2,
  CalendarClock,
  CreditCard,
  Home,
  PlusCircle,
  Star,
} from "lucide-react";
import type { Screen } from "../App";
import { useLanguage } from "../utils/i18n";

interface BottomNavProps {
  current: Screen;
  isVIP: boolean;
  onChange: (screen: Screen) => void;
  scheduledCount?: number;
}

export default function BottomNav({
  current,
  isVIP,
  onChange,
  scheduledCount = 0,
}: BottomNavProps) {
  const { t } = useLanguage();

  const tabs: {
    id: Screen;
    labelKey: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: "dashboard", labelKey: "nav_home", icon: Home },
    { id: "add", labelKey: "nav_add", icon: PlusCircle },
    { id: "upcoming", labelKey: "nav_upcoming", icon: CalendarClock },
    { id: "analytics", labelKey: "nav_analytics", icon: BarChart2 },
    { id: "cards", labelKey: "cards_title", icon: CreditCard },
    { id: "vip", labelKey: "vip_title", icon: Star },
  ];

  return (
    <nav
      data-ocid="bottom_nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-card border-t border-border z-50"
      style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = current === tab.id;
          const isVIPTab = tab.id === "vip";
          const isCardsTab = tab.id === "cards";
          const isUpcomingTab = tab.id === "upcoming";
          return (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-emerald"
                  : isVIPTab && !isVIP
                    ? "text-vip"
                    : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={18} className={isActive ? "text-emerald" : ""} />
                {isCardsTab && !isVIP && (
                  <span className="absolute -top-1 -right-1 text-[8px]">
                    🔒
                  </span>
                )}
                {isUpcomingTab && scheduledCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1 rounded-full"
                    style={{
                      background: "#818cf8",
                      color: "#fff",
                      minWidth: 14,
                      textAlign: "center",
                    }}
                  >
                    {scheduledCount > 99 ? "99+" : scheduledCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-semibold tracking-wide ${
                  isActive
                    ? "text-emerald"
                    : isVIPTab && !isVIP
                      ? "text-vip"
                      : ""
                }`}
              >
                {t(tab.labelKey as Parameters<typeof t>[0])}
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
