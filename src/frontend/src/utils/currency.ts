export type Currency = "USD" | "EGP" | "EUR" | "SAR";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] =
  [
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "EGP", label: "EGP (ج.م)", symbol: "ج.م" },
    { value: "EUR", label: "EUR (€)", symbol: "€" },
    { value: "SAR", label: "SAR (ر.س)", symbol: "ر.س" },
  ];

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol ?? "$";
}
