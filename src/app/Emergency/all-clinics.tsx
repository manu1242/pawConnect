import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput, SafeAreaView } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStores } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

export default function AllClinicsScreen() {
  const { data: stores = [], isLoading } = useStores();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter only veterinary clinics
  const clinics = stores.filter((s: any) => {
    const isVet = 
      s.category === "Vet Clinic" || 
      s.category === "vet" || 
      s.storeTypes?.includes("Veterinary") || 
      s.storeTypes?.includes("Emergency Care") || 
      s.isEmergencyAvailable ||
      s.services?.some((srv: any) => srv.name?.toLowerCase().includes("vet") || srv.name?.toLowerCase().includes("emergency"));
    
    if (!isVet) return false;

    if (searchQuery.trim() === "") return true;

    const addressText = typeof s.address === "string" 
      ? s.address 
      : s.address 
        ? [s.address.street, s.address.area, s.address.city, s.address.pincode].filter(Boolean).join(", ")
        : "";
    const cityText = s.city || s.addressDetails?.city || (typeof s.address !== "string" ? s.address?.city : "") || "";

    return s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           addressText.toLowerCase().includes(searchQuery.toLowerCase()) ||
           cityText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderClinicCard = ({ item }: { item: any }) => {
    const clinicId = item.id || item._id;
    const isOpen = item.status !== "Closed";
    const logoUrl = item.logo || item.logoImage || item.banner || item.bannerImage || item.images?.[0] || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500";

    // Simulate consultation price and discounts
    const currentPrice = item.price || 499;
    const originalPrice = currentPrice * 3;
    const discount = "66% OFF";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: "/Emergency/vet-details", params: { id: clinicId } } as any)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: logoUrl }} style={styles.cardImage} />
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)" }]}>
            <Text style={styles.statusText}>{isOpen ? "OPEN NOW" : "CLOSED"}</Text>
          </View>

          {/* Overlaid Rating Pill */}
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillText}>{item.rating || "4.8"}</Text>
            <Ionicons name="star" size={10} color="#10B981" style={{ marginLeft: 2, marginRight: 4 }} />
            <Text style={styles.ratingDivider}>|</Text>
            <Text style={styles.ratingCountText}>{(item.reviewsCount || 120) + "+"}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          {/* Clinic Brand Name (Uppercase bold) */}
          <Text style={styles.cardBrandName} numberOfLines={1}>{item.name?.toUpperCase()}</Text>
          
          {/* Clinic Subtitle / Address */}
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.category || "General Veterinary Care"}
          </Text>

          {/* Consultation Fee / Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.activePrice}>₹{currentPrice}</Text>
            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
            <Text style={styles.discountPercent}>{discount}</Text>
          </View>

          {/* Express Triage Tag */}
          <View style={styles.expressRow}>
            <Ionicons name="flash" size={10} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 2 }} />
            <Text style={styles.expressText}>EXPRESS | Response in 15 mins</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Veterinary Clinics</Text>
          {!isLoading && <Text style={styles.headerSubtitle}>{clinics.length} clinics available</Text>}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.emergencyTextMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search veterinary clinics..."
            placeholderTextColor={COLORS.emergencyTextMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.emergencyTextMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.emergencyPrimaryOrange} />
          <Text style={styles.loadingText}>Loading all veterinary clinics...</Text>
        </View>
      ) : clinics.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search" size={48} color={COLORS.emergencyBorder} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No veterinary clinics found matching your search.</Text>
        </View>
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderClinicCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    height: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    color: COLORS.emergencyTextMuted,
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    overflow: "hidden",
  },
  imageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
    backgroundColor: COLORS.emergencySurfaceLight,
  },
  cardImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  ratingPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingPillText: {
    color: "#111111",
    fontSize: 9,
    fontWeight: "800",
  },
  ratingDivider: {
    color: "#777777",
    fontSize: 9,
    marginHorizontal: 3,
  },
  ratingCountText: {
    color: "#555555",
    fontSize: 9,
    fontWeight: "700",
  },
  cardContent: {
    padding: 10,
  },
  cardBrandName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: COLORS.emergencyTextMuted,
    fontSize: 10,
    marginTop: 3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  activePrice: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  originalPrice: {
    color: COLORS.emergencyTextMuted,
    fontSize: 10,
    textDecorationLine: "line-through",
    marginHorizontal: 6,
  },
  discountPercent: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 10,
    fontWeight: "800",
  },
  expressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.emergencyBorder,
    paddingTop: 8,
  },
  expressText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
