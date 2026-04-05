# WIZ — Version 34 Spec

## Current State

Version 33 is the current build. It is a fully offline PWA React app (localStorage only, no backend). It has:
- Multiple budget envelopes with a pill switcher on Dashboard
- Quick-Tap expense chips on Dashboard
- Savings Goal card on Dashboard
- Analytics screen (Summary + Insights tabs) with Recharts pie/bar charts
- Service Worker v6 with update-prompt banner in App.tsx
- `APP_VERSION = "v30"` hardcoded in App.tsx, What's New carousel (5 slides)
- `i18n.ts` with `translations.en` and `translations.ar` dictionaries
- BudgetData shape: `{ amount, durationLabel, durationDays }` — NO `startDate`
- Multiple budget entries stored as `wiz_budgets_{user}` array in localStorage
- Per-budget: `wiz_budget_{id}`, `wiz_expenses_{id}`, `wiz_scheduled_{id}`

## Requested Changes (Diff)

### Add
1. **Budget `startDate` field** — Add `startDate: string` (YYYY-MM-DD) to `BudgetData`. When a budget is saved/loaded without `startDate`, default it to today.
2. **Budget lifecycle check** — On `initUser` and on `switchBudget`, after loading budget data, compute `endDate = addDays(startDate, durationDays)`. If `endDate < today` AND budget has a `startDate`, trigger the archive flow instead of silently resetting.
3. **Archive flow** — When cycle is expired:
   a. Build an `ArchivedCycle` object: `{ budgetId, budgetName, startDate, endDate, amount, totalSpent, savedAmount, expenses[], archivedAt }`
   b. Load `wiz_archived_cycles_{user}` from localStorage (array), prepend new cycle, cap at 12 entries, save back.
   c. Do NOT reset the budget automatically. Set a `pendingCycleCompletion` state flag.
4. **Cycle Completed Modal** — Show when `pendingCycleCompletion` is set:
   - Title: "Cycle Completed! 🎉"
   - Shows: budget name, period dates, Total Budget, Total Spent, Amount Saved
   - Primary CTA: "Start New Cycle" — on click: sets `startDate = today` on the budget, clears expenses for that budget ID, saves budget with new startDate, clears `pendingCycleCompletion`
   - Secondary: "View History" — opens Analytics Insights tab
   - Does NOT auto-close; user must act
5. **Historical Insights cycle selector** — In Analytics `insights` tab:
   - Add a horizontal scrollable chip selector: "Current Cycle" + one chip per archived cycle (label = period or budget name + date range)
   - When an archived cycle chip is selected, the Insights tab renders pie chart and stats from `archivedCycle.expenses[]` instead of the live `expenses` prop
   - 6-month trend chart always uses live data
6. **Build-timestamp versioning** — Replace `APP_VERSION = "v30"` with `APP_VERSION = "__BUILD_TS__"` injected at build time via Vite `define`. In `vite.config.ts`, add `define: { '__BUILD_TS__': JSON.stringify(new Date().toISOString()) }`. The What's New modal compares `localStorage.getItem('wiz_seen_version')` against `APP_VERSION` (the timestamp). Since every build has a unique timestamp, the modal fires automatically after every deploy.
7. **Arabic translation completeness** — Add all missing keys to `translations.ar` and `translations.en` for:
   - Quick-Tap chips: `quick_tap_label`, `quick_tap_add`, `quick_tap_placeholder_icon`, `quick_tap_placeholder_label`, `quick_tap_placeholder_amount`, `quick_tap_add_btn`, `quick_tap_cancel`
   - Savings Goal: `savings_goal_title`, `savings_goal_none`, `savings_goal_set`, `savings_goal_name_placeholder`, `savings_goal_target_placeholder`, `savings_goal_save`, `savings_goal_cancel`, `savings_goal_add_funds`, `savings_goal_reached`
   - Analytics: `analytics_summary`, `analytics_insights`, `analytics_spending_breakdown`, `analytics_category_breakdown`, `analytics_period_wrapup`, `analytics_top_spend`, `analytics_total_spent`, `analytics_transactions`, `analytics_avg_day`, `analytics_6month_trend`, `analytics_smart_insight`, `analytics_alltime`, `analytics_start_date`, `analytics_end_date`, `analytics_no_expenses`, `analytics_current_cycle`, `analytics_history_title`, `analytics_red_bar_note`, `analytics_insight_text`, `analytics_no_insight`
   - Budget/Dashboard: `budget_cycle_completed`, `budget_start_new`, `budget_view_history`, `budget_period`, `budget_total_budget`, `budget_total_spent`, `budget_saved`, `budget_no_budget`, `budget_set_budget`, `budget_duration`, `budget_add_expense_btn`, `budget_search_placeholder`, `budget_add`, `budget_cancel`, `budget_create`, `budget_switcher_new_placeholder`, `budget_due_week_count`
   - Modals/misc: `whats_new_title_v34`, `whats_new_close`, `whats_new_next`, `whats_new_skip`, `whats_new_get_started`, `update_available`, `update_refresh`, `settings_export`, `settings_data`
   - Fix all hardcoded English strings in: Dashboard.tsx ("Add Expense", "Add", "Cancel", "Save Goal", etc.), Analytics.tsx (all labels), and any other screens

### Modify
- `App.tsx`: Replace `APP_VERSION = "v30"` with `__BUILD_TS__` define. Add `pendingCycleCompletion` state + `archivedCycles` state. Add `checkBudgetLifecycle()` called after `initUser` and `switchBudget`. Render `CycleCompletedModal` when pending.
- `BudgetData` type: add optional `startDate?: string`
- `BudgetSetup.tsx`: When saving, attach `startDate: today` to the BudgetData object
- `Analytics.tsx`: Add cycle selector chips in Insights tab; accept optional `archivedCycles` prop
- `i18n.ts`: Add all missing keys to both `en` and `ar` dictionaries
- `Dashboard.tsx`: Replace all hardcoded English strings with `t()` calls
- `vite.config.ts`: Add `define: { '__BUILD_TS__': JSON.stringify(new Date().toISOString()) }`

### Remove
- Nothing removed; purely additive changes

## Implementation Plan

1. Update `vite.config.ts` — add `__BUILD_TS__` define and `vite-env.d.ts` declaration
2. Update `i18n.ts` — add ~40 new translation keys to both `en` and `ar` dictionaries
3. Update `types/expense.ts` — add `startDate?` to `BudgetData` (it's in App.tsx, check if duplicated)
4. Update `App.tsx`:
   - Replace `APP_VERSION` with `__BUILD_TS__`
   - Add `ArchivedCycle` interface
   - Add `pendingCycleCompletion` state (holds the archived cycle data to show)
   - Add `checkBudgetLifecycle(budgetId, budgetEntry)` function
   - Call it in `initUser` and `switchBudget` after loading budget
   - Add `CycleCompletedModal` component (inline in App.tsx)
   - Pass `archivedCycles` to Analytics
5. Update `BudgetSetup.tsx` — attach `startDate: today` when calling `onComplete`
6. Update `Analytics.tsx` — add cycle selector in Insights tab, accept + use archived cycle expenses
7. Update `Dashboard.tsx` — replace all hardcoded strings with `t()` calls
