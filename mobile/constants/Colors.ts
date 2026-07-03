/**
 * Njangui color palette.
 *
 * Design principles:
 * - High contrast for outdoor sunlight visibility
 * - Primary blue (#1B4FD8) — trust, financial identity
 * - All text on white backgrounds meets WCAG AA contrast ratio
 */

export const Colors = {
  // Primary brand
  primary:        "#1B4FD8",   // Main blue — buttons, links, active states
  primaryDark:    "#1438A0",   // Pressed state
  primaryLight:   "#E8EDFB",   // Backgrounds, chips

  // Semantic
  success:        "#16A34A",   // Confirmed transactions, thumbs up
  danger:         "#DC2626",   // Errors, thumbs down, fraud flags
  warning:        "#D97706",   // Pending states
  info:           "#0284C7",   // Informational

  // Neutrals
  white:          "#FFFFFF",
  background:     "#F8F9FA",   // Screen backgrounds
  surface:        "#FFFFFF",   // Cards, modals
  border:         "#E2E8F0",   // Dividers, input borders
  borderFocus:    "#1B4FD8",   // Input focused border

  // Text
  textPrimary:    "#0F172A",   // Main body text — high contrast
  textSecondary:  "#475569",   // Labels, captions
  textDisabled:   "#94A3B8",   // Placeholder, disabled
  textInverse:    "#FFFFFF",   // Text on dark backgrounds

  // Special
  verified:       "#1B4FD8",   // ID card verified badge
  thumbsUp:       "#16A34A",
  thumbsDown:     "#DC2626",
};
