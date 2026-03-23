# WIZ by Aura — Version 13

## Current State
Full-featured personal budget tracker (Version 12) built entirely on React + localStorage. All screens are functional: Splash, Onboarding, BudgetSetup, Dashboard, AddExpense, Analytics, LinkedCards, VIPUpgrade, SettingsScreen, AdminPanel. No backend dependency.

## Requested Changes (Diff)

### Add
- **Daily Reminder Banner** on the Dashboard: On mount, check if the current user has any expense with today's date in localStorage. If none found, display a clean, dismissible banner at the top of the Dashboard (below the top controls row) with the message: 'Don't forget to track your spending today, Chief! 🎯'. The banner must have an X/close button. Once dismissed, it should not re-appear for the rest of that calendar day (store dismissal date in localStorage under `wiz_reminder_dismissed_<email>`).

### Modify
- `Dashboard.tsx`: Add the banner logic and UI.
- `App.tsx`: No backend imports — confirm all ICP/actor imports are removed (they should already be absent in V12).

### Remove
- Nothing.

## Implementation Plan
1. In `Dashboard.tsx`, on component mount check if any expense in the `expenses` prop has `date === today`.
2. Also check localStorage `wiz_reminder_dismissed_<currentUser>` — if it equals today's date string, skip the banner.
3. If no expense today and not dismissed today, show the banner.
4. Banner has an X button. On click: save today's date to `wiz_reminder_dismissed_<currentUser>` in localStorage and hide the banner.
5. Pass `currentUser` prop to Dashboard (it is already available in App.tsx via `currentUser` state — add it to Dashboard's props).
