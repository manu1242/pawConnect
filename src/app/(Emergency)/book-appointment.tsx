import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePets, useStores, useCreateBookingMutation } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

const DOCTORS = [
  { id: "d1", name: "Dr. Ananya Sharma", role: "Senior Surgeon", fee: 1000, icon: "ribbon" },
  { id: "d2", name: "Dr. Kabir Malhotra", role: "General Vet Practitioner", fee: 600, icon: "medkit" },
  { id: "d3", name: "Dr. Sneha Roy", role: "Pediatric Pet Specialist", fee: 800, icon: "heart" },
];

export default function BookAppointmentScreen() {
  const params = useLocalSearchParams();
  const { data: pets = [], isLoading: loadingPets } = usePets();
  const { data: stores = [], isLoading: loadingStores } = useStores();
  const createBookingMutation = useCreateBookingMutation();

  const routeClinicId = params.clinicId as string;

  // Stepper Wizard State
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(DOCTORS[0]);
  const [selectedDate, setSelectedDate] = useState("2026-06-17");
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");

  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      setSelectedPet(pets[0]);
    }
  }, [pets]);

  useEffect(() => {
    const clinics = stores.filter((s: any) => s.category === "Vet Clinic" || s.category === "vet" || true);
    if (clinics.length > 0 && !selectedClinic) {
      if (routeClinicId) {
        const found = clinics.find((c: any) => (c.id || c._id) === routeClinicId);
        setSelectedClinic(found || clinics[0]);
      } else {
        setSelectedClinic(clinics[0]);
      }
    }
  }, [stores, routeClinicId]);

  const handleNext = () => {
    if (step === 1 && !selectedPet) {
      Alert.alert("Required", "Please select a pet for this booking.");
      return;
    }
    if (step === 2 && !selectedClinic) {
      Alert.alert("Required", "Please select a veterinary clinic.");
      return;
    }
    if (step === 3 && !selectedDoctor) {
      Alert.alert("Required", "Please choose a doctor.");
      return;
    }
    if (step === 4 && !selectedSlot) {
      Alert.alert("Required", "Please choose a time slot.");
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      submitBooking();
    }
  };

  const submitBooking = () => {
    if (!selectedPet || !selectedClinic || !selectedDoctor) return;

    const petPayload = {
      name: selectedPet.name,
      breed: selectedPet.breed || "Mixed Breed",
      age: selectedPet.age || "2 yrs",
      weight: selectedPet.weight || "10 kg",
      gender: selectedPet.gender || "Male",
      image: selectedPet.photo || selectedPet.profileImage || "",
      petType: selectedPet.petType || "Dog",
      vaccinated: true,
      medicalConditions: `Consultation with ${selectedDoctor.name}`,
    };

    const bookingPayload = {
      storeId: selectedClinic.id || selectedClinic._id,
      serviceId: selectedClinic.services?.[0]?._id || selectedClinic.services?.[0]?.id || "vet-service-consult",
      serviceName: `Consultation: ${selectedDoctor.name}`,
      price: selectedDoctor.fee,
      petDetails: petPayload,
      date: selectedDate,
      timeSlot: selectedSlot,
      paymentMethod: "UPI",
      serviceMode: "store" as any,
      customerLocation: {
        address: "Hospital Outpatient Visit",
        latitude: 12.9716,
        longitude: 77.5946,
      } as any,
    };

    createBookingMutation.mutate(bookingPayload, {
      onSuccess: (res: any) => {
        Alert.alert(
          "Appointment Scheduled",
          "Your veterinary appointment is successfully scheduled. You can track it under Visits.",
          [
            {
              text: "Go to Visits",
              onPress: () => {
                router.replace("/(Emergency)/appointments");
              },
            },
          ]
        );
      },
      onError: (err: any) => {
        Alert.alert("Booking Failed", err?.response?.data?.message || "Failed to schedule appointment.");
      },
    });
  };

  const clinics = stores.filter((s: any) => s.category === "Vet Clinic" || s.category === "vet" || true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Vet Visit</Text>
        <Text style={styles.stepIndicator}>Step {step} of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STEP 1: SELECT PET */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Pet Patient</Text>
            {loadingPets ? (
              <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} />
            ) : pets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="paw-outline" size={40} color={COLORS.emergencyBorder} />
                <Text style={styles.emptyText}>No registered pets found.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/(Emergency)/pets" as any)}>
                  <Text style={styles.emptyBtnText}>Register Pet First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              pets.map((pet: any) => {
                const isSelected = selectedPet && (selectedPet.id || selectedPet._id) === (pet.id || pet._id);
                return (
                  <TouchableOpacity
                    key={pet.id || pet._id}
                    style={[styles.selectionCard, isSelected && styles.selectionCardActive]}
                    onPress={() => setSelectedPet(pet)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="paw" size={20} color={isSelected ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={styles.cardTitle}>{pet.name}</Text>
                      <Text style={styles.cardSub}>{pet.breed} • {pet.age}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.emergencyPrimaryOrange} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* STEP 2: SELECT CLINIC */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Select Veterinary Clinic</Text>
            {loadingStores ? (
              <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} />
            ) : (
              clinics.map((clinic: any) => {
                const isSelected = selectedClinic && (selectedClinic.id || selectedClinic._id) === (clinic.id || clinic._id);
                return (
                  <TouchableOpacity
                    key={clinic.id || clinic._id}
                    style={[styles.selectionCard, isSelected && styles.selectionCardActive]}
                    onPress={() => setSelectedClinic(clinic)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business" size={20} color={isSelected ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={styles.cardTitle}>{clinic.name}</Text>
                      <Text style={styles.cardSub}>📍 {clinic.address || clinic.city || "Nearby"}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.emergencyPrimaryOrange} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* STEP 3: SELECT DOCTOR */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Select Veterinarian</Text>
            {DOCTORS.map((doc) => {
              const isSelected = selectedDoctor && selectedDoctor.id === doc.id;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.selectionCard, isSelected && styles.selectionCardActive]}
                  onPress={() => setSelectedDoctor(doc)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={doc.icon as any} size={20} color={isSelected ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={styles.cardTitle}>{doc.name}</Text>
                    <Text style={styles.cardSub}>{doc.role} • Consultation Fee: ₹{doc.fee}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.emergencyPrimaryOrange} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 4: DATE & TIME */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Choose Schedule Date</Text>
            <View style={styles.datesGrid}>
              {["2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20"].map((date) => {
                const isSelected = selectedDate === date;
                const dateParts = date.split("-");
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => setSelectedDate(date)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dateChipLabel}>{dateParts[2]}/{dateParts[1]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Select Available Time Slot</Text>
            <View style={styles.slotsGrid}>
              {["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"].map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, isSelected && styles.slotChipActive]}
                    onPress={() => setSelectedSlot(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.slotText}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 5: REVIEW CONFIRMATION */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Review Appointment Details</Text>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pet Patient:</Text>
                <Text style={styles.summaryVal}>{selectedPet?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vet Clinic:</Text>
                <Text style={styles.summaryVal} numberOfLines={1}>{selectedClinic?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doctor Assigned:</Text>
                <Text style={styles.summaryVal}>{selectedDoctor?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule Date:</Text>
                <Text style={styles.summaryVal}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time Slot:</Text>
                <Text style={styles.summaryVal}>{selectedSlot}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Consultation Fee:</Text>
                <Text style={styles.totalVal}>₹{selectedDoctor?.fee}</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Wizard Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleNext}
          disabled={createBookingMutation.isPending}
          activeOpacity={0.9}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>{step === 5 ? "Schedule Visit" : "Continue"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.emergencyBg,
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  stepIndicator: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.emergencyTextMuted,
    marginTop: 10,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    padding: 16,
    marginBottom: 12,
  },
  selectionCardActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cardSub: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  datesGrid: {
    flexDirection: "row",
    gap: 10,
  },
  dateChip: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dateChipActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  dateChipLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotChip: {
    width: "30.5%",
    height: 42,
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  slotChipActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  slotText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryVal: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    maxWidth: "60%",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.emergencyBorder,
    marginVertical: 4,
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  totalVal: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 16,
    fontWeight: "900",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.emergencyBorder,
  },
  actionBtn: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.emergencyPrimaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
