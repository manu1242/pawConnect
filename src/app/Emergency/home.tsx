import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useStores, usePets, useBookings } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

const { width: screenWidth } = Dimensions.get("window");

export default function EmergencyHomeScreen() {
  const { user } = useAuthStore();
  const { data: stores = [], isLoading } = useStores();
  const { data: pets = [] } = usePets();
  const { data: bookings = [] } = useBookings("user");
  const [search, setSearch] = useState("");

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Filter vet/emergency clinics
  const clinics = stores.filter((s: any) => 
    s.category === "Vet Clinic" || 
    s.category === "vet" || 
  
    s.storeTypes?.includes("Veterinary") || 
    s.storeTypes?.includes("Emergency Care") || 
    s.isEmergencyAvailable ||
    s.services?.some((srv: any) => srv.name?.toLowerCase().includes("vet") || srv.name?.toLowerCase().includes("emergency"))
  );
  const featuredClinics = clinics.length > 0 ? clinics : stores.slice(0, 4);

  // Get next upcoming appointment
  const nextAppointment = bookings
    .filter((b: any) => b.status === "pending" || b.status === "accepted")
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>{getGreeting()},</Text>
          <Text style={styles.name}>{user?.fullName || "Manohar"}</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Marketplace toggle */}
          <TouchableOpacity 
            style={styles.marketplaceToggle} 
            onPress={() => router.replace("/(customer)/home" as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.emergencyPrimaryOrange} />
            <Text style={styles.marketplaceToggleText}>Exit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push("/(customer)/notifications" as any)}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar with GPS Badge */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.emergencyTextMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search symptoms, clinics, or vets..."
            placeholderTextColor={COLORS.emergencyTextMuted}
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.gpsBadge}>
            <Ionicons name="location" size={12} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 4 }} />
            <Text style={styles.gpsBadgeText}>GPS ON</Text>
          </View>
        </View>
      </View>

      {/* 🚨 Emergency Assistance Card */}
      <TouchableOpacity 
        style={styles.emergencyCard} 
        activeOpacity={0.9}
        onPress={() => router.push("/Emergency/emergency/" as any)}
      >
        <View style={styles.emergencyCardHeader}>
          <View style={styles.emergencyPulseContainer}>
            <View style={styles.emergencyPulseDot} />
            <Text style={styles.emergencyCardTitle}>🚨 EMERGENCY ASSISTANCE</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.emergencyCardBody}>
          Critical symptom checker, blood-red priority alert triage, and instant nearby emergency clinic matching.
        </Text>
        <View style={styles.emergencyCardBtn}>
          <Text style={styles.emergencyCardBtnText}>Find Emergency Vet</Text>
          <Ionicons name="flashlight" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.gridContainer}>
        {[
          { name: "🏥 Find Vet", route: "/Emergency/emergency" },
          { name: "📅 Book Appointment", route: "/Emergency/book-appointment" },
          { name: "💉 Vaccinations", route: "/Emergency/pets" },
          { name: "📋 Health Records", route: "/Emergency/profile" },
          { name: "📍 Nearby Clinics", route: "/Emergency/emergency" },
          { name: "☎ Emergency Call", route: "/Emergency/emergency", highlight: true },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.gridItem, item.highlight && styles.gridItemHighlight]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <Text style={[styles.gridItemText, item.highlight && styles.gridItemTextHighlight]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Featured Section: Nearby Veterinary Clinics */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Veterinary Clinics</Text>
        <TouchableOpacity onPress={() => router.push("/Emergency/emergency/" as any)}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} style={{ marginVertical: 20 }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalList}
          contentContainerStyle={{ gap: 16, paddingRight: 20 }}
        >
          {featuredClinics.map((clinic: any) => {
            const clinicId = clinic.id || clinic._id;
            const isOpen = clinic.status !== "Closed";
            return (
              <TouchableOpacity
                key={`clinic-${clinicId}`}
                style={styles.clinicTile}
                onPress={() => router.push({ pathname: "/Emergency/vet-details", params: { id: clinicId } } as any)}
                activeOpacity={0.9}
              >
                {/* Image background with overlay */}
                <View style={styles.clinicTileImageContainer}>
                   <Image
                            source={{ uri: clinic.banner || clinic.bannerImage || clinic.images?.[0] }}
                            style={styles.clinicTileImage}
                          />
                  <View style={[styles.statusPill, { backgroundColor: isOpen ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)" }]}>
                    <Text style={styles.statusPillText}>{isOpen ? "OPEN NOW" : "CLOSED"}</Text>
                  </View>
                </View>

                {/* Content Area */}
                <View style={styles.clinicTileContent}>
                  <Text style={styles.clinicTileName} numberOfLines={1}>{clinic.name}</Text>
                  <Text style={styles.clinicTileAddress} numberOfLines={1}>{clinic.address || clinic.city || "Nearby Clinic"}</Text>
                  <View style={styles.clinicTileMeta}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                      <Text style={styles.clinicTileRating}>{clinic.rating || "4.8"}</Text>
                    </View>
                    <Text style={styles.clinicTileDistance}>📍 {clinic.distance || "1.2 km"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Upcoming Appointments Section */}
      <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
      {nextAppointment ? (
        <View style={styles.nextAppointmentCard}>
          <View style={styles.nextAppointmentAccent} />
          <View style={styles.nextAppointmentBody}>
            <View style={styles.nextAppointmentHeader}>
              <View>
                <Text style={styles.nextAppointmentService}>{nextAppointment.serviceName}</Text>
                <Text style={styles.nextAppointmentStore}>{nextAppointment.storeName || "Veterinary Clinic"}</Text>
              </View>
              <View style={styles.nextAppointmentTimeBadge}>
                <Text style={styles.nextAppointmentTimeText}>{nextAppointment.timeSlot}</Text>
              </View>
            </View>
            <View style={styles.nextAppointmentFooter}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.emergencyTextMuted} style={{ marginRight: 6 }} />
              <Text style={styles.nextAppointmentDate}>{nextAppointment.date}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-clear-outline" size={28} color={COLORS.emergencyBorder} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyCardText}>No upcoming veterinary visits</Text>
          <TouchableOpacity 
            style={styles.emptyCardBtn}
            onPress={() => router.push("/Emergency/book-appointment" as any)}
          >
            <Text style={styles.emptyCardBtnText}>Book Vet Visit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Health Reminders & Shortcut Section */}
      <Text style={styles.sectionTitle}>Health Reminders</Text>
      <View style={styles.reminderContainer}>
        {pets.length > 0 ? (
          pets.slice(0, 2).map((pet: any, idx: number) => {
            const hasVaccines = pet.vaccinated;
            return (
              <View key={`reminder-${idx}`} style={styles.reminderCard}>
                <Ionicons name={hasVaccines ? "shield-checkmark" : "alert-circle"} size={22} color={hasVaccines ? COLORS.emergencySuccess : COLORS.emergencyAlertYellow} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{pet.name}'s Rabies Booster</Text>
                  <Text style={styles.reminderSubtitle}>
                    {hasVaccines ? "Fully up to date! Next due in 6 months." : "Booster injection is highly recommended."}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.reminderShortcut}
                  onPress={() => router.push("/Emergency/pets" as any)}
                >
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.reminderCard}>
            <Ionicons name="paw" size={22} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>Register your pets</Text>
              <Text style={styles.reminderSubtitle}>Get automated vaccination alerts & record tracking</Text>
            </View>
            <TouchableOpacity 
              style={styles.reminderShortcut}
              onPress={() => router.push("/Emergency/pets" as any)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 14,
    color: COLORS.emergencyPrimaryOrange,
    fontWeight: "700",
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  marketplaceToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyPrimaryOrange,
    gap: 6,
    shadowColor: COLORS.emergencyPrimaryOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  marketplaceToggleText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 11,
    fontWeight: "800",
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.emergencySurface,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  bellBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emergencyRed,
  },
  searchContainer: {
    marginBottom: 24,
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
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsBadgeText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 10,
    fontWeight: "800",
  },
  emergencyCard: {
    backgroundColor: COLORS.emergencyRed,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.emergencyRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyPulseContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  emergencyCardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  emergencyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyCardBody: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 16,
  },
  emergencyCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  emergencyCardBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 14,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  seeAllText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 13,
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: (screenWidth - 52) / 2,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 12,
    padding: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    height: 54,
  },
  gridItemHighlight: {
    backgroundColor: "rgba(229, 57, 53, 0.1)",
    borderColor: "rgba(229, 57, 53, 0.3)",
  },
  gridItemText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  gridItemTextHighlight: {
    color: COLORS.emergencyRed,
  },
  horizontalList: {
    marginBottom: 28,
  },
  clinicTile: {
    width: 220,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    overflow: "hidden",
  },
  clinicTileImageContainer: {
    width: "100%",
    height: 110,
    position: "relative",
  },
  clinicTileImage: {
    width: "100%",
    height: "100%",
  },
  statusPill: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  clinicTileContent: {
    padding: 12,
  },
  clinicTileName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  clinicTileAddress: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  clinicTileMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clinicTileRating: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  clinicTileDistance: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 11,
    fontWeight: "700",
  },
  nextAppointmentCard: {
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    overflow: "hidden",
    marginBottom: 24,
  },
  nextAppointmentAccent: {
    width: 5,
    backgroundColor: COLORS.emergencyPrimaryOrange,
  },
  nextAppointmentBody: {
    flex: 1,
    padding: 16,
  },
  nextAppointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nextAppointmentService: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  nextAppointmentStore: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    marginTop: 2,
  },
  nextAppointmentTimeBadge: {
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nextAppointmentTimeText: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 11,
    fontWeight: "700",
  },
  nextAppointmentFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.emergencyBorder,
    paddingTop: 8,
  },
  nextAppointmentDate: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyCardText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyCardBtn: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyCardBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  reminderContainer: {
    gap: 12,
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  reminderTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  reminderSubtitle: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  reminderShortcut: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
