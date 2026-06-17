import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../../../services/queries/hooks";
import { useBookingStore } from "../../../../store/bookingStore";
import { COLORS } from "../../../../theme/colors";
import { CustomButton } from "../../../../components/common/CustomButton";

export default function SelectServicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: store, isLoading, error } = useStoreDetails(id);
  const { bookingDraft, setBookingDraft } = useBookingStore();

  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !store) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load services.</Text>
        <CustomButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const services = store.services || [];

  const toggleSelect = (service: any) => {
    const sId = service._id || service.id;
    if (selectedServices.find(s => (s._id || s.id) === sId)) {
      setSelectedServices(selectedServices.filter(s => (s._id || s.id) !== sId));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const toggleExpand = (sId: string) => {
    if (expandedServices.includes(sId)) {
      setExpandedServices(expandedServices.filter(id => id !== sId));
    } else {
      setExpandedServices([...expandedServices, sId]);
    }
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce((sum, s) => {
      const finalPrice = s.offerEnabled ? Math.max(0, s.price - (s.discountAmount || 0)) : s.price;
      return sum + finalPrice;
    }, 0);
  };

  const handleProceed = () => {
    if (selectedServices.length === 0) return;

    const selectedServicesPayload = selectedServices.map((s: any) => ({
      serviceId: s._id || s.id,
      name: s.name,
      price: s.offerEnabled ? Math.max(0, s.price - (s.discountAmount || 0)) : s.price,
    }));

    const totalPrice = calculateTotalPrice();

    setBookingDraft({
      storeId: store.id || store._id,
      storeName: store.name,
      serviceName: selectedServices.map((s: any) => s.name).join(", "),
      serviceId: selectedServices[0]._id || selectedServices[0].id,
      selectedServices: selectedServicesPayload,
      serviceMode: store.serviceMode || "store",
      price: totalPrice,
    });

    router.push("/booking-wizard" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Services</Text>
          <Text style={styles.headerSub}>{store.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Available Services</Text>
        <Text style={styles.sectionSub}>Select one or more services to configure your booking</Text>

        {services.length === 0 ? (
          <Text style={styles.emptyText}>No services available at this store.</Text>
        ) : (
          services.map((service: any) => {
            const sId = service._id || service.id;
            const isSelected = !!selectedServices.find(s => (s._id || s.id) === sId);
            const isExpanded = expandedServices.includes(sId);

            // Compute prices
            const price = service.price || 0;
            const offerEnabled = !!service.offerEnabled;
            const discountAmount = service.discountAmount || 0;
            const finalPrice = offerEnabled ? Math.max(0, price - discountAmount) : price;

            return (
              <View
                key={sId}
                style={[
                  styles.serviceCard,
                  isSelected && styles.serviceCardActive,
                ]}
              >
                {/* Header Row */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(sId)}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleSelect(service)}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={24}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Service Core Info */}
                  <View style={styles.metaContainer}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>🕒 {service.duration || "60 min"}</Text>
                  </View>

                  {/* Price */}
                  <View style={styles.priceContainer}>
                    {offerEnabled && discountAmount > 0 ? (
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.originalPrice}>₹{price}</Text>
                        <Text style={styles.finalPrice}>₹{finalPrice}</Text>
                      </View>
                    ) : (
                      <Text style={styles.finalPrice}>₹{price}</Text>
                    )}
                  </View>

                  {/* Expand Chevron */}
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={COLORS.textMuted}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {/* Expanded Section */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.description}>{service.description || "No description provided."}</Text>

                    {offerEnabled && service.offerTitle ? (
                      <View style={styles.offerBadge}>
                        <Ionicons name="gift-outline" size={14} color="#7E22CE" />
                        <Text style={styles.offerText}>
                          {service.offerType || "Special Offer"}: {service.offerTitle} (Save ₹{discountAmount})
                        </Text>
                      </View>
                    ) : null}

                    {/* Includes Badges */}
                    {service.includes && service.includes.length > 0 && (
                      <View style={styles.inclusionsSection}>
                        <Text style={styles.sectionHeading}>What's Included:</Text>
                        <View style={styles.badgesContainer}>
                          {service.includes.map((inc: string, idx: number) => (
                            <View key={`${inc}-${idx}`} style={styles.badge}>
                              <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                              <Text style={styles.badgeText}>{inc}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Suitability / Mode */}
                    <View style={styles.additionalMeta}>
                      <Text style={styles.metaItem}>
                        🐱 Suitable for: <Text style={styles.boldText}>{service.petTypes?.join(", ") || "All Pets"}</Text>
                      </Text>
                      <Text style={styles.metaItem}>
                        🏡 Home Service: <Text style={styles.boldText}>{service.homeServiceAvailable ? "Available" : "Not Available"}</Text>
                      </Text>
                      {service.emergencyAvailable && (
                        <Text style={styles.metaItem}>
                          🚨 Emergency: <Text style={styles.boldText}>Available</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Footer */}
      {selectedServices.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerPriceContainer}>
            <Text style={styles.footerItemCount}>{selectedServices.length} service(s) selected</Text>
            <Text style={styles.footerPrice}>Total: ₹{calculateTotalPrice()}</Text>
          </View>
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <Text style={styles.proceedButtonText}>Choose Pet</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  serviceCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}04`,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 12,
  },
  metaContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  serviceDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
    marginBottom: 12,
  },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  offerText: {
    fontSize: 12,
    color: "#7E22CE",
    fontWeight: "600",
    marginLeft: 6,
  },
  inclusionsSection: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    color: "#15803D",
    fontWeight: "600",
    marginLeft: 4,
  },
  additionalMeta: {
    marginTop: 6,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  metaItem: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  boldText: {
    fontWeight: "600",
    color: COLORS.text,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerItemCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
