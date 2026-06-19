import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { usePets, useCreatePetMutation, useDeletePetMutation } from "../../services/queries/hooks";
import { usePetStore } from "../../store/petStore";
import { useUiStore } from "../../store/uiStore";
import { uploadApi } from "../../services/api/uploadApi";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../../components/common/CustomButton";

export default function RedesignedPetsScreen() {
  const params = useLocalSearchParams();
  const { data: pets = [], isLoading } = usePets();
  const createPetMutation = useCreatePetMutation();
  const deletePetMutation = useDeletePetMutation();
  
  const { petDraft, setPetDraft, clearPetDraft } = usePetStore();
  const { showToast, showAlert } = useUiStore();
  
  const [isAdding, setIsAdding] = useState(params.fromBooking === "true");
  const [uploading, setUploading] = useState(false);

  // Draft info
  const name = petDraft.name || "";
  const breed = petDraft.breed || "";
  const age = petDraft.age || "";
  const weight = petDraft.weight || "";
  const gender = petDraft.gender || "Male";
  const petType = petDraft.petType || "Dog";
  const vaccinated = petDraft.vaccinated ?? true;
  const photo = petDraft.photo || "";

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access media library is required", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const localUri = result.assets[0].uri;
        const res = await uploadApi.uploadSingleImage(localUri, "pets");
        if (res.success && res.data.url) {
          setPetDraft({
            photo: res.data.url,
            profileImage: res.data.url,
          } as any);
          showToast("Image uploaded successfully!", "success");
        } else {
          showToast("Failed to upload image", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error uploading image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePet = () => {
    if (!name || !breed || !age || !weight) {
      showToast("Please fill in all fields", "info");
      return;
    }

    createPetMutation.mutate(
      {
        name,
        petName: name,
        breed,
        age,
        weight,
        gender,
        petType,
        vaccinated,
        photo,
        profileImage: photo,
        status: "Active",
      } as any,
      {
        onSuccess: () => {
          showToast(`${name} added successfully!`, "success");
          clearPetDraft();
          if (params.fromBooking === "true") {
            router.replace({
              pathname: "/Emergency/book-appointment" as any,
              params: { clinicId: params.clinicId }
            });
          } else {
            setIsAdding(false);
          }
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to add pet", "error");
        },
      }
    );
  };

  const handleDeletePet = (id: string, petName: string) => {
    showAlert("Remove Pet", `Are you sure you want to remove ${petName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          deletePetMutation.mutate(id, {
            onSuccess: () => {
              showToast(`${petName} removed successfully`, "success");
            },
            onError: (err: any) => {
              showToast(err?.response?.data?.message || "Failed to remove pet", "error");
            },
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{isAdding ? "Register New Pet" : "My Pet Patients"}</Text>
          <Text style={styles.headerSubtitle}>Monitor records, vaccination status & due dates</Text>
        </View>
        {!isAdding && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Pet</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAdding ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <View style={styles.photoContainer}>
            <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator size="small" color={COLORS.emergencyPrimaryOrange} />
                </View>
              ) : photo ? (
                <Image source={{ uri: photo }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color={COLORS.emergencyTextMuted} />
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.darkInput}>
            <Text style={styles.darkInputLabel}>Pet Name</Text>
            <TextInput
              style={styles.darkInputText}
              placeholder="e.g. Max"
              placeholderTextColor={COLORS.emergencyTextMuted}
              value={name}
              onChangeText={(val) => setPetDraft({ name: val })}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceBox, petType === "Dog" ? styles.choiceActive : null]}
              onPress={() => setPetDraft({ petType: "Dog" })}
            >
              <Ionicons name="paw" size={18} color={petType === "Dog" ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
              <Text style={[styles.choiceText, petType === "Dog" ? styles.choiceTextActive : null]}>Dog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBox, petType === "Cat" ? styles.choiceActive : null]}
              onPress={() => setPetDraft({ petType: "Cat" })}
            >
              <Ionicons name="logo-github" size={18} color={petType === "Cat" ? COLORS.emergencyPrimaryOrange : COLORS.emergencyTextMuted} />
              <Text style={[styles.choiceText, petType === "Cat" ? styles.choiceTextActive : null]}>Cat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.darkInput}>
            <Text style={styles.darkInputLabel}>Breed</Text>
            <TextInput
              style={styles.darkInputText}
              placeholder="e.g. Golden Retriever"
              placeholderTextColor={COLORS.emergencyTextMuted}
              value={breed}
              onChangeText={(val) => setPetDraft({ breed: val })}
            />
          </View>

          <View style={styles.inputsRow}>
            <View style={{ flex: 1, marginBottom: 16 }}>
              <Text style={styles.darkInputLabel}>Age</Text>
              <TextInput
                style={styles.darkInputText}
                placeholder="e.g. 3 yrs"
                placeholderTextColor={COLORS.emergencyTextMuted}
                value={age}
                onChangeText={(val) => setPetDraft({ age: val })}
              />
            </View>
            <View style={{ flex: 1, marginBottom: 16 }}>
              <Text style={styles.darkInputLabel}>Weight</Text>
              <TextInput
                style={styles.darkInputText}
                placeholder="e.g. 12 kg"
                placeholderTextColor={COLORS.emergencyTextMuted}
                value={weight}
                onChangeText={(val) => setPetDraft({ weight: val })}
              />
            </View>
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            {["Male", "Female"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.choiceBox, gender === g ? styles.choiceActive : null]}
                onPress={() => setPetDraft({ gender: g })}
              >
                <Text style={[styles.choiceText, gender === g ? styles.choiceTextActive : null]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Vaccination Status</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceBox, vaccinated ? styles.choiceActive : null]}
              onPress={() => setPetDraft({ vaccinated: true })}
            >
              <Text style={[styles.choiceText, vaccinated ? styles.choiceTextActive : null]}>Vaccinated</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceBox, !vaccinated ? styles.choiceActive : null]}
              onPress={() => setPetDraft({ vaccinated: false })}
            >
              <Text style={[styles.choiceText, !vaccinated ? styles.choiceTextActive : null]}>Not Vaccinated</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={() => setIsAdding(false)}
              style={styles.flexBtn}
              textStyle={{ color: "#FFFFFF" }}
            />
            <CustomButton
              title="Save Pet"
              onPress={handleCreatePet}
              loading={createPetMutation.isPending}
              style={{ ...styles.flexBtn, backgroundColor: COLORS.emergencyPrimaryOrange }}
            />
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.emergencyPrimaryOrange} />
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="paw-outline" size={48} color={COLORS.emergencyBorder} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No pets registered yet.</Text>
          <TouchableOpacity style={styles.bookNowBtn} onPress={() => setIsAdding(true)}>
            <Text style={styles.bookNowBtnText}>Register First Pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {pets.map((pet: any) => {
            const petId = pet.id || pet._id;
            const isVaccinated = pet.vaccinated;
            return (
              <View key={petId} style={styles.petCard}>
                {/* Pet Info Row */}
                <View style={styles.petCardHeader}>
                  <View style={styles.petPhotoWrapper}>
                    {pet.photo || pet.profileImage ? (
                      <Image source={{ uri: pet.photo || pet.profileImage }} style={styles.petPhotoSmall} />
                    ) : (
                      <Ionicons name={pet.petType === "Cat" ? "logo-github" : "paw"} size={22} color={COLORS.emergencyPrimaryOrange} />
                    )}
                  </View>
                  <View style={styles.petMeta}>
                    <Text style={styles.petNameText}>{pet.name}</Text>
                    <Text style={styles.petBreedText}>{pet.breed} • {pet.age} • {pet.weight}</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePet(petId, pet.name)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.emergencyRed} />
                  </TouchableOpacity>
                </View>

                {/* 📊 High Fidelity Stat Blocks */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Last Visit</Text>
                    <Text style={styles.statValue}>12 May 2026</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Next Vaccine</Text>
                    <Text style={[styles.statValue, isVaccinated ? styles.valueSuccess : styles.valueAlert]}>
                      {isVaccinated ? "12 Nov 2026" : "OVERDUE 🚨"}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Health Docs</Text>
                    <Text style={styles.statValue}>13 Docs</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
    marginTop: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.emergencyTextMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emergencyPrimaryOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  bookNowBtn: {
    backgroundColor: COLORS.emergencyPrimaryOrange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookNowBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  petCard: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
    padding: 16,
    marginBottom: 16,
  },
  petCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  petPhotoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  petPhotoSmall: {
    width: "100%",
    height: "100%",
  },
  petMeta: {
    flex: 1,
    marginLeft: 14,
  },
  petNameText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  petBreedText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.emergencySurfaceLight,
    borderRadius: 12,
    padding: 10,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.emergencyBorder,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.emergencyTextMuted,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  valueSuccess: {
    color: COLORS.emergencySuccess,
  },
  valueAlert: {
    color: COLORS.emergencyAlertYellow,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  photoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  photoText: {
    color: COLORS.emergencyTextMuted,
    fontSize: 11,
    marginTop: 6,
    fontWeight: "600",
  },
  darkInput: {
    marginBottom: 16,
  },
  darkInputText: {
    color: "#FFFFFF",
    backgroundColor: COLORS.emergencySurface,
    borderColor: COLORS.emergencyBorder,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    width: "100%",
    marginTop: 8,
  },
  darkInputLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  choiceBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.emergencySurface,
  },
  choiceActive: {
    borderColor: COLORS.emergencyPrimaryOrange,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  choiceText: {
    color: COLORS.emergencyTextMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  choiceTextActive: {
    color: COLORS.emergencyPrimaryOrange,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.emergencyPrimaryOrange,
    marginTop: 10,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  flexBtn: {
    flex: 1,
  },
});
