import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Booking } from "../../types";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../common/CustomButton";

interface BookingCardProps {
  booking: Booking;
  role: "user" | "manager";
  onCancel?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
  onViewDetails?: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  role,
  onCancel,
  onAccept,
  onReject,
  onComplete,
  onViewDetails,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "accepted":
        return COLORS.info;
      case "completed":
        return COLORS.success;
      case "rejected":
      case "cancelled":
        return COLORS.danger;
      default:
        return COLORS.warning;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
          <Text style={styles.storeName}>
            {role === "user" ? (booking.storeId as any)?.name || booking.storeName || "Pet Store Provider" : `Pet: ${booking.petDetails?.name || "Unspecified"}`}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.text}>{booking.date} at {booking.timeSlot}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="card-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.text}>₹{booking.price} via {booking.paymentMethod}</Text>
        </View>
        {booking.customerLocation?.address && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.text} numberOfLines={1}>{booking.customerLocation.address}</Text>
          </View>
        )}
      </View>

      {booking.petDetails && (
        <View style={styles.petDetailsSection}>
          <TouchableOpacity 
            style={styles.expandHeader}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="paw" size={14} color={COLORS.primary} />
              <Text style={styles.petHeaderTitle}>Pet Info & Health Docs</Text>
            </View>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          {expanded && (
            <View style={styles.expandContent}>
              <View style={styles.gridRow}>
                <Text style={styles.gridLabel}>Name / Breed:</Text>
                <Text style={styles.gridValue}>{booking.petDetails.name} ({booking.petDetails.breed || "Dog"})</Text>
              </View>
              <View style={styles.gridRow}>
                <Text style={styles.gridLabel}>Age / Weight:</Text>
                <Text style={styles.gridValue}>{booking.petDetails.age || "N/A"} / {booking.petDetails.weight || "N/A"}</Text>
              </View>
              <View style={styles.gridRow}>
                <Text style={styles.gridLabel}>Gender:</Text>
                <Text style={styles.gridValue}>{booking.petDetails.gender || "N/A"}</Text>
              </View>
              <View style={styles.gridRow}>
                <Text style={styles.gridLabel}>Vaccinated:</Text>
                <Text style={[styles.gridValue, { color: booking.petDetails.vaccinated ? COLORS.success : COLORS.danger, fontWeight: "700" }]}>
                  {booking.petDetails.vaccinated ? "Yes (Fully)" : "No"}
                </Text>
              </View>
              {booking.petDetails.vaccinationRecords && booking.petDetails.vaccinationRecords.length > 0 && (
                <View style={styles.recordsSection}>
                  <Text style={styles.recordsTitle}>Health Documents & Files:</Text>
                  {booking.petDetails.vaccinationRecords.map((doc: string, index: number) => (
                    <Text key={index} style={styles.recordLink} numberOfLines={1}>
                      📄 Doc #{index + 1}: {doc}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Buttons based on status and role */}
      <View style={styles.actions}>
        <View style={styles.ownerActions}>
          {onViewDetails && (
            <CustomButton
              title="View Details"
              variant="outline"
              onPress={onViewDetails}
              style={styles.flexBtn}
            />
          )}
          {booking.status === "pending" && role === "user" && onCancel && (
            <CustomButton
              title="Cancel"
              variant="danger"
              onPress={onCancel}
              style={styles.flexBtn}
            />
          )}
          {booking.status === "pending" && role === "manager" && (
            <>
              {onReject && (
                <CustomButton
                  title="Reject"
                  variant="danger"
                  onPress={onReject}
                  style={styles.flexBtn}
                />
              )}
              {onAccept && (
                <CustomButton
                  title="Accept"
                  onPress={onAccept}
                  style={styles.flexBtn}
                />
              )}
            </>
          )}
          {booking.status === "accepted" && role === "manager" && onComplete && (
            <CustomButton
              title="Complete"
              onPress={onComplete}
              style={styles.flexBtn}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  storeName: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  details: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  actions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionBtn: {
    height: 38,
    borderRadius: 8,
  },
  ownerActions: {
    flexDirection: "row",
    gap: 12,
  },
  flexBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
  },
  petDetailsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  expandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  petHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  expandContent: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  gridValue: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: "600",
  },
  recordsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  recordsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  recordLink: {
    fontSize: 11,
    color: COLORS.primary,
    textDecorationLine: "underline",
    marginTop: 2,
  },
});
