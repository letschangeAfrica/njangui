/**
 * Cameroon mobile number validation & carrier detection.
 *
 * A Cameroonian national mobile number is 9 digits, always starting with 6.
 * The next 1-2 digits identify the carrier. Extracted from the phone-entry
 * design spec so it's testable independent of the screen that uses it.
 */

export type Carrier = "MTN" | "Orange" | "Camtel" | "Nexttel";

const CARRIER_COLORS: Record<Carrier, string> = {
  MTN: "#B8860B",
  Orange: "#DA5F14",
  Camtel: "#1E7A52",
  Nexttel: "#7A3AB8",
};

const LOW_DIGITS = ["0", "1", "2", "3", "4"];
const HIGH_DIGITS = ["5", "6", "7", "8", "9"];

/** `digits` is the national number only (no +237), e.g. "677001122". */
export function detectCarrier(digits: string): Carrier | null {
  if (digits.length < 3 || digits[0] !== "6") return null;

  const prefix2 = digits.slice(0, 2);
  const third = digits[2];

  if (prefix2 === "67" || (prefix2 === "65" && LOW_DIGITS.includes(third)) || (prefix2 === "68" && LOW_DIGITS.includes(third))) {
    return "MTN";
  }
  if (prefix2 === "69" || (prefix2 === "65" && HIGH_DIGITS.includes(third)) || (prefix2 === "68" && HIGH_DIGITS.includes(third))) {
    return "Orange";
  }
  if (prefix2 === "62") return "Camtel";
  if (prefix2 === "66") return "Nexttel";
  return null;
}

export function carrierColor(carrier: Carrier | null): string {
  return carrier ? CARRIER_COLORS[carrier] : "#6B5D4F";
}

export function isPrefixKnown(digits: string): boolean {
  return digits.length >= 3 && detectCarrier(digits) !== null;
}

export function isValidCameroonianNumber(digits: string): boolean {
  return digits.length === 9 && isPrefixKnown(digits);
}

/** "677001122" → "677 00 11 22" */
export function formatCameroonianNumber(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean)
    .join(" ");
}
