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

  const inEmergency = segments[0] === "(Emergency)";

  if (!user || isAuthRoute) {
    return null;
  }

  const role = user.role;

  interface TabItem {
    name: string;
    route: string;
    icon: any;
    special?: boolean;
  }

  // Define tabs based on role and emergency status
  const customerTabs: TabItem[] = [
    { name: "Home", route: "/(customer)/home", icon: "home" },
    { name: "Stores", route: "/(customer)/stores", icon: "search" },
    
    // { name: "Bookings", route: "/(customer)/bookings", icon: "calendar" },
    { name: "Emergency", route: "/(Emergency)/home", icon: "flash", special: true },
    { name: "Pets", route: "/(customer)/pets", icon: "paw" },
    { name: "Profile", route: "/(customer)/profile", icon: "person" },
  ];

  const emergencyTabs: TabItem[] = [
    { name: "Home", route: "/(Emergency)/home", icon: "home" },
 
    { name: "Appointments", route: "/(Emergency)/appointments", icon: "calendar" },
       { name: "Emergency", route: "/(Emergency)/emergency", icon: "flash", special: true },
    { name: "My Pets", route: "/(Emergency)/pets", icon: "paw" },
    { name: "Profile", route: "/(Emergency)/profile", icon: "person" },
  ];

  const ownerTabs: TabItem[] = [
    { name: "Dashboard", route: "/(owner)/dashboard", icon: "grid" },
    { name: "Bookings", route: "/(owner)/bookings", icon: "calendar" },
    { name: "Services", route: "/(owner)/services", icon: "list" },
    { name: "Store", route: "/(owner)/store", icon: "storefront" },
    { name: "Profile", route: "/(owner)/profile", icon: "person" },
  ];

  const tabs = role === "manager" ? ownerTabs : (inEmergency ? emergencyTabs : customerTabs);

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

    if (route.startsWith("/(Emergency)/")) {
      const targetSegment = route.split("/")[2] || "home";
      const currentSegment = segments[1] || "home";
      return segments[0] === "(Emergency)" && currentSegment === targetSegment;
    }

    return routeParts.every((part, idx) => segments[idx] === part);
  };

  const handlePress = (route: string) => {
    router.replace(route as any);
  };

  // Select theme colors based on mode
  const barBg = inEmergency ? COLORS.emergencyBg : COLORS.surface;
  const barBorder = inEmergency ? COLORS.emergencyBorder : COLORS.border;
  const getTabColor = (tab: typeof customerTabs[0], active: boolean) => {
    if (active) {
      if (tab.special) return COLORS.emergencyRed;
      return inEmergency ? COLORS.emergencyPrimaryOrange : COLORS.primary;
    }
    return inEmergency ? COLORS.emergencyTextMuted : COLORS.textMuted;
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: barBg,
          borderTopColor: barBorder,
        },
      ]}
    >
      <View style={styles.content}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          const iconName = active ? tab.icon : (`${tab.icon}-outline` as any);
          const color = getTabColor(tab, active);

          return (
            // <TouchableOpacity
            //   key={tab.route}
            //   style={styles.tabButton}
            //   onPress={() => handlePress(tab.route)}
            //   activeOpacity={0.7}
            // >
            //   <Ionicons
            //     name={iconName}
            //     size={22}
            //     color={color}
            //   />
            //   <Text
            //     style={[
            //       styles.tabLabel,
            //       { color: color },
            //     ]}
            //     numberOfLines={1}
            //   >
            //     {tab.name}
            //   </Text>
            // </TouchableOpacity>
            <TouchableOpacity
  key={tab.route}
  style={[
    styles.tabButton,
    tab.special && styles.emergencyButton,
  ]}
  onPress={() => handlePress(tab.route)}
  activeOpacity={0.7}
>
  <Ionicons
  name={iconName}
  size={tab.special ? 28 : 22}
  color={tab.special ? "#FFFFFF" : color}
/>
  <Text
    style={[
      styles.tabLabel,
      { color },
      tab.special && styles.emergencyLabel,
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
  emergencyButton: {
  width: 50,
  height: 70,
  borderRadius:50,

  backgroundColor: COLORS.emergencyPrimaryOrange,
  borderColor: COLORS.surface,

  

  justifyContent: "center",
  alignItems: "center",

  marginTop: -35,

  borderWidth: 4,
 
},

emergencyLabel: {
  position: "absolute",
  bottom: -18,

  width: 80,
  textAlign: "center",

  fontSize: 10,
  fontWeight: "700",

  color: COLORS.emergencyPrimaryOrange,
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
