import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { usePathname, router, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { COLORS } from "../../theme/colors";

export const TAB_BAR_HEIGHT = 68;

export const TabBar: React.FC = () => {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // Hide tab bar on auth and onboarding routes
  const isAuthRoute =
    pathname.includes("/(auth)") ||
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname === "/" ||
    pathname === "/index";

  if (!user || isAuthRoute) {
    return null;
  }

  const role = user.role;

  // Define tabs based on role
  const customerTabs = [
    { name: "Home", route: "/(customer)/home", icon: "home" as const },
    { name: "Stores", route: "/(customer)/stores", icon: "search" as const },
    { name: "Bookings", route: "/(customer)/bookings", icon: "calendar" as const },
    { name: "Pets", route: "/(customer)/pets", icon: "paw" as const },
    { name: "Profile", route: "/(customer)/profile", icon: "person" as const },
  ];

  const ownerTabs = [
    { name: "Dashboard", route: "/(owner)/dashboard", icon: "grid" as const },
    { name: "Bookings", route: "/(owner)/bookings", icon: "calendar" as const },
    { name: "Services", route: "/(owner)/services", icon: "list" as const },
    { name: "Store", route: "/(owner)/store", icon: "storefront" as const },
    { name: "Profile", route: "/(owner)/profile", icon: "person" as const },
  ];

  const tabs = role === "manager" ? ownerTabs : customerTabs;

  // Helper to determine if a route is active
  const isActive = (route: string) => {
    const routeParts = route.split("/").filter(Boolean);
    if (routeParts.length === 0) return false;

    // Highlight Home tab on both customer home and store details
    if (route === "/(customer)/home") {
      const isStoreDetail = segments[0] === "(customer)" && segments[1] === "store";
      const isHome = segments[0] === "(customer)" && segments[1] === "home";
      return isHome || isStoreDetail;
    }

    return routeParts.every((part, idx) => segments[idx] === part);
  };

  const handlePress = (route: string) => {
    router.replace(route as any);
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          const iconName = active ? tab.icon : (`${tab.icon}-outline` as any);

          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabButton}
              onPress={() => handlePress(tab.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? COLORS.primary : COLORS.textMuted },
                ]}
                numberOfLines={1}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
});
