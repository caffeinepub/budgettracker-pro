import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WizUser {
  email: string;
  password: string;
}

interface OnboardingScreenProps {
  onComplete: (email: string) => void;
}

function getUsers(): WizUser[] {
  try {
    return JSON.parse(localStorage.getItem("wiz_users") || "[]");
  } catch {
    return [];
  }
}

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    if (!signUpEmail.includes("@")) {
      setSignUpError("Please enter a valid email address.");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters.");
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setSignUpError("Passwords do not match.");
      return;
    }
    const users = getUsers();
    if (
      users.find((u) => u.email.toLowerCase() === signUpEmail.toLowerCase())
    ) {
      setSignUpError("An account with this email already exists.");
      return;
    }
    users.push({ email: signUpEmail, password: signUpPassword });
    localStorage.setItem("wiz_users", JSON.stringify(users));
    localStorage.setItem("wiz_session", signUpEmail);
    onComplete(signUpEmail);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Hardcoded admin account — always allow
    if (
      loginEmail.toLowerCase() === "admin@aura.com" &&
      loginPassword === "AuraAdmin2026"
    ) {
      localStorage.setItem("wiz_session", loginEmail);
      onComplete(loginEmail);
      return;
    }

    const users = getUsers();
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.toLowerCase() &&
        u.password === loginPassword,
    );
    if (!match) {
      setLoginError("Invalid email or password.");
      return;
    }
    localStorage.setItem("wiz_session", loginEmail);
    onComplete(loginEmail);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 overflow-y-auto py-8"
      style={{ background: "#0a0a0a" }}
      data-ocid="onboarding.page"
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/uploads/IMG_20260323_010002-1.png"
            alt="WIZ"
            style={{
              width: 72,
              filter: "drop-shadow(0 0 14px rgba(220,38,38,0.65))",
            }}
          />
          <p
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 300,
              letterSpacing: "0.15em",
              fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
            }}
          >
            Wealth Insight Zone
          </p>
        </div>

        {/* Social Auth */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            data-ocid="auth.google.button"
            onClick={() => toast("Google sign-in coming soon!")}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.1 0 5.6 1.1 7.6 2.9l5.6-5.6C33.5 3.6 29.1 1.5 24 1.5 14.8 1.5 7 7.4 3.9 15.6l6.6 5.1C12.1 14 17.6 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.7-2.1 5-4.4 6.6l6.8 5.3c4-3.7 6.4-9.2 6.4-15.9z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.5c-.5-1.5-.8-3.2-.8-4.9s.3-3.4.8-4.9l-6.6-5.1C2.5 16.8 1.5 20.3 1.5 24s1 7.2 2.4 10.4l6.6-5.9z"
              />
              <path
                fill="#34A853"
                d="M24 46.5c5.1 0 9.4-1.7 12.5-4.6l-6.8-5.3c-1.7 1.2-3.9 1.9-5.7 1.9-6.4 0-11.9-4.5-13.5-10.6l-6.6 5.9C7 40.6 14.8 46.5 24 46.5z"
              />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            data-ocid="auth.facebook.button"
            onClick={() => toast("Facebook sign-in coming soon!")}
            className="w-full flex items-center justify-center gap-3 font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all text-sm text-white"
            style={{ background: "#1877F2" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "#2a2a2a" }} />
          <span className="text-xs text-white/40 font-medium">
            or continue with email
          </span>
          <div className="flex-1 h-px" style={{ background: "#2a2a2a" }} />
        </div>

        {/* Auth Tabs */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList
            className="w-full mb-4"
            style={{ background: "#1a1a1a", borderRadius: 14 }}
            data-ocid="auth.tab"
          >
            <TabsTrigger
              value="login"
              className="flex-1 data-[state=active]:bg-wiz-red data-[state=active]:text-white rounded-xl"
              data-ocid="auth.login.tab"
            >
              Log In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="flex-1 data-[state=active]:bg-wiz-red data-[state=active]:text-white rounded-xl"
              data-ocid="auth.signup.tab"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Log In */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="login-email"
                  className="text-white/80 text-xs font-medium"
                >
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-ocid="login.email.input"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    color: "#fff",
                    borderRadius: 12,
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-white/80 text-xs font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPass ? "text" : "password"}
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    data-ocid="login.password.input"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      color: "#fff",
                      borderRadius: 12,
                      paddingRight: 40,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {loginError && (
                <p
                  data-ocid="login.error_state"
                  className="text-xs font-medium"
                  style={{ color: "#ef4444" }}
                >
                  {loginError}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="login.submit_button"
                className="w-full font-bold py-5 rounded-2xl bg-emerald hover:bg-emerald-dark text-white"
                style={{ fontSize: 15 }}
              >
                Log In
              </Button>
            </form>
          </TabsContent>

          {/* Sign Up */}
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="signup-email"
                  className="text-white/80 text-xs font-medium"
                >
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-ocid="signup.email.input"
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    color: "#fff",
                    borderRadius: 12,
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="signup-password"
                  className="text-white/80 text-xs font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignUpPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    data-ocid="signup.password.input"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      color: "#fff",
                      borderRadius: 12,
                      paddingRight: 40,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showSignUpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="signup-confirm"
                  className="text-white/80 text-xs font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-confirm"
                    type={showSignUpConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={signUpConfirm}
                    onChange={(e) => setSignUpConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    data-ocid="signup.confirm_password.input"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      color: "#fff",
                      borderRadius: 12,
                      paddingRight: 40,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showSignUpConfirm ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>
              {signUpError && (
                <p
                  data-ocid="signup.error_state"
                  className="text-xs font-medium"
                  style={{ color: "#ef4444" }}
                >
                  {signUpError}
                </p>
              )}
              <Button
                type="submit"
                data-ocid="signup.submit_button"
                className="w-full font-bold py-5 rounded-2xl bg-emerald hover:bg-emerald-dark text-white"
                style={{ fontSize: 15 }}
              >
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
