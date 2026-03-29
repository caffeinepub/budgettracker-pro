import { Briefcase, Camera, GraduationCap, Laptop } from "lucide-react";
import { useRef, useState } from "react";
import { CURRENCIES } from "../utils/currency";
import { type Lang, setLanguage } from "../utils/i18n";

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

const FONT = { fontFamily: "Cairo, 'Plus Jakarta Sans', Inter, sans-serif" };

const INPUT_STYLE: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  color: "#fff",
  borderRadius: 14,
  padding: "14px 16px",
  fontSize: 15,
  outline: "none",
  width: "100%",
  ...FONT,
};

const ROLES = [
  {
    key: "student",
    en_label: "Student",
    ar_label: "طالب",
    en_sub: "Manage allowance",
    ar_sub: "إدارة المصروف",
    icon: <GraduationCap size={26} />,
  },
  {
    key: "employee",
    en_label: "Employee",
    ar_label: "موظف",
    en_sub: "Manage salary",
    ar_sub: "إدارة الراتب",
    icon: <Briefcase size={26} />,
  },
  {
    key: "freelancer",
    en_label: "Intern / Freelancer",
    ar_label: "متدرب / مستقل",
    en_sub: "Manage irregular income",
    ar_sub: "إدارة الدخل غير المنتظم",
    icon: <Laptop size={26} />,
  },
];

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [name, setName] = useState(
    () => localStorage.getItem("wiz_user_name") || "",
  );
  const [nameError, setNameError] = useState("");
  const [avatar, setAvatar] = useState<string | null>(() =>
    localStorage.getItem("wiz_user_avatar"),
  );
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("wiz_language") as Lang) || "en",
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("wiz_currency") || "",
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("wiz_user_role") || "",
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const isAr = lang === "ar";

  const handleLangSelect = (l: Lang) => {
    setLang(l);
    setLanguage(l);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCurrency(val);
    if (val) localStorage.setItem("wiz_currency", val);
  };

  const handleRoleSelect = (key: string) => {
    setRole(key);
    localStorage.setItem("wiz_user_role", key);
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(isAr ? "الرجاء إدخال اسمك" : "Please enter your name");
      return;
    }
    setNameError("");
    localStorage.setItem("wiz_user_name", trimmed);
    if (avatar) localStorage.setItem("wiz_user_avatar", avatar);
    localStorage.setItem("wiz_session", trimmed);
    onComplete(trimmed);
  };

  const sectionLabel: React.CSSProperties = {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    ...FONT,
  };

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: "#0a0a0a", ...FONT }}
      dir={isAr ? "rtl" : "ltr"}
      data-ocid="onboarding.page"
    >
      <div className="flex flex-col items-center w-full max-w-sm mx-auto px-5 py-10 pb-16">
        {/* Logo */}
        <img
          src="/assets/uploads/IMG_20260323_010002-1.png"
          alt="WIZ"
          style={{
            width: 56,
            marginBottom: 28,
            filter: "drop-shadow(0 0 14px rgba(220,38,38,0.65))",
          }}
        />

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-7">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-ocid="onboarding.avatar.upload_button"
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: avatar ? "transparent" : "#151515",
              border: avatar ? "2px solid #dc2626" : "2px dashed #3a3a3a",
              cursor: "pointer",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "border-color 0.2s",
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ textAlign: "center" }}>
                <Camera size={24} color="#555" />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p style={{ color: "#555", fontSize: 12, marginTop: 8, ...FONT }}>
            {isAr ? "إضافة صورة (اختياري)" : "Add Photo (Optional)"}
          </p>
        </div>

        {/* Name Input */}
        <div className="w-full mb-5">
          <label style={sectionLabel} htmlFor="onboarding-name">
            {isAr ? "الاسم" : "Your Name"}
          </label>
          <input
            id="onboarding-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError("");
            }}
            placeholder={isAr ? "أدخل اسمك بالكامل" : "Enter your full name"}
            data-ocid="onboarding.name.input"
            style={{
              ...INPUT_STYLE,
              borderColor: nameError ? "#dc2626" : "#2a2a2a",
            }}
          />
          {nameError && (
            <p
              data-ocid="onboarding.name.error_state"
              style={{
                color: "#ef4444",
                fontSize: 12,
                marginTop: 6,
                ...FONT,
              }}
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Language Toggle */}
        <div className="w-full mb-5">
          <p style={sectionLabel}>{isAr ? "اللغة" : "Language"}</p>
          <div
            style={{
              display: "flex",
              background: "#151515",
              border: "1px solid #2a2a2a",
              borderRadius: 14,
              padding: 4,
              gap: 4,
            }}
          >
            {(["en", "ar"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                data-ocid={`onboarding.lang_${l}.toggle`}
                onClick={() => handleLangSelect(l)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: lang === l ? "#dc2626" : "transparent",
                  color: lang === l ? "#fff" : "rgba(255,255,255,0.4)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                  ...FONT,
                }}
              >
                {l === "en" ? "English" : "العربية"}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Dropdown */}
        <div className="w-full mb-5">
          <label style={sectionLabel} htmlFor="onboarding-currency">
            {isAr ? "العملة الأساسية" : "Primary Currency"}
          </label>
          <select
            id="onboarding-currency"
            value={currency}
            onChange={handleCurrencyChange}
            data-ocid="onboarding.currency.select"
            style={{
              ...INPUT_STYLE,
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: isAr
                ? "12px center"
                : "calc(100% - 14px) center",
              paddingRight: isAr ? "14px" : "36px",
              paddingLeft: isAr ? "36px" : "16px",
              cursor: "pointer",
            }}
          >
            <option value="" disabled>
              {isAr ? "اختر العملة" : "Select Currency"}
            </option>
            {CURRENCIES.map((c) => (
              <option
                key={c.value}
                value={c.value}
                style={{ background: "#1a1a1a", color: "#fff" }}
              >
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Role Cards */}
        <div className="w-full mb-7">
          <p style={sectionLabel}>
            {isAr ? "كيف ستستخدم WIZ؟" : "How will you use WIZ?"}
          </p>
          <div className="flex flex-col gap-3">
            {ROLES.map((r) => {
              const selected = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  data-ocid={`onboarding.role_${r.key}.button`}
                  onClick={() => handleRoleSelect(r.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    background: selected ? "rgba(220,38,38,0.08)" : "#111",
                    border: selected ? "2px solid #dc2626" : "2px solid #222",
                    borderRadius: 16,
                    padding: "14px 16px",
                    cursor: "pointer",
                    textAlign: isAr ? "right" : "left",
                    boxShadow: selected
                      ? "0 0 16px rgba(220,38,38,0.18)"
                      : "none",
                    transition: "all 0.2s",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      color: selected ? "#dc2626" : "#555",
                      flexShrink: 0,
                      transition: "color 0.2s",
                    }}
                  >
                    {r.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 14,
                        margin: 0,
                        ...FONT,
                      }}
                    >
                      {isAr ? r.ar_label : r.en_label}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 12,
                        margin: "3px 0 0",
                        ...FONT,
                      }}
                    >
                      {isAr ? r.ar_sub : r.en_sub}
                    </p>
                  </div>
                  {selected && (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#dc2626",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Enter My Zone Button */}
        <button
          type="button"
          data-ocid="onboarding.enter.button"
          onClick={handleSubmit}
          style={{
            width: "100%",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            padding: "17px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.03em",
            boxShadow: "0 4px 24px rgba(220,38,38,0.35)",
            ...FONT,
          }}
        >
          {isAr ? "دخول منطقتي" : "Enter My Zone"}
        </button>

        {/* Footer */}
        <p
          style={{
            color: "#333",
            fontSize: 11,
            marginTop: 20,
            textAlign: "center",
            ...FONT,
          }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#555" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
