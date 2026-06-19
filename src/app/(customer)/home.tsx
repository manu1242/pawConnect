import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Dimensions, Animated } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useStores, usePublicPromos } from "../../services/queries/hooks";
import { useStoresCacheStore } from "../../store/storesCacheStore";
import { COLORS } from "../../theme/colors";
import { StoreCard } from "../../components/cards/StoreCard";

const CATEGORIES = [
  { id: "grooming", name: "Grooming", icon: "cut-outline" },
  { id: "vet", name: "Vet Clinic", icon: "medical-outline" },
  { id: "boarding", name: "Boarding", icon: "home-outline" },
  { id: "training", name: "school-outline" },
];

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

export default function CustomerHomeScreen() {
  const { user } = useAuthStore();
  const { openModal } = useUiStore();
  const { cachedStores, setCachedStores } = useStoresCacheStore();
  const { data: fetchedStores, isLoading } = useStores();
  const { data: promos = [] } = usePublicPromos();
  const [search, setSearch] = useState("");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Stale-while-revalidate pattern: use cached stores if fresh ones are loading
  const stores = (fetchedStores && fetchedStores.length > 0) ? fetchedStores : cachedStores;
  const isStoresLoading = isLoading && stores.length === 0;

  useEffect(() => {
    if (fetchedStores && fetchedStores.length > 0) {
      setCachedStores(fetchedStores);
    }
  }, [fetchedStores]);

  if (isStoresLoading) {
    return <HomeSkeleton />;
  }

  // Setup swipable banners (fallback to beautiful default banner if none defined)
  const defaultBanner = {
    _id: "default-grooming",
    code: "WELCOME30",
    title: "30% Off Grooming Sessions Today",
    description: "Book high-fidelity grooming packages today",
    discountType: "percentage" as const,
    discountValue: 30,
    active: true,
    displayOnHome: true,
    bannerImage: "",
    storeId: null as any
  };
  const bannersToDisplay = promos && promos.length > 0 ? promos : [defaultBanner];

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
      {/* <View style={styles.bannerContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 40));
            setActiveBannerIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {bannersToDisplay.map((banner, index) => (
            <TouchableOpacity
              key={banner._id || index}
              activeOpacity={0.9}
              style={[styles.banner, { width: screenWidth - 40, marginRight: bannersToDisplay.length > 1 ? 10 : 0 }]}
              onPress={() => {
                if (banner.storeId) {
                  router.push(`/store/${banner.storeId._id || banner.storeId}` as any);
                } else {
                  router.push("/services" as any);
                }
              }}
            >
              {banner.bannerImage ? (
                <View style={{ width: "100%", height: "100%", position: "relative" }}>
                  <Image
                    source={{ uri: banner.bannerImage }}
                    style={{ width: "100%", height: "100%", borderRadius: 14 }}
                    resizeMode="cover"
                  />
                  <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: "rgba(0,0,0,0.5)", borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
                    <Text style={[styles.bannerLabel, { textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 3 }]}>{banner.code}</Text>
                    <Text style={[styles.bannerTitle, { fontSize: 14, marginBottom: 0, lineHeight: 18, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 3 }]}>{banner.title}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={styles.bannerLeft}>
                    <Text style={styles.bannerLabel}>{banner.code}</Text>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <View style={styles.bannerBtn}>
                      <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.bannerBtnText}>Claim now</Text>
                    </View>
                  </View>
                  <View style={styles.bannerRight}>
                    <Ionicons name="gift-outline" size={80} color="rgba(255, 255, 255, 0.2)" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        {bannersToDisplay.length > 1 && (
          <View style={styles.dotsRow}>
            {bannersToDisplay.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeBannerIndex === index && styles.dotActive
                ]}
              />
            ))}
          </View>
        )}
      </View> */}

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

      {/* Section: Featured Stores (Horizontal Scroll) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Stores</Text>
        <TouchableOpacity onPress={() => router.push("/stores" as any)}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {isStoresLoading ? (
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

      {/* Section Header: Services */}
      <View style={[styles.sectionHeader, { marginBottom: 16, marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Services</Text>
          <Text style={styles.sectionSubtitleText}>Everything your pet needs, all in one place 🐾</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/services" as any)}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.seeAllServicesText}>View all services</Text>
            <Ionicons name="chevron-forward" size={12} color="#C2410C" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll of Rounded Circles */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalServicesContainer}
        style={{ marginBottom: 20 }}
      >
        {[
          { id: "Grooming", label: "Grooming", icon: "cut-outline", bg: "#FFF8F6", color: "#FF6B35" },
          { id: "Vet Clinic", label: "Vet Clinic", icon: "pulse-outline", bg: "#F0F6FF", color: "#3B82F6" },
          { id: "Boarding", label: "Boarding", icon: "home-outline", bg: "#F0FDF4", color: "#16A34A" },
          { id: "Training", label: "Training", icon: "school-outline", bg: "#FAF5FF", color: "#7C3AED" },
          { id: "Emergency", label: "Emergency", icon: "home-outline", bg: "#FFF8F6", color: "#ef0d0dff" },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.circularServiceItem}
            onPress={() => router.push({ pathname: "/services", params: { select: item.id } } as any)}
          >
            <View style={[styles.circularIconWrapper, { backgroundColor: item.bg, borderColor: `${item.color}25` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.circularServiceText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section: Nearby Stores */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Text style={styles.sectionTitle}>Nearby Stores</Text>
      </View>

      {isStoresLoading ? (
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
});
