/**
 * 404 — Unmatched route fallback.
 */

import { Link, usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const path = usePathname();
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.emoji}>🗺️</Text>
        <Text style={s.title}>Page introuvable</Text>
        <Text style={s.path}>{path}</Text>
        <Link href="/(auth)/onboarding" style={s.link}>
          ← Retour à l'accueil
        </Link>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF7F4" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emoji: { fontSize: 56 },
  title: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 22, color: "#1B3A6B" },
  path: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#94A3B8" },
  link: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#1B4FD8", marginTop: 8 },
});
