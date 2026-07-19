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

    "phone.back.a11y": "Retour à l'accueil",
    "phone.title.register": "Ton numéro de téléphone",
    "phone.title.login": "Connecte-toi avec ton numéro",
    "phone.subtitle.register":
      "Pour sécuriser ton compte, on t'envoie un code par SMS. Un seul numéro, aucune complication.",
    "phone.subtitle.login": "On t'envoie un code de connexion par SMS.",
    "phone.field.a11y": "Numéro de téléphone camerounais, format 6 XX XX XX XX",
    "phone.placeholder": "6 XX XX XX XX",
    "phone.validNumber": "Numéro {carrier} valide",
    "phone.error.empty": "Entre ton numéro pour continuer",
    "phone.error.mustStartWith6": "Un numéro camerounais commence par 6",
    "phone.error.unknownPrefix": "Ce préfixe n'est pas reconnu",
    "phone.error.tooShort": "Il manque des chiffres — 9 au total",
    "phone.error.sendFailed": "Impossible d'envoyer le code. Réessaie.",
    "phone.cta": "Continuer",
    "phone.legal":
      "En continuant, tu acceptes de recevoir un SMS de vérification. Des frais opérateur peuvent s'appliquer.",
    "phone.keypad.digit": "Chiffre {digit}",
    "phone.keypad.backspace": "Effacer",

    "otp.back.a11y": "Retour, corriger le numéro",
    "otp.title": "Entre le code reçu",
    "otp.subtitle": "On a envoyé un code à 6 chiffres au",
    "otp.change": "Modifier",
    "otp.cell.a11y": "Chiffre {n} sur 6, {state}",
    "otp.cell.filled": "rempli",
    "otp.cell.empty": "vide",
    "otp.field.a11y": "Code de vérification à 6 chiffres",
    "otp.verifying": "Vérification…",
    "otp.success": "Code confirmé — {route}",
    "otp.route.create": "crée ton code PIN",
    "otp.route.enter": "entre ton code PIN",
    "otp.notReceived": "Pas reçu ?",
    "otp.resend": "Renvoyer le code",
    "otp.resendIn": "Renvoyer dans {countdown}",
    "otp.resendToast": "Nouveau code envoyé",
    "otp.sendFailed": "Impossible d'envoyer le code. Réessaie.",
    "otp.devHint": "Mode dev — code : {code}",

    "pin.back.a11y": "Retour",
    "pin.title.create": "Crée ton code secret",
    "pin.title.confirm": "Confirme ton code",
    "pin.title.login": "Entre ton code secret",
    "pin.subtitle.create": "Quatre chiffres pour protéger ton compte et ta réputation.",
    "pin.subtitle.confirm": "Entre le même code une seconde fois.",
    "pin.subtitle.login": "Ce numéro est déjà enregistré. Entre ton code secret.",
    "pin.field.a11y": "Code secret à 4 chiffres, saisie masquée",
    "pin.dot.a11y": "Chiffre {n} sur 4{state}",
    "pin.dot.filled": ", saisi",
    "pin.error.mismatch": "Les codes ne correspondent pas, réessaie",
    "pin.error.wrongWithAttempts": "Code incorrect. {left} tentative(s) restante(s)",
    "pin.error.generic": "Une erreur est survenue.",
    "pin.error.pinTooWeak": "Ce PIN est trop simple. Choisis un PIN plus sécurisé.",
    "pin.locked.title": "Trop de tentatives",
    "pin.locked.body": "Réessaie dans {countdown} ou vérifie à nouveau ton numéro.",
    "pin.locked.cta": "Vérifier mon numéro",
    "pin.step.label": "Étape {step} sur 2",
    "pin.forgot": "Code oublié ?",
    "pin.forgot.toast": "Retour à la vérification du numéro",
    "pin.restart": "Recommencer",
    "pin.done.created": "Compte créé — bienvenue !",
    "pin.done.login": "Déverrouillé",
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

    "phone.back.a11y": "Back to home",
    "phone.title.register": "Your phone number",
    "phone.title.login": "Log in with your number",
    "phone.subtitle.register":
      "To secure your account, we'll send you a code by SMS. One number, no hassle.",
    "phone.subtitle.login": "We'll send you a login code by SMS.",
    "phone.field.a11y": "Cameroonian phone number, format 6 XX XX XX XX",
    "phone.placeholder": "6 XX XX XX XX",
    "phone.validNumber": "Valid {carrier} number",
    "phone.error.empty": "Enter your number to continue",
    "phone.error.mustStartWith6": "A Cameroonian number starts with 6",
    "phone.error.unknownPrefix": "This prefix isn't recognized",
    "phone.error.tooShort": "Missing digits — 9 total",
    "phone.error.sendFailed": "Couldn't send the code. Try again.",
    "phone.cta": "Continue",
    "phone.legal":
      "By continuing, you agree to receive a verification SMS. Carrier fees may apply.",
    "phone.keypad.digit": "Digit {digit}",
    "phone.keypad.backspace": "Backspace",

    "otp.back.a11y": "Back, edit number",
    "otp.title": "Enter the code",
    "otp.subtitle": "We sent a 6-digit code to",
    "otp.change": "Edit",
    "otp.cell.a11y": "Digit {n} of 6, {state}",
    "otp.cell.filled": "filled",
    "otp.cell.empty": "empty",
    "otp.field.a11y": "6-digit verification code",
    "otp.verifying": "Verifying…",
    "otp.success": "Code confirmed — {route}",
    "otp.route.create": "create your PIN",
    "otp.route.enter": "enter your PIN",
    "otp.notReceived": "Didn't get it?",
    "otp.resend": "Resend code",
    "otp.resendIn": "Resend in {countdown}",
    "otp.resendToast": "New code sent",
    "otp.sendFailed": "Couldn't send the code. Try again.",
    "otp.devHint": "Dev mode — code: {code}",

    "pin.back.a11y": "Back",
    "pin.title.create": "Create your secret code",
    "pin.title.confirm": "Confirm your code",
    "pin.title.login": "Enter your secret code",
    "pin.subtitle.create": "Four digits to protect your account and your reputation.",
    "pin.subtitle.confirm": "Enter the same code a second time.",
    "pin.subtitle.login": "This number is already registered. Enter your secret code.",
    "pin.field.a11y": "4-digit secret code, masked entry",
    "pin.dot.a11y": "Digit {n} of 4{state}",
    "pin.dot.filled": ", entered",
    "pin.error.mismatch": "The codes don't match, try again",
    "pin.error.wrongWithAttempts": "Wrong code. {left} attempt(s) left",
    "pin.error.generic": "Something went wrong.",
    "pin.error.pinTooWeak": "This PIN is too simple. Choose a more secure PIN.",
    "pin.locked.title": "Too many attempts",
    "pin.locked.body": "Try again in {countdown} or re-verify your number.",
    "pin.locked.cta": "Re-verify my number",
    "pin.step.label": "Step {step} of 2",
    "pin.forgot": "Forgot code?",
    "pin.forgot.toast": "Back to number verification",
    "pin.restart": "Start over",
    "pin.done.created": "Account created — welcome!",
    "pin.done.login": "Unlocked",
  },
} as const;

export type StringKey = keyof (typeof strings)["fr"];

export function t(key: StringKey, vars?: Record<string, string>): string {
  let value: string = strings[locale][key] ?? strings.fr[key] ?? key;
  if (vars) {
    for (const [name, val] of Object.entries(vars)) {
      value = value.replace(`{${name}}`, val);
    }
  }
  return value;
}
