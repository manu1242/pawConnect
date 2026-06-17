import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useBookings, useUpdateBookingStatusMutation } from "../../services/queries/hooks";
import { BookingCard } from "../../components/cards/BookingCard";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";

export default function CustomerBookingsScreen() {
  const { data: bookings, isLoading } = useBookings("user");
  const cancelMutation = useUpdateBookingStatusMutation("user");
  const { showToast } = useUiStore();

  const handleCancelBooking = (bookingId: string) => {
    cancelMutation.mutate(
      { bookingId, action: "cancel" },
      {
        onSuccess: () => {
          showToast("Booking cancelled successfully", "success");
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to cancel booking", "error");
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !bookings || bookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No bookings scheduled yet.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id || (item as any)._id || Math.random().toString()}
          renderItem={({ item }) => {
            const bookingId = item.id || (item as any)._id;
            return (
              <BookingCard
                booking={item}
                role="user"
                onCancel={() => handleCancelBooking(bookingId)}
                onViewDetails={() => router.push(`/bookings/${bookingId}` as any)}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
