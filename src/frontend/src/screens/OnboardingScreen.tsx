import { User } from "lucide-react";
import { useRef, useState } from "react";
import { type Lang, setLanguage } from "../utils/i18n";
import { requestNotificationPermission } from "../utils/notifications";

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

const FONT_STYLE = {
  fontFamily: "Cairo, 'Plus Jakarta Sans', Inter, sans-serif",
};

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: i === step ? "#dc2626" : "#2a2a2a",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [localLang, setLocalLang] = useState<Lang>(
    () => (localStorage.getItem("wiz_language") as Lang) || "en",
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const { t } = (() => {
    const lang = localLang;
    const translations = {
      en: {
        onboarding_welcome: "Welcome to WIZ",
        onboarding_subtitle: "Let's personalize your zone.",
        onboarding_name_label: "Your Name",
        onboarding_name_placeholder: "Enter your full name",
        onboarding_avatar_label: "Add Photo (Optional)",
        onboarding_next: "Next",
        onboarding_language_title: "Choose Your Language",
        onboarding_language_subtitle: "You can change this later in Settings",
        onboarding_notif_title: "Stay on Track",
        onboarding_notif_desc:
          "Allow notifications to get daily reminders to log your expenses.",
        onboarding_notif_allow: "Allow Notifications",
        onboarding_notif_skip: "Skip for Now",
        onboarding_enter: "Enter My Zone",
      },
      ar: {
        onboarding_welcome: "أهلاً بك في WIZ",
        onboarding_subtitle: "يلا نخصص منطقتك.",
        onboarding_name_label: "اسمك",
        onboarding_name_placeholder: "أدخل اسمك بالكامل",
        onboarding_avatar_label: "إضافة صورة (اختياري)",
        onboarding_next: "التالي",
        onboarding_language_title: "اختر لغتك",
        onboarding_language_subtitle: "يمكنك تغييرها لاحقاً من الإعدادات",
        onboarding_notif_title: "ابقَ على المسار",
        onboarding_notif_desc:
          "اسمح بالإشعارات لتصلك تذكيرات يومية لتسجيل مصاريفك.",
        onboarding_notif_allow: "السماح بالإشعارات",
        onboarding_notif_skip: "تخطي الآن",
        onboarding_enter: "دخول منطقتي",
      },
    };
    const dict = lang === "ar" ? translations.ar : translations.en;
    return {
      t: (key: string): string => (dict as Record<string, string>)[key] ?? key,
    };
  })();

  const isRTL = localLang === "ar";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLangSelect = (lang: Lang) => {
    setLocalLang(lang);
    setLanguage(lang);
  };

  const handleComplete = () => {
    const finalName = name.trim() || "Chief";
    localStorage.setItem("wiz_user_name", finalName);
    if (avatar) localStorage.setItem("wiz_user_avatar", avatar);
    localStorage.setItem("wiz_session", finalName);
    onComplete(finalName);
  };

  const inputStyle = {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 15,
    outline: "none",
    width: "100%",
    ...FONT_STYLE,
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-start overflow-y-auto"
      style={{ background: "#0a0a0a", ...FONT_STYLE }}
      dir={isRTL ? "rtl" : "ltr"}
      data-ocid="onboarding.page"
    >
      <div className="flex flex-col items-center w-full max-w-sm px-6 py-10 min-h-screen">
        {/* Logo */}
        <img
          src="/assets/uploads/IMG_20260323_010002-1.png"
          alt="WIZ"
          style={{
            width: 60,
            marginBottom: 20,
            filter: "drop-shadow(0 0 12px rgba(220,38,38,0.6))",
          }}
        />

        <StepDots step={step} />

        {/* Step 0: Name + Avatar */}
        {step === 0 && (
          <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
            <div className="text-center">
              <h1
                style={{
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 800,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_welcome")}
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  marginTop: 6,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_subtitle")}
              </p>
            </div>

            {/* Avatar */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              data-ocid="onboarding.avatar.upload_button"
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: avatar ? "transparent" : "#1a1a1a",
                border: "2px dashed #3a3a3a",
                cursor: "pointer",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
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
                  <User size={28} color="#4a4a4a" />
                  <p
                    style={{
                      color: "#4a4a4a",
                      fontSize: 9,
                      marginTop: 4,
                      ...FONT_STYLE,
                    }}
                  >
                    {t("onboarding_avatar_label")}
                  </p>
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

            <div className="w-full flex flex-col gap-2">
              <label
                htmlFor="onboarding-name"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  fontWeight: 600,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_name_label")}
              </label>
              <input
                type="text"
                placeholder={t("onboarding_name_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                id="onboarding-name"
                data-ocid="onboarding.name.input"
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              data-ocid="onboarding.next.button"
              disabled={!name.trim()}
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                background: name.trim() ? "#dc2626" : "#3a3a3a",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "16px",
                fontSize: 16,
                fontWeight: 700,
                cursor: name.trim() ? "pointer" : "not-allowed",
                marginTop: 4,
                ...FONT_STYLE,
              }}
            >
              {t("onboarding_next")}
            </button>
          </div>
        )}

        {/* Step 1: Language + Notifications */}
        {step === 1 && (
          <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="text-center">
              <h1
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 800,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_language_title")}
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  marginTop: 6,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_language_subtitle")}
              </p>
            </div>

            {/* Language Cards */}
            <div className="flex gap-3">
              {[
                {
                  lang: "en" as Lang,
                  flag: "🇺🇸",
                  label: "English",
                  sub: "English",
                },
                {
                  lang: "ar" as Lang,
                  flag: "🇸🇦",
                  label: "العربية",
                  sub: "Arabic",
                },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.lang}
                  onClick={() => handleLangSelect(opt.lang)}
                  data-ocid={`onboarding.lang_${opt.lang}.button`}
                  style={{
                    flex: 1,
                    background:
                      localLang === opt.lang
                        ? "rgba(220,38,38,0.12)"
                        : "#1a1a1a",
                    border: `2px solid ${
                      localLang === opt.lang ? "#dc2626" : "#2a2a2a"
                    }`,
                    borderRadius: 16,
                    padding: "20px 12px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{opt.flag}</span>
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      ...FONT_STYLE,
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      ...FONT_STYLE,
                    }}
                  >
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Notification Section */}
            <div
              style={{
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: 16,
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 32 }}>🔔</span>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_notif_title")}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_notif_desc")}
              </p>
              <button
                type="button"
                data-ocid="onboarding.allow_notifications.button"
                onClick={async () => {
                  await requestNotificationPermission();
                }}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_notif_allow")}
              </button>
              <button
                type="button"
                data-ocid="onboarding.skip_notifications.button"
                onClick={() => {}}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 12,
                  cursor: "pointer",
                  ...FONT_STYLE,
                }}
              >
                {t("onboarding_notif_skip")}
              </button>
            </div>

            <button
              type="button"
              data-ocid="onboarding.enter.button"
              onClick={() => handleComplete()}
              style={{
                width: "100%",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "16px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                ...FONT_STYLE,
              }}
            >
              {t("onboarding_enter")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
