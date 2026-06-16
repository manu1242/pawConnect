import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../../services/queries/hooks";
import { useBookingStore } from "../../../store/bookingStore";
import { useUiStore } from "../../../store/uiStore";
import { COLORS } from "../../../theme/colors";
import { CustomButton } from "../../../components/common/CustomButton";

export default function StoreDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: store, isLoading } = useStoreDetails(id as string);
  const { setBookingDraft } = useBookingStore();
  const { openModal } = useUiStore();

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Store details not found.</Text>
        <CustomButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const details = store.storeDetails || {};
  const name = store.name || details.name || "Happy Paws";
  const category = store.storeTypes?.[0] || details.category || "Pet Store";
  const description = store.description || details.description || "Professional pet services";
  const bannerUri = store.banner || store.bannerImage || store.logo || details.images?.[0] || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80";
  const services = store.services || [];

  let addressText = "";
  if (typeof store.address === "string") {
    addressText = store.address;
  } else if (store.address) {
    const addr = store.address as any;
    addressText = `${addr.area ? `${addr.area}, ` : ""}${addr.city}${addr.pincode ? ` - ${addr.pincode}` : ""}`;
  }

  const ratingText = store.rating !== undefined && store.rating > 0 
    ? `${Number(store.rating.toFixed(1))} (${store.totalReviews || 0} Reviews)` 
    : "4.8 (24 Reviews)";

  const handleBookService = (service: any) => {
    setBookingDraft({
      storeId: store.id || store._id,
      storeName: name,
      serviceName: service.name,
      serviceId: service._id || service.id,
      serviceMode: store.serviceMode || "store",
      price: service.price,
    });
    router.push("/booking-wizard" as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: bannerUri,
          }}
          style={styles.banner}
        />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoSection}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color={COLORS.warning} />
          <Text style={styles.ratingText}>{ratingText}</Text>
          <TouchableOpacity
            style={styles.reviewLink}
            onPress={() => openModal("ratingReview", { storeName: name, storeId: store.id || store._id })}
          >
            <Text style={styles.reviewLinkText}>Rate Provider</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={18} color={COLORS.primaryLight} />
          <Text style={styles.metaText}>{addressText || "Address not available"}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.primaryLight} />
          <Text style={styles.metaText}>Available Mon - Sat (9:00 AM - 6:00 PM)</Text>
        </View>
      </View>

      {/* Services List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        {services.length === 0 ? (
          <Text style={styles.emptyText}>No services listed by provider.</Text>
        ) : (
          services.map((service: any, index: number) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceLeft}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc}>{service.description || "Professional pet service"}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
              <CustomButton
                title="Book"
                onPress={() => handleBookService(service)}
                style={styles.bookBtn}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  bannerContainer: {
    position: "relative",
    height: 220,
    width: "100%",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  backBtn: {
    position: "absolute",
    top: 24,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  category: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryLight,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 4,
  },
  reviewLink: {
    marginLeft: 16,
  },
  reviewLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryLight,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: "italic",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  serviceLeft: {
    flex: 1,
    marginRight: 16,
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
  bookBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
