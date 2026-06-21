import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Dimensions, Animated } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../../services/queries/hooks";
import { useStoresCacheStore } from "../../store/storesCacheStore";
import { COLORS } from "../../theme/colors";
import { StoreCard } from "../../components/cards/StoreCard";
import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../services/axios/axiosClient";

const ProductCard = ({ product, storeName, onPressStore }: { product: any; storeName: string; onPressStore: () => void }) => {
  const price = product.price || 0;
  const image = product.images?.[0] || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&q=80";

  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <View style={styles.itemHeaderRow}>
          <Text style={styles.itemBadge}>{product.category}</Text>
          <Text style={styles.itemPrice}>₹{price}</Text>
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{product.description || "High quality supplies for your pets."}</Text>
        <TouchableOpacity style={styles.itemStoreRow} onPress={onPressStore}>
          <Ionicons name="storefront-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.itemStoreText} numberOfLines={1}>{storeName}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const screenWidth = Dimensions.get("window").width;

const SkeletonPulse = ({ style }: { style: any }) => {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return <Animated.View style={[style, { opacity: pulseAnim }]} />;
};

function HomeSkeleton() {
  return (
    <ScrollView style={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.skeletonHeader}>
        <View>
          <SkeletonPulse style={styles.skeletonGreeting} />
          <SkeletonPulse style={styles.skeletonName} />
        </View>
        <SkeletonPulse style={styles.skeletonBell} />
      </View>

      {/* Search Bar Skeleton */}
      <SkeletonPulse style={styles.skeletonSearch} />

      {/* Emergency Banner Skeleton */}
      <SkeletonPulse style={styles.skeletonEmergencyBanner} />

      {/* Section Title Featured */}
      <View style={styles.skeletonSectionHeader}>
        <SkeletonPulse style={styles.skeletonSectionTitle} />
      </View>

      {/* Featured Horizontal List Skeleton */}
      <View style={styles.skeletonHorizontalRow}>
        <SkeletonPulse style={styles.skeletonStoreCardHorizontal} />
        <SkeletonPulse style={styles.skeletonStoreCardHorizontal} />
      </View>

      {/* Section Title Services */}
      <View style={styles.skeletonSectionHeader}>
        <SkeletonPulse style={styles.skeletonSectionTitle} />
      </View>

      {/* Services Circles Row Skeleton */}
      <View style={styles.skeletonServicesRow}>
        <View style={styles.skeletonServiceCol}>
          <SkeletonPulse style={styles.skeletonServiceCircle} />
          <SkeletonPulse style={styles.skeletonServiceText} />
        </View>
        <View style={styles.skeletonServiceCol}>
          <SkeletonPulse style={styles.skeletonServiceCircle} />
          <SkeletonPulse style={styles.skeletonServiceText} />
        </View>
        <View style={styles.skeletonServiceCol}>
          <SkeletonPulse style={styles.skeletonServiceCircle} />
          <SkeletonPulse style={styles.skeletonServiceText} />
        </View>
        <View style={styles.skeletonServiceCol}>
          <SkeletonPulse style={styles.skeletonServiceCircle} />
          <SkeletonPulse style={styles.skeletonServiceText} />
        </View>
      </View>

      {/* Section Title Nearby */}
      <View style={styles.skeletonSectionHeader}>
        <SkeletonPulse style={styles.skeletonSectionTitle} />
      </View>

      {/* Nearby Stores Vertical Skeleton */}
      <SkeletonPulse style={styles.skeletonStoreCardVertical} />
      <SkeletonPulse style={styles.skeletonStoreCardVertical} />
    </ScrollView>
  );
}

const CUSTOMER_LAT = 12.9716;
const CUSTOMER_LON = 77.5946;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const getStoreDistance = (store: any) => {
  const lat = store.latitude || store.location?.latitude || store.location?.coordinates?.[1];
  const lon = store.longitude || store.location?.longitude || store.location?.coordinates?.[0];
  if (lat && lon) {
    return calculateDistance(CUSTOMER_LAT, CUSTOMER_LON, Number(lat), Number(lon));
  }
  // deterministic fallback distance based on store name hash
  const nameStr = store.name || "";
  const hash = nameStr.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return (hash % 8) + 0.8;
};

export default function CustomerHomeScreen() {
  const { user } = useAuthStore();
  const { cachedStores, setCachedStores } = useStoresCacheStore();
  const { data: fetchedStores, isLoading } = useStores();
  const [search, setSearch] = useState("");

  // Stale-while-revalidate pattern: use cached stores if fresh ones are loading
  const stores = (fetchedStores && fetchedStores.length > 0) ? fetchedStores : cachedStores;
  const isStoresLoading = isLoading && stores.length === 0;

  // Fetch module products globally
  const { data: allProducts = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["global-products"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/products");
      return res.data?.data?.products || [];
    }
  });

  useEffect(() => {
    if (fetchedStores && fetchedStores.length > 0) {
      setCachedStores(fetchedStores);
    }
  }, [fetchedStores]);

  if (isStoresLoading) {
    return <HomeSkeleton />;
  }

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

  // Filter approved stores (only filter out blocked/rejected stores)
  const approvedStores = stores.filter((item: any) => {
    if (!item.status) return true;
    const status = item.status.toLowerCase();
    return status !== "rejected" && status !== "blocked" && status !== "suspended";
  });

  const getStoreName = (storeId: string) => {
    const store = approvedStores.find((s: any) => (s._id || s.id) === storeId);
    return store ? store.name : "Happy Paws Store";
  };

  // Extract featured stores: Only show actual featured stores
  const finalFeatured = approvedStores.filter((item: any) => {
    return item.isFeatured === true;
  });

  // Extract nearby stores: Approved, sorted by nearest first
  const nearbyStores = [...approvedStores].sort((a: any, b: any) => {
    return getStoreDistance(a) - getStoreDistance(b);
  });

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
          placeholder="Search stores, services, products..."
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

      {/* Redesigned Veterinary Care & Emergency Assistance Redirection Banner */}
      <TouchableOpacity
        style={styles.emergencyBanner}
        activeOpacity={0.95}
        onPress={() => router.replace("/Emergency/home" as any)}
      >
        <View style={styles.emergencyBannerHeader}>
          <View style={styles.emergencyBadge}>
            <Text style={styles.emergencyBadgeText}>VET & EMERGENCY ASSISTANCE</Text>
          </View>
          <Ionicons name="pulse" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.emergencyBannerTitle}>PawConnect Redesign Experience</Text>
        <Text style={styles.emergencyBannerSub}>
          Helping pet parents find trusted veterinary care, book instant appointments, and get emergency pet assistance.
        </Text>
        <View style={styles.emergencyBannerBtn}>
          <Text style={styles.emergencyBannerBtnText}>Switch to Vet & Emergency Mode</Text>
          <Ionicons name="arrow-forward" size={14} color="#E53935" style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>

      {/* Categories Section - Services */}
      <View style={[styles.sectionHeader, { marginBottom: 12, marginTop: 4 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Pet Services</Text>
          <Text style={styles.sectionSubtitleText}>Book trusted services for your furry friend 🐾</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalServicesContainer}
        style={{ marginBottom: 20 }}
      >
        {[
          { id: "Veterinary", label: "Veterinary", icon: "pulse-outline", bg: "#F0F6FF", color: "#3B82F6" },
          { id: "Grooming", label: "Grooming", icon: "cut-outline", bg: "#FFF8F6", color: "#FF6B35" },
          { id: "Dog Walking", label: "Dog Walking", icon: "walk-outline", bg: "#FFFDF2", color: "#D97706" },
          { id: "Boarding", label: "Boarding", icon: "home-outline", bg: "#F0FDF4", color: "#16A34A" },
          { id: "Training", label: "Training", icon: "school-outline", bg: "#FAF5FF", color: "#7C3AED" },
          { id: "Emergency Care", label: "Emergency", icon: "alert-circle-outline", bg: "#FFF5F5", color: "#EF4444" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.circularServiceItem}
            onPress={() => handleCategoryPress(item.id)}
          >
            <View style={[styles.circularIconWrapper, { backgroundColor: item.bg, borderColor: `${item.color}25` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.circularServiceText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Categories Section - Products */}
      <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Pet Supplies</Text>
          <Text style={styles.sectionSubtitleText}>High-quality supplies for everyday pet care 🛍️</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalServicesContainer}
        style={{ marginBottom: 24 }}
      >
        {[
          { id: "Food", label: "Food", icon: "paw-outline", bg: "#FEF3C7", color: "#D97706" },
          { id: "Toys", label: "Toys", icon: "football-outline", bg: "#ECFDF5", color: "#059669" },
          { id: "Medicines", label: "Medicines", icon: "bandage-outline", bg: "#F3F4F6", color: "#6B7280" },
          { id: "Accessories", label: "Accessories", icon: "ribbon-outline", bg: "#FDF2F8", color: "#DB2777" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.circularServiceItem}
            onPress={() => handleCategoryPress(item.id)}
          >
            <View style={[styles.circularIconWrapper, { backgroundColor: item.bg, borderColor: `${item.color}25` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.circularServiceText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section: Featured Stores (Horizontal Scroll) */}
      {finalFeatured.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Stores</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: "/stores", params: { featured: "true" } } as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
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
                  distance={getStoreDistance(item)}
                  onPress={() => router.push(`/store/${storeId}` as any)}
                />
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Section: Stores (Horizontal Scroll) */}
      <View style={[styles.sectionHeader, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>Stores</Text>
        <TouchableOpacity onPress={() => router.push("/stores" as any)}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {isStoresLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
      ) : nearbyStores.length === 0 ? (
        <Text style={styles.emptyText}>No stores available.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalList}
          contentContainerStyle={{ gap: 4, paddingRight: 20 }}
        >
          {nearbyStores.map((item) => {
            const storeId = item.id || (item as any)._id;
            return (
              <StoreCard
                key={`nearby-${storeId}`}
                store={item}
                horizontal
                distance={getStoreDistance(item)}
                onPress={() => router.push(`/store/${storeId}` as any)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Section: Popular Products (Vertical List) */}
      <View style={[styles.sectionHeader, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>Popular Products</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: "/stores", params: { tab: "products" } } as any)}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {isProductsLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 24 }} />
      ) : allProducts.length === 0 ? (
        <Text style={styles.emptyText}>No products available.</Text>
      ) : (
        <View style={styles.verticalListContainer}>
          {allProducts.slice(0, 6).map((item: any) => {
            const storeId = item.storeId;
            return (
              <ProductCard
                key={`prod-${item._id || item.id}`}
                product={item}
                storeName={getStoreName(storeId)}
                onPressStore={() => {
                  if (storeId) {
                    router.push(`/store/${storeId}` as any);
                  }
                }}
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
  sectionSubtitleText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  seeAllServicesText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
    marginRight: 2,
  },
  horizontalServicesContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 4,
  },
  circularServiceItem: {
    alignItems: "center",
    width: 74,
  },
  circularIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  circularServiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#27272A",
    marginTop: 6,
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
  emergencyBanner: {
    backgroundColor: "#E53935",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emergencyBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emergencyBannerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  emergencyBannerSub: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  emergencyBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  emergencyBannerBtnText: {
    color: "#E53935",
    fontSize: 12,
    fontWeight: "700",
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  skeletonGreeting: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E4E4E7",
  },
  skeletonName: {
    width: 160,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E4E4E7",
    marginTop: 6,
  },
  skeletonBell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E4E4E7",
  },
  skeletonSearch: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E4E4E7",
    marginBottom: 24,
  },
  skeletonEmergencyBanner: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    backgroundColor: "#E4E4E7",
    marginBottom: 24,
  },
  skeletonSectionHeader: {
    marginVertical: 12,
  },
  skeletonSectionTitle: {
    width: 150,
    height: 20,
    borderRadius: 8,
    backgroundColor: "#E4E4E7",
  },
  skeletonHorizontalRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  skeletonStoreCardHorizontal: {
    width: screenWidth * 0.65,
    height: 160,
    borderRadius: 16,
    backgroundColor: "#E4E4E7",
  },
  skeletonServicesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  skeletonServiceCol: {
    alignItems: "center",
  },
  skeletonServiceCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E4E4E7",
  },
  skeletonServiceText: {
    width: 50,
    height: 10,
    borderRadius: 4,
    backgroundColor: "#E4E4E7",
    marginTop: 8,
  },
  skeletonStoreCardVertical: {
    width: "100%",
    height: 100,
    borderRadius: 16,
    backgroundColor: "#E4E4E7",
    marginBottom: 16,
  },
  verticalListContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface || "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border || "#E4E4E7",
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemBadge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#FEF3C7",
    color: "#D97706",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text || "#18181B",
    marginTop: 4,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.textMuted || "#71717A",
    marginTop: 2,
  },
  itemStoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  itemStoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
