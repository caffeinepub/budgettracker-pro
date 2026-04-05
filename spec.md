# WIZ — Custom Budget Duration (Free for All)

## Current State

- `BudgetData` interface: `{ amount, durationLabel, durationDays, startDate? }` — no `endDate` field stored
- `BudgetSetup` full-screen page has a "Custom" option in `VIP_DURATIONS` array, gated behind `!isVIP` lock/toast
- `DurationSelector` component (used in Dashboard budget switcher flow) also has a "Custom" button gated behind VIP
- Both Custom pickers show **Start Date + End Date** inputs when VIP and Custom is selected
- `checkBudgetLifecycle()` in `App.tsx` derives end date by doing `startDate + durationDays` — it does NOT read a stored `endDate`. This means if a custom range doesn't start today, the lifecycle check will be off.
- i18n: `budget_setup_custom_start` / `budget_setup_custom_end` keys exist, but no `duration_custom` label key or date picker wrapper labels exist

## Requested Changes (Diff)

### Add
- `endDate?: string` optional field to `BudgetData` interface in `App.tsx`
- i18n keys: `duration_custom` (EN: "Custom" / AR: "مخصص"), `duration_custom_range` (EN: "Custom Range" / AR: "نطاق مخصص"), `duration_apply` (EN: "Apply" / AR: "تطبيق")
- Lifecycle check logic: if `BudgetData.endDate` is present, use it directly instead of computing from `durationDays`

### Modify
- **`BudgetSetup.tsx`**: Move "Custom" from `VIP_DURATIONS` to its own always-visible option (no lock icon, no VIP toast). Show Start Date + End Date pickers when selected for all users. Compute `durationDays = ceil((endDate - startDate) / 86400000)`. Store `durationLabel = "startDate – endDate"`. Pass `endDate` in the saved `BudgetData`.
- **`DurationSelector.tsx`**: Remove VIP gate from the Custom button entirely. Remove the lock icon and VIP badge overlay. Remove the VIP upgrade dialog trigger when Custom is tapped. Show date pickers for all users when Custom is selected.
- **`App.tsx`** — `checkBudgetLifecycle()`: Change end date derivation to: if `budgetData.endDate` is set, use it; otherwise fall back to `startDate + durationDays`. This ensures custom ranges spanning non-today starts work correctly.
- **`i18n.ts`**: Add the three new keys to both `en` and `ar` dictionaries.

### Remove
- VIP gate, lock icon overlay, and VIP badge on the Custom duration button in both `BudgetSetup.tsx` and `DurationSelector.tsx`
- The `showUpgradeDialog` trigger that fires when a non-VIP user taps Custom in `DurationSelector.tsx`

## Implementation Plan

1. Add `endDate?: string` to `BudgetData` in `App.tsx`
2. Update `checkBudgetLifecycle` to use `budgetData.endDate` when present, fall back to computed end otherwise
3. Update `BudgetSetup.tsx`: remove Custom from VIP array, add it as a free standalone option below the free presets grid, show Start+End date pickers for all users, pass `endDate` in `onComplete` call
4. Update `DurationSelector.tsx`: remove VIP check from `handleCustomClick`, remove lock/VIP badge from Custom button, show date pickers for all users unconditionally when `showCustom` is true
5. Add i18n keys (`duration_custom`, `duration_custom_range`, `duration_apply`) in both EN and AR in `i18n.ts`
6. Use `t()` calls for the Custom label and Apply button text in both components
7. Validate (lint + typecheck + build)
