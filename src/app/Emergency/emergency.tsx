import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Linking, Image } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStores } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";
import { useUiStore } from "../../store/uiStore";

const EMERGENCY_CATEGORIES = [
  { id: "breathing", name: "Breathing Issues", desc: "Choking, rapid panting, gasping", icon: "cellular-outline", bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444" },
  { id: "accident", name: "Accidents / Trauma", desc: "Fractures, bleeding wounds, falls", icon: "car-outline", bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" },
  { id: "poisoning", name: "Poisoning / Toxins", desc: "Ingested chemicals, toxic plants", icon: "skull-outline", bg: "rgba(16, 185, 129, 0.15)", color: "#10B981" },
  { id: "bleeding", name: "Severe Bleeding", desc: "Arterial cuts, persistent blood loss", icon: "water-outline", bg: "rgba(236, 72, 153, 0.15)", color: "#EC4899" },
  { id: "vomiting", name: "Vomiting / Diarrhea", desc: "Severe dehydration, blood in stool", icon: "fitness-outline", bg: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6" },
  { id: "heatstroke", name: "Heat Stroke", desc: "High temperature, collapse, drooling", icon: "thermometer-outline", bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" },
];

export default function EmergencyScreen() {
  const { data: stores = [] } = useStores();
  const [search, setSearch] = useState("");
  const { showAlert } = useUiStore();

  const handleCallHotline = () => {
    Linking.openURL("tel:108").catch(() => {
      showAlert("Emergency Hotline", "Calling Emergency Services: 108");
    });
  };

  const handleCallClinic = (phone: string, name: string) => {
    Linking.openURL(`tel:${phone || "9999999999"}`).catch(() => {
      showAlert("Call Clinic", `Calling ${name} at ${phone || "9999999999"}`);
    });
  };

  const handleSelectSymptom = (symptomName: string) => {
    router.push({
      pathname: "/Emergency/book-emergency" as any,
      params: { symptom: symptomName }
    });
  };

  // Filter nearby emergency clinics
  const emergencyClinics = stores
    .filter((s: any) => 
      s.category === "Vet Clinic" || 
      s.category === "vet" || 
      s.storeTypes?.includes("Veterinary") || 
      s.storeTypes?.includes("Emergency Care") || 
      s.isEmergencyAvailable
    )
    .slice(0, 4);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 🩸 Blood-Red Header Section */}
      <View style={styles.bloodRedHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🚨 Emergency Assistance</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSubtitle}>Critical triage mode active. Nearest support matching is live.</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.emergencyTextMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find Open Emergency Clinics..."
            placeholderTextColor={COLORS.emergencyTextMuted}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="funnel-outline" size={18} color={COLORS.emergencyPrimaryOrange} />
        </View>
      </View>

      {/* Emergency Categories Section */}
      <Text style={styles.sectionTitle}>Select Pet Symptom Type</Text>
      <View style={styles.categoriesGrid}>
        {EMERGENCY_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryCard, { borderColor: `${cat.color}35` }]}
            onPress={() => handleSelectSymptom(cat.name)}
            activeOpacity={0.8}
          >
            <View style={[styles.categoryIconBg, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon as any} size={22} color={cat.color} />
            </View>
            <View style={styles.categoryTextWrapper}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categorySub}>{cat.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.2)" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Nearest Clinics Section */}
      <Text style={styles.sectionTitle}>Nearest Open Emergency Vets</Text>
      <View style={styles.clinicsContainer}>
        {emergencyClinics.map((clinic: any, idx: number) => {
          const clinicId = clinic.id || clinic._id;
          const phone = clinic.phone || "+91 98765 43210";
          return (
            <View key={`nearest-${clinicId}-${idx}`} style={styles.clinicCard}>
              <Image
                source={{ uri: clinic.image || clinic.photo || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500" }}
                style={styles.clinicImage}
              />
              <View style={styles.clinicInfo}>
                <View style={styles.clinicHeaderRow}>
                  <Text style={styles.clinicName} numberOfLines={1}>{clinic.name}</Text>
                  <View style={styles.openPill}>
                    <Text style={styles.openPillText}>OPEN 24/7</Text>
                  </View>
                </View>
                <Text style={styles.clinicDistance}>📍 {clinic.distance} • Rating: ⭐ {clinic.rating}</Text>
                
                {/* Immediate Action Buttons */}
                <View style={styles.clinicActions}>
                  <TouchableOpacity 
                    style={styles.callBtn}
                    onPress={() => handleCallClinic(phone, clinic.name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.callBtnText}>Call Clinic</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.bookBtn}
                    onPress={() => router.push({ pathname: "/Emergency/book-emergency", params: { clinicId } } as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookBtnText}>Book Instantly</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Map Section */}
      <Text style={styles.sectionTitle}>Live Tracking Nearby Clinics</Text>
      <View style={styles.mapContainer}>
        {/* Mocking a beautiful dark-mode map style */}
        <View style={styles.mockMap}>
          {/* Clinic Pin 1 */}
          <View style={[styles.mapPin, { top: "35%", left: "30%" }]}>
            <Ionicons name="location" size={24} color={COLORS.emergencyRed} />
            <View style={styles.pinLabel}><Text style={styles.pinLabelText}>Nearest Vet</Text></View>
          </View>
          {/* User Location Pin */}
          <View style={[styles.mapPin, { top: "60%", left: "50%" }]}>
            <Ionicons name="navigate" size={20} color="#3B82F6" />
            <View style={[styles.pinLabel, { backgroundColor: "#3B82F6" }]}><Text style={styles.pinLabelText}>You</Text></View>
          </View>
          <View style={styles.mapStatusOverlay}>
            <Ionicons name="navigate-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.mapStatusText}>GPS coordinates lock active</Text>
          </View>
        </View>
      </View>

      {/* Large CTA: Emergency Hotline Button */}
      <TouchableOpacity 
        style={styles.hotlineBtn}
        onPress={handleCallHotline}
        activeOpacity={0.9}
      >
        <View style={styles.hotlineContent}>
          <Ionicons name="call" size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.hotlineTitle}>ONE-TAP EMERGENCY CALL</Text>
            <Text style={styles.hotlineSub}>Dial instant ambulance/triage dispatch (108)</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  bloodRedHeader: {
    backgroundColor: COLORS.emergencyRed,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  categoriesGrid: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  categoryTextWrapper: {
    flex: 1,
  },
  categoryName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  categorySub: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  clinicsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  clinicCard: {
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    alignItems: "center",
  },
  clinicImage: {
    width: 74,
    height: 74,
    borderRadius: 12,
  },
  clinicInfo: {
    flex: 1,
    marginLeft: 14,
  },
  clinicHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clinicName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    marginRight: 6,
  },
  openPill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openPillText: {
    color: COLORS.emergencySuccess,
    fontSize: 8,
    fontWeight: "800",
  },
  clinicDistance: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  clinicActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurfaceLight,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  bookBtn: {
    flex: 1.2,
    backgroundColor: COLORS.emergencyRed,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mockMap: {
    height: 160,
    backgroundColor: "#151515",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    position: "relative",
    overflow: "hidden",
  },
  mapPin: {
    position: "absolute",
    alignItems: "center",
  },
  pinLabel: {
    backgroundColor: COLORS.emergencyRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  pinLabelText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  mapStatusOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapStatusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  hotlineBtn: {
    backgroundColor: COLORS.emergencyRed,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    shadowColor: COLORS.emergencyRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  hotlineContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  hotlineTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  hotlineSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 2,
  },
});
