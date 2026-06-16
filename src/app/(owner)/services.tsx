import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMyStore, useEditStoreMutation } from "../../services/queries/hooks";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function OwnerServicesScreen() {
  const { data: store, isLoading } = useMyStore();
  const editStoreMutation = useEditStoreMutation();
  const { showToast } = useUiStore();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const handleAddService = () => {
    if (!name || !price) {
      showToast("Service name and price are required", "info");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) {
      showToast("Price must be a valid number", "info");
      return;
    }

    if (!store) return;

    const currentServices = store.services || [];
    const updatedServices = [
      ...currentServices,
      { name, price: priceNum, description },
    ];

    editStoreMutation.mutate(
      { services: updatedServices },
      {
        onSuccess: () => {
          showToast(`Service "${name}" added successfully!`, "success");
          setName("");
          setPrice("");
          setDescription("");
          setIsAdding(false);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to add service", "error");
        },
      }
    );
  };

  const handleDeleteService = (serviceIndex: number) => {
    if (!store) return;
    const currentServices = store.services || [];
    const updatedServices = currentServices.filter((_, idx) => idx !== serviceIndex);

    editStoreMutation.mutate(
      { services: updatedServices },
      {
        onSuccess: () => {
          showToast("Service removed successfully", "success");
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to remove service", "error");
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{isAdding ? "Add Service" : "Manage Services"}</Text>
        {!isAdding && store && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAdding ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <CustomInput
            label="Service Name"
            placeholder="e.g. Premium Grooming"
            value={name}
            onChangeText={setName}
          />
          <CustomInput
            label="Price (₹)"
            placeholder="e.g. 799"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <CustomInput
            label="Description"
            placeholder="e.g. Haircut, wash, and blowdry"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <View style={styles.actions}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={() => setIsAdding(false)}
              style={styles.flexBtn}
            />
            <CustomButton
              title="Add"
              onPress={handleAddService}
              loading={editStoreMutation.isPending}
              style={styles.flexBtn}
            />
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !store ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Register your store first under the "Store" tab to add services.</Text>
        </View>
      ) : !store.services || store.services.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No services listed. Add your first service above!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {store.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.info}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description ? (
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                ) : null}
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteService(index)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  serviceDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 6,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryLight,
  },
  deleteBtn: {
    padding: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  flexBtn: {
    flex: 1,
  },
});
