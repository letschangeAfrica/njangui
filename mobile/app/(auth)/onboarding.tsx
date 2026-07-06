/**
 * Screen 1 — Onboarding / Splash
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MarketIllustration from "../../components/illustrations/MarketIllustration";
import { C, F } from "../../constants/theme";
import { t } from "../../lib/i18n";
import { track } from "../../services/analytics";

// ── Feature card ──────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function FeatureCard({
  icon,
  iconColor,
  iconBg,
  label,
}: {
  icon: IoniconsName;
  iconColor: string;
  iconBg: string;
  label: string;
}) {
  return (
    <View style={s.card} accessible accessibilityLabel={label.replace("\n", " ")}>
      <View style={[s.cardIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={s.cardLabel}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

// On web the app renders inside a fixed-width phone shell (app/_layout.tsx
// caps it at 430px); on native, the window *is* the device. Clamping to
// whichever is smaller keeps this sized to the visible frame either way —
// measuring via onLayout was tried first but is unreliable here: on web,
// a flex:1 container's onLayout can fire once before the flex layout
// settles (reporting 0) and never fire again, leaving the illustration
// permanently blank.
const MAX_PHONE_WIDTH = 430;
const SAFE_AREA_PADDING = 24 * 2;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, MAX_PHONE_WIDTH) - SAFE_AREA_PADDING;

  function goToPhone(intent: "register" | "login") {
    track("onboarding_cta_tap", { intent });
    router.push({ pathname: "/(auth)/phone", params: { intent } });
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe}>

        {/* ── Brand ── */}
        <View style={s.brandRow}>
          <View
            style={s.logoMark}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={s.logoLetter}>N</Text>
          </View>
          <Text style={s.wordmark} accessibilityRole="header">NJANGUI</Text>
        </View>

        <View style={s.taglinePill}>
          <View style={s.taglineDot} />
          <Text style={s.taglineText}>{t("onboarding.tagline")}</Text>
        </View>

        {/* ── Illustration ── */}
        <View
          style={s.illustrationArea}
          accessible
          accessibilityRole="image"
          accessibilityLabel={t("onboarding.illustration.a11y")}
        >
          <MarketIllustration width={contentWidth * 0.92} accent={C.brandGreen} />
        </View>

        {/* ── Feature cards ── */}
        <View style={s.cardsRow}>
          <FeatureCard
            icon="checkmark"
            iconColor="#1E7A52"
            iconBg="#E9F3EE"
            label={t("onboarding.feature.verifiedIdentity")}
          />
          <FeatureCard
            icon="star"
            iconColor="#E0A21A"
            iconBg="#FBF0DC"
            label={t("onboarding.feature.realReputation")}
          />
          <FeatureCard
            icon="shield-checkmark"
            iconColor="#B84E0C"
            iconBg="#FBE7D6"
            label={t("onboarding.feature.secure")}
          />
        </View>

        {/* ── CTA ── */}
        <View style={s.ctaArea}>
          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.85}
            onPress={() => goToPhone("register")}
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.cta.start")}
            accessibilityHint={t("onboarding.cta.startHint")}
          >
            <Text style={s.ctaBtnText}>{t("onboarding.cta.start")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.loginLink}
            activeOpacity={0.7}
            onPress={() => goToPhone("login")}
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.cta.loginPrefix") + t("onboarding.cta.loginBold")}
            accessibilityHint={t("onboarding.cta.loginHint")}
          >
            <Text style={s.loginLinkText}>
              {t("onboarding.cta.loginPrefix")}
              <Text style={s.loginLinkBold}>{t("onboarding.cta.loginBold")}</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  safe: {
    flex: 1, paddingHorizontal: 24, paddingTop: 12,
    alignItems: "center", justifyContent: "space-between",
  },

  // Brand
  brandRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    alignSelf: "flex-start", marginTop: 8,
  },
  logoMark: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: C.brandGreen,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.brandGreen, shadowOpacity: 0.4,
    shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  logoLetter: {
    fontFamily: F.bold, fontSize: 24,
    color: C.white,
  },
  wordmark: {
    fontFamily: F.bold, fontSize: 26,
    letterSpacing: 4, color: "#241C15",
  },
  taglinePill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", marginTop: 16,
    backgroundColor: "#FBE7D6",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  taglineDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "#B84E0C",
  },
  taglineText: {
    fontFamily: F.semibold, fontSize: 13.5,
    color: "#7A3A12",
  },

  illustrationArea: {
    alignItems: "center", justifyContent: "center", flex: 1,
  },

  // Feature cards
  cardsRow: { flexDirection: "row", gap: 8, width: "100%", marginBottom: 22 },
  card: {
    flex: 1, alignItems: "center", gap: 8,
    backgroundColor: C.cardBg, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 6,
    borderWidth: 1, borderColor: "#EFE4D3",
  },
  cardIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  cardLabel: {
    fontFamily: F.semibold, fontSize: 11.5,
    color: "#3A2E22", textAlign: "center", lineHeight: 14.5,
  },

  // CTA
  ctaArea: {
    width: "100%", alignItems: "center",
    paddingBottom: 12, gap: 16,
  },
  ctaBtn: {
    width: "100%", height: 56,
    backgroundColor: C.brandGreen, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.brandGreen, shadowOpacity: 0.45,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  ctaBtnText: {
    fontFamily: F.bold, fontSize: 17,
    color: C.white, letterSpacing: 0.3,
  },
  loginLink: { paddingVertical: 4 },
  loginLinkText: {
    fontFamily: F.regular, fontSize: 14.5,
    color: "#6B5D4F",
  },
  loginLinkBold: {
    fontFamily: F.bold, color: C.brandGreenDeep,
  },
});
