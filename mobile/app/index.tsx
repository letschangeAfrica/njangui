/**
 * Root index — checks for a stored JWT and redirects:
 *   token present  →  /(main)/home   (skip auth flow)
 *   no token       →  /(auth)/onboarding
 */

import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { isLoggedIn } from "../services/auth";

export default function Index() {
  const [checked, setChecked]   = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    isLoggedIn()
      .then(setLoggedIn)
      .catch(() => setLoggedIn(false))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F4" }}>
        <ActivityIndicator size="large" color="#1B4FD8" />
      </View>
    );
  }

  return <Redirect href={loggedIn ? "/(main)/home" : "/(auth)/onboarding"} />;
}
