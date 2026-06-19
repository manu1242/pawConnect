import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useMyStore, useStoreMutation, useEditStoreMutation } from "../../services/queries/hooks";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { uploadApi } from "../../services/api/uploadApi";
import { COLORS, SHADOWS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function OwnerStoreScreen() {
  const { user } = useAuthStore();
  const { data: store, isLoading } = useMyStore();
  const registerStoreMutation = useStoreMutation();
  const editStoreMutation = useEditStoreMutation();
  const { showToast } = useUiStore();

  const [isEditing, setIsEditing] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null);

  // --- Registration Local States ---
  const [regName, setRegName] = useState("");
  const [regCategory, setRegCategory] = useState("Veterinary");
  const [regDesc, setRegDesc] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regLatitude, setRegLatitude] = useState("12.9716");
  const [regLongitude, setRegLongitude] = useState("77.5946");
  const [regLogo, setRegLogo] = useState("");
  const [regBanner, setRegBanner] = useState("");
  const [regGallery, setRegGallery] = useState<string[]>([]);
  const [regDoctors, setRegDoctors] = useState<{ name: string; specialty: string; experience: string }[]>([]);

  // --- Edit Local States ---
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [editGallery, setEditGallery] = useState<string[]>([]);
  const [editDoctors, setEditDoctors] = useState<{ name: string; specialty: string; experience: string }[]>([]);

  // Temporary doctor inputs
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("");
  const [newDocExp, setNewDocExp] = useState("");

  useEffect(() => {
    if (store) {
      setEditName(store.name || store.storeDetails?.name || "");
      setEditCategory(store.category || store.storeDetails?.category || store.storeTypes?.[0] || "Veterinary");
      setEditDesc(store.description || store.storeDetails?.description || "");
      setEditPhone(store.phone || "");
      setEditAddress(typeof store.address === "string" ? store.address : (store.address?.street || ""));
      setEditCity(store.addressDetails?.city || "");
      setEditPincode(store.addressDetails?.pincode || "");
      setEditLatitude(store.latitude?.toString() || "");
      setEditLongitude(store.longitude?.toString() || "");
      setEditLogo(store.logo || "");
      setEditBanner(store.bannerImage || store.banner || "");
      setEditGallery(store.gallery || []);
      setEditDoctors(store.doctors || []);
    }
  }, [store]);

  const handleUploadImage = async (target: "logo" | "banner" | "gallery", isEditMode: boolean) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access media library is required", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: target === "logo" ? [1, 1] : [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingMedia(target);
        const localUri = result.assets[0].uri;
        const res = await uploadApi.uploadSingleImage(localUri, "stores");
        
        if (res.success && res.data.url) {
          const uploadedUrl = res.data.url;
          if (isEditMode) {
            if (target === "logo") setEditLogo(uploadedUrl);
            else if (target === "banner") setEditBanner(uploadedUrl);
            else setEditGallery([...editGallery, uploadedUrl]);
          } else {
            if (target === "logo") setRegLogo(uploadedUrl);
            else if (target === "banner") setRegBanner(uploadedUrl);
            else setRegGallery([...regGallery, uploadedUrl]);
          }
          showToast("Image uploaded successfully!", "success");
        } else {
          showToast("Failed to upload image", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error uploading image", "error");
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleRemoveGalleryImage = (idxToRemove: number, isEditMode: boolean) => {
    if (isEditMode) {
      setEditGallery(editGallery.filter((_, idx) => idx !== idxToRemove));
    } else {
      setRegGallery(regGallery.filter((_, idx) => idx !== idxToRemove));
    }
  };

  const handleAutoDetectLocation = async (isEditMode: boolean) => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant location access in settings to auto-detect coordinates.");
        setDetectingGps(false);
        return;
      }

      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (currentLoc?.coords) {
        const { latitude, longitude } = currentLoc.coords;
        if (isEditMode) {
          setEditLatitude(latitude.toFixed(6));
          setEditLongitude(longitude.toFixed(6));
        } else {
          setRegLatitude(latitude.toFixed(6));
          setRegLongitude(longitude.toFixed(6));
        }
        showToast("GPS Coordinates auto-filled successfully!", "success");
      }
    } catch (e) {
      Alert.alert("GPS Error", "Failed to retrieve coordinates.");
    } finally {
      setDetectingGps(false);
    }
  };

  const handleRegister = () => {
    if (!regName || !regCategory || !regPhone || !regAddress || !regCity || !regPincode || !regLatitude || !regLongitude) {
      showToast("All fields marked with * are required", "info");
      return;
    }

    if (regDesc && regDesc.length < 10) {
      showToast("Clinic description must be at least 10 characters long", "info");
      return;
    }

    const payload = {
      ownerDetails: {
        name: user?.fullName || "Owner Name",
        phone: user?.phone || regPhone,
        email: user?.email || "owner@pawconnect.com",
      },
      name: regName,
      description: regDesc || "Premium Veterinary & Emergency Clinic",
      category: regCategory,
      categories: [regCategory], // Required by register validator
      storeTypes: [regCategory],
      address: {
        street: regAddress,
        city: regCity,
        state: "Karnataka",
        country: "India",
        pincode: regPincode,
      },
      location: {
        type: "Point",
        coordinates: [Number(regLongitude), Number(regLatitude)]
      },
      latitude: Number(regLatitude),
      longitude: Number(regLongitude),
      phone: regPhone,
      logo: regLogo || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500",
      bannerImage: regBanner || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500",
      gallery: regGallery,
      doctors: regDoctors,
      services: [
        {
          name: "Emergency Consultation",
          category: regCategory,
          price: 1500,
          description: "Priority critical care veterinary checkup and triage.",
          duration: "45 min",
          active: true,
          emergencyAvailable: true
        }
      ],
      businessHours: [
        { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
        { day: "Sunday", isOpen: true, openTime: "09:00", closeTime: "18:00" }
      ],
      paymentMethods: ["Cash", "UPI", "Card"],
      facilities: ["Parking", "Waiting Area", "AC"], // Must match FACILITIES constants
      bookingMode: "Both", // Must match BOOKING_MODES constants
      maxBookingsPerDay: 30,
      is24x7: true,
    };

    registerStoreMutation.mutate(payload, {
      onSuccess: () => {
        showToast("Clinic profile submitted for review!", "success");
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.response?.data?.errors?.map((e: any) => e.msg).join("; ") || "Failed to register";
        showToast(errMsg, "error");
      },
    });
  };

  const handleAddDoctorReg = () => {
    if (!newDocName || !newDocSpecialty) {
      showToast("Please enter Doctor name and specialty", "info");
      return;
    }
    setRegDoctors([...regDoctors, { name: newDocName, specialty: newDocSpecialty, experience: newDocExp || "5+ Years exp" }]);
    setNewDocName("");
    setNewDocSpecialty("");
    setNewDocExp("");
  };

  const handleAddDoctorEdit = () => {
    if (!newDocName || !newDocSpecialty) {
      showToast("Please enter Doctor name and specialty", "info");
      return;
    }
    setEditDoctors([...editDoctors, { name: newDocName, specialty: newDocSpecialty, experience: newDocExp || "5+ Years exp" }]);
    setNewDocName("");
    setNewDocSpecialty("");
    setNewDocExp("");
  };

  const handleRemoveDoctorEdit = (idxToRemove: number) => {
    setEditDoctors(editDoctors.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSaveEdit = () => {
    if (!editName || !editCategory || !editPhone || !editAddress || !editCity || !editPincode || !editLatitude || !editLongitude) {
      showToast("Required fields cannot be empty", "info");
      return;
    }

    editStoreMutation.mutate(
      {
        name: editName,
        category: editCategory,
        categories: [editCategory],
        storeTypes: [editCategory],
        description: editDesc,
        phone: editPhone,
        address: {
          street: editAddress,
          city: editCity,
          state: "Karnataka",
          country: "India",
          pincode: editPincode,
        },
        location: {
          type: "Point",
          coordinates: [Number(editLongitude), Number(editLatitude)]
        },
        latitude: Number(editLatitude),
        longitude: Number(editLongitude),
        logo: editLogo,
        bannerImage: editBanner,
        gallery: editGallery,
        doctors: editDoctors,
      },
      {
        onSuccess: () => {
          showToast("Clinic profile updated successfully!", "success");
          setIsEditing(false);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Failed to update profile", "error");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Clinic Profile Control</Text>
        <Text style={styles.headerSub}>Manage your veterinary listings and emergency status</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Verification Status Banner */}
        {store && (
          <View style={[
            styles.statusBanner,
            store.status === "approved" ? styles.approvedBanner : styles.pendingBanner
          ]}>
            <View style={styles.statusBannerLeft}>
              <View style={[
                styles.statusDotBg,
                { backgroundColor: store.status === "approved" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)" }
              ]}>
                <Ionicons
                  name={store.status === "approved" ? "checkmark-circle" : "time"}
                  size={20}
                  color={store.status === "approved" ? COLORS.success : COLORS.warning}
                />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.statusTitleText, { color: store.status === "approved" ? COLORS.success : COLORS.warning }]}>
                  {store.status === "approved" ? "Approved Vet Clinic" : "Awaiting Verification"}
                </Text>
                <Text style={styles.statusDescText}>
                  {store.status === "approved" 
                    ? "Active on Emergency dashboard. Visible to users nearby." 
                    : "Submitted to Admin. Once approved, your clinic will appear on the emergency list."}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!store ? (
          // Registration Form Card
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medical" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Register Veterinary Clinic</Text>
            </View>
            <Text style={styles.sub}>Fill in all clinic profile information. Upon verification approval, the clinic will be listed live.</Text>

            {/* Section 1: Clinic Identity & Contact */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>1</Text></View>
                <Text style={styles.sectionTitle}>Clinic Info & Hotline</Text>
              </View>

              <CustomInput
                label="Clinic Name *"
                placeholder="e.g. Indiranagar Emergency Vet Clinic"
                value={regName}
                onChangeText={setRegName}
              />
              <CustomInput
                label="Category *"
                placeholder="e.g. Veterinary, Emergency Care"
                value={regCategory}
                onChangeText={setRegCategory}
              />
              <CustomInput
                label="Emergency Hotline Phone *"
                placeholder="e.g. +91 99887 76655"
                value={regPhone}
                onChangeText={setRegPhone}
                keyboardType="phone-pad"
              />
              <CustomInput
                label="Clinic Description (Min 10 characters) *"
                placeholder="Write about facilities, specialties, consulting hours..."
                value={regDesc}
                onChangeText={setRegDesc}
                multiline
              />
            </View>

            {/* Section 2: Media & Gallery */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>2</Text></View>
                <Text style={styles.sectionTitle}>Brand Logos & Showcase Photos</Text>
              </View>
              
              {/* Logo Row */}
              <Text style={styles.mediaLabel}>Clinic Logo Image *</Text>
              <View style={styles.mediaPickerRow}>
                {regLogo ? (
                  <Image source={{ uri: regLogo }} style={styles.logoCircle} />
                ) : (
                  <View style={[styles.logoCircle, styles.emptyLogo]}>
                    <Ionicons name="camera-outline" size={22} color={COLORS.textMuted} />
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.pickBtn} 
                  onPress={() => handleUploadImage("logo", false)}
                  disabled={uploadingMedia !== null}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.pickBtnText}>
                    {uploadingMedia === "logo" ? "Uploading..." : "Upload Logo"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Banner Card */}
              <Text style={styles.mediaLabel}>Clinic Hero Banner *</Text>
              <View style={styles.bannerPickerCard}>
                {regBanner ? (
                  <Image source={{ uri: regBanner }} style={styles.bannerImagePreview} />
                ) : (
                  <View style={styles.emptyBannerPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                    <Text style={styles.emptyBannerText}>No Banner Uploaded</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.bannerUploadBtn} 
                  onPress={() => handleUploadImage("banner", false)}
                  disabled={uploadingMedia !== null}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.bannerUploadText}>
                    {uploadingMedia === "banner" ? "Uploading..." : "Upload Banner Image"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gallery Grid */}
              <Text style={styles.mediaLabel}>Clinic Showcase Gallery</Text>
              <View style={styles.galleryWrapper}>
                <View style={styles.thumbnailContainer}>
                  {regGallery.map((url, idx) => (
                    <View key={`reg-gal-${idx}`} style={styles.thumbnailWrapper}>
                      <Image source={{ uri: url }} style={styles.thumbnailImg} />
                      <TouchableOpacity 
                        style={styles.removeThumbnailBadge} 
                        onPress={() => handleRemoveGalleryImage(idx, false)}
                      >
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={styles.addGalleryBtn}
                  onPress={() => handleUploadImage("gallery", false)}
                  disabled={uploadingMedia !== null}
                >
                  <Ionicons name="images-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.addGalleryText}>
                    {uploadingMedia === "gallery" ? "Uploading..." : "Add Facility Photo"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 3: Location Details */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>3</Text></View>
                <Text style={styles.sectionTitle}>Clinic Address & GPS Coordinates</Text>
              </View>

              <TouchableOpacity 
                style={styles.gpsButton} 
                onPress={() => handleAutoDetectLocation(false)}
                disabled={detectingGps}
              >
                {detectingGps ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="locate" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.gpsButtonText}>Auto-Fill Current GPS Coordinates</Text>
                  </>
                )}
              </TouchableOpacity>

              <CustomInput
                label="Full Street Address *"
                placeholder="e.g. 15, 80 Feet Rd, Hal 3rd Stage"
                value={regAddress}
                onChangeText={setRegAddress}
              />
              <View style={styles.row}>
                <CustomInput
                  label="City *"
                  placeholder="e.g. Bengaluru"
                  value={regCity}
                  onChangeText={setRegCity}
                  containerStyle={{ flex: 1 }}
                />
                <CustomInput
                  label="Pincode *"
                  placeholder="560008"
                  value={regPincode}
                  onChangeText={setRegPincode}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <View style={styles.row}>
                <CustomInput
                  label="Latitude *"
                  placeholder="12.9716"
                  value={regLatitude}
                  onChangeText={setRegLatitude}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
                <CustomInput
                  label="Longitude *"
                  placeholder="77.5946"
                  value={regLongitude}
                  onChangeText={setRegLongitude}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </View>

            {/* Section 4: Doctors Team */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>4</Text></View>
                <Text style={styles.sectionTitle}>Senior Veterinary Doctors</Text>
              </View>

              {regDoctors.map((doc, idx) => (
                <View key={`reg-doc-${idx}`} style={styles.doctorCardRow}>
                  <View style={styles.doctorCardLeft}>
                    <View style={styles.docAvatarCircle}>
                      <Ionicons name="person" size={16} color={COLORS.primary} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.doctorNameText}>{doc.name}</Text>
                      <Text style={styles.doctorDetailsText}>{doc.specialty} • {doc.experience}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteDocBtn} 
                    onPress={() => setRegDoctors(regDoctors.filter((_, i) => i !== idx))}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.docAddCard}>
                <Text style={styles.docAddHeader}>Add Vet Doctor to Profile</Text>
                <CustomInput
                  label="Doctor's Full Name"
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={newDocName}
                  onChangeText={setNewDocName}
                />
                <CustomInput
                  label="Medical Specialty"
                  placeholder="e.g. Critical Care & Surgery"
                  value={newDocSpecialty}
                  onChangeText={setNewDocSpecialty}
                />
                <CustomInput
                  label="Experience Years"
                  placeholder="e.g. 10+ Years"
                  value={newDocExp}
                  onChangeText={setNewDocExp}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddDoctorReg}>
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.addButtonText}>Add Doctor</Text>
                </TouchableOpacity>
              </View>
            </View>

            <CustomButton
              title="Submit Clinic Registration"
              onPress={handleRegister}
              loading={registerStoreMutation.isPending}
              style={{ marginTop: 24 }}
            />
          </View>
        ) : (
          // Registered Store Details
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clinicCardTitle}>{store.name || store.storeDetails?.name}</Text>
                <Text style={styles.clinicCardCategory}>{store.category || store.storeDetails?.category || store.storeTypes?.[0]}</Text>
              </View>
              {!isEditing && (
                <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
                  <Ionicons name="create" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.editProfileText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View>
                <Text style={styles.sectionFormHeader}>Clinic Identity & Contact</Text>
                <CustomInput
                  label="Clinic Name *"
                  value={editName}
                  onChangeText={setEditName}
                />
                <CustomInput
                  label="Category *"
                  value={editCategory}
                  onChangeText={setEditCategory}
                />
                <CustomInput
                  label="Hotline / Phone Number *"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
                <CustomInput
                  label="Description (Min 10 characters) *"
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                />

                <Text style={styles.sectionFormHeader}>Brand Media & Gallery Images</Text>
                
                {/* Edit Logo */}
                <Text style={styles.mediaLabel}>Clinic Logo Image</Text>
                <View style={styles.mediaPickerRow}>
                  {editLogo ? (
                    <Image source={{ uri: editLogo }} style={styles.logoCircle} />
                  ) : (
                    <View style={[styles.logoCircle, styles.emptyLogo]}>
                      <Ionicons name="camera-outline" size={22} color={COLORS.textMuted} />
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.pickBtn} 
                    onPress={() => handleUploadImage("logo", true)}
                    disabled={uploadingMedia !== null}
                  >
                    <Text style={styles.pickBtnText}>
                      {uploadingMedia === "logo" ? "Uploading..." : "Upload Logo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Edit Banner */}
                <Text style={styles.mediaLabel}>Clinic Hero Banner</Text>
                <View style={styles.bannerPickerCard}>
                  {editBanner ? (
                    <Image source={{ uri: editBanner }} style={styles.bannerImagePreview} />
                  ) : (
                    <View style={styles.emptyBannerPlaceholder}>
                      <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.bannerUploadBtn} 
                    onPress={() => handleUploadImage("banner", true)}
                    disabled={uploadingMedia !== null}
                  >
                    <Text style={styles.bannerUploadText}>
                      {uploadingMedia === "banner" ? "Uploading..." : "Upload Banner"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Edit Gallery */}
                <Text style={styles.mediaLabel}>Clinic Gallery</Text>
                <View style={styles.galleryWrapper}>
                  <View style={styles.thumbnailContainer}>
                    {editGallery.map((url, idx) => (
                      <View key={`edit-gal-${idx}`} style={styles.thumbnailWrapper}>
                        <Image source={{ uri: url }} style={styles.thumbnailImg} />
                        <TouchableOpacity 
                          style={styles.removeThumbnailBadge} 
                          onPress={() => handleRemoveGalleryImage(idx, true)}
                        >
                          <Ionicons name="close" size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity 
                    style={styles.addGalleryBtn}
                    onPress={() => handleUploadImage("gallery", true)}
                    disabled={uploadingMedia !== null}
                  >
                    <Ionicons name="images-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.addGalleryText}>
                      {uploadingMedia === "gallery" ? "Uploading..." : "Add Facility Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionFormHeader}>Address & Location Coordinates</Text>
                
                <TouchableOpacity 
                  style={styles.gpsButton} 
                  onPress={() => handleAutoDetectLocation(true)}
                  disabled={detectingGps}
                >
                  {detectingGps ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.gpsButtonText}>Auto-Fill Current GPS Coordinates</Text>
                    </>
                  )}
                </TouchableOpacity>

                <CustomInput
                  label="Full Address *"
                  value={editAddress}
                  onChangeText={setEditAddress}
                />
                <View style={styles.row}>
                  <CustomInput
                    label="City *"
                    value={editCity}
                    onChangeText={setEditCity}
                    containerStyle={{ flex: 1 }}
                  />
                  <CustomInput
                    label="Pincode *"
                    value={editPincode}
                    onChangeText={setEditPincode}
                    keyboardType="numeric"
                    containerStyle={{ flex: 1 }}
                  />
                </View>
                <View style={styles.row}>
                  <CustomInput
                    label="Latitude *"
                    value={editLatitude}
                    onChangeText={setEditLatitude}
                    keyboardType="numeric"
                    containerStyle={{ flex: 1 }}
                  />
                  <CustomInput
                    label="Longitude *"
                    value={editLongitude}
                    onChangeText={setEditLongitude}
                    keyboardType="numeric"
                    containerStyle={{ flex: 1 }}
                  />
                </View>

                <Text style={styles.sectionFormHeader}>Manage Doctors Team</Text>
                {editDoctors.map((doc, idx) => (
                  <View key={`doc-edit-${idx}`} style={styles.doctorCardRow}>
                    <View style={styles.doctorCardLeft}>
                      <View style={styles.docAvatarCircle}>
                        <Ionicons name="person" size={16} color={COLORS.primary} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.doctorNameText}>{doc.name}</Text>
                        <Text style={styles.doctorDetailsText}>{doc.specialty} • {doc.experience}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteDocBtn} 
                      onPress={() => handleRemoveDoctorEdit(idx)}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.docAddCard}>
                  <Text style={styles.docAddHeader}>Add Vet Doctor</Text>
                  <CustomInput
                    label="Doctor Name"
                    placeholder="Dr. Name"
                    value={newDocName}
                    onChangeText={setNewDocName}
                  />
                  <CustomInput
                    label="Specialty"
                    placeholder="e.g. Trauma Surgery"
                    value={newDocSpecialty}
                    onChangeText={setNewDocSpecialty}
                  />
                  <CustomInput
                    label="Experience"
                    placeholder="e.g. 10+ Years"
                    value={newDocExp}
                    onChangeText={setNewDocExp}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={handleAddDoctorEdit}>
                    <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.addButtonText}>Add Doctor</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionsRow}>
                  <CustomButton
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsEditing(false)}
                    style={styles.flexBtn}
                  />
                  <CustomButton
                    title="Save Changes"
                    onPress={handleSaveEdit}
                    loading={editStoreMutation.isPending}
                    style={styles.flexBtn}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.detailsContainer}>
                {/* Banner Hero Preview */}
                <View style={styles.bannerHeroContainer}>
                  <Image 
                    source={{ uri: store.bannerImage || store.banner || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500" }} 
                    style={styles.bannerHeroImage} 
                  />
                  <Image 
                    source={{ uri: store.logo || "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500" }} 
                    style={styles.logoHeroAvatar} 
                  />
                </View>

                {/* Info List */}
                <View style={styles.readOnlyList}>
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={18} color={COLORS.textMuted} />
                    <Text style={styles.infoValText}>{store.phone || "No hotline phone added"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="pin-outline" size={18} color={COLORS.textMuted} />
                    <Text style={styles.infoValText} numberOfLines={2}>
                      {store.address ? (typeof store.address === "string" ? store.address : `${store.addressDetails?.city || ""} (${store.addressDetails?.pincode || ""})`) : "No address specified"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="locate-outline" size={18} color={COLORS.textMuted} />
                    <Text style={styles.infoValText}>
                      {store.latitude !== undefined && store.longitude !== undefined ? `${store.latitude}, ${store.longitude}` : "GPS Coordinates not set"}
                    </Text>
                  </View>
                  <View style={styles.infoRowCol}>
                    <Text style={styles.infoLabelText}>Clinic Description</Text>
                    <Text style={styles.infoDescriptionText}>{store.description || store.storeDetails?.description || "No description provided."}</Text>
                  </View>

                  {/* Doctors Profiles display */}
                  <View style={[styles.infoRowCol, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabelText}>Clinic Doctor Registry</Text>
                    {store.doctors && store.doctors.length > 0 ? (
                      store.doctors.map((doc: any, idx: number) => (
                        <View key={`read-doc-${idx}`} style={styles.readDocCard}>
                          <View style={styles.readDocLeft}>
                            <View style={styles.readDocIconBg}>
                              <Ionicons name="person" size={16} color="#FFFFFF" />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                              <Text style={styles.readDocName}>{doc.name}</Text>
                              <Text style={styles.readDocSub}>{doc.specialty}</Text>
                            </View>
                          </View>
                          <View style={styles.readDocBadge}>
                            <Text style={styles.readDocBadgeText}>{doc.experience}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDocText}>No doctors registered to this clinic profile.</Text>
                    )}
                  </View>

                  {/* Gallery display */}
                  {store.gallery && store.gallery.length > 0 && (
                    <View style={styles.infoRowCol}>
                      <Text style={styles.infoLabelText}>Showcase Photos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScrollContent}>
                        {store.gallery.map((url: string, idx: number) => (
                          <Image key={`gallery-read-${idx}`} source={{ uri: url }} style={styles.galleryPhotoItem} />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBanner: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    padding: 14,
    ...SHADOWS.sm,
  },
  approvedBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  pendingBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  statusBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDotBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitleText: {
    fontSize: 13,
    fontWeight: "800",
  },
  statusDescText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 8,
  },
  sectionFormHeader: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  flexBtn: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  mediaLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 8,
  },
  mediaPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emptyLogo: {
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: COLORS.primary,
  },
  pickBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  bannerPickerCard: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    backgroundColor: COLORS.surfaceLight,
  },
  bannerImagePreview: {
    width: "100%",
    height: "100%",
  },
  emptyBannerPlaceholder: {
    alignItems: "center",
  },
  emptyBannerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  bannerUploadBtn: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerUploadText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  galleryWrapper: {
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnailContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thumbnailWrapper: {
    position: "relative",
  },
  thumbnailImg: {
    width: 54,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  removeThumbnailBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addGalleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  addGalleryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  gpsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  gpsButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  doctorCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doctorCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  docAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  doctorNameText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  doctorDetailsText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteDocBtn: {
    padding: 6,
  },
  docAddCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  docAddHeader: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
  },
  clinicCardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  clinicCardCategory: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  editProfileText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  detailsContainer: {
    width: "100%",
  },
  bannerHeroContainer: {
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    marginBottom: 50,
  },
  bannerHeroImage: {
    width: "100%",
    height: "100%",
  },
  logoHeroAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "absolute",
    bottom: -34,
    left: 20,
    backgroundColor: "#FFFFFF",
  },
  readOnlyList: {
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  infoRowCol: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    gap: 4,
  },
  infoLabelText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  infoValText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  infoDescriptionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  readDocCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceLight,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  readDocLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  readDocIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  readDocName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  readDocSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  readDocBadge: {
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.15)",
  },
  readDocBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "800",
  },
  noDocText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },
  galleryScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  galleryPhotoItem: {
    width: 90,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
