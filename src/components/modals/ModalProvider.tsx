import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../common/CustomButton";

const FALLBACK_LOCATION = {
  address: "Veeravasaram, Andhra Pradesh",
  latitude: 16.5362,
  longitude: 81.6243,
};

export const ModalProvider: React.FC = () => {
  const { activeModal, closeModal, modalData } = useUiStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { showToast } = useUiStore();

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (activeModal === "locationPicker") {
      fetchLocation();
    } else {
      setResolvedLocation(null);
      setLocationError("");
      setLocationLoading(false);
    }
  }, [activeModal]);

  const fetchLocation = async () => {
    setLocationLoading(true);
    setLocationError("");
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError("Location services are disabled. Please enable GPS in settings.");
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission to access location was denied");
        return;
      }

      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (err) {
        console.warn("getCurrentPositionAsync failed, attempting getLastKnownPositionAsync:", err);
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location) {
        setLocationError("GPS coordinates are unavailable. Please enable GPS or use the default location.");
        return;
      }

      const { latitude, longitude } = location.coords;
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let address = "Unknown Location";
      
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const parts = [
          item.name,
          item.street,
          item.district,
          item.city,
          item.region,
          item.postalCode,
        ].filter(Boolean);
        if (parts.length > 0) {
          address = parts.join(", ");
        }
      }

      setResolvedLocation({
        address,
        latitude,
        longitude,
      });
    } catch (err: any) {
      console.error("Error fetching location:", err);
      setLocationError("Could not retrieve GPS coordinates. Please ensure GPS is enabled or use the default location.");
    } finally {
      setLocationLoading(false);
    }
  };

  if (!activeModal) return null;

  // Render modal content based on type
  const renderContent = () => {
    switch (activeModal) {
      case "locationPicker":
        return (
          <View style={styles.contentCard}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Location</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {locationLoading ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={[styles.text, { marginTop: 12, marginBottom: 0 }]}>
                  Detecting device location via GPS...
                </Text>
              </View>
            ) : locationError ? (
              <View>
                <Text style={[styles.text, { color: COLORS.danger, marginBottom: 16 }]}>
                  {locationError}
                </Text>
                <CustomButton
                  title="Retry GPS Detection"
                  onPress={fetchLocation}
                  style={{ marginBottom: 12 }}
                />
                <CustomButton
                  title="Use Default Location"
                  onPress={() => {
                    if (modalData?.onSelect) {
                      modalData.onSelect(FALLBACK_LOCATION);
                    }
                    showToast("Default location applied", "info");
                    closeModal();
                  }}
                  variant="outline"
                />
              </View>
            ) : resolvedLocation ? (
              <View>
                <Text style={styles.text}>
                  GPS coordinates successfully resolved. Please confirm your location.
                </Text>
                <View style={styles.gpsBox}>
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.gpsTitle}>Detected Location</Text>
                    <Text style={styles.gpsSub}>
                      {resolvedLocation.address} ({resolvedLocation.latitude.toFixed(4)}° N, {resolvedLocation.longitude.toFixed(4)}° E)
                    </Text>
                  </View>
                </View>
                <CustomButton
                  title="Confirm Location"
                  onPress={() => {
                    if (modalData?.onSelect) {
                      modalData.onSelect(resolvedLocation);
                    }
                    showToast("Location resolved successfully", "success");
                    closeModal();
                  }}
                />
              </View>
            ) : (
              <View>
                <Text style={styles.text}>
                  Press the button below to detect location.
                </Text>
                <CustomButton
                  title="Detect GPS Location"
                  onPress={fetchLocation}
                />
              </View>
            )}
          </View>
        );


      case "ratingReview":
        return (
          <View style={styles.contentCard}>
            <View style={styles.header}>
              <Text style={styles.title}>Rate & Review</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>How was your experience with {modalData?.storeName || "the store"}?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={COLORS.warning}
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />
            <CustomButton
              title="Submit Review"
              onPress={() => {
                if (modalData?.onSubmit) {
                  modalData.onSubmit({ rating, comment });
                }
                showToast("Review submitted successfully", "success");
                closeModal();
                setComment("");
              }}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeModal} />
      <View style={[styles.modalWrapper, { paddingBottom: 24 + insets.bottom }]}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  modalWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  text: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  gpsBox: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  gpsSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 8,
  },
  notificationUnread: {
    backgroundColor: "rgba(255, 107, 53, 0.05)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notifyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notifyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  notifyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  notifyTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  emptyNotifyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 24,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
});
