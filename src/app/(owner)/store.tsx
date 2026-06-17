import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMyStore, useStoreMutation, useEditStoreMutation } from "../../services/queries/hooks";
import { useStoreRegistrationStore } from "../../store/storeRegistrationStore";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function OwnerStoreScreen() {
  const { data: store, isLoading } = useMyStore();
  const registerStoreMutation = useStoreMutation();
  const editStoreMutation = useEditStoreMutation();
  const { showToast } = useUiStore();

  const { formData, updateStoreDetails, updateAddress, updateOwnerDetails, updateCategories, resetStore } = useStoreRegistrationStore();
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields local state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (store) {
      setEditName(store.storeDetails?.name || "");
      setEditDesc(store.storeDetails?.description || "");
    }
  }, [store]);

  const handleRegister = () => {
    const sDetails = formData.storeDetails || {};
    const addr = formData.address || {};
    const hasCategory = formData.storeTypes && formData.storeTypes.length > 0;

    if (!sDetails.name || !hasCategory || !addr.city || !addr.pincode) {
      showToast("Store Name, Category, City, and Pincode are required", "info");
      return;
    }

    const payload = {
      ownerDetails: {
        name: formData.ownerDetails.name || "Owner Name",
        phone: formData.ownerDetails.phone || "9999999999",
        email: formData.ownerDetails.email || "owner@pawconnect.com",
      },
      storeDetails: {
        name: sDetails.name,
        description: sDetails.description || "Premium Pet Care Services",
        category: formData.storeTypes[0] || "Pet Grooming",
      },
      address: {
        city: addr.city,
        pincode: addr.pincode,
        latitude: addr.latitude || 12.9716,
        longitude: addr.longitude || 77.5946,
      },
      services: [],
      businessHours: {},
      paymentMethods: ["Cash", "UPI"],
      facilities: [],
      bookingMode: "instant",
      maxBookingsPerDay: 20,
      is24x7: false,
    };

    registerStoreMutation.mutate(payload, {
      onSuccess: () => {
        showToast("Store registered successfully!", "success");
        resetStore();
      },
      onError: (err: any) => {
        showToast(err?.response?.data?.message || "Failed to register store", "error");
      },
    });
  };

  const handleSaveEdit = () => {
    if (!editName) {
      showToast("Store name cannot be empty", "info");
      return;
    }

    editStoreMutation.mutate(
      {
        storeDetails: {
          ...store?.storeDetails,
          name: editName,
          description: editDesc,
        } as any,
      },
      {
        onSuccess: () => {
          showToast("Store details updated!", "success");
          setIsEditing(false);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to update store details", "error");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Store Setup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!store ? (
          // Registration Form
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Register Your Provider Store</Text>
            <Text style={styles.sub}>Please fill in the details to list your services.</Text>

            <CustomInput
              label="Store Name"
              placeholder="e.g. Bark & Bubble Salon"
              value={formData.storeDetails?.name || ""}
              onChangeText={(val) => updateStoreDetails({ name: val })}
            />

            <CustomInput
              label="Category"
              placeholder="e.g. Pet Grooming / Veterinary Clinic"
              value={formData.storeTypes?.[0] || ""}
              onChangeText={(val) => updateCategories([val])}
            />

            <CustomInput
              label="Description"
              placeholder="Describe your services..."
              value={formData.storeDetails?.description || ""}
              onChangeText={(val) => updateStoreDetails({ description: val })}
              multiline
            />

            <View style={styles.row}>
              <CustomInput
                label="City"
                placeholder="e.g. Bengaluru"
                value={formData.address?.city || ""}
                onChangeText={(val) => updateAddress({ city: val })}
                containerStyle={{ flex: 1 }}
              />
              <CustomInput
                label="Pincode"
                placeholder="e.g. 560038"
                value={formData.address?.pincode || ""}
                onChangeText={(val) => updateAddress({ pincode: val })}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
            </View>

            <CustomButton
              title="Register Store"
              onPress={handleRegister}
              loading={registerStoreMutation.isPending}
              style={{ marginTop: 8 }}
            />
          </View>
        ) : (
          // Registered Store Details
          <View style={styles.card}>
            <View style={styles.infoHeader}>
              <Text style={styles.cardTitle}>Store Profile</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Ionicons name="create-outline" size={20} color={COLORS.primaryLight} />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View>
                <CustomInput
                  label="Store Name"
                  placeholder="Store Name"
                  value={editName}
                  onChangeText={setEditName}
                />
                <CustomInput
                  label="Description"
                  placeholder="Description"
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                />
                <View style={styles.actionsRow}>
                  <CustomButton
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsEditing(false)}
                    style={styles.flexBtn}
                  />
                  <CustomButton
                    title="Save"
                    onPress={handleSaveEdit}
                    loading={editStoreMutation.isPending}
                    style={styles.flexBtn}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Store Name:</Text>
                  <Text style={styles.detailVal}>{store.storeDetails?.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailVal}>{store.storeDetails?.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailVal}>
                    {store.address ? (typeof store.address === "string" ? store.address : `${store.address.city || ""} (${store.address.pincode || ""})`) : "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRowCol}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailDesc}>{store.storeDetails?.description}</Text>
                </View>
              </View>
            )}
          </View>
        )}
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
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  flexBtn: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  detailsList: {
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  detailRowCol: {
    flexDirection: "column",
    gap: 4,
    paddingBottom: 10,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  detailVal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  detailDesc: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
});
