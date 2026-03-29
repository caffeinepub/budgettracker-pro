export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

export function hasLoggedExpenseToday(userKey: string): boolean {
  try {
    const raw = localStorage.getItem(`wiz_expenses_${userKey}`);
    if (!raw) return false;
    const expenses = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    return expenses.some((e: { date: string }) => e.date === today);
  } catch {
    return false;
  }
}

export function scheduleDailyReminderViaSW(lang: string) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      // Attempt Periodic Background Sync (Chrome Android only)
      if ("periodicSync" in reg) {
        (
          reg as unknown as {
            periodicSync: {
              register: (
                tag: string,
                opts: { minInterval: number },
              ) => Promise<void>;
            };
          }
        ).periodicSync
          .register("daily-expense-reminder", {
            minInterval: 24 * 60 * 60 * 1000,
          })
          .catch(() => {
            /* not supported */
          });
      }
      // Send message to SW to schedule a timeout-based check
      if (reg.active) {
        reg.active.postMessage({ type: "SCHEDULE_DAILY_REMINDER", lang });
      }
    })
    .catch(() => {
      /* SW not ready */
    });
}

export function triggerImmediateNotificationIfNeeded(
  userKey: string,
  lang: string,
) {
  if (Notification.permission !== "granted") return;
  if (hasLoggedExpenseToday(userKey)) return;

  const msg =
    lang === "ar"
      ? "لا تنسَ تسجيل مصاريف اليوم! 🎯"
      : "Don't forget to track your spending today! 🎯";

  navigator.serviceWorker.ready
    .then((reg) => {
      reg
        .showNotification("WIZ — Daily Reminder", {
          body: msg,
          icon: "/assets/uploads/IMG_20260323_010002-1.png",
          badge: "/assets/uploads/IMG_20260323_010002-1.png",
          tag: "daily-reminder",
        })
        .catch(() => {});
    })
    .catch(() => {
      if (Notification.permission === "granted") {
        new Notification("WIZ — Daily Reminder", {
          body: msg,
          icon: "/assets/uploads/IMG_20260323_010002-1.png",
        });
      }
    });
}
