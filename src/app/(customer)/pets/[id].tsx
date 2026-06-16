import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { usePet, useUpdatePetMutation, useDeletePetMutation } from "../../../services/queries/hooks";
import { useUiStore } from "../../../store/uiStore";
import { uploadApi } from "../../../services/api/uploadApi";
import { COLORS } from "../../../theme/colors";
import { CustomInput } from "../../../components/common/CustomInput";
import { CustomButton } from "../../../components/common/CustomButton";

const { width } = Dimensions.get("window");

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useUiStore();

  const { data: pet, isLoading, error } = usePet(id);
  const updatePetMutation = useUpdatePetMutation();
  const deletePetMutation = useDeletePetMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit states
  const [name, setName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("Male");
  const [vaccinated, setVaccinated] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [height, setHeight] = useState("");
  const [color, setColor] = useState("");
  const [coatType, setCoatType] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [temperament, setTemperament] = useState("");
  const [trainingStatus, setTrainingStatus] = useState("");
  const [microchipNumber, setMicrochipNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [photo, setPhoto] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Active section tab in details view
  const [activeTab, setActiveTab] = useState<"info" | "medical" | "behavior">("info");

  // Sync state with loaded pet data
  useEffect(() => {
    if (pet) {
      setName(pet.name || pet.petName || "");
      setPetType(pet.petType || "Dog");
      setBreed(pet.breed || "");
      setAge(pet.age || "");
      setWeight(pet.weight || "");
      setGender(pet.gender || "Male");
      setVaccinated(pet.vaccinated ?? true);
      setDateOfBirth(pet.dateOfBirth || "");
      setHeight(pet.height || "");
      setColor(pet.color || "");
      setCoatType(pet.coatType || "");
      setMedicalConditions(pet.medicalConditions || "");
      setAllergies(pet.allergies || "");
      setMedications(pet.medications || "");
      setTemperament(pet.temperament || "");
      setTrainingStatus(pet.trainingStatus || "");
      setMicrochipNumber(pet.microchipNumber || "");
      setSpecialInstructions(pet.specialInstructions || "");
      setPhoto(pet.photo || pet.profileImage || "");
      setPhotos(pet.photos || pet.galleryImages || []);
    }
  }, [pet, isEditing]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Failed to load pet details</Text>
        <CustomButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

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
          setPhoto(res.data.url);
          showToast("Profile image updated successfully!", "success");
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
          setPhotos((prev) => [...prev, ...newUrls].slice(0, 4));
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
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePet = () => {
    if (!name || !breed || !age || !weight) {
      showToast("Please fill in all basic fields", "info");
      return;
    }

    updatePetMutation.mutate(
      {
        petId: id,
        payload: {
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
          medicalConditions,
          allergies,
          medications,
          temperament,
          trainingStatus,
          microchipNumber,
          specialInstructions,
          photo,
          profileImage: photo,
          photos: photos.length > 0 ? photos : (photo ? [photo] : []),
          galleryImages: photos.length > 0 ? photos : (photo ? [photo] : []),
        },
      },
      {
        onSuccess: () => {
          showToast("Pet updated successfully!", "success");
          setIsEditing(false);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to update pet", "error");
        },
      }
    );
  };

  const handleDeletePet = () => {
    deletePetMutation.mutate(id, {
      onSuccess: () => {
        showToast(`${name} removed successfully`, "success");
        router.back();
      },
      onError: (err: any) => {
        showToast(err?.response?.data?.message || "Failed to remove pet", "error");
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? "Edit Pet Details" : name}</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={22} color={COLORS.primaryLight} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {isEditing ? (
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
            onChangeText={setName}
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceBox, petType === "Dog" ? styles.choiceActive : null]}
              onPress={() => setPetType("Dog")}
            >
              <Ionicons name="paw" size={18} color={petType === "Dog" ? COLORS.primaryLight : COLORS.textMuted} />
              <Text style={[styles.choiceText, petType === "Dog" ? styles.choiceTextActive : null]}>Dog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBox, petType === "Cat" ? styles.choiceActive : null]}
              onPress={() => setPetType("Cat")}
            >
              <Ionicons name="logo-github" size={18} color={petType === "Cat" ? COLORS.primaryLight : COLORS.textMuted} />
              <Text style={[styles.choiceText, petType === "Cat" ? styles.choiceTextActive : null]}>Cat</Text>
            </TouchableOpacity>
          </View>

          <CustomInput
            label="Breed"
            placeholder="e.g. Golden Retriever"
            value={breed}
            onChangeText={setBreed}
          />

          <View style={styles.inputsRow}>
            <CustomInput
              label="Age"
              placeholder="e.g. 3 yrs"
              value={age}
              onChangeText={setAge}
              containerStyle={{ flex: 1 }}
            />
            <CustomInput
              label="Weight"
              placeholder="e.g. 12 kg"
              value={weight}
              onChangeText={setWeight}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            {["Male", "Female"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.choiceBox, gender === g ? styles.choiceActive : null]}
                onPress={() => setGender(g)}
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
            onChangeText={setDateOfBirth}
          />

          <View style={styles.inputsRow}>
            <CustomInput
              label="Height"
              placeholder="e.g. 45 cm"
              value={height}
              onChangeText={setHeight}
              containerStyle={{ flex: 1 }}
            />
            <CustomInput
              label="Color"
              placeholder="e.g. Gold"
              value={color}
              onChangeText={setColor}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <CustomInput
            label="Coat Type"
            placeholder="e.g. Medium Hair"
            value={coatType}
            onChangeText={setCoatType}
          />

          <Text style={styles.sectionTitle}>Health & Vaccination</Text>

          <Text style={styles.label}>Vaccination Status</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceBox, vaccinated ? styles.choiceActive : null]}
              onPress={() => setVaccinated(true)}
            >
              <Text style={[styles.choiceText, vaccinated ? styles.choiceTextActive : null]}>Vaccinated</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceBox, !vaccinated ? styles.choiceActive : null]}
              onPress={() => setVaccinated(false)}
            >
              <Text style={[styles.choiceText, !vaccinated ? styles.choiceTextActive : null]}>Not Vaccinated</Text>
            </TouchableOpacity>
          </View>

          <CustomInput
            label="Medical Conditions"
            placeholder="e.g. None"
            value={medicalConditions}
            onChangeText={setMedicalConditions}
            multiline
            numberOfLines={2}
          />

          <CustomInput
            label="Allergies"
            placeholder="e.g. Chicken"
            value={allergies}
            onChangeText={setAllergies}
            multiline
            numberOfLines={2}
          />

          <CustomInput
            label="Medications"
            placeholder="e.g. None"
            value={medications}
            onChangeText={setMedications}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.sectionTitle}>Behavior & Other info</Text>

          <CustomInput
            label="Temperament"
            placeholder="e.g. Friendly"
            value={temperament}
            onChangeText={setTemperament}
          />

          <CustomInput
            label="Training Status"
            placeholder="e.g. Advanced Training"
            value={trainingStatus}
            onChangeText={setTrainingStatus}
          />

          <CustomInput
            label="Microchip Number"
            placeholder="e.g. Groomy2345"
            value={microchipNumber}
            onChangeText={setMicrochipNumber}
          />

          <CustomInput
            label="Special Instructions"
            placeholder="e.g. Keep leash on during grooming"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />

          <View style={styles.actions}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={() => setIsEditing(false)}
              style={styles.flexBtn}
            />
            <CustomButton
              title="Save Changes"
              onPress={handleUpdatePet}
              loading={updatePetMutation.isPending}
              style={styles.flexBtn}
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Visual Profile Card */}
          <View style={styles.profileHeroCard}>
            <View style={styles.heroImageContainer}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.heroImage} />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Ionicons name={petType === "Cat" ? "logo-github" : "paw"} size={64} color={COLORS.primaryLight} />
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
              <Text style={styles.heroName}>{name}</Text>
              <TouchableOpacity style={{ marginLeft: 6, padding: 4 }} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={18} color={COLORS.primaryLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.heroBreed}>{breed}</Text>
            
            <View style={styles.quickStatsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{age}</Text>
                <Text style={styles.statLabel}>Age</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{weight}</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{gender}</Text>
                <Text style={styles.statLabel}>Gender</Text>
              </View>
            </View>

            <View style={[styles.badge, vaccinated ? styles.badgeSuccess : styles.badgeDanger, { marginTop: 12 }]}>
              <Text style={[styles.badgeText, vaccinated ? styles.badgeTextSuccess : styles.badgeTextDanger]}>
                {vaccinated ? "Fully Vaccinated" : "Not Vaccinated"}
              </Text>
            </View>
          </View>

          {/* Photo Gallery Grid */}
          {photos && photos.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeader}>Photo Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewGalleryScroll}>
                {photos.map((url, index) => (
                  <View key={url + index} style={styles.previewGalleryItem}>
                    <Image source={{ uri: url }} style={styles.previewGalleryImage} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Collapsible Info Sections Tabs */}
          <View style={styles.tabContainer}>
            {(["info", "medical", "behavior"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabButton, activeTab === t ? styles.tabActive : null]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabText, activeTab === t ? styles.tabTextActive : null]}>
                  {t === "info" ? "Physical" : t === "medical" ? "Medical" : "Behavior"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "info" && (
            <View style={styles.tabContentCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pet Type</Text>
                <Text style={styles.detailValue}>{petType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{dateOfBirth || "Not specified"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Height</Text>
                <Text style={styles.detailValue}>{height || "Not specified"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{color || "Not specified"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coat Type</Text>
                <Text style={styles.detailValue}>{coatType || "Not specified"}</Text>
              </View>
            </View>
          )}

          {activeTab === "medical" && (
            <View style={styles.tabContentCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vaccinated</Text>
                <Text style={[styles.detailValue, { color: vaccinated ? COLORS.success : COLORS.danger, fontWeight: "700" }]}>
                  {vaccinated ? "Yes" : "No"}
                </Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabelColumn}>Medical Conditions</Text>
                <Text style={styles.detailValueColumn}>{medicalConditions || "None reported"}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabelColumn}>Allergies</Text>
                <Text style={styles.detailValueColumn}>{allergies || "None reported"}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabelColumn}>Medications</Text>
                <Text style={styles.detailValueColumn}>{medications || "None reported"}</Text>
              </View>
            </View>
          )}

          {activeTab === "behavior" && (
            <View style={styles.tabContentCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Temperament</Text>
                <Text style={styles.detailValue}>{temperament || "Not specified"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Training Status</Text>
                <Text style={styles.detailValue}>{trainingStatus || "Not specified"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Microchip Number</Text>
                <Text style={styles.detailValue}>{microchipNumber || "Not specified"}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabelColumn}>Special Instructions</Text>
                <Text style={styles.detailValueColumn}>{specialInstructions || "None"}</Text>
              </View>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity style={styles.deleteBtnContainer} onPress={handleDeletePet}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.deleteBtnText}>Remove Pet</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  editBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 8,
    alignSelf: "center",
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

  // Hero Card View Styles
  profileHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  heroImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.primary,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.05)",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  heroBreed: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickStatsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statVal: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primaryLight,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Badge View Styles
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  badgeDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeTextSuccess: {
    color: COLORS.success,
  },
  badgeTextDanger: {
    color: COLORS.danger,
  },

  // Info Section Styles
  infoSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  previewGalleryScroll: {
    gap: 12,
  },
  previewGalleryItem: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  previewGalleryImage: {
    width: "100%",
    height: "100%",
  },

  // Tabs layout styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabContentCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  detailColumn: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabelColumn: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValueColumn: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  // Delete Pet action style
  deleteBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    marginBottom: 20,
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "700",
  },
});
