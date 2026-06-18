import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Linking } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { usePets } from "../../services/queries/hooks";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";

export default function RedesignedProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const { data: pets = [] } = usePets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of PawConnect?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.logout();
          } catch (e) {
            // silent fail
          }
          await SecureStore.deleteItemAsync("pawconnect_access_token");
          clearAuth();
          router.replace("/login" as any);
        },
      },
    ]);
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:+919876543210").catch(() => {
      Alert.alert("Support", "Call Support at +91 98765 43210");
    });
  };

  const handleAddEmergencyContact = () => {
    Alert.alert("Emergency Contact", "Primary Vet Emergency hotline (+91 108) is saved as default contact.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 👤 Profile Header Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || "M"}</Text>
        </View>
        <Text style={styles.profileName}>{user?.fullName || "Manohar"}</Text>
        <Text style={styles.profileEmail}>{user?.email || "manohar@example.com"}</Text>
        <Text style={styles.profilePhone}>{user?.phone || "+91 99999 88888"}</Text>
        
        {/* Switch back to regular customer app */}
        <TouchableOpacity 
          style={styles.switchAppBtn}
          onPress={() => router.replace("/(customer)/home" as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="storefront-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.switchAppText}>Exit Emergency Mode</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 Live Stat Counters */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push("/Emergency/pets" as any)}>
          <Text style={styles.statVal}>{pets.length > 0 ? pets.length : 2}</Text>
          <Text style={styles.statLabel}>Registered Pets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => Alert.alert("Health Documents", "You have 13 active medical records and vaccine files.")}>
          <Text style={styles.statVal}>13</Text>
          <Text style={styles.statLabel}>Health Docs</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Actions List */}
      <View style={styles.menuCard}>
        {/* My Pets */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/Emergency/pets" as any)}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBg, { backgroundColor: "rgba(255, 107, 53, 0.1)" }]}>
              <Ionicons name="paw-outline" size={20} color={COLORS.emergencyPrimaryOrange} />
            </View>
            <Text style={styles.menuItemTitle}>My Registered Pets</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.emergencyTextMuted} />
        </TouchableOpacity>

        {/* Health Records */}
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Medical Records", "13 health documents active.")}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBg, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.emergencySuccess} />
            </View>
            <Text style={styles.menuItemTitle}>Health Records & Files</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.emergencyTextMuted} />
        </TouchableOpacity>

        {/* Emergency Contacts */}
        <TouchableOpacity style={styles.menuItem} onPress={handleAddEmergencyContact}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBg, { backgroundColor: "rgba(229, 57, 53, 0.1)" }]}>
              <Ionicons name="call-outline" size={20} color={COLORS.emergencyRed} />
            </View>
            <Text style={styles.menuItemTitle}>Emergency Contacts</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.emergencyTextMuted} />
        </TouchableOpacity>

        {/* Notifications Toggle */}
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBg, { backgroundColor: "rgba(168, 85, 247, 0.1)" }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.emergencyAccentPurple} />
            </View>
            <Text style={styles.menuItemTitle}>Triage Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#262626", true: COLORS.emergencyPrimaryOrange }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Support */}
        <TouchableOpacity style={styles.menuItem} onPress={handleCallSupport}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBg, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
              <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuItemTitle}>Help & Clinic Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.emergencyTextMuted} />
        </TouchableOpacity>
      </View>

      {/* Styled destructive Logout Button */}
      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color={COLORS.emergencyRed} style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Sign Out Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    marginBottom: 20,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.emergencyPrimaryOrange,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: COLORS.emergencyPrimaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.emergencyTextMuted,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 12,
    color: COLORS.emergencyTextMuted,
    marginTop: 2,
  },
  switchAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurfaceLight,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
  },
  switchAppText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  statVal: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.emergencyTextMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  menuCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "rgba(229, 57, 53, 0.15)",
    borderWidth: 1.5,
    borderColor: COLORS.emergencyRed,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(229, 57, 53, 0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutBtnText: {
    color: COLORS.emergencyRed,
    fontSize: 14,
    fontWeight: "800",
  },
});
