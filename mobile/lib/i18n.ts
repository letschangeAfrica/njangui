/**
 * Minimal i18n scaffold.
 *
 * Njangui targets Cameroon, where French is the default working language,
 * but Cameroon is officially bilingual (FR/EN) so screens should pull copy
 * from here rather than hardcoding strings — swapping `locale` is then a
 * one-line change, and adding a language switcher later doesn't require
 * touching every screen.
 *
 * This is intentionally dependency-free (no i18n-js/react-intl) since the
 * app only ships one locale today. If a second locale ships for real,
 * replace this with a proper library — the `t()` call sites won't change.
 */

export type Locale = "fr" | "en";

export const locale: Locale = "fr";

const strings = {
  fr: {
    "onboarding.tagline": "La réputation qui ouvre les portes",
    "onboarding.cta.start": "Commencer",
    "onboarding.cta.startHint": "Créer un nouveau compte Njangui",
    "onboarding.cta.loginPrefix": "Déjà un compte ? ",
    "onboarding.cta.loginBold": "Se connecter",
    "onboarding.cta.loginHint": "Se connecter à un compte existant",
    "onboarding.feature.verifiedIdentity": "Identité\nvérifiée",
    "onboarding.feature.realReputation": "Réputation\nréelle",
    "onboarding.feature.secure": "100%\nsécurisé",
    "onboarding.illustration.a11y":
      "Illustration : deux commerçants se serrant la main sur un marché, avec un badge de réputation.",
  },
  en: {
    "onboarding.tagline": "The reputation that opens doors",
    "onboarding.cta.start": "Get started",
    "onboarding.cta.startHint": "Create a new Njangui account",
    "onboarding.cta.loginPrefix": "Already have an account? ",
    "onboarding.cta.loginBold": "Log in",
    "onboarding.cta.loginHint": "Log in to an existing account",
    "onboarding.feature.verifiedIdentity": "Verified\nidentity",
    "onboarding.feature.realReputation": "Real\nreputation",
    "onboarding.feature.secure": "100%\nsecure",
    "onboarding.illustration.a11y":
      "Illustration: two traders shaking hands at a market, with a reputation badge.",
  },
} as const;

export type StringKey = keyof (typeof strings)["fr"];

export function t(key: StringKey): string {
  return strings[locale][key] ?? strings.fr[key] ?? key;
}
