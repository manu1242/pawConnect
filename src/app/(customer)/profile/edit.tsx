import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../../store/authStore";
import { useUiStore } from "../../../store/uiStore";
import { useUpdateProfileMutation } from "../../../services/queries/hooks";
import { COLORS } from "../../../theme/colors";
import { CustomInput } from "../../../components/common/CustomInput";
import { CustomButton } from "../../../components/common/CustomButton";

export default function EditProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const { showToast } = useUiStore();
  const updateProfileMutation = useUpdateProfileMutation();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("Jane Doe");
  const [emergencyPhone, setEmergencyPhone] = useState("+1 555-0199");

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
          router.back();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to update profile", "error");
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
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <CustomInput label="Full Name" placeholder="Enter full name" value={fullName} onChangeText={setFullName} />
          <CustomInput label="Phone Number" placeholder="Enter phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <CustomButton title="Save Profile Details" onPress={handleUpdateProfile} loading={updateProfileMutation.isPending} />
        </View>

        {/* Address Management */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <Text style={styles.addressText}>123 Main St, New York, NY 10001</Text>
          </View>
          <TouchableOpacity style={styles.inlineActionBtn} onPress={() => Alert.alert("Addresses", "Address management coming soon.")}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.inlineActionText}>Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <CustomInput label="Contact Name" value={emergencyName} onChangeText={setEmergencyName} />
          <CustomInput label="Contact Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
          <CustomButton title="Update Emergency Contact" variant="outline" onPress={() => showToast("Emergency contact saved!", "success")} />
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
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  inlineActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  inlineActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 6,
  },
  row: {
    flexDirection: "row",
  },
  flexBtn: {
    flex: 1,
  },
});
