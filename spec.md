# Wealth Insight Zone (WIZ) — Auth Flow

## Current State
- OnboardingScreen has a single 'Get Started' button with no email/password fields.
- SplashScreen routes returning users (localStorage `wiz_returning`) straight to Dashboard, bypassing onboarding.
- No logout mechanism exists. Once `wiz_returning` is set, there is no way to return to the onboarding/login screen.

## Requested Changes (Diff)

### Add
- Sign Up form: email field, password field, confirm password field, 'Create Account' button.
- Log In form: email field, password field, 'Log In' button.
- Tab switcher on OnboardingScreen to toggle between Sign Up and Log In views.
- Mock local auth: store user credentials in localStorage (`wiz_users`) on sign up; validate on log in.
- Logged-in user state stored in localStorage (`wiz_session`), used instead of `wiz_returning`.
- Log Out button in the Dashboard header (visible to all users).
- Logging out clears `wiz_session` and resets app state back to onboarding.

### Modify
- OnboardingScreen: replace 'Get Started' button with Sign Up / Log In tabbed forms.
- SplashScreen: check `wiz_session` instead of `wiz_returning` to decide routing.
- Dashboard: add Log Out button in the header area.
- App.tsx: pass logout handler down to Dashboard; handle session-based routing.

### Remove
- `wiz_returning` localStorage key replaced by `wiz_session`.

## Implementation Plan
1. Update `OnboardingScreen.tsx`: add Sign Up / Log In tabs; email + password inputs; mock auth logic using localStorage.
2. Update `SplashScreen.tsx`: check `wiz_session` for returning user detection.
3. Update `Dashboard.tsx`: add Log Out button in header; accept `onLogout` prop.
4. Update `App.tsx`: pass `onLogout` to Dashboard; logout handler clears session and resets to onboarding.
