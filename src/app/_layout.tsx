import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Slot, usePathname, router, useSegments } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { TabBar, TAB_BAR_HEIGHT } from "../components/navigation/TabBar";
import { ModalProvider } from "../components/modals/ModalProvider";
import { Toast } from "../components/common/Toast";
import { CustomAlert } from "../components/common/CustomAlert";
import { LoadingOverlay } from "../components/common/LoadingOverlay";
import { COLORS } from "../theme/colors";
import { useUpdateProfileMutation } from "../services/queries/hooks";

// Initialize Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Configure push notifications handler to show alerts in foreground (only if not Expo Go)
if (!isExpoGo) {
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn("Failed to initialize expo-notifications:", err);
  }
}

async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.log("Push notifications are disabled in Expo Go. Use a development build to test push notifications.");
    return null;
  }

  try {
    const Notifications = require("expo-notifications");
    const Device = require("expo-device");

    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B35",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        console.log("Project ID not found in configuration");
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  } catch (err) {
    console.warn("Error registering for push notifications:", err);
    return null;
  }
}

function AppNavigationShell() {
  const { user, accessToken } = useAuthStore();
  const { loading } = useUiStore();
  const segments = useSegments();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = React.useState(false);
  const updateProfileMutation = useUpdateProfileMutation();

  // Register push notifications and setup event listeners
  useEffect(() => {
    if (!accessToken || isExpoGo) return;

    try {
      const Notifications = require("expo-notifications");

      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          // Send pushToken, deviceToken, expoPushToken to backend
          updateProfileMutation.mutate({
            pushToken: token,
            deviceToken: token,
            expoPushToken: token,
          } as any);
        }
      });

      // Listener when a notification is received in foreground
      const notificationListener = Notifications.addNotificationReceivedListener(() => {
        // Invalidate query cache to fetch latest notifications list
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });

      // Listener when user taps/clicks on a notification in the system drawer
      const responseListener = Notifications.addNotificationResponseReceivedListener(() => {
        // Redirect user to notifications page
        router.push("/(customer)/notifications" as any);
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } catch (err) {
      console.warn("Failed to register notification listeners:", err);
    }
  }, [accessToken]);

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
      <CustomAlert />
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
