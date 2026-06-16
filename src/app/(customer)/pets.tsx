import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { usePets, useCreatePetMutation, useDeletePetMutation } from "../../services/queries/hooks";
import { usePetStore } from "../../store/petStore";
import { useUiStore } from "../../store/uiStore";
import { uploadApi } from "../../services/api/uploadApi";
import { PetCard } from "../../components/cards/PetCard";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function CustomerPetsScreen() {
  const { data: pets, isLoading } = usePets();
  const createPetMutation = useCreatePetMutation();
  const deletePetMutation = useDeletePetMutation();
  
  const { petDraft, setPetDraft, clearPetDraft } = usePetStore();
  const { showToast } = useUiStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form local-state getters from Zustand Draft
  const name = petDraft.name || "";
  const breed = petDraft.breed || "";
  const age = petDraft.age || "";
  const weight = petDraft.weight || "";
  const gender = petDraft.gender || "Male";
  const petType = petDraft.petType || "Dog";
  const vaccinated = petDraft.vaccinated ?? true;
  const dateOfBirth = petDraft.dateOfBirth || "";
  const height = petDraft.height || "";
  const color = petDraft.color || "";
  const coatType = petDraft.coatType || "";
  const microchipNumber = petDraft.microchipNumber || "";
  const medicalConditions = petDraft.medicalConditions || "";
  const allergies = petDraft.allergies || "";
  const medications = petDraft.medications || "";
  const temperament = petDraft.temperament || "";
  const trainingStatus = petDraft.trainingStatus || "";
  const specialInstructions = petDraft.specialInstructions || "";
  const photo = petDraft.photo || "";
  const photos = petDraft.photos || [];

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
          });
          showToast("Image uploaded successfully!", "success");
        } else {
          showToast("Failed to upload image", "error");
        }
      }
    } catch (err) {
      console.error("Image upload error:", err);
      showToast("Error uploading image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handlePickGalleryImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access media library is required", "error");
        return;
      }

      const remainingSlots = 4 - photos.length;
      if (remainingSlots <= 0) {
        showToast("You can only add up to 4 gallery images", "info");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const newUrls: string[] = [];
        
        for (const asset of result.assets) {
          try {
            const res = await uploadApi.uploadSingleImage(asset.uri, "pets_gallery");
            if (res.success && res.data.url) {
              newUrls.push(res.data.url);
            }
          } catch (uploadErr) {
            console.error("Failed to upload gallery image:", uploadErr);
          }
        }

        if (newUrls.length > 0) {
          const updatedPhotos = [...photos, ...newUrls].slice(0, 4);
          setPetDraft({
            photos: updatedPhotos,
            galleryImages: updatedPhotos,
          });
          showToast(`Successfully uploaded ${newUrls.length} gallery image(s)!`, "success");
        } else {
          showToast("Failed to upload gallery images", "error");
        }
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
      showToast("Error uploading gallery images", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPetDraft({
      photos: updatedPhotos,
      galleryImages: updatedPhotos,
    });
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
        dateOfBirth,
        height,
        color,
        coatType,
        microchipNumber,
        medicalConditions,
        allergies,
        medications,
        temperament,
        trainingStatus,
        specialInstructions,
        photo,
        profileImage: photo,
        photos: photos.length > 0 ? photos : (photo ? [photo] : []),
        galleryImages: photos.length > 0 ? photos : (photo ? [photo] : []),
        status: "Active",
      },
      {
        onSuccess: () => {
          showToast(`${name} added successfully!`, "success");
          clearPetDraft();
          setIsAdding(false);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to add pet", "error");
        },
      }
    );
  };

  const handleDeletePet = (id: string, petName: string) => {
    deletePetMutation.mutate(id, {
      onSuccess: () => {
        showToast(`${petName} removed successfully`, "success");
      },
      onError: (err: any) => {
        showToast(err?.response?.data?.message || "Failed to remove pet", "error");
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{isAdding ? "Add New Pet" : "My Pets"}</Text>
        {!isAdding && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Ionicons name="add" size={20} color="#FFF" />
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
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : photo ? (
                <Image source={{ uri: photo }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color={COLORS.textMuted} />
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionSubtitle}>Gallery Images (Up to 4)</Text>
          <View style={styles.galleryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {photos.map((url, index) => (
                <View key={url + index} style={styles.galleryItem}>
                  <Image source={{ uri: url }} style={styles.galleryImage} />
                  <TouchableOpacity style={styles.removeGalleryBtn} onPress={() => handleRemoveGalleryImage(index)}>
                    <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 4 && (
                <TouchableOpacity style={styles.addGalleryBtn} onPress={handlePickGalleryImages} disabled={uploading}>
                  <Ionicons name="images-outline" size={24} color={COLORS.textMuted} />
                  <Text style={styles.addGalleryText}>{photos.length}/4</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <CustomInput
            label="Pet Name"
            placeholder="e.g. Max"
            value={name}
            onChangeText={(val) => setPetDraft({ name: val })}
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceBox, petType === "Dog" ? styles.choiceActive : null]}
              onPress={() => setPetDraft({ petType: "Dog" })}
            >
              <Ionicons name="paw" size={18} color={petType === "Dog" ? COLORS.primaryLight : COLORS.textMuted} />
              <Text style={[styles.choiceText, petType === "Dog" ? styles.choiceTextActive : null]}>Dog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBox, petType === "Cat" ? styles.choiceActive : null]}
              onPress={() => setPetDraft({ petType: "Cat" })}
            >
              <Ionicons name="logo-github" size={18} color={petType === "Cat" ? COLORS.primaryLight : COLORS.textMuted} />
              <Text style={[styles.choiceText, petType === "Cat" ? styles.choiceTextActive : null]}>Cat</Text>
            </TouchableOpacity>
          </View>

          <CustomInput
            label="Breed"
            placeholder="e.g. Golden Retriever"
            value={breed}
            onChangeText={(val) => setPetDraft({ breed: val })}
          />

          <View style={styles.inputsRow}>
            <CustomInput
              label="Age"
              placeholder="e.g. 3 yrs"
              value={age}
              onChangeText={(val) => setPetDraft({ age: val })}
              containerStyle={{ flex: 1 }}
            />
            <CustomInput
              label="Weight"
              placeholder="e.g. 12 kg"
              value={weight}
              onChangeText={(val) => setPetDraft({ weight: val })}
              containerStyle={{ flex: 1 }}
            />
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

          <Text style={styles.sectionTitle}>Physical Details</Text>

          <CustomInput
            label="Date of Birth"
            placeholder="e.g. 2025-06-12"
            value={dateOfBirth}
            onChangeText={(val) => setPetDraft({ dateOfBirth: val })}
          />

          <View style={styles.inputsRow}>
            <CustomInput
              label="Height"
              placeholder="e.g. 45 cm"
              value={height}
              onChangeText={(val) => setPetDraft({ height: val })}
              containerStyle={{ flex: 1 }}
            />
            <CustomInput
              label="Color"
              placeholder="e.g. Gold"
              value={color}
              onChangeText={(val) => setPetDraft({ color: val })}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <CustomInput
            label="Coat Type"
            placeholder="e.g. Medium Hair"
            value={coatType}
            onChangeText={(val) => setPetDraft({ coatType: val })}
          />

          <Text style={styles.sectionTitle}>Health & Vaccination</Text>

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

          <CustomInput
            label="Medical Conditions"
            placeholder="e.g. None"
            value={medicalConditions}
            onChangeText={(val) => setPetDraft({ medicalConditions: val })}
            multiline
            numberOfLines={2}
          />

          <CustomInput
            label="Allergies"
            placeholder="e.g. Chicken"
            value={allergies}
            onChangeText={(val) => setPetDraft({ allergies: val })}
            multiline
            numberOfLines={2}
          />

          <CustomInput
            label="Medications"
            placeholder="e.g. None"
            value={medications}
            onChangeText={(val) => setPetDraft({ medications: val })}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.sectionTitle}>Behavior & Other info</Text>

          <CustomInput
            label="Temperament"
            placeholder="e.g. Friendly"
            value={temperament}
            onChangeText={(val) => setPetDraft({ temperament: val })}
          />

          <CustomInput
            label="Training Status"
            placeholder="e.g. Advanced Training"
            value={trainingStatus}
            onChangeText={(val) => setPetDraft({ trainingStatus: val })}
          />

          <CustomInput
            label="Microchip Number"
            placeholder="e.g. Groomy2345"
            value={microchipNumber}
            onChangeText={(val) => setPetDraft({ microchipNumber: val })}
          />

          <CustomInput
            label="Special Instructions"
            placeholder="e.g. Keep leash on during grooming"
            value={specialInstructions}
            onChangeText={(val) => setPetDraft({ specialInstructions: val })}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actions}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={() => setIsAdding(false)}
              style={styles.flexBtn}
            />
            <CustomButton
              title="Save Pet"
              onPress={handleCreatePet}
              loading={createPetMutation.isPending}
              style={styles.flexBtn}
            />
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !pets || pets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No pets registered. Add your first pet above!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {pets.map((pet) => {
            const petId = pet.id || (pet as any)._id;
            return (
              <PetCard
                key={petId}
                pet={pet}
                onDelete={() => handleDeletePet(petId, pet.name)}
              />
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
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
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  choiceActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  choiceText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  choiceTextActive: {
    color: COLORS.primaryLight,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  flexBtn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primaryLight,
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
    alignSelf: "center",
  },
  galleryContainer: {
    marginBottom: 24,
    alignItems: "center",
    width: "100%",
  },
  galleryScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
  },
  galleryItem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: "relative",
  },
  galleryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeGalleryBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "transparent",
  },
  addGalleryBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  addGalleryText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },
});
