import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStores } from "../../services/queries/hooks";
import { StoreCard } from "../../components/cards/StoreCard";
import { COLORS } from "../../theme/colors";

export default function StoresListScreen() {
  const params = useLocalSearchParams<{ category?: string; search?: string }>();
  const { data: stores, isLoading } = useStores();
  
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Set initial filters from route search/category params
  useEffect(() => {
    if (params.search) setSearchText(params.search);
    if (params.category) setSelectedCategory(params.category);
  }, [params]);

  // Filter logic
  const filteredStores = stores?.filter((store) => {
    const storeDetails = store.storeDetails || {};
    const name = store.name || storeDetails.name || "";
    const description = store.description || storeDetails.description || "";
    const storeCategories = store.storeTypes || (storeDetails.category ? [storeDetails.category] : []);

    const nameMatch = name.toLowerCase().includes(searchText.toLowerCase()) || 
                      description.toLowerCase().includes(searchText.toLowerCase());

    const catMatch = !selectedCategory || storeCategories.some(cat => {
      const normalizedCat = cat.toLowerCase();
      const normalizedSel = selectedCategory.toLowerCase();
      return normalizedCat.includes(normalizedSel) || 
             normalizedSel.includes(normalizedCat) ||
             (normalizedSel === "pet grooming" && normalizedCat === "grooming") ||
             (normalizedSel === "veterinary clinic" && normalizedCat === "veterinary") ||
             (normalizedSel === "pet boarding" && normalizedCat === "boarding") ||
             (normalizedSel === "pet training" && normalizedCat === "training");
    });

    return nameMatch && catMatch;
  }) || [];

  const categoriesList = [
    "Pet Grooming",
    "Veterinary Clinic",
    "Pet Boarding",
    "Pet Day Care",
    "Pet Training",
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Stores</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stores..."
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
                  {item === null ? "All" : item}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.filterScroll}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        />
      </View>

      {/* Stores List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredStores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No stores match your filters.</Text>
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
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
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
});
