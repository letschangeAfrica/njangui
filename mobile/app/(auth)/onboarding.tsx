/**
 * Screen 1 — Onboarding / Splash
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

// ── Market illustration — pure geometry, no emojis ────────────────────────────
function MarketIllustration() {
  return (
    <View style={ill.wrapper}>
      {/* ground line */}
      <View style={ill.ground} />

      {/* left stall */}
      <View style={ill.stallLeft}>
        <View style={ill.roofLeft} />
        <View style={ill.bodyLeft} />
      </View>

      {/* right stall */}
      <View style={ill.stallRight}>
        <View style={ill.roofRight} />
        <View style={ill.bodyRight} />
      </View>

      {/* centre figure */}
      <View style={ill.figureWrap}>
        <View style={ill.figureHead} />
        <View style={ill.figureBody} />
      </View>

      {/* handshake arc */}
      <View style={ill.arc} />

      {/* reputation badge */}
      <View style={ill.badge}>
        <Ionicons name="star" size={14} color={C.white} />
      </View>
    </View>
  );
}

const ill = StyleSheet.create({
  wrapper: {
    width: width * 0.72,
    height: height * 0.28,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ground: {
    position: "absolute", bottom: 0, width: "100%",
    height: 5, backgroundColor: "rgba(200,120,42,0.4)", borderRadius: 3,
  },
  stallLeft: {
    position: "absolute", left: width * 0.02, bottom: 5,
    width: width * 0.22, alignItems: "center",
  },
  roofLeft: {
    width: 0, height: 0,
    borderLeftWidth: width * 0.13, borderRightWidth: width * 0.13,
    borderBottomWidth: 28,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderBottomColor: C.terra,
  },
  bodyLeft: {
    width: width * 0.2, height: 50,
    backgroundColor: "rgba(200,120,42,0.25)", borderRadius: 4,
  },
  stallRight: {
    position: "absolute", right: width * 0.02, bottom: 5,
    width: width * 0.22, alignItems: "center",
  },
  roofRight: {
    width: 0, height: 0,
    borderLeftWidth: width * 0.13, borderRightWidth: width * 0.13,
    borderBottomWidth: 28,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderBottomColor: "#E09A40",
  },
  bodyRight: {
    width: width * 0.2, height: 50,
    backgroundColor: "rgba(224,154,64,0.2)", borderRadius: 4,
  },
  figureWrap: {
    position: "absolute", bottom: 5, alignItems: "center",
  },
  figureHead: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  figureBody: {
    width: 22, height: 44, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.55)", marginTop: 2,
  },
  arc: {
    position: "absolute", bottom: 58,
    width: 100, height: 50, borderRadius: 50,
    borderWidth: 2.5, borderColor: "rgba(224,154,64,0.45)",
    borderBottomColor: "transparent",
  },
  badge: {
    position: "absolute", top: 2, right: width * 0.06,
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.terra,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
  },
});

// ── Feature pill ──────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function FeaturePill({ icon, label }: { icon: IoniconsName; label: string }) {
  return (
    <View style={s.pill}>
      <Ionicons name={icon} size={13} color={C.terra} />
      <Text style={s.pillText}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={s.root}>
      {/* tinted top band */}
      <View style={s.topBand} />

      <SafeAreaView style={s.safe}>

        {/* ── Brand ── */}
        <View style={s.brand}>
          {/* N lettermark */}
          <View style={s.logoMark}>
            <Text style={s.logoLetter}>N</Text>
          </View>
          <Text style={s.wordmark}>NJANGUI</Text>
          <View style={s.taglinePill}>
            <Text style={s.taglineText}>La réputation qui ouvre les portes</Text>
          </View>
        </View>

        {/* ── Illustration ── */}
        <View style={s.illustrationArea}>
          <MarketIllustration />
        </View>

        {/* ── Feature pills ── */}
        <View style={s.pillsRow}>
          <FeaturePill icon="shield-checkmark-outline" label="Identité vérifiée" />
          <FeaturePill icon="star-outline"             label="Réputation réelle" />
          <FeaturePill icon="lock-closed-outline"      label="100 % sécurisé"   />
        </View>

        {/* ── CTA ── */}
        <View style={s.ctaArea}>
          <TouchableOpacity
            style={s.ctaBtn}
            activeOpacity={0.82}
            onPress={() => router.push("/(auth)/phone")}
          >
            <Text style={s.ctaBtnText}>Commencer</Text>
            <Ionicons name="arrow-forward" size={18} color={C.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.loginLink}
            activeOpacity={0.7}
            onPress={() => router.push("/(auth)/phone")}
          >
            <Text style={s.loginLinkText}>
              Déjà un compte ?{" "}
              <Text style={s.loginLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  topBand: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: height * 0.55,
    backgroundColor: C.blue,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    opacity: 0.3,
  },
  safe: {
    flex: 1, paddingHorizontal: 24, paddingTop: 20,
    alignItems: "center", justifyContent: "space-between",
  },

  // Brand
  brand: { alignItems: "center", marginTop: 16 },
  logoMark: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  logoLetter: {
    fontFamily: F.bold, fontSize: 36,
    color: C.white, letterSpacing: -1,
  },
  wordmark: {
    fontFamily: F.bold, fontSize: 32,
    letterSpacing: 6, color: C.white, marginBottom: 12,
  },
  taglinePill: {
    backgroundColor: "rgba(200,120,42,0.25)",
    borderWidth: 1, borderColor: "rgba(200,120,42,0.45)",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  taglineText: {
    fontFamily: F.medium, fontSize: 13,
    color: C.pageBg, letterSpacing: 0.2,
  },

  illustrationArea: {
    alignItems: "center", justifyContent: "center", flex: 1,
  },

  // Feature pills
  pillsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  pillText: {
    fontFamily: F.medium, fontSize: 11,
    color: "rgba(255,255,255,0.82)",
  },

  // CTA
  ctaArea: {
    width: "100%", alignItems: "center",
    paddingBottom: 24, gap: 16,
  },
  ctaBtn: {
    width: "100%", height: 56,
    backgroundColor: C.terra, borderRadius: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    shadowColor: C.terra, shadowOpacity: 0.45,
    shadowRadius: 12, elevation: 6,
  },
  ctaBtnText: {
    fontFamily: F.bold, fontSize: 17,
    color: C.white, letterSpacing: 0.3,
  },
  loginLink: { paddingVertical: 8 },
  loginLinkText: {
    fontFamily: F.regular, fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  loginLinkBold: {
    fontFamily: F.semibold, color: "#E09A40",
  },
});
