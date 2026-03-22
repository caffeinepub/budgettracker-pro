import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: (isNewUser: boolean) => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const isNewUser = !localStorage.getItem("wiz_session");
      onComplete(isNewUser);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#0a0a0a" }}
      data-ocid="splash.page"
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/uploads/IMG_20260323_010002-1.png"
          alt="WIZ"
          style={{
            width: 180,
            filter: "drop-shadow(0 0 24px rgba(220,38,38,0.7))",
          }}
        />
        <p
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 300,
            letterSpacing: "0.2em",
            textAlign: "center",
            fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
          }}
        >
          Wealth Insight Zone
        </p>
      </div>
    </div>
  );
}
