import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: (name: string | null) => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const name = localStorage.getItem("wiz_session");
      onComplete(name);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#0a0a0a" }}
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
            fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
          }}
        >
          Wealth Insight Zone
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Cairo, Plus Jakarta Sans, Inter, sans-serif",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "rgba(255,255,255,0.75)",
            margin: 0,
          }}
        >
          WIZ by{" "}
          <span
            style={{
              fontWeight: 700,
              background:
                "linear-gradient(90deg, #dc2626 0%, #ef4444 60%, #f87171 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Aura
          </span>
        </p>
      </div>
    </div>
  );
}
