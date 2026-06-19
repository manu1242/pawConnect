import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, SafeAreaView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";
import { useUiStore } from "../../store/uiStore";

const { width: screenWidth } = Dimensions.get("window");

export default function EmergencyPaymentScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;
    storeId: string;
    price: string;
    symptom: string;
    petName: string;
    gpsAddress: string;
    latitude: string;
    longitude: string;
  }>();

  const { data: store, isLoading: loadingStore } = useStoreDetails(params.storeId || "");
  const { showAlert } = useUiStore();

  // States
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 minutes countdown

  // Steps during processing
  const processingLabels = [
    "Locking emergency slot...",
    "Securing priority triage queue...",
    "Verifying location coordinates...",
    "Authorizing payment dispatch..."
  ];

  // Countdown timer for confirmation
  useEffect(() => {
    if (!isSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePay = () => {
    setIsProcessing(true);
    setProcessingStep(0);

    // Simulate multi-step verification process
    const interval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev < processingLabels.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsProcessing(false);
          setIsSuccess(true);
          return prev;
        }
      });
    }, 1000);
  };

  if (loadingStore) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.emergencyPrimaryOrange} />
        <Text style={styles.loadingText}>Fetching clinic data...</Text>
      </View>
    );
  }

  // 1. PAYMENT STATE
  if (!isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Emergency Payment</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Urgent Bill Details */}
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.emergencyPrimaryOrange} />
              <Text style={styles.invoiceTitle}>Urgent Veterinary Consultation</Text>
            </View>
            <Text style={styles.invoiceDesc}>Priority slot assigned at {store?.name || "Backup Emergency Team"}</Text>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>🐶 Pet Name:</Text>
              <Text style={styles.metaValue}>{params.petName || "Dog"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>🚨 Symptom:</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{params.symptom || "Emergency Consultation"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>📍 GPS Address:</Text>
              <Text style={styles.metaValue} numberOfLines={2}>{params.gpsAddress || "Detected GPS location"}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Emergency Consultation Fee</Text>
              <Text style={styles.priceValue}>₹1,500</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Urgent Dispatch & Triage</Text>
              <Text style={[styles.priceValue, { color: COLORS.emergencySuccess }]}>FREE</Text>
            </View>
            <View style={[styles.priceRow, { marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Total Payable Amount</Text>
              <Text style={styles.totalValue}>₹1,500</Text>
            </View>
          </View>

          {/* Select Payment Method */}
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodContainer}>
            <TouchableOpacity 
              style={[styles.methodCard, selectedMethod === "upi" && styles.methodCardActive]} 
              onPress={() => setSelectedMethod("upi")}
              activeOpacity={0.8}
            >
              <View style={styles.methodRadio}>
                <View style={[styles.radioDot, selectedMethod === "upi" && styles.radioDotActive]} />
              </View>
              <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.methodName}>Instant UPI (GPay, PhonePe, Paytm)</Text>
                <Text style={styles.methodSub}>Zero convenience fees applied</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.methodCard, selectedMethod === "card" && styles.methodCardActive]} 
              onPress={() => setSelectedMethod("card")}
              activeOpacity={0.8}
            >
              <View style={styles.methodRadio}>
                <View style={[styles.radioDot, selectedMethod === "card" && styles.radioDotActive]} />
              </View>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.methodName}>Credit / Debit Card</Text>
                <Text style={styles.methodSub}>Pay via secured Gateway</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Pay Action Button */}
          <TouchableOpacity 
            style={styles.payButton} 
            onPress={handlePay}
            disabled={isProcessing}
            activeOpacity={0.9}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.payButtonText}>Pay ₹1,500 Securely</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Loading Overlay */}
        {isProcessing && (
          <View style={styles.overlayContainer}>
            <View style={styles.overlayCard}>
              <ActivityIndicator size="large" color={COLORS.emergencyPrimaryOrange} />
              <Text style={styles.overlayLabel}>{processingLabels[processingStep]}</Text>
              <Text style={styles.overlaySub}>Please do not close the app or go back.</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // 2. SUCCESS STATE (High-fidelity Triage Confirmation Screen)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
        {/* Animated Green Check Ring */}
        <View style={styles.successHeader}>
          <View style={styles.checkRing}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.emergencySuccess} />
          </View>
          <Text style={styles.successTitle}>Emergency Request Dispatched!</Text>
          <Text style={styles.successSubtitle}>Booking Reference: {params.bookingId || "#PWC-EM-304"}</Text>
        </View>

        {/* 15 Minute Guarantee Tracker */}
        <View style={styles.guaranteeCard}>
          <Text style={styles.guaranteeTitle}>GUARANTEED CLINIC RESPONSE IN</Text>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.guaranteeSub}>
            The veterinary doctor is reviewing your pet's symptom description. A phone call is initiated automatically upon confirmation.
          </Text>
          {/* Live Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFilled, { width: `${(timeLeft / 900) * 100}%` }]} />
          </View>
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
            <Text style={styles.summaryLabel}>Dog Name:</Text>
            <Text style={styles.summaryValue}>{params.petName || "Dog"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Urgent Case:</Text>
            <Text style={styles.summaryValue}>{params.symptom || "Triage Case"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GPS Coordinates:</Text>
            <Text style={styles.summaryValue}>{params.latitude && params.longitude ? `${parseFloat(params.latitude).toFixed(4)}, ${parseFloat(params.longitude).toFixed(4)}` : "Locked via GPS"}</Text>
          </View>
        </View>

        {/* Immediate Call / Navigation Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.callBtn]}
            onPress={() => {
              if (store?.phone) {
                router.replace(`tel:${store.phone}` as any);
              } else {
                showAlert("Emergency Calling", "Calling vet hotline: +91 99887 76655");
              }
            }}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.emergencyBg,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.emergencyBorder,
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  invoiceCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    marginBottom: 24,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  invoiceTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  invoiceDesc: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.emergencyBorder,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  metaValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    flex: 0.7,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  methodContainer: {
    gap: 10,
    marginBottom: 30,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
  },
  methodCardActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.05)",
  },
  methodRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.emergencyBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  radioDotActive: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
  },
  methodName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  methodSub: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  payButton: {
    backgroundColor: COLORS.emergencyRed,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.emergencyRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  overlayCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    width: "100%",
  },
  overlayLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 20,
    textAlign: "center",
  },
  overlaySub: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  // Success Screen Styles
  successScroll: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
  },
  successHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  checkRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    marginBottom: 20,
  },
  successTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  successSubtitle: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    marginTop: 6,
  },
  guaranteeCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyPrimaryOrange,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
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
  detailsCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    width: "100%",
    marginBottom: 30,
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
