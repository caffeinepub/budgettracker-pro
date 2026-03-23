import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Mail, Moon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface SettingsScreenProps {
  currentUser: string | null;
  darkMode: boolean;
  onToggleDark: () => void;
  remindersEnabled: boolean;
  onToggleReminders: () => void;
  onBack: () => void;
}

export default function SettingsScreen({
  currentUser,
  darkMode,
  onToggleDark,
  remindersEnabled,
  onToggleReminders,
  onBack,
}: SettingsScreenProps) {
  const handleToggleReminders = async () => {
    const next = !remindersEnabled;
    if (next) {
      // Request permission if not already granted
      if ("Notification" in window) {
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission === "granted") {
          // Fire test notification
          new Notification("WIZ Reminder 💰", {
            body: "Don't forget to log your expenses today!",
            icon: "/assets/uploads/IMG_20260323_010002-1.png",
          });
          onToggleReminders();
          toast.success("Daily reminders enabled!");
        } else {
          toast.error(
            "Enable notifications in your browser settings to receive daily reminders",
          );
          return; // Don't toggle on if permission denied
        }
      } else {
        // Browser doesn't support notifications, still allow toggle as in-app
        onToggleReminders();
        toast.success("In-app daily reminders enabled!");
      }
    } else {
      onToggleReminders();
      toast("Daily reminders disabled");
    }
  };

  return (
    <div
      className="flex flex-col gap-5 p-4 pt-10 animate-fade-in"
      data-ocid="settings.page"
    >
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="settings.back.button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </header>

      {/* Account Info */}
      <section
        className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-3"
        data-ocid="settings.account.card"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Account
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald/15 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-emerald" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {currentUser ?? "Not logged in"}
            </p>
            <p className="text-xs text-muted-foreground">Logged-in account</p>
          </div>
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
              <p className="text-sm font-semibold text-foreground">Dark Mode</p>
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
                Daily Reminders
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

      {/* App Info */}
      <section className="bg-card rounded-3xl shadow-card p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          About
        </p>
        <p className="text-sm text-foreground font-semibold">
          WIZ — Wealth Insight Zone
        </p>
        <p className="text-xs text-muted-foreground">
          Your data is stored locally on your device and never shared. All
          inputs are sanitized to prevent XSS attacks.
        </p>
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
