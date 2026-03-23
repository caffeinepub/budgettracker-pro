# WIZ by Aura — Multi-Currency Support

## Current State
The app has a hardcoded `$` (USD) symbol on Budget Setup, Dashboard progress ring, expense list, Analytics, and VIP screens. The Add Expense screen has a per-expense currency selector but it does not affect global display. There is no global currency setting.

## Requested Changes (Diff)

### Add
- A `currency` state in App.tsx (type `'EGP' | 'USD' | 'EUR' | 'SAR'`) loaded from `localStorage` key `wiz_currency`, defaulting to `USD`.
- A `setCurrency` function that saves to `localStorage` and updates state.
- A `CurrencySelector` dropdown component (dark-themed, matches the app's `#141414` card style) with four options: EGP (ج.م), USD ($), EUR (€), SAR (ر.س).
- Currency selector added to **BudgetSetup** screen (below the amount input, above the duration selector).
- Currency selector added to **Edit Budget** flow (same BudgetSetup component used for editing).

### Modify
- Pass `currency` and `onCurrencyChange` props down from App.tsx to: `BudgetSetup`, `Dashboard`, `Analytics`, `VIPUpgrade`.
- **Dashboard**: Replace all hardcoded `$` symbols with the correct currency symbol based on the selected currency. This includes the progress ring center text, Total Budget card, Remaining card, expense list amounts, and the VIP upgrade banner price reference.
- **Analytics**: Replace hardcoded `$` symbols with the correct currency symbol.
- **VIPUpgrade**: Replace hardcoded `$` in budget-related displays with the correct currency symbol (subscription price stays in USD as it is a real payment price).
- **BudgetSetup**: Replace the hardcoded `$` prefix in the amount input with the selected currency symbol dynamically. Show currency next to the "Budget set to" confirmation line.

### Remove
- Hardcoded `$` prefixes in budget/expense displays across all screens (replaced by dynamic symbol).

## Implementation Plan
1. Create a `CURRENCIES` constant and a `getCurrencySymbol(currency)` helper in a shared `utils/currency.ts` file.
2. Add `currency` state to `App.tsx`, load from `localStorage`, pass to relevant screens.
3. Add `CurrencySelector` inline in `BudgetSetup.tsx` between amount and duration sections.
4. Update `BudgetSetup` props interface to accept `currency` + `onCurrencyChange`.
5. Update `Dashboard` props interface; replace all `$` with `getCurrencySymbol(currency)`.
6. Update `Analytics` and `VIPUpgrade` props interfaces; replace budget-display `$` symbols.
7. Ensure currency persists independently of user session (global `wiz_currency` key, not per-user), but can also be stored per-user if needed — global is fine for this feature.
