# BudgetTracker Pro (WIZ)

## Current State
- App has Dashboard, AddExpense, Analytics, LinkedCards, VIPUpgrade screens
- No splash screen or onboarding flow
- AddExpense has no duration/timeframe selector
- No Set Budget screen exists yet (budget is hardcoded)
- isVIP state toggles premium features

## Requested Changes (Diff)

### Add
- SplashScreen component: matte black background, WIZ logo (/assets/uploads/IMG_20260323_010002-1.png) centered with soft red glow, "Wealth Insight Zone" subtitle in white below logo, displays 2 seconds then routes to Onboarding (new user) or Dashboard (returning user)
- OnboardingScreen: simple login/welcome screen for new users with a "Continue" button that marks user as returning
- Duration/Timeframe Selector component (reusable): quick options "1 Week", "2 Weeks", "1 Month" (free), "3 Months", "6 Months", "1 Year", "Custom" (VIP only). Free users see lock icon on VIP options with upgrade prompt modal
- Custom timeframe uses start date + end date calendar picker
- Pro-rated budget calculations: given total budget + duration, compute daily/weekly/monthly spending limits and display them
- VIP upgrade prompt modal/popup when free user taps a locked duration option

### Modify
- App.tsx: add splash screen state (showing/shown), onboarding state (isNewUser), route through splash -> onboarding (if new) -> dashboard
- AddExpense screen: add Duration/Timeframe Selector section, pass isVIP prop, show pro-rated limits when duration + amount are both set
- Dashboard: pass isVIP to AddExpense

### Remove
- Nothing removed

## Implementation Plan
1. Create SplashScreen.tsx with WIZ logo, red glow CSS, "Wealth Insight Zone" text, 2s timer
2. Create OnboardingScreen.tsx for new user welcome/login placeholder
3. Create DurationSelector.tsx reusable component with free/VIP gating and custom date picker
4. Add VIPUpgradeModal.tsx (or inline dialog) triggered when free user taps locked option
5. Update AddExpense.tsx to include DurationSelector, accept isVIP prop, show pro-rated budget stats
6. Update App.tsx to manage splash -> onboarding -> main app flow, pass isVIP to AddExpense
