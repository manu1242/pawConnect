import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Animated } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";
import { useUiStore } from "../../store/uiStore";

// 🌟 Reusable Pulsing Skeleton Component for premium UX
const SkeletonPulse = ({ style }: { style: any }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return <Animated.View style={[style, { opacity: pulseAnim }]} />;
};

function VetDetailsSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Banner Placeholder */}
      <SkeletonPulse style={styles.skeletonBanner} />
      
      <View style={styles.skeletonContent}>
        {/* Title & Address */}
        <SkeletonPulse style={styles.skeletonTitle} />
        <SkeletonPulse style={styles.skeletonAddress} />
        
        {/* Stats Row */}
        <View style={styles.skeletonStatsRow}>
          <SkeletonPulse style={styles.skeletonStatBox} />
          <SkeletonPulse style={styles.skeletonStatBox} />
        </View>

        {/* Action Buttons */}
        <View style={styles.skeletonActionRow}>
          <SkeletonPulse style={styles.skeletonActionBtn} />
          <SkeletonPulse style={styles.skeletonActionBtn} />
        </View>

        {/* Tab Pills */}
        <View style={styles.skeletonTabRow}>
          <SkeletonPulse style={styles.skeletonTabPill} />
          <SkeletonPulse style={styles.skeletonTabPill} />
          <SkeletonPulse style={styles.skeletonTabPill} />
          <SkeletonPulse style={styles.skeletonTabPill} />
        </View>

        {/* Content Card */}
        <SkeletonPulse style={styles.skeletonMainCard} />
        <SkeletonPulse style={styles.skeletonLine} />
        <SkeletonPulse style={styles.skeletonLineShort} />
      </View>
    </View>
  );
}

export default function VetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { data: clinic, isLoading, error } = useStoreDetails(id as string);
  const { showToast, showAlert } = useUiStore();
  const clinicAny = clinic as any;

  const [activeTab, setActiveTab] = useState("About");

  if (isLoading) {
    return <VetDetailsSkeleton />;
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

  // Build clean address string
  const clinicAddressStr = typeof clinic.address === "string" 
    ? clinic.address 
    : (clinic.address
       ? `${clinicAny.address.street || ""}, ${clinic.address.city || ""}, ${clinic.address.pincode || ""}`
       : (clinic.addressDetails?.city || "Address not available"));

  const handleCallClinic = () => {
    if (!clinic.phone) {
      showToast("Phone hotline not registered for this clinic", "error");
      return;
    }
    Linking.openURL(`tel:${clinic.phone}`).catch(() => {
      showAlert("Call Clinic", `Calling ${clinic.name} at ${clinic.phone}`);
    });
  };

  const handleNavigate = () => {
    const address = clinicAddressStr;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {
      showAlert("Directions", `Opening maps for: ${address}`);
    });
  };

  const handleBookAppointment = () => {
    router.push({
      pathname: "/Emergency/book-appointment" as any,
      params: { clinicId: clinic.id || clinic._id }
    });
  };

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
        <View style={styles.nameLogoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clinicName}>{clinic.name}</Text>
            <Text style={styles.clinicAddress}>📍 {clinicAddressStr}</Text>
          </View>
          {clinic.logo ? (
            <Image source={{ uri: clinic.logo }} style={styles.clinicLogo} />
          ) : null}
        </View>

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

        {/* Horizontal Scrollable Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer} 
          contentContainerStyle={styles.tabsContentContainer}
        >
          {["About", "Doctors", "Gallery", "Services", "Hours"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content Wrapper */}
        <View style={styles.tabContentWrapper}>
          {activeTab === "About" && (
            <View style={styles.tabContentArea}>
              <View style={styles.aboutSection}>
                <Text style={styles.tabSectionTitle}>About Clinic</Text>
                <Text style={styles.aboutDescription}>
                  {clinic.description || clinic.storeDetails?.description || "Welcome to our state-of-the-art veterinary clinic. We provide complete diagnostics, treatment, surgical operations, and preventative vaccines for dogs and all household pets."}
                </Text>
              </View>
              {clinic.facilities && clinic.facilities.length > 0 && (
                <View style={styles.aboutSection}>
                  <Text style={styles.tabSectionTitle}>Clinic Facilities</Text>
                  <View style={styles.facilitiesContainer}>
                    {clinic.facilities.map((fac: string, idx: number) => (
                      <View key={`fac-${idx}`} style={styles.facilityTag}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 4 }} />
                        <Text style={styles.facilityText}>{fac}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === "Doctors" && (
            <View style={styles.tabContentArea}>
              <Text style={styles.tabSectionTitle}>Veterinary Team</Text>
              {clinicAny.doctors && clinicAny.doctors.length > 0 ? (
                clinicAny.doctors.map((doc: any, idx: number) => (
                  <View key={`doc-${idx}`} style={[styles.doctorCard, { marginBottom: 10 }]}>
                    <View style={styles.doctorAvatar}>
                      <Ionicons name="person" size={28} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.doctorName}>{doc.name}</Text>
                      <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
                      <Text style={styles.doctorExp}>{doc.experience || "Senior Vet Doctor"}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No doctor profiles added to this clinic registry.</Text>
              )}
            </View>
          )}

          {activeTab === "Gallery" && (
            <View style={styles.tabContentArea}>
              <Text style={styles.tabSectionTitle}>Clinic Facilities Gallery</Text>
              {clinic.gallery && clinic.gallery.length > 0 ? (
                <View style={styles.galleryGrid}>
                  {clinic.gallery.map((url: string, idx: number) => (
                    <Image key={`gallery-${idx}`} source={{ uri: url }} style={styles.galleryGridPhoto} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyGalleryCard}>
                  <Ionicons name="images-outline" size={44} color={COLORS.emergencyTextMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.noDataText}>No facility photos available in the gallery.</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "Services" && (
            <View style={styles.tabContentArea}>
              <Text style={styles.tabSectionTitle}>Services Offered</Text>
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
            </View>
          )}

          {activeTab === "Hours" && (
            <View style={styles.tabContentArea}>
              <Text style={styles.tabSectionTitle}>Operating Schedule</Text>
              <View style={styles.hoursContainer}>
                {clinic.businessHours && clinic.businessHours.length > 0 ? (
                  clinic.businessHours.map((bh: any, idx: number) => (
                    <View key={`bh-${idx}`} style={styles.hourRow}>
                      <Text style={styles.hourDay}>{bh.day}</Text>
                      <View style={[styles.hourStatusPill, { backgroundColor: bh.isOpen ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)" }]}>
                        <Text style={[styles.hourStatusText, { color: bh.isOpen ? COLORS.emergencySuccess : COLORS.emergencyRed }]}>
                          {bh.isOpen ? `${bh.openTime} - ${bh.closeTime}` : "Closed"}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.defaultHoursCard}>
                    <Ionicons name="time" size={20} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 10 }} />
                    <Text style={styles.defaultHoursText}>
                      {clinic.is24x7 ? "Open 24 Hours / 7 Days a week" : "Standard Hours: 09:00 AM - 09:00 PM"}
                    </Text>
                  </View>
                )}
              </View>
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
  
  // Tabs styling
  tabsContainer: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  tabsContentContainer: {
    gap: 10,
    paddingBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  tabButtonActive: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    borderColor: COLORS.emergencyPrimaryOrange,
  },
  tabButtonText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // Tab Content Layout
  tabContentWrapper: {
    minHeight: 180,
    marginBottom: 24,
  },
  tabContentArea: {
    paddingVertical: 10,
  },
  tabSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  
  // About Content
  aboutSection: {
    marginBottom: 20,
  },
  aboutDescription: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  facilityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  facilityText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  // Doctors List
  doctorCard: {
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 14,
    alignItems: "center",
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

  // Gallery grid
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  galleryGridPhoto: {
    width: "48%",
    height: 110,
    borderRadius: 10,
  },
  emptyGalleryCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Services Offered
  servicesList: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 14,
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

  // Business Hours Schedule
  hoursContainer: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  hourDay: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  hourStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hourStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  defaultHoursCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 12,
    padding: 16,
  },
  defaultHoursText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Booking CTA
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
    marginTop: 10,
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
  nameLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  clinicLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: COLORS.emergencySurface,
  },

  // Skeleton placeholders
  skeletonContainer: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
  },
  skeletonBanner: {
    width: "100%",
    height: 220,
    backgroundColor: COLORS.emergencySurface,
  },
  skeletonContent: {
    padding: 20,
  },
  skeletonTitle: {
    width: "70%",
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.emergencySurface,
    marginBottom: 12,
  },
  skeletonAddress: {
    width: "45%",
    height: 14,
    borderRadius: 4,
    backgroundColor: COLORS.emergencySurface,
    marginBottom: 24,
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  skeletonStatBox: {
    width: 120,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.emergencySurface,
  },
  skeletonActionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  skeletonActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.emergencySurface,
  },
  skeletonTabRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  skeletonTabPill: {
    width: 76,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.emergencySurface,
  },
  skeletonMainCard: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    backgroundColor: COLORS.emergencySurface,
    marginBottom: 16,
  },
  skeletonLine: {
    width: "100%",
    height: 14,
    borderRadius: 4,
    backgroundColor: COLORS.emergencySurface,
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    backgroundColor: COLORS.emergencySurface,
  },
});
