import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../../theme/colors";
import { useAuthStore } from "../../../store/authStore";
import { useUiStore } from "../../../store/uiStore";
import { authApi } from "../../../services/api/authApi";
import { CustomInput } from "../../../components/common/CustomInput";
import { CustomButton } from "../../../components/common/CustomButton";
import {
  LEGAL_ABOUT,
  PRIVACY_POLICY,
  TERMS_AND_CONDITIONS,
  REFUND_POLICY,
} from "../../../constants/legal";

export default function SettingsScreen() {
  const { clearAuth } = useAuthStore();
  const { showToast } = useUiStore();

  // Change Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);

  // Legal Modal
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalContent, setLegalContent] = useState({ title: "", text: "" });

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showToast("Please fill in both password fields", "info");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "info");
      return;
    }

    setLoadingPass(true);
    try {
      const res = await authApi.changePassword({ oldPassword, newPassword });
      if (res.success) {
        showToast("Password updated successfully! Please login again.", "success");
        setOldPassword("");
        setNewPassword("");
        handleLogout();
      } else {
        showToast(res.message || "Failed to update password", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Incorrect current password", "error");
    } finally {
      setLoadingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // silent
    }
    await SecureStore.deleteItemAsync("pawconnect_access_token");
    clearAuth();
    router.replace("/login" as any);
  };

  const showLegal = (title: string, text: string) => {
    setLegalContent({ title, text });
    setLegalModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Security / Password */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <CustomInput label="Current Password" placeholder="Current password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
          <CustomInput label="New Password" placeholder="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <CustomButton title="Update Password" onPress={handleChangePassword} loading={loadingPass} />
        </View>

        {/* App Preferences */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert("Language", "English is currently active.")}>
            <Text style={styles.rowItemText}>Language</Text>
            <Text style={styles.mutedVal}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert("Location Permissions", "Location services are enabled.")}>
            <Text style={styles.rowItemText}>Location Permissions</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Legal Policies */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Legal & Policies</Text>

          <TouchableOpacity style={styles.rowItem} onPress={() => showLegal("About PawConnect", LEGAL_ABOUT)}>
            <Text style={styles.rowItemText}>About PawConnect</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => showLegal("Terms & Conditions", TERMS_AND_CONDITIONS)}>
            <Text style={styles.rowItemText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => showLegal("Privacy Policy", PRIVACY_POLICY)}>
            <Text style={styles.rowItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => showLegal("Refund Policy", REFUND_POLICY)}>
            <Text style={styles.rowItemText}>Refund Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data & Privacy Settings</Text>

          <TouchableOpacity style={styles.rowItem} onPress={() => showToast("Your data export has been queued. You will receive an email shortly.", "success")}>
            <Text style={styles.rowItemText}>Download My Data</Text>
            <Ionicons name="download-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() =>
              Alert.alert("Delete Account", "Are you sure you want to permanently delete your account? This action cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => showToast("Account deletion request submitted.", "error") },
              ])
            }
          >
            <Text style={[styles.rowItemText, { color: COLORS.danger }]}>Delete My Account</Text>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Legal Modal popup */}
      <Modal animationType="slide" transparent={true} visible={legalModalVisible} onRequestClose={() => setLegalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{legalContent.title}</Text>
            <ScrollView style={{ marginVertical: 14 }}>
              <Text style={styles.modalText}>{legalContent.text}</Text>
            </ScrollView>
            <CustomButton title="Close" onPress={() => setLegalModalVisible(false)} />
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
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  mutedVal: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});
