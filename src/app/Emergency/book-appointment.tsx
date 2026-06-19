import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePets, useStores, useCreateBookingMutation, useUpdatePetMutation } from "../../services/queries/hooks";
import { COLORS } from "../../theme/colors";

const DEFAULT_DOCTORS = [
  { id: "d1", name: "Dr. Ananya Sharma", role: "Senior Surgeon", fee: 1000, icon: "ribbon" },
  { id: "d2", name: "Dr. Kabir Malhotra", role: "General Vet Practitioner", fee: 600, icon: "medkit" },
  { id: "d3", name: "Dr. Sneha Roy", role: "Pediatric Pet Specialist", fee: 800, icon: "heart" },
];

const SYMPTOM_OPTIONS = [
  "Vomiting / Diarrhea",
  "Lethargy / Weakness",
  "Loss of Appetite",
  "Breathing Difficulty",
  "Injury / Bleeding / Trauma",
  "Skin / Allergy Issues",
  "Other (Describe below)"
];

// Helper to generate next 5 upcoming dates starting from today (no previous dates)
const getUpcomingDates = () => {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
};

export default function BookAppointmentScreen() {
  const params = useLocalSearchParams();
  const { data: pets = [], isLoading: loadingPets } = usePets();
  const { data: stores = [], isLoading: loadingStores } = useStores();
  const createBookingMutation = useCreateBookingMutation();
  const updatePetMutation = useUpdatePetMutation();

  const routeClinicId = params.clinicId as string;

  // Stepper Wizard State
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  
  // Symptoms
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [symptomDescription, setSymptomDescription] = useState("");

  // Doctor list based on chosen clinic
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  // Dynamic schedule dates
  const upcomingDates = getUpcomingDates();
  const [selectedDate, setSelectedDate] = useState(upcomingDates[0]);
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM");

  // Pet Details Modal & Editing State
  const [detailPet, setDetailPet] = useState<any>(null);
  const [isEditingPet, setIsEditingPet] = useState(false);
  const [editPetName, setEditPetName] = useState("");
  const [editPetBreed, setEditPetBreed] = useState("");
  const [editPetAge, setEditPetAge] = useState("");
  const [editPetWeight, setEditPetWeight] = useState("");
  const [editPetGender, setEditPetGender] = useState("Male");
  const [editPetVaccinated, setEditPetVaccinated] = useState(true);
  const [editPetPhoto, setEditPetPhoto] = useState("");

  // Premium Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    buttons: { text: string; onPress?: () => void; style?: "default" | "destructive" }[];
  } | null>(null);

  const showAlert = (
    title: string,
    message: string,
    buttons?: { text: string; onPress?: () => void; style?: "default" | "destructive" }[]
  ) => {
    setCustomAlert({
      title,
      message,
      buttons: buttons || [{ text: "OK", onPress: () => setCustomAlert(null), style: "default" }]
    });
  };

  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      setSelectedPet(pets[0]);
    }
  }, [pets]);

  // Resolve selected clinic from route
  useEffect(() => {
    if (stores.length > 0 && !selectedClinic) {
      const found = stores.find((s: any) => (s.id || s._id) === routeClinicId);
      setSelectedClinic(found || stores[0]);
    }
  }, [stores, routeClinicId]);

  // Get doctors list of the chosen clinic (fallback to defaults if empty)
  const getClinicDoctors = () => {
    if (selectedClinic?.doctors && selectedClinic.doctors.length > 0) {
      return selectedClinic.doctors.map((d: any, idx: number) => ({
        id: d.id || `clinic-doc-${idx}`,
        name: d.name,
        role: d.specialty || "Veterinary Doctor",
        fee: 750, // Standard consulting fee
        icon: "medkit"
      }));
    }
    return DEFAULT_DOCTORS;
  };

  const doctorsList = getClinicDoctors();

  // Set default doctor once loaded
  useEffect(() => {
    if (doctorsList.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctorsList[0]);
    }
  }, [selectedClinic]);

  const openPetDetailModal = (pet: any) => {
    setDetailPet(pet);
    setIsEditingPet(false);
    setEditPetName(pet.name || "");
    setEditPetBreed(pet.breed || "");
    setEditPetAge(pet.age || "");
    setEditPetWeight(pet.weight || "");
    setEditPetGender(pet.gender || "Male");
    setEditPetVaccinated(pet.vaccinated ?? true);
    setEditPetPhoto(pet.photo || pet.profileImage || "");
  };

  const handleSavePet = () => {
    if (!editPetName || !editPetBreed || !editPetAge || !editPetWeight) {
      showAlert("Required fields", "Please fill in Name, Breed, Age and Weight.");
      return;
    }

    updatePetMutation.mutate({
      petId: detailPet.id || detailPet._id,
      payload: {
        name: editPetName,
        breed: editPetBreed,
        age: editPetAge,
        weight: editPetWeight,
        gender: editPetGender,
        vaccinated: editPetVaccinated,
        photo: editPetPhoto,
        profileImage: editPetPhoto,
      } as any
    }, {
      onSuccess: (res: any) => {
        const updatedPet = res.data?.pet || {
          ...detailPet,
          name: editPetName,
          breed: editPetBreed,
          age: editPetAge,
          weight: editPetWeight,
          gender: editPetGender,
          vaccinated: editPetVaccinated,
          photo: editPetPhoto,
        };

        // Sync with stepper state if it's the active patient
        if (selectedPet && (selectedPet.id || selectedPet._id) === (detailPet.id || detailPet._id)) {
          setSelectedPet(updatedPet);
        }

        setDetailPet(updatedPet);
        setIsEditingPet(false);
        showAlert("Success", "Pet profile updated successfully.");
      },
      onError: (err: any) => {
        showAlert("Failed", err?.response?.data?.message || "Failed to update pet profile.");
      }
    });
  };

  const handleNext = () => {
    if (step === 1 && !selectedPet) {
      showAlert("Required", "Please select a pet patient.");
      return;
    }
    if (step === 2 && !selectedSymptom) {
      showAlert("Required", "Please select or describe a symptom.");
      return;
    }
    if (step === 3 && !selectedDoctor) {
      showAlert("Required", "Please choose a veterinary doctor.");
      return;
    }
    if (step === 4 && !selectedSlot) {
      showAlert("Required", "Please select a time slot.");
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
      vaccinated: selectedPet.vaccinated ?? true,
      medicalConditions: `Symptoms: ${selectedSymptom}. Description: ${symptomDescription || "None"}`,
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
        address: selectedClinic.address || "Hospital Outpatient Visit",
        latitude: selectedClinic.latitude || 12.9716,
        longitude: selectedClinic.longitude || 77.5946,
      } as any,
    };

    createBookingMutation.mutate(bookingPayload, {
      onSuccess: (res: any) => {
        showAlert(
          "Appointment Scheduled",
          "Your veterinary appointment has been successfully booked.",
          [
            {
              text: "Go to Visits",
              onPress: () => {
                router.replace("/Emergency/appointments");
              },
            },
          ]
        );
      },
      onError: (err: any) => {
        showAlert("Booking Failed", err?.response?.data?.message || "Failed to schedule appointment.");
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <Text style={styles.stepIndicator}>Step {step} of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STEP 1: SELECT PET PATIENT */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Select Pet Patient</Text>
            {loadingPets ? (
              <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} />
            ) : pets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="paw-outline" size={40} color={COLORS.emergencyBorder} />
                <Text style={styles.emptyText}>No registered pets found.</Text>
                <TouchableOpacity 
                  style={styles.emptyBtn} 
                  onPress={() => router.push({
                    pathname: "/Emergency/pets" as any,
                    params: { fromBooking: "true", clinicId: routeClinicId }
                  })}
                >
                  <Text style={styles.emptyBtnText}>Register Pet First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {pets.map((pet: any) => {
                  const isSelected = selectedPet && (selectedPet.id || selectedPet._id) === (pet.id || pet._id);
                  const isVaccinated = pet.vaccinated;
                  return (
                    <View
                      key={pet.id || pet._id}
                      style={[styles.selectionCard, isSelected && styles.selectionCardActive]}
                    >
                      <TouchableOpacity
                        style={styles.selectionCardTouch}
                        onPress={() => setSelectedPet(pet)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.petAvatarWrapper}>
                          {pet.photo || pet.profileImage ? (
                            <Image source={{ uri: pet.photo || pet.profileImage }} style={styles.petAvatarImage} />
                          ) : (
                            <Ionicons name={pet.petType === "Cat" ? "logo-github" : "paw"} size={20} color={isSelected ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
                          )}
                        </View>
                        <View style={{ marginLeft: 14, flex: 1 }}>
                          <Text style={styles.cardTitle}>{pet.name}</Text>
                          <Text style={styles.cardSub}>{pet.breed} • {pet.age} • {pet.weight}</Text>
                          <Text style={styles.cardInfoMini}>
                            Last Visit: 12 May 2026 • Vaccine: {isVaccinated ? "12 Nov 2026" : "OVERDUE 🚨"}
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.emergencyPrimaryOrange} style={{ marginRight: 8 }} />}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.eyeBtn}
                        onPress={() => openPetDetailModal(pet)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye-outline" size={20} color={COLORS.emergencyPrimaryOrange} />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                <TouchableOpacity 
                  style={styles.addNewPetBtn} 
                  onPress={() => router.push({
                    pathname: "/Emergency/pets" as any,
                    params: { fromBooking: "true", clinicId: routeClinicId }
                  })}
                >
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.emergencyPrimaryOrange} />
                  <Text style={styles.addNewPetBtnText}>Add New Pet Patient</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* STEP 2: SELECT PET SYMPTOMS */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Select Pet Symptoms</Text>
            
            <View style={styles.symptomsContainer}>
              {SYMPTOM_OPTIONS.map((opt) => {
                const isSelected = selectedSymptom === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.symptomPill, isSelected && styles.symptomPillActive]}
                    onPress={() => setSelectedSymptom(opt)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.symptomPillText, isSelected && styles.symptomPillTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Describe Symptoms & Problems</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Enter details of pet symptoms, problems, duration, or any other critical information..."
                placeholderTextColor={COLORS.emergencyTextMuted}
                value={symptomDescription}
                onChangeText={setSymptomDescription}
              />
            </View>
          </View>
        )}

        {/* STEP 3: SELECT DOCTOR */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Select Doctor of {selectedClinic?.name || "Clinic"}</Text>
            {doctorsList.map((doc: any) => {
              const isSelected = selectedDoctor && selectedDoctor.id === doc.id;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.selectionCard, isSelected && styles.selectionCardActive, { paddingRight: 16 }]}
                  onPress={() => setSelectedDoctor(doc)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.selectionCardTouch, { paddingLeft: 0, paddingVertical: 10 }]}>
                    <Ionicons name={doc.icon as any} size={20} color={isSelected ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
                    <View style={{ marginLeft: 14, flex: 1 }}>
                      <Text style={styles.cardTitle}>{doc.name}</Text>
                      <Text style={styles.cardSub}>{doc.role} • Fee: ₹{doc.fee}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.emergencyPrimaryOrange} />}
                  </View>
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
              {upcomingDates.map((date) => {
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
            <Text style={styles.stepTitle}>Schedule Visit Details</Text>
            
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
                <Text style={styles.summaryLabel}>Selected Doctor:</Text>
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
              <View style={styles.summaryRowCol}>
                <Text style={styles.summaryLabel}>Pet Symptoms & Problems:</Text>
                <Text style={styles.summaryValDesc}>
                  [{selectedSymptom}] {symptomDescription || "No additional description entered."}
                </Text>
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

      {/* 🐾 Pet Details & Edit Modal */}
      <Modal
        visible={!!detailPet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailPet(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditingPet ? `Edit ${detailPet?.name}` : `${detailPet?.name}'s Records`}
              </Text>
              <TouchableOpacity onPress={() => setDetailPet(null)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {!isEditingPet ? (
                /* VIEW MODE */
                <View style={styles.viewModeContainer}>
                  <View style={styles.modalImageContainer}>
                    {detailPet?.photo || detailPet?.profileImage ? (
                      <Image source={{ uri: detailPet.photo || detailPet.profileImage }} style={styles.modalPetImage} />
                    ) : (
                      <View style={styles.modalPetPlaceholder}>
                        <Ionicons name="paw" size={48} color={COLORS.emergencyPrimaryOrange} />
                      </View>
                    )}
                  </View>

                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Name</Text>
                      <Text style={styles.detailValue}>{detailPet?.name}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Type</Text>
                      <Text style={styles.detailValue}>{detailPet?.petType || "Dog"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Breed</Text>
                      <Text style={styles.detailValue}>{detailPet?.breed || "N/A"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Age</Text>
                      <Text style={styles.detailValue}>{detailPet?.age || "N/A"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Weight</Text>
                      <Text style={styles.detailValue}>{detailPet?.weight || "N/A"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Gender</Text>
                      <Text style={styles.detailValue}>{detailPet?.gender || "N/A"}</Text>
                    </View>
                  </View>

                  <View style={styles.recordsCard}>
                    <View style={styles.recordRow}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.emergencyPrimaryOrange} />
                      <Text style={styles.recordLabel}>Last Visit:</Text>
                      <Text style={styles.recordValue}>12 May 2026</Text>
                    </View>
                    <View style={styles.recordRow}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.emergencyPrimaryOrange} />
                      <Text style={styles.recordLabel}>Next Vaccine:</Text>
                      <Text style={[styles.recordValue, detailPet?.vaccinated ? styles.textSuccess : styles.textAlert]}>
                        {detailPet?.vaccinated ? "12 Nov 2026" : "OVERDUE 🚨"}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.editBtnLarge} 
                    onPress={() => setIsEditingPet(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.editBtnLargeText}>Edit Pet Details</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* EDIT MODE */
                <View style={styles.editModeContainer}>
                  <View style={styles.editPhotoSection}>
                    {editPetPhoto ? (
                      <Image source={{ uri: editPetPhoto }} style={styles.modalPetImageSmall} />
                    ) : (
                      <View style={styles.modalPetPlaceholderSmall}>
                        <Ionicons name="paw" size={24} color={COLORS.emergencyTextMuted} />
                      </View>
                    )}
                    <TextInput
                      style={[styles.editInput, { flex: 1, marginTop: 0 }]}
                      placeholder="Image URL"
                      placeholderTextColor={COLORS.emergencyTextMuted}
                      value={editPetPhoto}
                      onChangeText={setEditPetPhoto}
                    />
                  </View>

                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Pet Name</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editPetName}
                      onChangeText={setEditPetName}
                      placeholder="e.g. Max"
                      placeholderTextColor={COLORS.emergencyTextMuted}
                    />
                  </View>

                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Breed</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editPetBreed}
                      onChangeText={setEditPetBreed}
                      placeholder="e.g. Beagle"
                      placeholderTextColor={COLORS.emergencyTextMuted}
                    />
                  </View>

                  <View style={styles.editRow}>
                    <View style={[styles.editField, { flex: 1 }]}>
                      <Text style={styles.editLabel}>Age</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editPetAge}
                        onChangeText={setEditPetAge}
                        placeholder="e.g. 2 yrs"
                        placeholderTextColor={COLORS.emergencyTextMuted}
                      />
                    </View>
                    <View style={[styles.editField, { flex: 1 }]}>
                      <Text style={styles.editLabel}>Weight</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editPetWeight}
                        onChangeText={setEditPetWeight}
                        placeholder="e.g. 10 kg"
                        placeholderTextColor={COLORS.emergencyTextMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Gender</Text>
                    <View style={styles.genderRow}>
                      {["Male", "Female"].map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genderChoice, editPetGender === g && styles.genderChoiceActive]}
                          onPress={() => setEditPetGender(g)}
                        >
                          <Text style={[styles.genderChoiceText, editPetGender === g && styles.genderChoiceTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Vaccination Status</Text>
                    <View style={styles.genderRow}>
                      <TouchableOpacity
                        style={[styles.genderChoice, editPetVaccinated && styles.genderChoiceActive]}
                        onPress={() => setEditPetVaccinated(true)}
                      >
                        <Text style={[styles.genderChoiceText, editPetVaccinated && styles.genderChoiceTextActive]}>
                          Vaccinated
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.genderChoice, !editPetVaccinated && styles.genderChoiceActive]}
                        onPress={() => setEditPetVaccinated(false)}
                      >
                        <Text style={[styles.genderChoiceText, !editPetVaccinated && styles.genderChoiceTextActive]}>
                          Not Vaccinated
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={styles.cancelBtn} 
                      onPress={() => setIsEditingPet(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.saveBtn} 
                      onPress={handleSavePet}
                      disabled={updatePetMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {updatePetMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🚨 Premium Custom Alert Modal */}
      <Modal
        visible={!!customAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert(null)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Ionicons 
                name={
                  customAlert?.title.toLowerCase().includes("fail") || 
                  customAlert?.title.toLowerCase().includes("required") 
                    ? "alert-circle" 
                    : "checkmark-circle"
                } 
                size={40} 
                color={
                  customAlert?.title.toLowerCase().includes("fail") || 
                  customAlert?.title.toLowerCase().includes("required") 
                    ? COLORS.emergencyRed 
                    : COLORS.emergencyPrimaryOrange
                } 
              />
              <Text style={styles.alertTitle}>{customAlert?.title}</Text>
            </View>
            
            <Text style={styles.alertMessage}>{customAlert?.message}</Text>
            
            <View style={styles.alertButtonsRow}>
              {customAlert?.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={`alert-btn-${idx}`}
                  style={[
                    styles.alertButton,
                    btn.style === "destructive" ? styles.alertButtonDestructive : styles.alertButtonPrimary
                  ]}
                  onPress={() => {
                    setCustomAlert(null);
                    if (btn.onPress) btn.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alertButtonText}>{btn.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingRight: 10,
    marginBottom: 12,
  },
  selectionCardTouch: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 16,
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
  cardInfoMini: {
    color: COLORS.emergencyPrimaryOrange,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  petAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  petAvatarImage: {
    width: "100%",
    height: "100%",
  },
  eyeBtn: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addNewPetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.emergencyBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  addNewPetBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  symptomsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  symptomPill: {
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  symptomPillActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  symptomPillText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  symptomPillTextActive: {
    color: COLORS.emergencyPrimaryOrange,
    fontWeight: "800",
  },
  textAreaContainer: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textArea: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlignVertical: "top",
    minHeight: 80,
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
  summaryRowCol: {
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
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
  summaryValDesc: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.emergencyBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.emergencyBorder,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  viewModeContainer: {
    alignItems: "center",
  },
  modalImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 2,
    borderColor: COLORS.emergencyPrimaryOrange,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  modalPetImage: {
    width: "100%",
    height: "100%",
  },
  modalPetPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  detailItem: {
    width: "46%",
    marginBottom: 4,
  },
  detailLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },
  recordsCard: {
    width: "100%",
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recordLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  recordValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  textSuccess: {
    color: COLORS.emergencySuccess,
  },
  textAlert: {
    color: COLORS.emergencyAlertYellow,
  },
  editBtnLarge: {
    flexDirection: "row",
    backgroundColor: COLORS.emergencyPrimaryOrange,
    width: "100%",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtnLargeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  // Edit Mode Styles
  editModeContainer: {
    width: "100%",
  },
  editPhotoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  modalPetImageSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalPetPlaceholderSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.emergencySurface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  editInput: {
    color: "#FFFFFF",
    backgroundColor: COLORS.emergencySurface,
    borderColor: COLORS.emergencyBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  editRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderChoice: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.emergencySurface,
  },
  genderChoiceActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  genderChoiceText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  genderChoiceTextActive: {
    color: COLORS.emergencyPrimaryOrange,
    fontWeight: "800",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.emergencyPrimaryOrange,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertContainer: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    width: "100%",
    maxWidth: 320,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  alertHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  alertMessage: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  alertButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  alertButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  alertButtonPrimary: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
  },
  alertButtonDestructive: {
    backgroundColor: COLORS.emergencyRed,
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
