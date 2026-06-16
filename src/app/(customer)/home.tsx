import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useStores } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";
import { StoreCard } from "../../components/cards/StoreCard";

const CATEGORIES = [
  { id: "grooming", name: "Grooming", icon: "cut-outline" },
  { id: "vet", name: "Vet Clinic", icon: "medical-outline" },
  { id: "boarding", name: "Boarding", icon: "home-outline" },
  { id: "training", name: "school-outline" },
];

export default function CustomerHomeScreen() {
  const { user } = useAuthStore();
  const { openModal } = useUiStore();
  const { data: stores = [], isLoading } = useStores();
  const [search, setSearch] = useState("");

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: "/stores" as any,
      params: { category },
    });
  };

  const handleSearchSubmit = () => {
    router.push({
      pathname: "/stores" as any,
      params: { search },
    });
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning 🐾";
    if (hrs < 18) return "Good afternoon 🐾";
    return "Good evening 🐾";
  };

  // Extract featured stores
  const featuredStores = stores.filter((item: any) => item.isFeatured === true || (item.rating && item.rating >= 4.7));
  const finalFeatured = featuredStores.length > 0 ? featuredStores : stores.slice(0, 4);

  // Listing stores showing below (all other stores or fallback to all)
  const listingStores = stores.filter((item: any) => {
    const itemId = item.id || item._id;
    return !finalFeatured.some((f: any) => (f.id || f._id) === itemId);
  });
  
  const finalListing = listingStores.length > 0 ? listingStores : stores;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>{getGreeting()}</Text>
          <Text style={styles.name}>Hi, {user?.fullName?.split(" ")[0] || "Manohar"}!</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => router.push("/(customer)/notifications" as any)}>
          <Ionicons name="notifications-outline" size={22} color="#27272A" />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search grooming, vets, boarding..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Promo Banner / Carousel */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerLabel}>LIMITED OFFER</Text>
            <Text style={styles.bannerTitle}>30% Off Grooming Sessions Today</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => handleCategoryPress("Grooming")}>
              <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.bannerBtnText}>Book now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerRight}>
            <Ionicons name="cut-outline" size={80} color="rgba(255, 255, 255, 0.2)" />
          </View>
        </View>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Section: Featured Stores (Horizontal Scroll) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Stores</Text>
        <TouchableOpacity onPress={() => router.push("/stores" as any)}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
      ) : finalFeatured.length === 0 ? (
        <Text style={styles.emptyText}>No featured stores available.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalList}
          contentContainerStyle={{ gap: 4, paddingRight: 20 }}
        >
          {finalFeatured.map((item) => {
            const storeId = item.id || (item as any)._id;
            return (
              <StoreCard
                key={`featured-${storeId}`}
                store={item}
                horizontal
                onPress={() => router.push(`/store/${storeId}` as any)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Section: Services */}
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.servicesContainer}>
        {CATEGORIES.map((cat, index) => {
          const names = ["Grooming", "Vet Clinic", "Boarding", "Training"];
          const label = names[index];
          const iconName = 
            cat.id === "grooming" ? "cut-outline" :
            cat.id === "vet" ? "medical-outline" :
            cat.id === "boarding" ? "home-outline" : "school-outline";

          return (
            <TouchableOpacity
              key={cat.id || `cat-${index}`}
              style={styles.serviceItem}
              onPress={() => handleCategoryPress(label)}
            >
              <View style={styles.serviceIconWrapper}>
                <Ionicons name={iconName as any} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.serviceText}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section: Nearby Stores */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Text style={styles.sectionTitle}>Nearby Stores</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
      ) : finalListing.length === 0 ? (
        <Text style={styles.emptyText}>No stores available nearby.</Text>
      ) : (
        <View style={styles.verticalListContainer}>
          {finalListing.map((item) => {
            const storeId = item.id || (item as any)._id;
            return (
              <StoreCard
                key={`nearby-${storeId}`}
                store={item}
                onPress={() => router.push(`/store/${storeId}` as any)}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: "#27272A",
    marginTop: 2,
  },
  bellBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F4F4F5",
  },
  bellBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    color: "#27272A",
    fontSize: 14,
    fontWeight: "500",
  },
  bannerContainer: {
    marginBottom: 28,
  },
  banner: {
    flexDirection: "row",
    backgroundColor: "#FF8E53",
    borderRadius:14,
    padding: 20,
    height: 145,
    overflow: "hidden",
  },
  bannerLeft: {
    flex: 1.3,
    justifyContent: "center",
  },
  bannerLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    opacity: 0.9,
    marginBottom: 4,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 12,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bannerRight: {
    flex: 0.7,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E4E4E7",
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#27272A",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  horizontalList: {
    marginBottom: 28,
  },
  servicesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  serviceItem: {
    alignItems: "center",
    width: "22%",
  },
  serviceIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F4F4F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#27272A",
    textAlign: "center",
  },
  verticalListContainer: {
    gap: 4,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginVertical: 12,
    fontStyle: "italic",
  },
});
