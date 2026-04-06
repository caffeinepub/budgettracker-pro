import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DebtEntry } from "../types/expense";
import { getCurrencySymbol } from "../utils/currency";
import type { Currency } from "../utils/currency";
import { useLanguage } from "../utils/i18n";

interface DebtScreenProps {
  currentUser: string | null;
  currency: Currency;
}

function loadDebts(user: string): DebtEntry[] {
  try {
    const raw = localStorage.getItem(`wiz_debts_${user}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDebts(user: string, debts: DebtEntry[]) {
  localStorage.setItem(`wiz_debts_${user}`, JSON.stringify(debts));
}

export default function DebtScreen({ currentUser, currency }: DebtScreenProps) {
  const { t, isRTL } = useLanguage();
  const sym = getCurrencySymbol(currency);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  const [showAddOwedToMe, setShowAddOwedToMe] = useState(false);
  const [showAddOwedByMe, setShowAddOwedByMe] = useState(false);
  const [showSettledOwedToMe, setShowSettledOwedToMe] = useState(false);
  const [showSettledOwedByMe, setShowSettledOwedByMe] = useState(false);

  // Form state — shared between both add forms (only one open at a time)
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");

  useEffect(() => {
    if (currentUser) setDebts(loadDebts(currentUser));
  }, [currentUser]);

  const persist = (updated: DebtEntry[]) => {
    setDebts(updated);
    if (currentUser) saveDebts(currentUser, updated);
  };

  const resetForm = () => {
    setFormName("");
    setFormAmount("");
    setFormNote("");
  };

  const handleAdd = (type: "owed_to_me" | "owed_by_me") => {
    const amt = Number.parseFloat(formAmount);
    if (!formName.trim() || Number.isNaN(amt) || amt <= 0) return;
    const entry: DebtEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      personName: formName.trim(),
      amount: amt,
      note: formNote.trim(),
      settled: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    persist([...debts, entry]);
    resetForm();
    if (type === "owed_to_me") setShowAddOwedToMe(false);
    else setShowAddOwedByMe(false);
    toast.success(t("debts_save"));
  };

  const handleSettle = (id: string) => {
    persist(
      debts.map((d) =>
        d.id === id
          ? {
              ...d,
              settled: true,
              settledAt: new Date().toISOString().split("T")[0],
            }
          : d,
      ),
    );
    toast.success(t("debts_settle"));
  };

  const owedToMeActive = debts.filter(
    (d) => d.type === "owed_to_me" && !d.settled,
  );
  const owedToMeSettled = debts.filter(
    (d) => d.type === "owed_to_me" && d.settled,
  );
  const owedByMeActive = debts.filter(
    (d) => d.type === "owed_by_me" && !d.settled,
  );
  const owedByMeSettled = debts.filter(
    (d) => d.type === "owed_by_me" && d.settled,
  );

  const totalOwedToMe = owedToMeActive.reduce((s, d) => s + d.amount, 0);
  const totalOwedByMe = owedByMeActive.reduce((s, d) => s + d.amount, 0);
  const net = totalOwedToMe - totalOwedByMe;

  const cardStyle: React.CSSProperties = {
    background: "#141414",
    border: "1px solid #2a2a2a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    color: "white",
    padding: "10px 14px",
    fontSize: 14,
    width: "100%",
    fontFamily: "Cairo, Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const renderAddForm = (type: "owed_to_me" | "owed_by_me") => (
    <div
      style={{
        background: "#1a1a1a",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        border: "1px solid #2a2a2a",
      }}
    >
      <input
        style={inputStyle}
        placeholder={t("debts_person_name")}
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        data-ocid="debts.input"
      />
      <input
        style={{ ...inputStyle, marginTop: 8 }}
        type="number"
        placeholder={t("debts_amount")}
        value={formAmount}
        onChange={(e) => setFormAmount(e.target.value)}
        data-ocid="debts.input"
      />
      <input
        style={{ ...inputStyle, marginTop: 8 }}
        placeholder={t("debts_note")}
        value={formNote}
        onChange={(e) => setFormNote(e.target.value)}
        data-ocid="debts.input"
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          type="button"
          data-ocid="debts.submit_button"
          onClick={() => handleAdd(type)}
          style={{
            flex: 1,
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          {t("debts_save")}
        </button>
        <button
          type="button"
          data-ocid="debts.cancel_button"
          onClick={() => {
            resetForm();
            if (type === "owed_to_me") setShowAddOwedToMe(false);
            else setShowAddOwedByMe(false);
          }}
          style={{
            flex: 1,
            background: "transparent",
            color: "#9ca3af",
            border: "1px solid #3f3f46",
            borderRadius: 10,
            padding: "10px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          {t("debts_cancel")}
        </button>
      </div>
    </div>
  );

  const renderEntry = (entry: DebtEntry, index: number) => (
    <div
      key={entry.id}
      data-ocid={`debts.item.${index + 1}`}
      style={{
        background: "#1f1f1f",
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        border: "1px solid #2a2a2a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}
          >
            {entry.personName}
          </p>
          {entry.note ? (
            <p style={{ color: "#9ca3af", fontSize: 12, margin: "2px 0 0" }}>
              {entry.note}
            </p>
          ) : null}
          <p style={{ color: "#6b7280", fontSize: 11, margin: "4px 0 0" }}>
            {entry.createdAt}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            marginLeft: 12,
          }}
        >
          <span
            style={{
              color: entry.type === "owed_to_me" ? "#10b981" : "#ef4444",
              fontWeight: 800,
              fontSize: 15,
              whiteSpace: "nowrap",
            }}
          >
            {sym}
            {entry.amount.toFixed(2)}
          </span>
          <button
            type="button"
            data-ocid="debts.confirm_button"
            onClick={() => handleSettle(entry.id)}
            style={{
              border: "1px solid #10b981",
              color: "#10b981",
              background: "transparent",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {t("debts_settle")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettledEntry = (entry: DebtEntry) => (
    <div
      key={entry.id}
      style={{
        background: "#141414",
        borderRadius: 12,
        padding: 12,
        marginBottom: 6,
        opacity: 0.5,
        border: "1px solid #2a2a2a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: "#9ca3af",
              fontWeight: 600,
              fontSize: 13,
              margin: 0,
            }}
          >
            ✓ {entry.personName}
          </p>
          {entry.note ? (
            <p style={{ color: "#6b7280", fontSize: 11, margin: "2px 0 0" }}>
              {entry.note}
            </p>
          ) : null}
          {entry.settledAt ? (
            <p style={{ color: "#6b7280", fontSize: 10, margin: "3px 0 0" }}>
              {t("debts_settled_at")}: {entry.settledAt}
            </p>
          ) : null}
        </div>
        <span
          style={{
            color: "#6b7280",
            fontWeight: 700,
            fontSize: 14,
            marginLeft: 12,
            whiteSpace: "nowrap",
          }}
        >
          {sym}
          {entry.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );

  const renderSection = (
    type: "owed_to_me" | "owed_by_me",
    activeEntries: DebtEntry[],
    settledEntries: DebtEntry[],
    showAdd: boolean,
    setShowAdd: (v: boolean) => void,
    showSettled: boolean,
    setShowSettled: (v: boolean) => void,
    sectionTotal: number,
    dotColor: string,
    label: string,
  ) => (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
            {label}
          </span>
          <span
            style={{
              color: dotColor,
              fontWeight: 800,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {sym}
            {sectionTotal.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          data-ocid="debts.open_modal_button"
          onClick={() => {
            resetForm();
            setShowAdd(!showAdd);
          }}
          style={{
            background: "rgba(16,185,129,0.1)",
            color: "#10b981",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {t("debts_add_entry")}
        </button>
      </div>

      {showAdd && renderAddForm(type)}

      {activeEntries.length === 0 && !showAdd ? (
        <p
          data-ocid="debts.empty_state"
          style={{
            color: "#6b7280",
            fontSize: 13,
            textAlign: "center",
            padding: "10px 0",
          }}
        >
          {t("debts_empty")}
        </p>
      ) : null}

      {activeEntries.map((entry, i) => renderEntry(entry, i))}

      {settledEntries.length > 0 ? (
        <div>
          <button
            type="button"
            data-ocid="debts.toggle"
            onClick={() => setShowSettled(!showSettled)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#6b7280",
              fontSize: 12,
              fontWeight: 600,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              fontFamily: "inherit",
            }}
          >
            {showSettled ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {t("debts_settled_section")} ({settledEntries.length})
          </button>
          {showSettled ? settledEntries.map(renderSettledEntry) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        paddingTop: 40,
        paddingBottom: 80,
        paddingLeft: 16,
        paddingRight: 16,
        fontFamily: "Cairo, Inter, sans-serif",
      }}
    >
      <h1
        style={{
          color: "white",
          fontWeight: 800,
          fontSize: 22,
          margin: "0 0 20px",
        }}
      >
        {t("debts_title")}
      </h1>

      {/* Net Balance Card */}
      <div style={{ ...cardStyle, textAlign: "center" }} data-ocid="debts.card">
        <p
          style={{
            color: "#9ca3af",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 6px",
          }}
        >
          {t("debts_net_balance")}
        </p>
        <p
          style={{
            color: net > 0 ? "#10b981" : net < 0 ? "#ef4444" : "#9ca3af",
            fontWeight: 900,
            fontSize: 28,
            margin: 0,
          }}
        >
          {net > 0 ? "+" : net < 0 ? "-" : ""}
          {sym}
          {Math.abs(net).toFixed(2)}
        </p>
        <p
          style={{
            color: net > 0 ? "#10b981" : net < 0 ? "#ef4444" : "#9ca3af",
            fontSize: 12,
            margin: "4px 0 0",
            fontWeight: 600,
          }}
        >
          {net > 0
            ? t("debts_net_positive")
            : net < 0
              ? t("debts_net_negative")
              : t("debts_net_zero")}
        </p>
      </div>

      {renderSection(
        "owed_to_me",
        owedToMeActive,
        owedToMeSettled,
        showAddOwedToMe,
        setShowAddOwedToMe,
        showSettledOwedToMe,
        setShowSettledOwedToMe,
        totalOwedToMe,
        "#10b981",
        t("debts_owed_to_me"),
      )}

      {renderSection(
        "owed_by_me",
        owedByMeActive,
        owedByMeSettled,
        showAddOwedByMe,
        setShowAddOwedByMe,
        showSettledOwedByMe,
        setShowSettledOwedByMe,
        totalOwedByMe,
        "#ef4444",
        t("debts_owed_by_me"),
      )}
    </div>
  );
}
