import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../../components/common/CustomButton";

export default function BookingSuccessScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;
    storeId: string;
    customerAddress: string;
    customerLat: string;
    customerLng: string;
    totalPaid: string;
    serviceName: string;
  }>();

  const { data: store, isLoading } = useStoreDetails(params.storeId || "");
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(2);
  };

  const storeLat = store?.latitude || 16.5362;
  const storeLng = store?.longitude || 81.6243;
  const custLat = parseFloat(params.customerLat || "16.5362");
  const custLng = parseFloat(params.customerLng || "81.6243");

  const distance = calculateDistance(storeLat, storeLng, custLat, custLng);

  const handleSupport = () => {
    Linking.openURL("mailto:support@pawconnect.com?subject=Booking Support Request");
  };

  const handleContact = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone}`);
    } else {
      Linking.openURL("tel:+18005550199");
    }
  };

  const handleRate = (stars: number) => {
    setRating(stars);
    setRated(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Swiggy/Faasos Dotted Tracking Mockup */}
        <View style={styles.trackingHeader}>
          <Text style={styles.trackingTitle}>Order Placed Successfully!</Text>
          <Text style={styles.trackingSubtitle}>Booking ID: {params.bookingId || "#PWC103984"}</Text>
          
          <View style={styles.mapVisualContainer}>
            {/* Store Node */}
            <View style={styles.nodeWrapper}>
              <View style={styles.storeNode}>
                <Ionicons name="business" size={24} color="#FFF" />
              </View>
              <Text style={styles.nodeLabel} numberOfLines={1}>{store?.name || "Pet Center"}</Text>
              <Text style={styles.nodeCoords}>({storeLat.toFixed(3)}°, {storeLng.toFixed(3)}°)</Text>
            </View>

            {/* Connecting Dotted Line */}
            <View style={styles.dottedLineContainer}>
              <View style={styles.dottedLine} />
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{distance} km</Text>
              </View>
            </View>

            {/* Customer Node */}
            <View style={styles.nodeWrapper}>
              <View style={styles.customerNode}>
                <Ionicons name="home" size={24} color="#FFF" />
              </View>
              <Text style={styles.nodeLabel}>You</Text>
              <Text style={styles.nodeCoords}>({custLat.toFixed(3)}°, {custLng.toFixed(3)}°)</Text>
            </View>
          </View>
        </View>

        {/* Order Status Details Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View style={styles.greenDot} />
            <Text style={styles.statusText}>Booking Received & Pending Confirmation</Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>25 mins</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={18} color={COLORS.textMuted} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Services</Text>
              <Text style={styles.detailValue}>{params.serviceName || "Grooming & Spa"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={18} color={COLORS.textMuted} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Total Paid</Text>
              <Text style={[styles.detailValue, { fontWeight: "700", color: COLORS.primary }]}>₹{params.totalPaid || "0"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.textMuted} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Provider Location</Text>
              <Text style={styles.detailValue}>{store?.address || "Store Address"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={18} color={COLORS.textMuted} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Customer Location</Text>
              <Text style={styles.detailValue}>{params.customerAddress || "Home Address"}</Text>
            </View>
          </View>
        </View>

        {/* Rate Experience Section */}
        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Rate your Booking Experience</Text>
          <Text style={styles.rateSub}>Let us know how easy it was to book your service</Text>
          
          {rated ? (
            <View style={styles.thankYouContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#15803D" />
              <Text style={styles.thankYouText}>Thank you for your review! ({rating} stars)</Text>
            </View>
          ) : (
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRate(star)}>
                  <Ionicons
                    name={rating >= star ? "star" : "star-outline"}
                    size={32}
                    color={rating >= star ? "#EAB308" : COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Support and Contact Actions */}
        <View style={styles.supportContainer}>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.text} />
            <Text style={styles.supportButtonText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportButton} onPress={handleContact}>
            <Ionicons name="call-outline" size={20} color={COLORS.text} />
            <Text style={styles.supportButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title="Go to My Bookings"
          onPress={() => router.replace("/bookings" as any)}
          style={styles.mainBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  trackingHeader: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  trackingSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  mapVisualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  nodeWrapper: {
    alignItems: "center",
    width: 90,
  },
  storeNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  customerNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
    textAlign: "center",
  },
  nodeCoords: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dottedLineContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 40,
  },
  dottedLine: {
    width: "100%",
    height: 2,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
  },
  distanceBadge: {
    position: "absolute",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  statusText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  timeBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
    marginTop: 2,
  },
  rateCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  rateTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  rateSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: "row",
    gap: 12,
  },
  thankYouContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  thankYouText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
    marginLeft: 8,
  },
  supportContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  supportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  mainBtn: {
    backgroundColor: COLORS.primary,
  },
});
