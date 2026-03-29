import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Globe, Moon, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { type Lang, useLanguage } from "../utils/i18n";
import { requestNotificationPermission } from "../utils/notifications";

interface SettingsScreenProps {
  currentUser: string | null;
  darkMode: boolean;
  onToggleDark: () => void;
  remindersEnabled: boolean;
  onToggleReminders: () => void;
  onBack: () => void;
  onLanguageChange: (lang: Lang) => void;
  language: Lang;
}

export default function SettingsScreen({
  currentUser,
  darkMode,
  onToggleDark,
  remindersEnabled,
  onToggleReminders,
  onBack,
  onLanguageChange,
  language,
}: SettingsScreenProps) {
  const { t, isRTL } = useLanguage();
  const avatarSrc = localStorage.getItem("wiz_user_avatar");

  const handleToggleReminders = async () => {
    const next = !remindersEnabled;
    if (next) {
      if ("Notification" in window) {
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission === "granted") {
          onToggleReminders();
          toast.success("Daily reminders enabled!");
        } else {
          toast.error(
            "Enable notifications in your browser settings to receive daily reminders",
          );
          return;
        }
      } else {
        onToggleReminders();
        toast.success("In-app daily reminders enabled!");
      }
    } else {
      onToggleReminders();
      toast("Daily reminders disabled");
    }
  };

  const notifPermission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied";

  return (
    <div
      className="flex flex-col gap-5 p-4 pt-10 animate-fade-in"
      data-ocid="settings.page"
      style={{ fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif" }}
    >
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="settings.back.button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft
            size={20}
            className="text-foreground"
            style={{ transform: isRTL ? "scaleX(-1)" : undefined }}
          />
        </button>
        <h1 className="text-xl font-bold text-foreground">
          {t("settings_title")}
        </h1>
      </header>

      {/* Account Info */}
      <section
        className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3"
        data-ocid="settings.account.card"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {t("settings_account")}
        </p>
        <div className="flex items-center gap-3">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(220,38,38,0.4)",
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald/15 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-emerald" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {currentUser ?? "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">Logged in</p>
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {t("settings_language")}
        </p>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <Globe size={16} className="text-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground flex-1">
            {t("settings_language")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="settings.lang_en.button"
            onClick={() => onLanguageChange("en")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              border: `2px solid ${language === "en" ? "#dc2626" : "#2a2a2a"}`,
              background:
                language === "en" ? "rgba(220,38,38,0.1)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🇺🇸 English
          </button>
          <button
            type="button"
            data-ocid="settings.lang_ar.button"
            onClick={() => onLanguageChange("ar")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              border: `2px solid ${language === "ar" ? "#dc2626" : "#2a2a2a"}`,
              background:
                language === "ar" ? "rgba(220,38,38,0.1)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🇸🇦 العربية
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {t("settings_notifications")}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <Bell size={16} className="text-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("settings_notifications")}
            </p>
            <p className="text-xs text-muted-foreground">
              {notifPermission === "granted"
                ? "✅ Notifications Enabled"
                : notifPermission === "denied"
                  ? "❌ Blocked in browser settings"
                  : "Get daily spending nudges"}
            </p>
          </div>
          {notifPermission === "default" && (
            <button
              type="button"
              data-ocid="settings.enable_notifications.button"
              onClick={async () => {
                const result = await requestNotificationPermission();
                if (result === "granted")
                  toast.success("Notifications enabled!");
                else toast.error("Permission denied");
              }}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {t("settings_notif_enable")}
            </button>
          )}
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Preferences
        </p>
        {/* Dark Mode */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Moon size={16} className="text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("settings_theme")}
              </p>
              <p className="text-xs text-muted-foreground">Matte black theme</p>
            </div>
          </div>
          <Switch
            data-ocid="settings.dark_mode.switch"
            checked={darkMode}
            onCheckedChange={onToggleDark}
          />
        </div>
        <div className="border-t border-border" />
        {/* Daily Reminders */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Bell size={16} className="text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("settings_notifications")}
              </p>
              <p className="text-xs text-muted-foreground">
                Get a nudge to log expenses
              </p>
            </div>
          </div>
          <Switch
            data-ocid="settings.reminders.switch"
            checked={remindersEnabled}
            onCheckedChange={handleToggleReminders}
          />
        </div>
      </section>

      {/* Security */}
      <section className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Security
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center">
            <ShieldCheck size={16} className="text-emerald" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Data Protection Active
            </p>
            <p className="text-xs text-muted-foreground">
              Input sanitization &amp; route guards enabled
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center pb-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-emerald"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
