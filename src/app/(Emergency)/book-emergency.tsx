import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { usePets, useStores, useCreateBookingMutation } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

const { width: screenWidth } = Dimensions.get("window");

export default function BookEmergencyScreen() {
  const params = useLocalSearchParams();
  const { data: pets = [], isLoading: loadingPets } = usePets();
  const { data: stores = [], isLoading: loadingStores } = useStores();
  const createBookingMutation = useCreateBookingMutation();

  // Route Params Pre-population
  const routeSymptom = params.symptom as string;
  const routeClinicId = params.clinicId as string;

  // Flow State
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("Now");
  const [symptomsDescription, setSymptomsDescription] = useState("");

  // GPS Location State
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string>("Detecting GPS location...");
  const [loadingGps, setLoadingGps] = useState(false);

  // Filter only DOGS for emergency pet selection
  const dogPets = pets.filter((pet: any) => pet.petType?.toLowerCase() === "dog");

  // Haversine distance calculator
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // 1. Fetch GPS Location
  useEffect(() => {
    async function getGPSPosition() {
      try {
        setLoadingGps(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setGpsLocation({ latitude: 12.9716, longitude: 77.5946 });
          setGpsAddress("Bangalore (Default GPS Coords)");
          setLoadingGps(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setGpsLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const ad = geocode[0];
          const text = [ad.name, ad.street, ad.city, ad.region, ad.postalCode].filter(Boolean).join(", ");
          setGpsAddress(text || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        } else {
          setGpsAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } catch (err) {
        console.error("GPS fetching failed:", err);
        setGpsLocation({ latitude: 12.9716, longitude: 77.5946 });
        setGpsAddress("Bangalore (Default Coords)");
      } finally {
        setLoadingGps(false);
      }
    }
    getGPSPosition();
  }, []);

  // Filter and Proximity-Sort clinics (only showing stores registered as Vet Clinics / Vets)
  const clinics = stores
    .filter((s: any) => {
      const cat = s.category?.toLowerCase() || "";
      const types = s.storeTypes?.map((t: string) => t.toLowerCase()) || [];
      return cat.includes("vet") || types.some((t: string) => t.includes("vet"));
    })
    .map((c: any) => {
      if (gpsLocation && c.latitude && c.longitude) {
        const d = calculateDistance(gpsLocation.latitude, gpsLocation.longitude, c.latitude, c.longitude);
        return { ...c, distanceValue: parseFloat(d), distanceStr: `${d} km` };
      }
      return { ...c, distanceValue: 9999, distanceStr: c.distance || "1.5 km" };
    })
    .sort((a, b) => a.distanceValue - b.distanceValue);

  // Populate defaults when dogPets loads
  useEffect(() => {
    if (dogPets.length > 0 && !selectedPet) {
      setSelectedPet(dogPets[0]);
    }
  }, [dogPets]);

  useEffect(() => {
    if (clinics.length > 0 && !selectedClinic) {
      if (routeClinicId) {
        const found = clinics.find((c: any) => (c.id || c._id) === routeClinicId);
        setSelectedClinic(found || clinics[0]);
      } else {
        setSelectedClinic(clinics[0]); // Pre-highlight nearest vet clinic
      }
    }
  }, [stores, routeClinicId, clinics]);

  useEffect(() => {
    if (routeSymptom) {
      setSymptomsDescription(`Pet is exhibiting: ${routeSymptom}. Needs urgent veterinary care.`);
    }
  }, [routeSymptom]);

  const handleCreatePetShortcut = () => {
    Alert.prompt(
      "Quick Add Pet",
      "Enter pet's name to register dog immediately:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Pet",
          onPress: (name: string | undefined) => {
            if (!name) return;
            // Select quick temporary dog pet
            setSelectedPet({ name, breed: "Dog", age: "2 yrs", weight: "12 kg", petType: "Dog", temporary: true });
          },
        },
      ]
    );
  };

  const handleConfirmBooking = () => {
    if (!selectedPet) {
      Alert.alert("Step 1 Missing", "Please pick a dog or add one quickly.");
      return;
    }
    if (!selectedClinic) {
      Alert.alert("Step 2 Missing", "Please select a clinic. If none is near, a remote backup triage doctor will be assigned.");
      return;
    }
    if (!symptomsDescription.trim()) {
      Alert.alert("Step 4 Missing", "Please specify the symptoms so the vet can prepare.");
      return;
    }

    const petPayload = {
      name: selectedPet.name,
      breed: selectedPet.breed || "Dog",
      age: selectedPet.age || "2 yrs",
      weight: selectedPet.weight || "10 kg",
      gender: selectedPet.gender || "Male",
      image: selectedPet.photo || selectedPet.profileImage || "",
      petType: "Dog",
      vaccinated: true,
      medicalConditions: symptomsDescription,
    };

    // Construct urgent booking payload
    const bookingPayload = {
      storeId: selectedClinic.id || selectedClinic._id,
      serviceId: selectedClinic.services?.[0]?._id || selectedClinic.services?.[0]?.id || "emergency-vet-service-01",
      serviceName: "Emergency Consultation",
      price: 1500, // Premium emergency slot pricing
      petDetails: petPayload,
      date: new Date().toISOString().split("T")[0],
      timeSlot: selectedTimeSlot === "Now" ? "ASAP (Now)" : selectedTimeSlot,
      paymentMethod: "UPI",
      serviceMode: "store" as any,
      customerLocation: {
        address: gpsAddress,
        latitude: gpsLocation?.latitude || 12.9716,
        longitude: gpsLocation?.longitude || 77.5946,
      } as any,
    };

    createBookingMutation.mutate(bookingPayload, {
      onSuccess: (res: any) => {
        const created = res.data?.booking || res.booking;
        // Immediately route to the triage tracking screen
        router.push({
          pathname: "/(Emergency)/success" as any,
          params: {
            bookingId: created?._id || created?.id,
            storeId: selectedClinic.id || selectedClinic._id,
            symptom: routeSymptom || symptomsDescription,
            petName: selectedPet.name,
            gpsAddress,
            latitude: gpsLocation?.latitude?.toString(),
            longitude: gpsLocation?.longitude?.toString(),
          }
        });
      },
      onError: (err: any) => {
        Alert.alert("Booking Error", err?.response?.data?.message || "Failed to submit emergency booking. Please call the hotline directly.");
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Back Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Urgent Vet Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ⚠️ Yellow Alert at the Top */}
      <View style={styles.alertBanner}>
        <Ionicons name="time" size={18} color={COLORS.emergencyBg} style={{ marginRight: 8 }} />
        <Text style={styles.alertText}>🚨 Bookings confirmed by clinic within 15 minutes</Text>
      </View>

      {/* STEP 1: PICK PET */}
      <View style={styles.stepSection}>
        <Text style={styles.stepLabel}>Step 1: Pick your Dog (Emergency Care)</Text>
        {loadingPets ? (
          <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {dogPets.length === 0 ? (
              <View style={{ justifyContent: "center", paddingHorizontal: 10 }}>
                <Text style={{ color: COLORS.emergencyTextMuted, fontSize: 12, fontWeight: "600" }}>No dogs registered. Quick Add below.</Text>
              </View>
            ) : (
              dogPets.map((pet: any) => {
                const isSelected = selectedPet && (selectedPet.id || selectedPet._id) === (pet.id || pet._id);
                return (
                  <TouchableOpacity
                    key={pet.id || pet._id}
                    style={[styles.petChip, isSelected && styles.petChipActive]}
                    onPress={() => setSelectedPet(pet)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.petImageWrapper}>
                      {pet.photo || pet.profileImage ? (
                        <Image source={{ uri: pet.photo || pet.profileImage }} style={styles.petPhoto} />
                      ) : (
                        <Ionicons name="paw" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.petName}>{pet.name}</Text>
                    {isSelected && <View style={styles.checkDot} />}
                  </TouchableOpacity>
                );
              })
            )}
            <TouchableOpacity style={styles.addPetChip} onPress={handleCreatePetShortcut} activeOpacity={0.8}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addPetText}>Quick Add</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* STEP 2: CHOOSE NEAREST CLINIC (Pre-highlighted) */}
      <View style={styles.stepSection}>
        <Text style={styles.stepLabel}>Step 2: Nearest Vet Clinic (GPS Sorted)</Text>
        {loadingStores ? (
          <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {clinics.length === 0 ? (
              <TouchableOpacity
                style={[styles.clinicChip, styles.clinicChipActive, { width: 300, flexDirection: "row", alignItems: "center", gap: 10 }]}
                activeOpacity={1}
              >
                <Ionicons name="call" size={24} color={COLORS.emergencyPrimaryOrange} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.clinicName}>Backup Emergency Triage Team</Text>
                  <Text style={styles.clinicMeta}>No local physical clinics available. Assigned backup online triage.</Text>
                </View>
              </TouchableOpacity>
            ) : (
              clinics.map((clinic: any, idx: number) => {
                const isSelected = selectedClinic && (selectedClinic.id || selectedClinic._id) === (clinic.id || clinic._id);
                return (
                  <TouchableOpacity
                    key={clinic.id || clinic._id || idx}
                    style={[styles.clinicChip, isSelected && styles.clinicChipActive]}
                    onPress={() => setSelectedClinic(clinic)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clinicName}>{clinic.name}</Text>
                    <Text style={styles.clinicMeta}>📍 {clinic.distanceStr || clinic.distance || "1.0 km"} • Rating: {clinic.rating || "4.8"}</Text>
                    {idx === 0 && <View style={styles.nearestBadge}><Text style={styles.nearestBadgeText}>NEAREST</Text></View>}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* STEP 3: SELECT TIME SLOT */}
      <View style={styles.stepSection}>
        <Text style={styles.stepLabel}>Step 3: Select Time Slot</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {["Now", "+15 mins", "+30 mins", "+45 mins", "+1 hour", "+2 hours"].map((slot) => {
            const isSelected = selectedTimeSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotChip, isSelected && styles.slotChipActive]}
                onPress={() => setSelectedTimeSlot(slot)}
                activeOpacity={0.8}
              >
                <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* STEP 4: DESCRIBE SYMPTOMS */}
      <View style={styles.stepSection}>
        <Text style={styles.stepLabel}>Step 4: Describe Symptoms</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Please describe symptoms (e.g. difficulty breathing, bleeding from leg, ingested toxins...)"
          placeholderTextColor={COLORS.emergencyTextMuted}
          value={symptomsDescription}
          onChangeText={setSymptomsDescription}
        />
      </View>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmBooking}
          disabled={createBookingMutation.isPending}
          activeOpacity={0.9}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Confirm Emergency Booking</Text>
            </>
          )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencyAlertYellow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  alertText: {
    color: COLORS.emergencyBg,
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  stepSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  stepLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    gap: 12,
    paddingRight: 20,
    paddingVertical: 4,
  },
  petChip: {
    width: 90,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    position: "relative",
  },
  petChipActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
  },
  petImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.emergencySurfaceLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  petPhoto: {
    width: "100%",
    height: "100%",
  },
  petName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  checkDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emergencyPrimaryOrange,
  },
  addPetChip: {
    width: 90,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderStyle: "dashed",
  },
  addPetText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  clinicChip: {
    width: 170,
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    position: "relative",
  },
  clinicChipActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
  },
  clinicName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  clinicMeta: {
    color: COLORS.emergencyTextMuted,
    fontSize: 10,
    marginTop: 4,
  },
  nearestBadge: {
    position: "absolute",
    bottom: -6,
    right: 8,
    backgroundColor: COLORS.emergencyRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nearestBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
  },
  slotChipActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: COLORS.emergencyPrimaryOrange,
  },
  slotText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  slotTextActive: {
    color: "#FFFFFF",
  },
  textArea: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 13,
    textAlignVertical: "top",
    height: 100,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  confirmBtn: {
    backgroundColor: COLORS.emergencyRed,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.emergencyRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
