import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBookings, useUpdateBookingStatusMutation } from "../../services/queries/hooks";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";

export default function RedesignedAppointmentsScreen() {
  const params = useLocalSearchParams();
  const { data: bookings = [], isLoading } = useBookings("user");
  const cancelMutation = useUpdateBookingStatusMutation("user");
  const { showToast } = useUiStore();

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this veterinary appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelMutation.mutate(
              { bookingId, action: "cancel" },
              {
                onSuccess: () => {
                  showToast("Appointment cancelled successfully", "success");
                },
                onError: (err: any) => {
                  showToast(err?.response?.data?.message || "Failed to cancel booking", "error");
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleReschedule = (bookingId: string, clinicName: string) => {
    Alert.alert(
      "Reschedule Request",
      `Would you like to send a request to ${clinicName} to reschedule your slot?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Reschedule",
          onPress: () => {
            showToast("Reschedule request transmitted to clinic!", "success");
          },
        },
      ]
    );
  };

  const handleDirections = (clinicName: string) => {
    const query = encodeURIComponent(clinicName || "Veterinary Clinic");
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {
      showToast("Could not open maps application.", "error");
    });
  };

  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "accepted");
  const completedBookings = bookings.filter((b) => b.status === "completed" || b.status === "cancelled" || b.status === "rejected");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vet Visits</Text>
        <Text style={styles.headerSubtitle}>Manage appointments, get directions, or cancel slots</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.emergencyPrimaryOrange} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color={COLORS.emergencyBorder} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No appointments scheduled yet.</Text>
          <TouchableOpacity 
            style={styles.bookNowBtn}
            onPress={() => router.push("/Emergency/book-appointment" as any)}
          >
            <Text style={styles.bookNowBtnText}>Book Appointment Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...activeBookings, ...completedBookings]}
          keyExtractor={(item) => item.id || (item as any)._id || Math.random().toString()}
          renderItem={({ item, index }) => {
            const bookingId = item.id || (item as any)._id;
            const isCompleted = item.status === "completed" || item.status === "cancelled" || item.status === "rejected";
            const isActive = !isCompleted;
            
            // Highlight color logic: orange for upcoming (first), purple for the second, normal for completed
            let stripeColor = COLORS.emergencyBorder;
            if (isActive) {
              stripeColor = index === 0 ? COLORS.emergencyPrimaryOrange : COLORS.emergencyAccentPurple;
            }

            return (
              <View style={[styles.appointmentCard, { borderTopColor: stripeColor }]}>
                {/* Header Section */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    <Text style={styles.clinicName}>{item.storeName || "Veterinary Provider"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isCompleted ? "rgba(255,255,255,0.05)" : "rgba(255, 107, 53, 0.1)" }]}>
                    <Text style={[styles.statusText, { color: isCompleted ? COLORS.emergencyTextMuted : COLORS.emergencyPrimaryOrange }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.cardDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.emergencyTextMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{item.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.emergencyTextMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{item.timeSlot}</Text>
                  </View>
                  {item.petDetails?.name && (
                    <View style={styles.detailItem}>
                      <Ionicons name="paw-outline" size={14} color={COLORS.emergencyTextMuted} style={{ marginRight: 6 }} />
                      <Text style={styles.detailText}>Pet: {item.petDetails.name}</Text>
                    </View>
                  )}
                </View>

                {/* Actions Button Row */}
                {isActive && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleReschedule(bookingId, item.storeName || "Veterinary Provider")}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnText}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleDirections(item.storeName || "")}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="navigate-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnText}>Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => handleCancelBooking(bookingId)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={14} color={COLORS.emergencyRed} style={{ marginRight: 4 }} />
                      <Text style={[styles.actionBtnText, { color: COLORS.emergencyRed }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
    backgroundColor: COLORS.emergencyBg,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  bookNowBtn: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookNowBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  appointmentCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    borderTopWidth: 4,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
    paddingBottom: 12,
    marginBottom: 12,
  },
  serviceName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  clinicName: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.emergencyBorder,
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurfaceLight,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderColor: "rgba(229, 57, 53, 0.2)",
    backgroundColor: "rgba(229, 57, 53, 0.05)",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
