import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useStores } from "../../services/queries/hooks";
import { StoreCard } from "../../components/cards/StoreCard";
import { axiosClient } from "../../services/axios/axiosClient";
import { COLORS } from "../../theme/colors";

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

const ServiceCard = ({ service, storeName, onPressStore }: { service: any; storeName: string; onPressStore: () => void }) => {
  const price = service.price || service.consultationFee || 0;
  const image = service.image || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80";

  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <View style={styles.itemHeaderRow}>
          <Text style={[styles.itemBadge, { backgroundColor: "#FAF5FF", color: "#7C3AED" }]}>{service.type}</Text>
          {price > 0 && <Text style={styles.itemPrice}>₹{price}</Text>}
        </View>
        <Text style={styles.itemName} numberOfLines={1}>{service.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{service.description || service.details || "Professional pet service."}</Text>
        <TouchableOpacity style={styles.itemStoreRow} onPress={onPressStore}>
          <Ionicons name="storefront-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.itemStoreText} numberOfLines={1}>{storeName}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function StoresListScreen() {
  const params = useLocalSearchParams<{ category?: string; search?: string; tab?: string; featured?: string }>();
  const { data: stores = [], isLoading: isStoresLoading } = useStores();
  
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stores" | "products" | "services">("stores");

  // Fetch module products globally
  const { data: allProducts = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["global-products"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/products");
      return res.data?.data?.products || [];
    }
  });

  // Fetch module packages/services globally
  const { data: allGrooming = [] } = useQuery({
    queryKey: ["global-grooming"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/grooming/packages");
      return res.data?.data?.packages || [];
    }
  });

  const { data: allTraining = [] } = useQuery({
    queryKey: ["global-training"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/training/programs");
      return res.data?.data?.programs || [];
    }
  });

  const { data: allBoarding = [] } = useQuery({
    queryKey: ["global-boarding"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/boarding/packages");
      return res.data?.data?.packages || [];
    }
  });

  const { data: allDoctors = [] } = useQuery({
    queryKey: ["global-doctors"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/veterinary/doctors");
      return res.data?.data?.doctors || [];
    }
  });

  const { data: allWalkers = [] } = useQuery({
    queryKey: ["global-walkers"],
    queryFn: async () => {
      const res = await axiosClient.get("/stores/modules/walking/walkers");
      return res.data?.data?.walkers || [];
    }
  });

  // Set initial filters from route search/category params
  useEffect(() => {
    if (params.search) setSearchText(params.search);
    if (params.category) {
      setSelectedCategory(params.category);
    }
    if (params.tab === "products" || params.tab === "services" || params.tab === "stores") {
      setActiveTab(params.tab as any);
    }
  }, [params]);

  // Dynamically switch tab when selectedCategory changes (via param or manually clicking chip)
  useEffect(() => {
    if (selectedCategory) {
      const productCats = ["food", "toys", "medicines", "accessories"];
      const serviceCats = ["veterinary", "grooming", "dog walking", "boarding", "training", "emergency care"];
      
      const normalized = selectedCategory.toLowerCase();
      if (productCats.some(cat => normalized.includes(cat) || cat.includes(normalized))) {
        setActiveTab("products");
      } else if (serviceCats.some(cat => normalized.includes(cat) || cat.includes(normalized))) {
        setActiveTab("services");
      }
    }
  }, [selectedCategory]);

  const getStoreName = (storeId: string) => {
    const store = stores.find((s: any) => (s._id || s.id) === storeId);
    return store ? store.name : "Happy Paws Store";
  };

  // Filter stores
  const filteredStores = stores.filter((store: any) => {
    const storeDetails = store.storeDetails || {};
    const name = store.name || storeDetails.name || "";
    const description = store.description || storeDetails.description || "";
    const storeCategories = store.storeTypes || [];
    
    const matchesSearch = !searchText || 
      name.toLowerCase().includes(searchText.toLowerCase()) || 
      description.toLowerCase().includes(searchText.toLowerCase()) ||
      storeCategories.some(cat => cat.toLowerCase().includes(searchText.toLowerCase()));

    const matchesCategory = !selectedCategory || storeCategories.some(cat => {
      const normalizedCat = cat.toLowerCase();
      const normalizedSel = selectedCategory.toLowerCase();
      return normalizedCat.includes(normalizedSel) || normalizedSel.includes(normalizedCat);
    }) || (store.productCategories || []).some((pc: string) => {
      const normalizedPc = pc.toLowerCase();
      const normalizedSel = selectedCategory.toLowerCase();
      return normalizedPc.includes(normalizedSel) || normalizedSel.includes(normalizedPc);
    });

    const isApproved = !store.status || (
      store.status.toLowerCase() !== "rejected" && 
      store.status.toLowerCase() !== "blocked" && 
      store.status.toLowerCase() !== "suspended"
    );

    const matchesFeatured = !params.featured || (params.featured === "true" ? store.isFeatured === true : true);

    return matchesSearch && matchesCategory && isApproved && matchesFeatured;
  });
  // Filter products
  const filteredProducts = allProducts.filter((product: any) => {
    const name = product.name || "";
    const description = product.description || "";
    const category = product.category || "";

    const matchesSearch = !searchText || 
      name.toLowerCase().includes(searchText.toLowerCase()) || 
      description.toLowerCase().includes(searchText.toLowerCase()) ||
      category.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = !selectedCategory || 
      category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(category.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Combine & filter services
  const combinedServices: any[] = [
    ...allGrooming.map(item => ({ ...item, type: "Grooming", name: item.packageName, icon: "cut-outline" })),
    ...allTraining.map(item => ({ ...item, type: "Training", name: item.programName, icon: "school-outline" })),
    ...allBoarding.map(item => ({ ...item, type: "Boarding", name: item.packageName, icon: "home-outline" })),
    ...allDoctors.map(item => ({ ...item, type: "Veterinary", name: `Dr. ${item.name}`, details: item.specialty, icon: "pulse-outline" })),
    ...allWalkers.map(item => ({ ...item, type: "Dog Walking", name: item.name, details: `Area: ${item.serviceArea || "Nearby"}`, icon: "walk-outline" })),
  ];

  const filteredServices = combinedServices.filter((service: any) => {
    const name = service.name || "";
    const description = service.description || service.details || "";
    const type = service.type || "";

    const matchesSearch = !searchText ||
      name.toLowerCase().includes(searchText.toLowerCase()) ||
      description.toLowerCase().includes(searchText.toLowerCase()) ||
      type.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = !selectedCategory ||
      type.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(type.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    "Veterinary",
    "Grooming",
    "Dog Walking",
    "Boarding",
    "Training",
    "Emergency Care",
    "Food",
    "Toys",
    "Medicines",
    "Accessories",
  ];

  const renderActiveList = () => {
    if (isStoresLoading || isProductsLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (activeTab === "stores") {
      return filteredStores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No stores match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStores}
          keyExtractor={(item) => item.id || (item as any)._id || Math.random().toString()}
          renderItem={({ item }) => {
            const storeId = item.id || (item as any)._id;
            return (
              <StoreCard
                store={item}
                onPress={() => router.push(`/store/${storeId}` as any)}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === "products") {
      return filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No products match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              storeName={getStoreName(item.storeId)}
              onPressStore={() => router.push(`/store/${item.storeId}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeTab === "services") {
      return filteredServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="build-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No services match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              storeName={getStoreName(item.storeId)}
              onPressStore={() => router.push(`/store/${item.storeId}` as any)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {params.featured === "true"
            ? "Featured Stores"
            : params.tab === "products"
            ? "Products"
            : params.tab === "services"
            ? "Services"
            : "Marketplace"}
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stores, products, services..."
          placeholderTextColor={COLORS.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Horizontal Filter Selector */}
      <View style={styles.filterRow}>
        <FlatList
          data={[null, ...categoriesList]}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected ? styles.filterChipActive : null]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.filterText, isSelected ? styles.filterTextActive : null]}>
                  {item === null ? "All Categories" : item}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.filterScroll}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsContainer}>
        {[
          { key: "stores", label: `Stores (${filteredStores.length})` },
          { key: "products", label: `Products (${filteredProducts.length})` },
          { key: "services", label: `Services (${filteredServices.length})` },
        ].map((tab) => {
          const isTabActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isTabActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[styles.tabButtonText, isTabActive && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List Feed */}
      {renderActiveList()}
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
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.text,
    fontSize: 14,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
    marginTop: 4,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
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
