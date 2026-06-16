import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDashboard, useBookings, useUpdateBookingStatusMutation } from "../../services/queries/hooks";
import { BookingCard } from "../../components/cards/BookingCard";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";

export default function OwnerDashboardScreen() {
  const { data: dashboardData, isLoading: loadingDash } = useDashboard();
  const { data: bookings, isLoading: loadingBookings } = useBookings("manager");
  const updateStatusMutation = useUpdateBookingStatusMutation("manager");
  const { showToast } = useUiStore();

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

  const pendingBookings = bookings?.filter((b) => b.status === "pending") || [];
  const activeBookings = bookings?.filter((b) => b.status === "accepted") || [];

  // Extract analytics stats with mock fallbacks
  const stats = [
    { title: "Total Bookings", value: dashboardData?.totalBookings ?? bookings?.length ?? 0, icon: "calendar", color: COLORS.primaryLight },
    { title: "Active Bookings", value: dashboardData?.activeBookings ?? activeBookings.length, icon: "time", color: COLORS.info },
    { title: "Pending Request", value: pendingBookings.length, icon: "alert-circle", color: COLORS.warning },
    { title: "Total Earnings", value: `₹${dashboardData?.revenue ?? 12400}`, icon: "wallet", color: COLORS.success },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Store Console</Text>
        <Text style={styles.title}>Dashboard Overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.iconWrapper, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Section: Pending Approvals */}
      <Text style={styles.sectionTitle}>Pending Bookings ({pendingBookings.length})</Text>
      {loadingBookings ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
      ) : pendingBookings.length === 0 ? (
        <Text style={styles.emptyText}>No pending requests.</Text>
      ) : (
        pendingBookings.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            role="manager"
            onAccept={() => handleUpdateStatus(b.id, "accept")}
            onReject={() => handleUpdateStatus(b.id, "reject")}
          />
        ))
      )}

      {/* Section: Active Appointments */}
      <Text style={styles.sectionTitle}>Active Appointments ({activeBookings.length})</Text>
      {loadingBookings ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
      ) : activeBookings.length === 0 ? (
        <Text style={styles.emptyText}>No active appointments for today.</Text>
      ) : (
        activeBookings.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            role="manager"
            onComplete={() => handleUpdateStatus(b.id, "complete")}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 24,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...StyleSheet.absoluteFillObject,
    position: "relative",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 16,
  },
});
