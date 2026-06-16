import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBookingStore } from "../../store/bookingStore";
import { useUiStore } from "../../store/uiStore";
import { usePets, useCreateBookingMutation } from "../../services/queries/hooks";
import { bookingApi } from "../../services/api/bookingApi";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../../components/common/CustomButton";

export default function BookingWizardScreen() {
  const { bookingDraft, setBookingDraft, clearBookingDraft } = useBookingStore();
  const { openModal, showToast } = useUiStore();
  const { data: pets, isLoading: loadingPets } = usePets();
  const createBookingMutation = useCreateBookingMutation();

  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<any>(bookingDraft.petDetails || null);
  const [date, setDate] = useState(bookingDraft.date || "2026-06-17");
  const [slot, setSlot] = useState(bookingDraft.timeSlot || "");
  interface SlotInfo {
    time: string;
    isBooked: boolean;
  }
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(bookingDraft.paymentMethod || "UPI");
  const [selectedServiceMode, setSelectedServiceMode] = useState<"store" | "home">(
    bookingDraft.serviceMode === "home" || bookingDraft.serviceMode === "Home Visit Only" ? "home" : "store"
  );

  // Fetch slots when date or store ID changes
  useEffect(() => {
    if (bookingDraft.storeId && date) {
      setLoadingSlots(true);
      bookingApi
        .getAvailableSlots(bookingDraft.storeId, date)
        .then((res) => {
          const fetched = res.data?.slots || [];
          const normalized = fetched.map((item: any) => {
            if (typeof item === "string") {
              return { time: item, isBooked: false };
            }
            return { time: item.time, isBooked: !!item.isBooked };
          });
          if (normalized.length === 0) {
            setSlots([
              { time: "09:00 AM", isBooked: false },
              { time: "11:00 AM", isBooked: false },
              { time: "02:00 PM", isBooked: false },
              { time: "04:00 PM", isBooked: false },
            ]);
          } else {
            setSlots(normalized);
          }
        })
        .catch(() => {
          setSlots([
            { time: "09:00 AM", isBooked: false },
            { time: "11:00 AM", isBooked: false },
            { time: "02:00 PM", isBooked: false },
            { time: "04:00 PM", isBooked: false },
          ]); // Fallback slots
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [bookingDraft.storeId, date]);

  // Persist form data locally as we progress
  const saveDraftState = () => {
    setBookingDraft({
      petDetails: selectedPet,
      date,
      timeSlot: slot,
      paymentMethod,
      serviceMode: selectedServiceMode,
    });
  };

  const handleNext = () => {
    if (step === 1 && !selectedPet) {
      showToast("Please select a pet", "info");
      return;
    }
    if (step === 2 && !slot) {
      showToast("Please choose a time slot", "info");
      return;
    }
    if (step === 3 && !bookingDraft.customerLocation) {
      showToast("Please select your address", "info");
      return;
    }

    saveDraftState();
    if (step < 4) {
      setStep(step + 1);
    } else {
      submitBooking();
    }
  };

  const submitBooking = () => {
    if (!selectedPet) return;

    const petPayload = {
      name: selectedPet.name,
      breed: selectedPet.breed,
      age: selectedPet.age,
      weight: selectedPet.weight,
      gender: selectedPet.gender,
      image: selectedPet.photo || selectedPet.profileImage || selectedPet.image || "",
      petType: selectedPet.petType || "Dog",
      vaccinated: !!selectedPet.vaccinated,
      vaccinationRecords: selectedPet.vaccinationRecords || [],
      medicalConditions: selectedPet.medicalConditions || "",
      allergies: selectedPet.allergies || "",
      medications: selectedPet.medications || "",
      temperament: selectedPet.temperament || "",
      trainingStatus: selectedPet.trainingStatus || "",
      specialInstructions: selectedPet.specialInstructions || "",
      microchipNumber: selectedPet.microchipNumber || "",
    };

    createBookingMutation.mutate(
      {
        storeId: bookingDraft.storeId,
        serviceId: bookingDraft.serviceId,
        serviceName: bookingDraft.serviceName,
        serviceMode: selectedServiceMode,
        price: bookingDraft.price,
        petDetails: petPayload,
        date,
        timeSlot: slot,
        paymentMethod,
        customerLocation: bookingDraft.customerLocation as any,
      },
      {
        onSuccess: () => {
          showToast("Booking created successfully!", "success");
          clearBookingDraft();
          router.replace("/bookings" as any);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Booking failed to submit", "error");
        },
      }
    );
  };

  const triggerLocationPicker = () => {
    openModal("locationPicker", {
      onSelect: (loc: any) => {
        setBookingDraft({ customerLocation: loc });
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Book {bookingDraft.serviceName}</Text>
        <Text style={styles.stepIndicator}>Step {step} of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: PET SELECTION */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Which pet is this booking for?</Text>
            {loadingPets ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
            ) : !pets || pets.length === 0 ? (
              <View style={styles.emptyPets}>
                <Text style={styles.emptyPetsText}>No pets registered yet.</Text>
                <CustomButton title="Add a Pet First" onPress={() => router.push("/pets" as any)} />
              </View>
            ) : (
              pets.map((pet) => {
                const petId = pet.id || (pet as any)._id;
                const isSelected = (selectedPet?.id || (selectedPet as any)?._id) === petId;
                return (
                  <TouchableOpacity
                    key={petId}
                    style={[styles.selectionCard, isSelected ? styles.cardActive : null]}
                    onPress={() => setSelectedPet(pet)}
                  >
                    <Ionicons name="paw" size={20} color={isSelected ? COLORS.primary : COLORS.textMuted} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.cardName}>{pet.name}</Text>
                      <Text style={styles.cardSub}>{pet.breed} • {pet.age} years old</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* STEP 2: DATE & TIME */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Choose a time slot</Text>
            <View style={styles.daysRow}>
              {["2026-06-17", "2026-06-18", "2026-06-19"].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, date === d ? styles.dayChipActive : null]}
                  onPress={() => setDate(d)}
                >
                  <Text style={[styles.dayText, date === d ? styles.dayTextActive : null]}>
                    {d.split("-")[2]}/{d.split("-")[1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loadingSlots ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((s) => {
                  const isSelected = slot === s.time;
                  const isBooked = s.isBooked;
                  return (
                    <TouchableOpacity
                      key={s.time}
                      style={[
                        styles.slotChip, 
                        isSelected ? styles.slotChipActive : null,
                        isBooked ? styles.slotChipBooked : null
                      ]}
                      onPress={() => !isBooked && setSlot(s.time)}
                      disabled={isBooked}
                    >
                      <Text style={[
                        styles.slotText, 
                        isSelected ? styles.slotTextActive : null,
                        isBooked ? styles.slotTextBooked : null
                      ]}>
                        {s.time} {isBooked ? "(Booked)" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* STEP 3: LOCATION & PAYMENT */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Service Location & Payment</Text>
            
            {bookingDraft.serviceMode === "Both" && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.subLabel}>Service Mode</Text>
                <View style={styles.serviceModeRow}>
                  <TouchableOpacity
                    style={[styles.modeChip, selectedServiceMode === "store" ? styles.modeChipActive : null]}
                    onPress={() => setSelectedServiceMode("store")}
                  >
                    <Ionicons name="business-outline" size={18} color={selectedServiceMode === "store" ? COLORS.primaryLight : COLORS.textMuted} />
                    <Text style={[styles.modeText, selectedServiceMode === "store" ? styles.modeTextActive : null]}>At Store</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeChip, selectedServiceMode === "home" ? styles.modeChipActive : null]}
                    onPress={() => setSelectedServiceMode("home")}
                  >
                    <Ionicons name="home-outline" size={18} color={selectedServiceMode === "home" ? COLORS.primaryLight : COLORS.textMuted} />
                    <Text style={[styles.modeText, selectedServiceMode === "home" ? styles.modeTextActive : null]}>Home Visit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.locationButton} onPress={triggerLocationPicker}>
              <Ionicons name="location" size={20} color={COLORS.primaryLight} />
              <Text style={styles.locationButtonText}>
                {bookingDraft.customerLocation?.address || "Resolve My Address via GPS"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.subLabel}>Payment Method</Text>
            {["Cash", "UPI", "Credit Card"].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.selectionCard, paymentMethod === m ? styles.cardActive : null]}
                onPress={() => setPaymentMethod(m)}
              >
                <Ionicons name="wallet-outline" size={20} color={paymentMethod === m ? COLORS.primary : COLORS.textMuted} />
                <Text style={styles.cardName}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 4: OVERVIEW */}
        {step === 4 && (
          <View style={styles.overviewCard}>
            <Text style={styles.stepTitle}>Review Your Booking</Text>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Provider:</Text>
              <Text style={styles.overviewVal}>{bookingDraft.storeName}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Service:</Text>
              <Text style={styles.overviewVal}>{bookingDraft.serviceName}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Service Mode:</Text>
              <Text style={styles.overviewVal}>{selectedServiceMode === "home" ? "Home Visit" : "At Store"}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Pet:</Text>
              <Text style={styles.overviewVal}>{selectedPet?.name}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Date & Time:</Text>
              <Text style={styles.overviewVal}>{date} at {slot}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Address:</Text>
              <Text style={styles.overviewVal} numberOfLines={1}>{bookingDraft.customerLocation?.address}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Total Price:</Text>
              <Text style={[styles.overviewVal, { color: COLORS.primaryLight, fontSize: 16, fontWeight: "700" }]}>₹{bookingDraft.price}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <CustomButton
          title={step === 4 ? "Confirm & Book" : "Continue"}
          onPress={handleNext}
          loading={createBookingMutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  stepIndicator: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 20,
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 12,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyPets: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyPetsText: {
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  dayChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  dayText: {
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  dayTextActive: {
    color: COLORS.primaryLight,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  slotChip: {
    width: "47%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  slotChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  slotText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  slotTextActive: {
    color: COLORS.primaryLight,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  locationButtonText: {
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: "600",
    fontSize: 13,
  },
  subLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  overviewLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  overviewVal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  serviceModeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  modeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  modeText: {
    color: COLORS.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  modeTextActive: {
    color: COLORS.primaryLight,
  },
  slotChipBooked: {
    borderColor: COLORS.border,
    backgroundColor: "rgba(244, 63, 94, 0.05)",
    opacity: 0.6,
  },
  slotTextBooked: {
    color: COLORS.danger,
    textDecorationLine: "line-through",
  },
});
