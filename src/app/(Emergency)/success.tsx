import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, SafeAreaView, Linking, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../services/queries/hooks";
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
  }>();

  const { data: store, isLoading: loadingStore } = useStoreDetails(params.storeId || "");
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 minutes countdown

  // Countdown timer for confirmation
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      pathname: "/(Emergency)/payment" as any,
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

        {/* 15 Minute Guarantee Tracker */}
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

        {/* Post-Treatment Payment Info Section */}
        <View style={styles.paymentInfoCard}>
          <View style={styles.paymentInfoHeader}>
            <Ionicons name="card" size={22} color={COLORS.emergencyPrimaryOrange} />
            <Text style={styles.paymentInfoTitle}>Post-Treatment Payment</Text>
          </View>
          <Text style={styles.paymentInfoBody}>
            No upfront payment is required so you can focus on your dog's immediate care. You can pay the consultation fee of ₹1,500 after the checkup is complete.
          </Text>
          <TouchableOpacity 
            style={styles.payNowBtn}
            onPress={handlePayNow}
            activeOpacity={0.8}
          >
            <Text style={styles.payNowBtnText}>Pay Consultation Fee Now (Optional)</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
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
              router.replace("/(Emergency)/home" as any);
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
});
