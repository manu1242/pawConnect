import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  role,
  onCancel,
  onAccept,
  onReject,
  onComplete,
}) => {
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

      {/* Buttons based on status and role */}
      {booking.status === "pending" && (
        <View style={styles.actions}>
          {role === "user" && onCancel && (
            <CustomButton
              title="Cancel Appointment"
              variant="outline"
              onPress={onCancel}
              style={styles.actionBtn}
            />
          )}
          {role === "manager" && (
            <View style={styles.ownerActions}>
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
            </View>
          )}
        </View>
      )}

      {booking.status === "accepted" && role === "manager" && onComplete && (
        <View style={styles.actions}>
          <CustomButton
            title="Mark as Completed"
            onPress={onComplete}
            style={styles.actionBtn}
          />
        </View>
      )}
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
});
