import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

export default function VetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: clinic, isLoading, error } = useStoreDetails(id as string);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.emergencyPrimaryOrange} />
        <Text style={styles.loadingText}>Loading clinic details...</Text>
      </View>
    );
  }

  if (error || !clinic) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color={COLORS.emergencyRed} />
        <Text style={styles.errorText}>Failed to load clinic details</Text>
        <TouchableOpacity style={styles.backBtnText} onPress={() => router.back()}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build clean address string from object or string structure
  const clinicAddressStr = typeof clinic.address === "string" 
    ? clinic.address 
    : (clinic.address
       ? `${clinic.address.street || ""}, ${clinic.address.city || ""}, ${clinic.address.pincode || ""}`
       : (clinic.addressDetails?.city || "Address not available"));

  const handleCallClinic = () => {
    if (!clinic.phone) {
      showToast("Phone hotline not registered for this clinic", "error");
      return;
    }
    Linking.openURL(`tel:${clinic.phone}`).catch(() => {
      Alert.alert("Call Clinic", `Calling ${clinic.name} at ${clinic.phone}`);
    });
  };

  const handleNavigate = () => {
    const address = clinicAddressStr;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Directions", `Opening maps for: ${address}`);
    });
  };

  const handleBookAppointment = () => {
    router.push({
      pathname: "/(Emergency)/book-appointment" as any,
      params: { clinicId: clinic.id || clinic._id }
    });
  };

  // Dynamically calculate timing
  const getClinicTimings = () => {
    if (clinic.businessHours && clinic.businessHours.length > 0) {
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const todayHours = clinic.businessHours.find((bh: any) => bh.day === today);
      if (todayHours) {
        return todayHours.isOpen 
          ? `${todayHours.openTime} - ${todayHours.closeTime}`
          : "Closed Today";
      }
      return `${clinic.businessHours[0].openTime} - ${clinic.businessHours[0].closeTime}`;
    }
    return clinic.is24x7 ? "24/7 Open" : "09:00 AM - 09:00 PM";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 🖼️ Dynamic Clinic Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: clinic.bannerImage || clinic.banner || clinic.logo || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500" }}
          style={styles.bannerImage}
        />
        <View style={styles.headerOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {clinic.is24x7 && (
            <View style={styles.emergencyAvailability}>
              <View style={styles.pulseDot} />
              <Text style={styles.emergencyAvailabilityText}>24/7 EMERGENCY LIVE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.clinicName}>{clinic.name}</Text>
        <Text style={styles.clinicAddress}>📍 {clinicAddressStr}</Text>

        {/* Rating and Timings info from API */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={16} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.statText}>{clinic.rating ? `${clinic.rating} / 5.0` : "4.8 / 5.0"}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time" size={16} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 6 }} />
            <Text style={styles.statText}>{getClinicTimings()}</Text>
          </View>
        </View>

        {/* Action button row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.outlineActionBtn} onPress={handleCallClinic}>
            <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Call Clinic</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineActionBtn} onPress={handleNavigate}>
            <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Doctor Information - API based */}
        <Text style={styles.sectionTitle}>Senior Veterinary Doctors</Text>
        {clinic.doctors && clinic.doctors.length > 0 ? (
          clinic.doctors.map((doc: any, idx: number) => (
            <View key={`doc-${idx}`} style={[styles.doctorCard, { marginBottom: 10 }]}>
              <View style={styles.doctorAvatar}>
                <Ionicons name="person" size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.doctorName}>{doc.name}</Text>
                <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
                <Text style={styles.doctorExp}>{doc.experience}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No doctor profiles added to this clinic registry.</Text>
        )}

        {/* Clinic Gallery - API based */}
        {clinic.gallery && clinic.gallery.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Clinic Facilities Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {clinic.gallery.map((url: string, idx: number) => (
                <Image key={`gallery-${idx}`} source={{ uri: url }} style={styles.galleryPhoto} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Services List - API based */}
        <Text style={styles.sectionTitle}>Services Offered</Text>
        <View style={styles.servicesList}>
          {clinic.services && clinic.services.length > 0 ? (
            clinic.services.map((srv: any, idx: number) => (
              <View key={`srv-${idx}`} style={styles.serviceItem}>
                <Ionicons name="medical" size={16} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 10 }} />
                <Text style={styles.serviceName} numberOfLines={1}>{srv.name}</Text>
                <Text style={styles.servicePrice}>₹{srv.price || srv.priceDetails || 500}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noDataText, { paddingVertical: 14 }]}>No services registered for this clinic.</Text>
          )}
        </View>

        {/* Large Booking CTA */}
        <TouchableOpacity style={styles.bookingCta} onPress={handleBookAppointment} activeOpacity={0.9}>
          <Text style={styles.bookingCtaText}>Book Veterinary Appointment</Text>
          <Ionicons name="calendar" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  bannerContainer: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  headerOverlay: {
    position: "absolute",
    top: 24,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyAvailability: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencyRed,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  emergencyAvailabilityText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  infoSection: {
    padding: 20,
  },
  clinicName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  clinicAddress: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    marginBottom: 20,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  outlineActionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 10,
    marginBottom: 12,
  },
  doctorCard: {
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  doctorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.emergencyPrimaryOrange,
    justifyContent: "center",
    alignItems: "center",
  },
  doctorName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  doctorSpecialty: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  doctorExp: {
    color: COLORS.emergencyTextMuted,
    fontSize: 10,
    marginTop: 2,
  },
  galleryScroll: {
    gap: 12,
    paddingRight: 20,
    marginBottom: 24,
  },
  galleryPhoto: {
    width: 140,
    height: 90,
    borderRadius: 10,
  },
  servicesList: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 14,
    marginBottom: 30,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  serviceName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  servicePrice: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 13,
    fontWeight: "800",
  },
  bookingCta: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.emergencyPrimaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookingCtaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.emergencyBg,
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.emergencyRed,
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
  },
  backBtnText: {
    marginTop: 16,
    padding: 10,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  noDataText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 8,
  },
});
