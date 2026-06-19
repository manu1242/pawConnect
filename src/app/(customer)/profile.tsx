import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { usePets, useBookings } from "../../services/queries/hooks";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../../components/common/CustomButton";

export default function CustomerProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  
  // Queries for real-time card numbers
  const { data: pets = [] } = usePets();
  const { data: bookings = [] } = useBookings("user");

  const upcomingBookingsCount = bookings.filter(
    (b) => b.status === "pending" || b.status === "accepted"
  ).length;

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch (e) {
      // silent fail
    }
    // High-fidelity artificial delay to make the spinner feel extremely premium
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await SecureStore.deleteItemAsync("pawconnect_access_token");
    clearAuth();
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    router.replace("/login" as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 👤 Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || "P"}</Text>
        </View>
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <Text style={styles.profilePhone}>{user?.phone || "No phone added"}</Text>
        <Text style={styles.memberSince}>Member since June 2026</Text>

        <TouchableOpacity 
          style={styles.editHeaderBtn} 
          onPress={() => router.push("/(customer)/profile/edit" as any)}
        >
          <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.editHeaderBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 Quick Actions Section (Cards at Top) */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(customer)/bookings" as any)}>
          <View style={[styles.quickIconBg, { backgroundColor: "rgba(255, 107, 53, 0.1)" }]}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.quickVal}>{upcomingBookingsCount}</Text>
          <Text style={styles.quickLabel}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => router.push("/(customer)/pets" as any)}>
          <View style={[styles.quickIconBg, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
            <Ionicons name="paw-outline" size={20} color={COLORS.success} />
          </View>
          <Text style={styles.quickVal}>{pets.length}</Text>
          <Text style={styles.quickLabel}>My Pets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => Alert.alert("Favorites", "Manage saved stores in the Search screen.")}>
          <View style={[styles.quickIconBg, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
            <Ionicons name="star-outline" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.quickVal}>3</Text>
          <Text style={styles.quickLabel}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => Alert.alert("Offers", "Code PAWWELCOME applied: 20% off your next booking!")}>
          <View style={[styles.quickIconBg, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
            <Ionicons name="gift-outline" size={20} color={COLORS.info} />
          </View>
          <Text style={styles.quickVal}>20%</Text>
          <Text style={styles.quickLabel}>Rewards</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Options List */}
      <View style={styles.menuCard}>
        {/* Personal Details */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/profile/edit" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(255, 107, 53, 0.08)" }]}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Personal Information</Text>
              <Text style={styles.menuItemSub}>Edit details, emergency contacts & address</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* My Pets */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/pets" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(16, 185, 129, 0.08)" }]}>
              <Ionicons name="paw-outline" size={20} color={COLORS.success} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>My Registered Pets</Text>
              <Text style={styles.menuItemSub}>View, add, and register vaccination data</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* My Bookings */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/bookings" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(59, 130, 246, 0.08)" }]}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.info} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>My Bookings & History</Text>
              <Text style={styles.menuItemSub}>Upcoming, history & service status</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Saved Payments & Billing */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/profile/payments" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(139, 92, 246, 0.08)" }]}>
              <Ionicons name="card-outline" size={20} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Saved Payments & Billing</Text>
              <Text style={styles.menuItemSub}>UPI, credit cards & transactions</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Notification Preferences */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/profile/notifications" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(245, 158, 11, 0.08)" }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.warning} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Notification Preferences</Text>
              <Text style={styles.menuItemSub}>Push alert channels, promo updates & email</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Help, Support & Feedback */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/profile/support" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(236, 72, 153, 0.08)" }]}>
              <Ionicons name="help-circle-outline" size={20} color="#EC4899" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Support, FAQs & Feedback</Text>
              <Text style={styles.menuItemSub}>WhatsApp, call support & report bugs</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Settings & Privacy */}
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push("/(customer)/profile/settings" as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconWrapper, { backgroundColor: "rgba(107, 114, 128, 0.08)" }]}>
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>App Settings & Privacy</Text>
              <Text style={styles.menuItemSub}>Password, export data & legal terms</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <CustomButton 
        title="Sign Out" 
        variant="outline" 
        onPress={handleLogout} 
        style={styles.logoutBtn} 
        textStyle={{ color: COLORS.danger }} 
      />
      </ScrollView>

      {/* Custom Logout Confirmation Dialog & Loader */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isLoggingOut ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Signing out safely...</Text>
                <Text style={styles.loadingSub}>Cleaning up your session details</Text>
              </View>
            ) : (
              <View>
                <View style={styles.modalHeader}>
                  <View style={styles.warningIconBg}>
                    <Ionicons name="log-out" size={28} color="#EF4444" />
                  </View>
                  <Text style={styles.modalTitle}>Confirm Sign Out</Text>
                </View>
                <Text style={styles.modalMessage}>
                  Are you sure you want to log out of PawConnect? You will need to enter your password again to log in.
                </Text>
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowLogoutModal(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={confirmLogout}
                  >
                    <Text style={styles.confirmBtnText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  memberSince: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editHeaderBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editHeaderBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  quickVal: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  menuItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 9, 11, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  warningIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#18181B",
  },
  modalMessage: {
    fontSize: 14,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E4E4E7",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#52525B",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#18181B",
    marginTop: 16,
  },
  loadingSub: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 4,
    fontWeight: "500",
  },
});
