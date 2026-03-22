interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const handleGetStarted = () => {
    localStorage.setItem("wiz_returning", "1");
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: "#0a0a0a" }}
      data-ocid="onboarding.page"
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <img
          src="/assets/uploads/IMG_20260323_010002-1.png"
          alt="WIZ"
          style={{
            width: 80,
            filter: "drop-shadow(0 0 12px rgba(220,38,38,0.6))",
          }}
        />
        <div className="text-center">
          <h1
            style={{
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 12,
              fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
            }}
          >
            Welcome to Wealth Insight Zone
          </h1>
          <p
            style={{
              color: "#9ca3af",
              fontSize: 15,
              lineHeight: 1.6,
              fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
            }}
          >
            Track your spending, set budgets, and take control of your finances.
          </p>
        </div>
        <button
          type="button"
          data-ocid="onboarding.get_started.primary_button"
          onClick={handleGetStarted}
          className="w-full bg-emerald text-white font-bold py-4 rounded-2xl shadow-emerald hover:bg-emerald-dark active:scale-[0.98] transition-all mt-4"
          style={{ fontSize: 16 }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
