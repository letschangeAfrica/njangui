/**
 * Main tab navigator.
 * Uses Ionicons from @expo/vector-icons (bundled with Expo SDK).
 */

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { C, F } from "../../constants/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TABS: {
  name: string;
  title: string;
  icon: IoniconsName;
  iconActive: IoniconsName;
}[] = [
  { name: "home",         title: "Accueil",      icon: "home-outline",        iconActive: "home"           },
  { name: "search",       title: "Recherche",    icon: "search-outline",      iconActive: "search"         },
  { name: "transactions", title: "Transactions", icon: "receipt-outline",     iconActive: "receipt"        },
  { name: "profile",      title: "Profil",       icon: "person-outline",      iconActive: "person"         },
];

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.cardBg,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor:   C.navy,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: {
          fontFamily: F.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
