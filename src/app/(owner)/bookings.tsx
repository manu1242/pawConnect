import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useBookings, useUpdateBookingStatusMutation } from "../../services/queries/hooks";
import { BookingCard } from "../../components/cards/BookingCard";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";

export default function OwnerBookingsScreen() {
  const { data: bookings, isLoading } = useBookings("manager");
  const updateStatusMutation = useUpdateBookingStatusMutation("manager");
  const { showToast } = useUiStore();
  
  const [filter, setFilter] = useState<string | null>(null);

  const handleUpdateStatus = (bookingId: string, action: "accept" | "reject" | "complete") => {
    updateStatusMutation.mutate(
      { bookingId, action },
      {
        onSuccess: () => {
          showToast(`Booking ${action}ed successfully!`, "success");
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || `Failed to ${action} booking`, "error");
        },
      }
    );
  };

  const filteredBookings = bookings?.filter((b) => !filter || b.status === filter) || [];
  const statusFilters = [
    { label: "All", value: null },
    { label: "Pending", value: "pending" },
    { label: "Active", value: "accepted" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage Bookings</Text>
      </View>

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        <FlatList
          data={statusFilters}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = filter === item.value;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected ? styles.filterChipActive : null]}
                onPress={() => setFilter(item.value)}
              >
                <Text style={[styles.filterText, isSelected ? styles.filterTextActive : null]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        />
      </View>

      {/* Bookings List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No appointments in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id || (item as any)._id || Math.random().toString()}
          renderItem={({ item }) => {
            const bookingId = item.id || (item as any)._id;
            return (
              <BookingCard
                booking={item}
                role="manager"
                onAccept={() => handleUpdateStatus(bookingId, "accept")}
                onReject={() => handleUpdateStatus(bookingId, "reject")}
                onComplete={() => handleUpdateStatus(bookingId, "complete")}
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
  filtersRow: {
    marginBottom: 16,
    height: 38,
  },
  filterChip: {
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: "#FFFFFF",
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
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
