# Wealth Insight Zone (WIZ)

## Current State
VIPUpgrade screen shows a paywall with a 'Subscribe Now' button that triggers a mock upgrade. No promo/invite code system exists. VIP state is stored in React state only (not persisted to localStorage per user account).

## Requested Changes (Diff)

### Add
- Promo code input field and 'Apply' button below the subscription area on the VIP upgrade screen
- Validation logic for hardcoded promo codes: 'AURA-VIP' and 'WIZ2026'
- On valid code: immediately grant lifetime VIP, persist to localStorage keyed by user email, show success message
- On invalid code: show inline error message
- Load VIP status from localStorage on user login (so VIP persists across sessions)

### Modify
- VIPUpgrade component: accept `currentUser` prop, add promo code UI and logic
- App.tsx: pass `currentUser` to VIPUpgrade; load VIP status from localStorage in `initUser`; save VIP to localStorage when granted

### Remove
- Nothing removed

## Implementation Plan
1. Update App.tsx: load `wiz_vip_{email}` from localStorage in `initUser`; persist VIP state when `setIsVIP(true)` is called via promo code; pass `currentUser` to VIPUpgrade
2. Update VIPUpgrade.tsx: add `currentUser` prop; add promo code state, input, Apply button, success/error messages; on valid code call `onUpgrade` and save to localStorage
