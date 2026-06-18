import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Slot, usePathname, router, useSegments } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { TabBar, TAB_BAR_HEIGHT } from "../components/navigation/TabBar";
import { ModalProvider } from "../components/modals/ModalProvider";
import { Toast } from "../components/common/Toast";
import { LoadingOverlay } from "../components/common/LoadingOverlay";
import { COLORS } from "../theme/colors";

// Initialize Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppNavigationShell() {
  const { user, accessToken } = useAuthStore();
  const { loading } = useUiStore();
  const segments = useSegments();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Sync state hydration
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => unsub();
  }, []);

  // Navigation Guard / Role-based routing
  useEffect(() => {
    if (!isHydrated) return;

    const segs = segments as any[];
    const inAuthGroup = segs[0] === "(auth)";
    const inCustomerGroup = segs[0] === "(customer)";
    const inEmergencyGroup = segs[0] === "(Emergency)";
    const inOwnerGroup = segs[0] === "(owner)";
    const isRoot = segs.length === 0 || (segs.length === 1 && segs[0] === "");

    if (!accessToken || !user) {
      // Not logged in -> Redirect to login if not already in auth flow
      if (!inAuthGroup) {
        router.replace("/login" as any);
      }
    } else {
      // Logged in -> Handle role redirection
      if (user.role === "user") {
        if (inOwnerGroup || inAuthGroup || isRoot) {
          router.replace("/(customer)/home" as any);
        }
      } else if (user.role === "manager") {
        if (inCustomerGroup || inEmergencyGroup || inAuthGroup || isRoot) {
          router.replace("/dashboard" as any);
        }
      }
    }
  }, [user, accessToken, segments, isHydrated]);

  // Determine if Bottom Tab Bar is visible
  const isAuthRoute =
    pathname.includes("/(auth)") ||
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname === "/" ||
    pathname === "/index";

  const insets = useSafeAreaInsets();
  const showTabs = user && !isAuthRoute;
  const paddingBottom = showTabs ? TAB_BAR_HEIGHT + insets.bottom : 0;
  const paddingTop = insets.top;

  const inEmergency = segments[0] === "Emergency";

  return (
    <View style={[styles.container, { backgroundColor: inEmergency ? "#0D0D0D" : COLORS.background }]}>
      <View style={[styles.mainArea, { paddingBottom, paddingTop }]}>
        <Slot />
      </View>
      <TabBar />
      <ModalProvider />
      <Toast />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigationShell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
  },
});
