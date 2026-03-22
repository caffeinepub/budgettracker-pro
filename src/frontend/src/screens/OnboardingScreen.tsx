import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface WizUser {
  email: string;
  password: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
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
  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  // Log In state
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
    onComplete();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

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
    onComplete();
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
