import React from "react";
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../../theme/colors";
import { useAuthStore } from "../../../store/authStore";
import { useUiStore } from "../../../store/uiStore";
import { useUpdateProfileMutation } from "../../../services/queries/hooks";

export default function NotificationsScreen() {
  const { user, updateUser } = useAuthStore();
  const { showToast } = useUiStore();
  const updateProfileMutation = useUpdateProfileMutation();

  const prefs = user?.notificationPreferences || {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    offersEnabled: true,
  };

  const handleToggle = (key: "pushEnabled" | "emailEnabled" | "smsEnabled" | "offersEnabled", val: boolean) => {
    const updatedPrefs = {
      ...prefs,
      [key]: val,
    };

    updateProfileMutation.mutate(
      { notificationPreferences: updatedPrefs },
      {
        onSuccess: () => {
          updateUser({ notificationPreferences: updatedPrefs });
          showToast("Notification settings updated!", "success");
        },
        onError: () => {
          showToast("Failed to update preferences", "error");
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        {updateProfileMutation.isPending ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Alert Channels</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Push Notifications</Text>
              <Text style={styles.subLabel}>Get real-time updates regarding bookings and messages.</Text>
            </View>
            <Switch
              value={prefs.pushEnabled}
              onValueChange={(val) => handleToggle("pushEnabled", val)}
              trackColor={{ true: COLORS.primary }}
              disabled={updateProfileMutation.isPending}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Email Notifications</Text>
              <Text style={styles.subLabel}>Receive reports, invoices, and booking confirmations via email.</Text>
            </View>
            <Switch
              value={prefs.emailEnabled}
              onValueChange={(val) => handleToggle("emailEnabled", val)}
              trackColor={{ true: COLORS.primary }}
              disabled={updateProfileMutation.isPending}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>SMS Status & Alerts</Text>
              <Text style={styles.subLabel}>Get SMS notifications for critical billing or updates.</Text>
            </View>
            <Switch
              value={prefs.smsEnabled}
              onValueChange={(val) => handleToggle("smsEnabled", val)}
              trackColor={{ true: COLORS.primary }}
              disabled={updateProfileMutation.isPending}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Promotional Content</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Offers & Rewards</Text>
              <Text style={styles.subLabel}>Get discount updates, seasonal promotions, and deals.</Text>
            </View>
            <Switch
              value={prefs.offersEnabled}
              onValueChange={(val) => handleToggle("offersEnabled", val)}
              trackColor={{ true: COLORS.primary }}
              disabled={updateProfileMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  subLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
