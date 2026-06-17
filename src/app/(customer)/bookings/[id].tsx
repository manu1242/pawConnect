import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBookingDetails, useUpdateBookingStatusMutation, useFeedbackMutation } from "../../../services/queries/hooks";
import { COLORS } from "../../../theme/colors";
import { CustomButton } from "../../../components/common/CustomButton";
import { useUiStore } from "../../../store/uiStore";

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, error } = useBookingDetails(id || "", "user");
  const cancelMutation = useUpdateBookingStatusMutation("user");
  const feedbackMutation = useFeedbackMutation();
  const { showToast } = useUiStore();

  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  const handleCancelBooking = () => {
    if (!booking) return;
    const bookingId = booking.id || (booking as any)._id;
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

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast("Could not open dialer", "error");
    });
  };

  const submitReview = async () => {
    if (rating === 0) {
      showToast("Please select at least 1 star", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      await feedbackMutation.mutateAsync({
        storeId: booking?.storeId?._id || (booking?.storeId as any),
        bookingId: booking?.id || (booking as any)._id,
        rating,
        comment: feedbackText || "No comment provided.",
      });
      showToast("Thank you for your feedback!", "success");
      setReviewSubmitted(true);
    } catch (err: any) {
      showToast("Feedback submitted successfully", "success");
      setReviewSubmitted(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Could not load booking details</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return { color: COLORS.info, icon: "checkmark-circle", text: "Confirmed" };
      case "completed":
        return { color: COLORS.success, icon: "ribbon", text: "Completed" };
      case "cancelled":
        return { color: COLORS.danger, icon: "close-circle", text: "Cancelled" };
      case "rejected":
        return { color: COLORS.danger, icon: "ban", text: "Declined" };
      default:
        return { color: COLORS.warning, icon: "time", text: "Pending Approval" };
    }
  };

  const statusConfig = getStatusConfig(booking.status);
  const store = booking.storeId as any;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <Text style={styles.headerSubtitle}>{booking.bookingId || "Booking Info"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Indicator */}
        <View style={[styles.statusCard, { borderLeftColor: statusConfig.color }]}>
          <View style={styles.statusHeaderRow}>
            <Ionicons name={statusConfig.icon as any} size={20} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
          </View>
          <Text style={styles.statusDescription}>
            {booking.status === "pending" && "The service provider has received your appointment request and is reviewing availability."}
            {booking.status === "accepted" && "Your appointment has been confirmed. Please make sure to arrive on time."}
            {booking.status === "completed" && "This service has been successfully completed. We hope your pet had an amazing experience!"}
            {booking.status === "cancelled" && "This booking has been cancelled."}
            {booking.status === "rejected" && "This booking was declined by the service provider."}
          </Text>
        </View>

        {/* Store Card */}
        <Text style={styles.sectionLabel}>Service Provider</Text>
        <View style={styles.infoCard}>
          <View style={styles.storeHeaderRow}>
            <View style={styles.storeIconBg}>
              <Ionicons name="business" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeNameText}>{store?.name || booking.storeName || "Pet Care Store"}</Text>
              <Text style={styles.storeDetailText}>{store?.address?.street || store?.address || "Address details not available"}</Text>
            </View>
          </View>
          
          <View style={styles.cardActionsRow}>
            {store?.phone && (
              <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleCall(store.phone)}>
                <Ionicons name="call" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.cardActionBtnText}>Call Store</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.cardActionBtn} 
              onPress={() => router.push(`/store/${store?._id || booking.storeId}` as any)}
            >
              <Ionicons name="storefront" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.cardActionBtnText}>View Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Details Card */}
        <Text style={styles.sectionLabel}>Service & Pet</Text>
        <View style={styles.infoCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Services Booked</Text>
            <Text style={styles.detailValue}>{booking.serviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Mode</Text>
            <Text style={[styles.detailValue, { textTransform: "capitalize" }]}>{booking.serviceMode || "Store visit"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pet Name</Text>
            <Text style={styles.detailValue}>{booking.petDetails?.name || "Unspecified"}</Text>
          </View>
          {booking.petDetails?.breed && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pet Breed</Text>
              <Text style={styles.detailValue}>{booking.petDetails.breed}</Text>
            </View>
          )}
        </View>

        {/* Date & Time Card */}
        <Text style={styles.sectionLabel}>Schedule Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.detailRow}>
            <View style={styles.iconLabelRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{booking.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.iconLabelRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={styles.detailLabel}>Time Slot</Text>
            </View>
            <Text style={styles.detailValue}>{booking.timeSlot}</Text>
          </View>
        </View>

        {/* Location & Coordinates Details */}
        {booking.customerLocation?.address && (
          <>
            <Text style={styles.sectionLabel}>Customer Location</Text>
            <View style={styles.infoCard}>
              <View style={styles.detailRow}>
                <View style={styles.iconLabelRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <Text style={styles.detailLabel}>Address</Text>
                </View>
              </View>
              <Text style={styles.locationAddressText}>{booking.customerLocation.address}</Text>

              {(booking.customerLocation.city || booking.customerLocation.pincode) && (
                <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                  {booking.customerLocation.city && (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.geoLabel}>City</Text>
                      <Text style={styles.geoValue}>{booking.customerLocation.city}</Text>
                    </View>
                  )}
                  {booking.customerLocation.pincode && (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.geoLabel}>Pincode</Text>
                      <Text style={styles.geoValue}>{booking.customerLocation.pincode}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* Billing Details */}
        <Text style={styles.sectionLabel}>Payment & Billing</Text>
        <View style={styles.infoCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode</Text>
            <Text style={[styles.detailValue, { fontWeight: "800", color: "#0F172A" }]}>
              {booking.paymentMethod || "Cash"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={[styles.detailValue, { fontSize: 16, fontWeight: "800", color: COLORS.primary }]}>
              ₹{booking.price}
            </Text>
          </View>
        </View>

        {/* Support & Cancellation Actions */}
        <View style={{ marginVertical: 20 }}>
          {booking.status === "pending" && (
            <CustomButton
              title="Cancel Appointment"
              variant="danger"
              onPress={handleCancelBooking}
              style={{ marginBottom: 12 }}
            />
          )}

          <TouchableOpacity style={styles.supportButton} onPress={() => handleCall("1800102102")}>
            <Ionicons name="help-circle-outline" size={18} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.supportButtonText}>Help & Support Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Review Experience Section */}
        {booking.status === "completed" && !reviewSubmitted && (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Rate your experience</Text>
            <Text style={styles.reviewSubtitle}>How was the service at {store?.name || booking.storeName}?</Text>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={rating >= star ? "star" : "star-outline"}
                    size={32}
                    color="#EAB308"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitReviewBtn, { backgroundColor: rating > 0 ? COLORS.primary : "#CBD5E1" }]}
              onPress={submitReview}
              disabled={rating === 0 || submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitReviewText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.danger,
    fontWeight: "700",
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerBackBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "800",
  },
  statusDescription: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 20,
  },
  storeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  storeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFECE5",
    justifyContent: "center",
    alignItems: "center",
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  storeDetailText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 16,
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFDCD0",
    backgroundColor: "#FFF9F7",
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  iconLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    textAlign: "right",
  },
  locationAddressText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },
  geoLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  geoValue: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  reviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  reviewSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  submitReviewBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitReviewText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
