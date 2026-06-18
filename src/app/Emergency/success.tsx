import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, SafeAreaView, Linking, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { useStoreDetails, useBookingDetails } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

const { width: screenWidth } = Dimensions.get("window");

export default function EmergencySuccessScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;
    storeId: string;
    symptom: string;
    petName: string;
    gpsAddress: string;
    latitude: string;
    longitude: string;
    location:string
  }>();

  const queryClient = useQueryClient();
  const { data: store, isLoading: loadingStore } = useStoreDetails(params.storeId || "");
  const { data: booking } = useBookingDetails(params.bookingId || "", "user");

  const [timeLeft, setTimeLeft] = useState(900); // 15:00 minutes countdown
  const [mockAccepted, setMockAccepted] = useState(false);

  // Poll booking details every 5 seconds to catch live status updates from backend
  useEffect(() => {
    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["booking", params.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "user"] });
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [params.bookingId]);

  // Countdown timer for pending status
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine if booking is accepted
  const dbAccepted = booking?.status === "accepted" || booking?.status === "approved" || booking?.status === "completed";
  const activeAccepted = dbAccepted || mockAccepted;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCallClinic = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone}`).catch(() => {
        Alert.alert("Hotline Call", `Calling vet clinic: ${store.phone}`);
      });
    } else {
      Alert.alert("Emergency Calling", "Calling vet hotline: +91 99887 76655");
    }
  };

  const handlePayNow = () => {
    router.push({
      pathname: "/Emergency/payment" as any,
      params: {
        bookingId: params.bookingId,
        storeId: params.storeId,
        price: "1500",
        symptom: params.symptom,
        petName: params.petName,
        gpsAddress: params.gpsAddress,
        latitude: params.latitude,
        longitude: params.longitude,
      }
    });
  };

  // Haversine Distance Calculation (User <-> Clinic)
  const getDistanceText = () => {
    const lat1 = parseFloat(params.latitude || "");
    const lon1 = parseFloat(params.longitude || "");
    
    // Clinic Coordinates from API
    const lat2 = store?.latitude || (store?.location?.coordinates ? store.location.coordinates[1] : null);
    const lon2 = store?.longitude || (store?.location?.coordinates ? store.location.coordinates[0] : null);

    if (!isNaN(lat1) && !isNaN(lon1) && lat2 && lon2) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      return `${d.toFixed(2)} km`;
    }
    return "2.5 km"; // fallback
  };

  const distText = getDistanceText();

  const handleNavigate = () => {
    const address = store?.address ? (typeof store.address === "string" ? store.address : `${store.address.street || ""}, ${store.address.city || ""}`) : "Vet Clinic";
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Directions", `Opening maps for: ${address}`);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Animated Green Check Ring */}
        <View style={styles.successHeader}>
          <View style={styles.checkRing}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.emergencySuccess} />
          </View>
          <Text style={styles.successTitle}>Booking Registered!</Text>
          <Text style={styles.successSubtitle}>Ref ID: {params.bookingId || "#PWC-EM-304"}</Text>
        </View>

        {/* Developer Simulation Toggle */}
        {!activeAccepted && (
          <TouchableOpacity 
            style={styles.simulateBtn} 
            onPress={() => setMockAccepted(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="construct-outline" size={14} color={COLORS.emergencyPrimaryOrange} />
            <Text style={styles.simulateBtnText}>Simulate Clinic Acceptance</Text>
          </TouchableOpacity>
        )}

        {/* 15 Minute Guarantee Tracker / Accepted Confirmation Map */}
        {activeAccepted ? (
          <View style={styles.acceptedCard}>
            <View style={styles.acceptedHeader}>
              <View style={styles.pulseGreenDot} />
              <Text style={styles.acceptedTitle}>Request Accepted!</Text>
            </View>
            <Text style={styles.acceptedSub}>
              Hansika Vet Clinic has accepted your emergency booking. Triage preparation has commenced.
            </Text>

            {/* 🗺️ Route Map Visualizer */}
            <View style={styles.mapVisualizer}>
              <View style={styles.mapHeader}>
                <Ionicons name="map-outline" size={16} color={COLORS.emergencyPrimaryOrange} />
                <Text style={styles.mapHeaderText}>Route Active • {distText} distance</Text>
              </View>

              <View style={styles.simulatedMap}>
                {/* User node */}
                <View style={styles.mapNode}>
                  <View style={[styles.nodeCircle, { backgroundColor: COLORS.emergencySuccess }]} />
                  <Text style={styles.nodeLabel}>Your Location</Text>
                </View>

                {/* Dotted path */}
                <View style={styles.dottedPath}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.emergencyPrimaryOrange} />
                </View>

                {/* Clinic node */}
                <View style={styles.mapNode}>
                  <View style={[styles.nodeCircle, { backgroundColor: COLORS.emergencyPrimaryOrange }]}>
                    <Ionicons name="medical" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.nodeLabel} numberOfLines={1}>{store?.name || "Clinic"}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.mapNavBtn} onPress={handleNavigate}>
                <Text style={styles.mapNavBtnText}>Open Route in Google Maps</Text>
                <Ionicons name="navigate-circle" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.guaranteeCard}>
            <Text style={styles.guaranteeTitle}>GUARANTEED CLINIC RESPONSE IN</Text>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.guaranteeSub}>
              Your emergency request has been sent to the clinic. The triage team is preparing for your arrival.
            </Text>
            {/* Live Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFilled, { width: `${(timeLeft / 900) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Post-Treatment Payment Info Section */}
        <View style={styles.paymentInfoCard}>
          <View style={styles.paymentInfoHeader}>
            <Ionicons name="card" size={22} color={activeAccepted ? COLORS.emergencySuccess : COLORS.emergencyPrimaryOrange} />
            <Text style={styles.paymentInfoTitle}>
              {activeAccepted ? "Complete Consultation Payment" : "Post-Treatment Payment"}
            </Text>
          </View>
          <Text style={styles.paymentInfoBody}>
            {activeAccepted
              ? "Your emergency request has been accepted. Please complete the consultation fee payment to finalize transaction details."
              : "No upfront payment is required so you can focus on your dog's immediate care. You can pay the consultation fee of ₹1,500 after the checkup is complete."}
          </Text>
          <TouchableOpacity 
            style={[styles.payNowBtn, activeAccepted && styles.payNowBtnHighlighted]}
            onPress={handlePayNow}
            activeOpacity={0.8}
          >
            <Text style={[styles.payNowBtnText, activeAccepted && styles.payNowBtnTextHighlighted]}>
              {activeAccepted ? "Pay Consultation Fee Now" : "Pay Consultation Fee Now (Optional)"}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={activeAccepted ? "#FFFFFF" : COLORS.emergencyPrimaryOrange} />
          </TouchableOpacity>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeaderRow}>
            <Image
              source={{ uri: store?.logo || store?.logoImage || store?.bannerImage || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500" }}
              style={styles.clinicThumb}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.targetClinicName}>{store?.name || "Backup Emergency Team"}</Text>
              <Text style={styles.targetClinicAddress} numberOfLines={1}>
                {store?.address ? (typeof store.address === "string" ? store.address : store.address.city) : "Emergency Vet Location"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dog's Name:</Text>
            <Text style={styles.summaryValue}>{params.petName || "Dog"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Emergency Type:</Text>
            <Text style={styles.summaryValue}>{params.symptom || "Triage Case"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GPS Coordinates:</Text>
            <Text style={styles.summaryValue}>{params.latitude && params.longitude ? `${parseFloat(params.latitude).toFixed(4)}, ${parseFloat(params.longitude).toFixed(4)}` : "Locked via GPS"}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCallClinic}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Call Clinic Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.homeBtn]}
            onPress={() => {
              router.replace("/Emergency/home" as any);
            }}
          >
            <Ionicons name="home" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: "center",
  },
  successHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  checkRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    marginBottom: 16,
  },
  successTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  successSubtitle: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    marginTop: 4,
  },
  guaranteeCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyPrimaryOrange,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  guaranteeTitle: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  timerText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 12,
  },
  guaranteeSub: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
    borderRadius: 2,
    marginTop: 16,
  },
  progressBarFilled: {
    height: "100%",
    backgroundColor: COLORS.emergencyPrimaryOrange,
    borderRadius: 2,
  },
  paymentInfoCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    width: "100%",
    marginBottom: 20,
  },
  paymentInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  paymentInfoTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  paymentInfoBody: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  payNowBtn: {
    marginTop: 14,
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    borderWidth: 1,
    borderColor: COLORS.emergencyPrimaryOrange,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payNowBtnText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 12,
    fontWeight: "800",
  },
  detailsCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    width: "100%",
    marginBottom: 24,
  },
  detailsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clinicThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  targetClinicName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  targetClinicAddress: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.emergencyBorder,
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: {
    backgroundColor: COLORS.emergencyRed,
  },
  homeBtn: {
    backgroundColor: COLORS.emergencySurfaceLight,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  simulateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.25)",
    marginBottom: 16,
    gap: 6,
  },
  simulateBtnText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 11,
    fontWeight: "700",
  },
  acceptedCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.emergencySuccess,
    width: "100%",
    marginBottom: 20,
  },
  acceptedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  pulseGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.emergencySuccess,
  },
  acceptedTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  acceptedSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  mapVisualizer: {
    backgroundColor: COLORS.emergencyBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 12,
    marginTop: 8,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  mapHeaderText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  simulatedMap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginVertical: 14,
  },
  mapNode: {
    alignItems: "center",
    width: "40%",
  },
  nodeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  nodeLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  dottedPath: {
    flex: 1,
    alignItems: "center",
  },
  mapNavBtn: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    borderRadius: 10,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  mapNavBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  payNowBtnHighlighted: {
    backgroundColor: COLORS.emergencySuccess,
    borderColor: COLORS.emergencySuccess,
  },
  payNowBtnTextHighlighted: {
    color: "#FFFFFF",
  },
});
