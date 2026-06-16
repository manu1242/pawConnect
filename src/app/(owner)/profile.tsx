import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useUpdateProfileMutation } from "../../services/queries/hooks";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function OwnerProfileScreen() {
  const { user, clearAuth, updateUser } = useAuthStore();
  const { showToast } = useUiStore();
  const updateProfileMutation = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Change Password state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);

  const handleUpdateProfile = () => {
    if (!fullName || !phone) {
      showToast("Fields cannot be empty", "info");
      return;
    }

    updateProfileMutation.mutate(
      { fullName, phone },
      {
        onSuccess: () => {
          updateUser({ fullName, phone });
          showToast("Profile updated successfully!", "success");
          setIsEditing(false);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to update profile", "error");
        },
      }
    );
  };

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
        showToast("Password updated successfully!", "success");
        setIsChangingPass(false);
        setOldPassword("");
        setNewPassword("");
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
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || "M"}</Text>
        </View>
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Store Manager Console</Text>
        </View>
      </View>

      {/* Editing Mode or Standard Display */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View>
            <CustomInput
              label="Full Name"
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
            <CustomInput
              label="Phone Number"
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.actionRow}>
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={() => setIsEditing(false)}
                style={styles.flexBtn}
              />
              <CustomButton
                title="Save"
                onPress={handleUpdateProfile}
                loading={updateProfileMutation.isPending}
                style={styles.flexBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoLabel}>Username: {user?.username}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoLabel}>Phone: {user?.phone || "Not set"}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Password Change Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.expandHeader}
          onPress={() => setIsChangingPass(!isChangingPass)}
        >
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Ionicons
            name={isChangingPass ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {isChangingPass && (
          <View style={{ marginTop: 12 }}>
            <CustomInput
              label="Current Password"
              placeholder="Enter current password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <CustomInput
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <CustomButton
              title="Update Password"
              onPress={handleChangePassword}
              loading={loadingPass}
            />
          </View>
        )}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    marginTop: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryLight,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  editLink: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryLight,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  expandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutBtn: {
    marginTop: 12,
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },
});
