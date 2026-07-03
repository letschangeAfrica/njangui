/**
 * Root layout — loads fonts, hides splash screen, sets up Expo Router.
 *
 * On web: constrains the app to a 430px phone-width container, centred
 * on a dark background, so the preview looks like a real device.
 */

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

// Keep splash visible until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  const inner = (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );

  // On web: wrap in a centred phone-sized container
  if (Platform.OS === "web") {
    return (
      <View style={s.webShell}>
        <View style={s.webPhone}>{inner}</View>
      </View>
    );
  }

  return inner;
}

const s = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%" as any,
  },
  webPhone: {
    width: 430,
    height: "100%" as any,
    maxHeight: 932,
    overflow: "hidden",
    borderRadius: 0,
    position: "relative",
    // subtle phone outline on large screens
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
});
