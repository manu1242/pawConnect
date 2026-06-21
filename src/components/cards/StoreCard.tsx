import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Store } from "../../types";
import { COLORS, SHADOWS } from "../../theme/colors";

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  horizontal?: boolean;
  distance?: number;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onPress, horizontal = false, distance }) => {
  const rating = store.rating !== undefined ? Number(store.rating.toFixed(1)) : 0;
  const reviewCount = store.totalReviews || 0;

  const storeDetails = store.storeDetails || {};
  const name = store.name || storeDetails.name || "Happy Paws";
  const category = store.storeTypes?.[0] || storeDetails.category || "Pet Store";
  
  // Resolve banner and logo with elegant defaults
  const bannerUri = store.banner || store.bannerImage || storeDetails.images?.[0] || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80";
  const logoUri = store.logo || store.logoImage || storeDetails.logo || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&q=80";

  let addressText = "Bengaluru";
  if (typeof store.address === "string") {
    const details = store.addressDetails || {};
    if (details.city) {
      addressText = details.area ? `${details.area}, ${details.city}` : details.city;
    } else {
      addressText = store.address;
    }
  } else if (store.address) {
    const addr = store.address as any;
    addressText = addr.area ? `${addr.area}, ${addr.city}` : addr.city || "Bengaluru";
  }

  // Format distance
  const distanceFormatted = distance !== undefined 
    ? `${distance.toFixed(1)} km away` 
    : undefined;

  const isStoreFeatured = store.isFeatured === true;

  return (
    <TouchableOpacity
      style={[styles.card, horizontal ? styles.cardHorizontal : styles.cardVertical]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: bannerUri }}
          style={horizontal ? styles.imageHorizontal : styles.imageVertical}
        />
        {/* Floating Logo Avatar */}
        <Image
          source={{ uri: logoUri }}
          style={styles.logoAvatar}
        />
        {/* Featured Store Pill Overlay */}
        {isStoreFeatured && (
          <View style={styles.featuredBadgeOverlay}>
            <Ionicons name="star" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={styles.featuredBadgeText}>Featured Store</Text>
          </View>
        )}
        {/* Status Badge Overlay if not approved */}
        {store.status && store.status.toLowerCase() !== "approved" && (
          <View style={[
            styles.statusBadgeOverlay,
            { backgroundColor: store.status.toLowerCase() === "pending" ? "#F59E0B" : "#EF4444" }
          ]}>
            <Text style={styles.statusBadgeText}>{store.status}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.categoryRow}>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={COLORS.warning} />
            <Text style={styles.ratingText}>{rating > 0 ? rating : "4.5"}</Text>
            <Text style={styles.reviewsText}>({reviewCount} reviews)</Text>
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {addressText} {distanceFormatted ? `• ${distanceFormatted}` : ""}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.statusOpen}>Open Now</Text>
          {distanceFormatted && (
            <Text style={styles.distanceTextSmall}>{distanceFormatted}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  featuredBadgeOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadgeOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  distanceTextSmall: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  cardHorizontal: {
    width: 325,
    marginRight: 16,
  },
  cardVertical: {
    width: "100%",
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
  },
  logoAvatar: {
    position: "absolute",
    bottom: -18,
    left: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageHorizontal: {
    height: 120,
    width: "100%",
  },
  imageVertical: {
    height: 150,
    width: "100%",
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 24, // Extra top spacing for the overlapping logo
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryLight,
    textTransform: "uppercase",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  reviewsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusOpen: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.success,
  },
});
