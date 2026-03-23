import { Crown, LogOut, Receipt, Shield, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AdminPanelProps {
  onLogout: () => void;
}

interface StatConfig {
  key: string;
  label: string;
  storageKey: string;
  icon: React.ReactNode;
}

const STATS: StatConfig[] = [
  {
    key: "totalUsers",
    label: "TOTAL USERS",
    storageKey: "wiz_admin_stat_totalUsers",
    icon: <Users size={20} color="#dc2626" />,
  },
  {
    key: "activeVIPs",
    label: "ACTIVE VIPs",
    storageKey: "wiz_admin_stat_activeVIPs",
    icon: <Crown size={20} color="#dc2626" />,
  },
  {
    key: "totalExpenses",
    label: "TOTAL EXPENSES",
    storageKey: "wiz_admin_stat_totalExpenses",
    icon: <Receipt size={20} color="#dc2626" />,
  },
];

function loadStat(storageKey: string): string {
  return localStorage.getItem(storageKey) || "0";
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [stats, setStats] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const s of STATS) {
      initial[s.key] = loadStat(s.storageKey);
    }
    return initial;
  });

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const s of STATS) {
      initial[s.key] = loadStat(s.storageKey);
    }
    return initial;
  });

  const handleSet = (statKey: string, storageKey: string) => {
    const val = inputs[statKey].trim();
    if (val === "" || Number.isNaN(Number(val))) {
      toast.error("Please enter a valid number.");
      return;
    }
    localStorage.setItem(storageKey, val);
    setStats((prev) => ({ ...prev, [statKey]: val }));
    toast.success("Stat updated.");
  };

  return (
    <div
      data-ocid="admin.panel"
      style={{
        minHeight: "100dvh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#111111",
          borderBottom: "1px solid #1f1f1f",
          padding: "20px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <img
          src="/assets/uploads/IMG_20260323_010002-1.png"
          alt="WIZ"
          style={{
            width: 40,
            height: 40,
            objectFit: "contain",
            filter: "drop-shadow(0 0 8px rgba(220,38,38,0.7))",
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1
              style={{
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: 0,
                fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
              }}
            >
              Admin Control Center
            </h1>
            <span
              data-ocid="admin.panel"
              style={{
                background: "#dc2626",
                color: "#fff",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                padding: "2px 7px",
                borderRadius: 4,
                textTransform: "uppercase",
              }}
            >
              ADMIN
            </span>
          </div>
          <p
            style={{
              color: "#7f1d1d",
              fontSize: 11,
              fontWeight: 500,
              margin: "2px 0 0",
              letterSpacing: "0.04em",
            }}
          >
            WIZ by Aura — Internal
          </p>
        </div>
        <button
          type="button"
          data-ocid="admin.logout.button"
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            color: "#dc2626",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Shield size={14} color="#dc2626" />
          <span
            style={{
              color: "#6b7280",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Platform Statistics
          </span>
        </div>

        {STATS.map((stat) => (
          <div
            key={stat.key}
            data-ocid={`admin.${stat.key}.card`}
            style={{
              background: "#111111",
              border: "1px solid #2a2a2a",
              borderLeft: "4px solid #dc2626",
              borderRadius: 12,
              padding: "18px 16px",
            }}
          >
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {stat.icon}
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </span>
            </div>

            {/* Big Number */}
            <div
              style={{
                color: "#ffffff",
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1,
                fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                letterSpacing: "-0.03em",
                marginBottom: 14,
              }}
            >
              {Number(stats[stat.key]).toLocaleString()}
            </div>

            {/* Input Row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                value={inputs[stat.key]}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [stat.key]: e.target.value }))
                }
                data-ocid={`admin.${stat.key}.input`}
                placeholder="Set value"
                style={{
                  flex: 1,
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#ffffff",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                data-ocid={`admin.${stat.key}.save_button`}
                onClick={() => handleSet(stat.key, stat.storageKey)}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Set
              </button>
            </div>
          </div>
        ))}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "#1f1f1f",
            margin: "8px 0",
          }}
        />

        {/* System Info */}
        <div
          data-ocid="admin.system.panel"
          style={{
            background: "#111111",
            border: "1px solid #1f1f1f",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <p
            style={{
              color: "#4b5563",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            System Info
          </p>
          <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
            Admin: <span style={{ color: "#9ca3af" }}>admin@aura.com</span>
          </p>
          <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
            App: <span style={{ color: "#9ca3af" }}>WIZ by Aura v1.0</span>
          </p>
        </div>

        {/* Footer branding */}
        <p
          style={{
            textAlign: "center",
            color: "#374151",
            fontSize: 11,
            marginTop: 8,
          }}
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#4b5563" }}
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
