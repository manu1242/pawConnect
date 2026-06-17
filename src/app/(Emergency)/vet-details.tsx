import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStores } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

export default function VetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: stores = [] } = useStores();

  // Find the current store details
  const foundClinic = stores.find((s: any) => (s.id || s._id) === id) || stores[0];
  const clinic = (foundClinic ? { ...foundClinic } : {
    name: "Apex Veterinary Hospital & Emergency Care",
    address: "742 Evergreen Terrace, Sector 4, Bangalore",
    rating: 4.9,
    phone: "+91 98765 43210",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500",
    services: [
      { id: "s1", name: "Emergency Surgery", price: 2500 },
      { id: "s2", name: "General Checkup", price: 600 },
      { id: "s3", name: "Rabies Vaccination", price: 400 },
      { id: "s4", name: "Pet Dental Cleaning", price: 1200 },
    ],
  }) as any;

  const clinicAddressStr = typeof clinic.address === "string" 
    ? clinic.address 
    : (clinic.address?.street || "Sector 4, Bangalore");

  const handleCallClinic = () => {
    const phone = clinic.phone || "+91 98765 43210";
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call Clinic", `Calling ${clinic.name} at ${phone}`);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 🖼️ Large Clinic Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: clinic.image || clinic.photo || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500" }}
          style={styles.bannerImage}
        />
        <View style={styles.headerOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.emergencyAvailability}>
            <View style={styles.pulseDot} />
            <Text style={styles.emergencyAvailabilityText}>24/7 EMERGENCY LIVE</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.clinicName}>{clinic.name}</Text>
        <Text style={styles.clinicAddress}>📍 {clinicAddressStr}</Text>

        {/* Rating and Timings info */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={16} color="#FBBF24" style={{ marginRight: 6 }} />
            <Text style={styles.statText}>{clinic.rating || "4.8"} / 5.0</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time" size={16} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 6 }} />
            <Text style={styles.statText}>09:00 AM - 09:00 PM</Text>
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

        {/* Doctor Information */}
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
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.doctorName}>Dr. Ananya Sharma, DVM</Text>
              <Text style={styles.doctorSpecialty}>Emergency Surgery & Trauma Specialist</Text>
              <Text style={styles.doctorExp}>12+ Years Experience</Text>
            </View>
          </View>
        )}

        {/* Clinic Gallery */}
        <Text style={styles.sectionTitle}>Clinic Facilities Gallery</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
          {[
            "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400",
            "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
            "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400",
          ].map((url, idx) => (
            <Image key={`gallery-${idx}`} source={{ uri: url }} style={styles.galleryPhoto} />
          ))}
        </ScrollView>

        {/* Services List */}
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
            <View style={styles.serviceItem}>
              <Ionicons name="medical" size={16} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 10 }} />
              <Text style={styles.serviceName}>General Consultation</Text>
              <Text style={styles.servicePrice}>₹600</Text>
            </View>
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
});
