export type IqdValue = string | number | null | undefined;

const GROUPED_INTEGER_PATTERN = /^\d{1,3}(?:[.,]\d{3})+$/;

/**
 * Converts an Iraqi Dinar value into numeric dinars.
 * Values such as "22.000" and "22,000" are treated as twenty-two thousand,
 * while database values such as "22000.00" remain twenty-two thousand.
 */
export function parseIqdAmount(value: IqdValue): number {
  const raw = String(value ?? "").trim().replace(/\s/g, "");
  if (!raw) return 0;

  const normalized = GROUPED_INTEGER_PATTERN.test(raw)
    ? raw.replace(/[.,]/g, "")
    : raw.replace(/,/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normalizes admin/customer input for decimal database columns without losing
 * Iraqi Dinar grouping. For example, "22.000" becomes "22000.00".
 */
export function normalizeIqdInput(value: IqdValue): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const amount = parseIqdAmount(raw);
  return Number.isFinite(amount) ? amount.toFixed(2) : "";
}

/**
 * Displays Iraqi Dinar as whole dinars with dot-based thousands separators.
 * For example, 22000 and "22000.00" both display as "22.000".
 */
export function formatIqdAmount(value: IqdValue): string {
  const amount = parseIqdAmount(value);
  if (!Number.isFinite(amount)) return "0";

  return new Intl.NumberFormat("en-US", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(Math.round(amount)).replace(/,/g, ".");
}
