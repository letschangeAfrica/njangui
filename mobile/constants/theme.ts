/**
 * Njangui Design System — single source of truth.
 *
 * Palette: warm cream base, terracotta accent, deep navy authority.
 * Typography: PlusJakartaSans, strict hierarchy of 5 levels.
 */

// ── Palette ───────────────────────────────────────────────────────────────────

export const C = {
  // Backgrounds
  pageBg:    "#FAF7F4",   // warm off-white page background
  cardBg:    "#FFFFFF",   // pure white cards
  stoneBg:   "#F4EEE6",   // warm stone — subtle section breaks

  // Brand
  navy:      "#1B3A6B",   // authority — headings, hero blocks
  blue:      "#1B4FD8",   // action — primary buttons, links
  blueFaint: "#EEF2FD",   // blue tint — active state backgrounds
  terra:     "#C8782A",   // terracotta — warm accent, badges
  terraFaint:"#FEF3E8",   // terracotta tint
  brandGreen:"#1E7A52",   // forest green — onboarding accent (logo, primary CTA)
  brandGreenDeep:"#175F40", // darkened brandGreen — link text on light bg

  // Text
  ink:       "#1A1A2E",   // primary text
  dim:       "#5C6375",   // secondary text
  muted:     "#9CA3AF",   // hints, meta, placeholders

  // Semantic
  green:     "#059669",   // confirmed / success
  greenFaint:"#ECFDF5",
  amber:     "#D97706",   // pending / warning
  amberFaint:"#FFFBEB",
  red:       "#DC2626",   // cancelled / danger
  redFaint:  "#FEF2F2",

  // Borders & dividers
  border:    "#EDE5D8",   // warm border (not cold grey)
  divider:   "#F0EAE0",   // lighter divider

  white:     "#FFFFFF",
} as const;

// ── Typography ────────────────────────────────────────────────────────────────

export const F = {
  regular:  "PlusJakartaSans_400Regular",
  medium:   "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold:     "PlusJakartaSans_700Bold",
} as const;

// ── Avatar colors — deterministic from provider name ─────────────────────────

const AVATAR_PALETTE = [
  { bg: "#C8782A", text: "#FFFFFF" }, // terracotta
  { bg: "#1B3A6B", text: "#FFFFFF" }, // navy
  { bg: "#2D7D52", text: "#FFFFFF" }, // forest
  { bg: "#7B3FA0", text: "#FFFFFF" }, // plum
  { bg: "#B85C38", text: "#FFFFFF" }, // rust
  { bg: "#1B6B8A", text: "#FFFFFF" }, // teal
];

export function avatarColor(name: string): { bg: string; text: string } {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

// ── Satisfaction bar colour ───────────────────────────────────────────────────

export function rateColor(rate: number): string {
  if (rate >= 80) return C.green;
  if (rate >= 50) return C.amber;
  return C.red;
}

// ── Status helpers ────────────────────────────────────────────────────────────

export function statusMeta(status: string): { label: string; color: string; bg: string } {
  if (status === "confirmed") return { label: "Confirmé",   color: C.green, bg: C.greenFaint };
  if (status === "pending")   return { label: "En attente", color: C.amber, bg: C.amberFaint };
  if (status === "cancelled") return { label: "Annulé",     color: C.red,   bg: C.redFaint };
  return { label: status, color: C.muted, bg: C.stoneBg };
}
