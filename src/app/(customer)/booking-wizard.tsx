import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { useBookingStore } from "../../store/bookingStore";
import { useUiStore } from "../../store/uiStore";
import { usePets, useCreateBookingMutation } from "../../services/queries/hooks";
import { bookingApi } from "../../services/api/bookingApi";
import { COLORS } from "../../theme/colors";
import { CustomButton } from "../../components/common/CustomButton";
import { promoApi } from "../../services/api/promoApi";

export default function BookingWizardScreen() {
  const { bookingDraft, setBookingDraft, clearBookingDraft } = useBookingStore();
  const { showToast } = useUiStore();
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

  // Coupon / Promo Code State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Detailed Location Form State
  const [locArea, setLocArea] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locState, setLocState] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [locPincode, setLocPincode] = useState("");
  const [locLat, setLocLat] = useState<number | null>(null);
  const [locLng, setLocLng] = useState<number | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // Initialize location state from draft on mount
  useEffect(() => {
    if (bookingDraft.customerLocation) {
      const cl = bookingDraft.customerLocation as any;
      setLocArea(cl.area || cl.address?.split(",")[0] || "");
      setLocCity(cl.city || "");
      setLocState(cl.state || "");
      setLocCountry(cl.country || "");
      setLocPincode(cl.pincode || "");
      setLocLat(cl.latitude || null);
      setLocLng(cl.longitude || null);
    }
  }, [bookingDraft.customerLocation]);

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
          ]);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [bookingDraft.storeId, date]);

  // GPS Location Detection
  const detectGPSLocation = async () => {
    setLocLoading(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        showToast("Location services are disabled. Please enable GPS in settings.", "error");
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access location was denied", "error");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!location) {
        showToast("GPS coordinates are unavailable.", "error");
        return;
      }

      const { latitude, longitude } = location.coords;
      setLocLat(latitude);
      setLocLng(longitude);

      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        setLocArea(item.street || item.name || item.district || "");
        setLocCity(item.city || "");
        setLocState(item.region || "");
        setLocCountry(item.country || "");
        setLocPincode(item.postalCode || "");
        
        const fullAddress = [
          item.street || item.name,
          item.city,
          item.region,
          item.country,
          item.postalCode,
        ].filter(Boolean).join(", ");

        setBookingDraft({
          customerLocation: {
            address: fullAddress,
            latitude,
            longitude,
            city: item.city || "",
            pincode: item.postalCode || "",
            state: item.region || "",
            country: item.country || "",
            area: item.street || item.name || item.district || "",
          } as any
        });
        showToast("GPS location resolved!", "success");
        setIsEditingLocation(true); // Open edit details automatically so they can verify/adjust
      }
    } catch (err) {
      console.error("GPS detection error:", err);
      showToast("Failed to detect GPS location", "error");
    } finally {
      setLocLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (!locCity || !locPincode || !locLat || !locLng) {
      showToast("Please make sure city, pincode, and coordinates are set.", "error");
      return;
    }
    const fullAddress = [locArea, locCity, locState, locCountry, locPincode].filter(Boolean).join(", ");
    setBookingDraft({
      customerLocation: {
        address: fullAddress,
        latitude: locLat,
        longitude: locLng,
        city: locCity,
        pincode: locPincode,
        state: locState,
        country: locCountry,
        area: locArea,
      }
    });
    setIsEditingLocation(false);
    showToast("Address saved!", "success");
  };

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
      showToast("Please configure and confirm your address", "info");
      return;
    }

    saveDraftState();
    if (step < 4) {
      setStep(step + 1);
    } else {
      submitBooking();
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await promoApi.validatePromo(
        couponCode.trim().toUpperCase(),
        bookingDraft.price || 0,
        bookingDraft.storeId
      );
      if (res.success && res.data) {
        const { code: appliedCode, discountAmount, title } = res.data;
        setAppliedCoupon(appliedCode);
        setCouponDiscount(discountAmount);
        showToast(`Coupon Applied! ${title} (Saved ₹${discountAmount})`, "success");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Invalid or inapplicable coupon code", "error");
      setAppliedCoupon(null);
      setCouponDiscount(0);
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

    const finalPrice = Math.max(0, (bookingDraft.price || 0) - couponDiscount);

    createBookingMutation.mutate(
      {
        storeId: bookingDraft.storeId,
        serviceId: bookingDraft.serviceId,
        serviceName: bookingDraft.serviceName,
        selectedServices: bookingDraft.selectedServices,
        serviceMode: selectedServiceMode,
        price: finalPrice,
        petDetails: petPayload,
        date,
        timeSlot: slot,
        paymentMethod,
        customerLocation: bookingDraft.customerLocation as any,
        promoCode: appliedCoupon || undefined,
      },
      {
        onSuccess: (res: any) => {
          showToast("Booking created successfully!", "success");
          const createdBooking = res.data?.booking || res.booking;
          clearBookingDraft();
          router.replace({
            pathname: "/booking-success",
            params: {
              bookingId: createdBooking?.bookingId || createdBooking?._id || createdBooking?.id,
              storeId: createdBooking?.storeId,
              customerAddress: createdBooking?.customerLocation?.address,
              customerLat: createdBooking?.customerLocation?.latitude,
              customerLng: createdBooking?.customerLocation?.longitude,
              totalPaid: createdBooking?.price,
              serviceName: createdBooking?.serviceName,
            }
          } as any);
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || "Booking failed to submit", "error");
        },
      }
    );
  };

  const itemPrice = bookingDraft.price || 0;
  const gstTax = Math.round(itemPrice * 0.18);
  const grandTotal = Math.max(0, itemPrice + gstTax - couponDiscount);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {bookingDraft.selectedServices && bookingDraft.selectedServices.length > 1
            ? "Book Services"
            : `Book ${bookingDraft.serviceName || "Service"}`}
        </Text>
        <Text style={styles.stepIndicator}>Step {step} of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* STEP 1: PET SELECTION */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Which pet is this booking for?</Text>
            
            {/* Add Pet Shortcut Redirect */}
            <TouchableOpacity 
              style={styles.addPetCard}
              onPress={() => router.push("/pets" as any)}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              <Text style={styles.addPetText}>Add New Pet</Text>
            </TouchableOpacity>

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

        {/* STEP 3: LOCATION CONFIGURATION */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Service Location Address</Text>
            
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

            {/* Saved Address Display */}
            {bookingDraft.customerLocation && !isEditingLocation ? (
              <View style={styles.savedLocationCard}>
                <View style={styles.savedLocationHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="checkmark-circle" size={20} color="#15803D" />
                    <Text style={styles.savedLocationTitle}>Saved Location Applied</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsEditingLocation(true)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.locationDetailsBox}>
                  <Text style={styles.locationDetailText}><Text style={styles.boldLabel}>Address:</Text> {bookingDraft.customerLocation.address}</Text>
                  <Text style={styles.locationDetailText}><Text style={styles.boldLabel}>Coordinates:</Text> {locLat?.toFixed(4)}° N, {locLng?.toFixed(4)}° E</Text>
                </View>

                <TouchableOpacity style={styles.detectLocationBtn} onPress={detectGPSLocation} disabled={locLoading}>
                  {locLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="location" size={18} color="#FFF" />
                      <Text style={styles.detectLocationBtnText}>Detect GPS Location Again</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Location Form (Detect & Edit)
              <View style={styles.locationForm}>
                <TouchableOpacity style={styles.detectLocationBtn} onPress={detectGPSLocation} disabled={locLoading}>
                  {locLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="location" size={18} color="#FFF" />
                      <Text style={styles.detectLocationBtnText}>Detect Location via GPS</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.formSectionTitle}>Address Details</Text>
                
                <Text style={styles.inputLabel}>Area / Street</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1226 University Dr"
                  value={locArea}
                  onChangeText={setLocArea}
                />

                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Menlo Park"
                  value={locCity}
                  onChangeText={setLocCity}
                />

                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. California"
                  value={locState}
                  onChangeText={setLocState}
                />

                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. United States"
                  value={locCountry}
                  onChangeText={setLocCountry}
                />

                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 94025"
                  value={locPincode}
                  onChangeText={setLocPincode}
                  keyboardType="numeric"
                />

                <View style={styles.coordsRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Latitude</Text>
                    <TextInput
                      style={styles.textInputDisabled}
                      value={locLat ? locLat.toString() : ""}
                      editable={false}
                      placeholder="Lat"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Longitude</Text>
                    <TextInput
                      style={styles.textInputDisabled}
                      value={locLng ? locLng.toString() : ""}
                      editable={false}
                      placeholder="Lng"
                    />
                  </View>
                </View>

                <CustomButton
                  title="Confirm & Save Address"
                  onPress={handleConfirmLocation}
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>
        )}

        {/* STEP 4: CHECKOUT PAYMENT & PLACE ORDER */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Payment</Text>

            {/* Payment Methods */}
            <View style={styles.paymentMethodsContainer}>
              {[
                { name: "Cash", icon: "cash-outline", desc: "Pay with hard cash after service" },
                { name: "UPI", icon: "phone-portrait-outline", desc: "Google Pay / PhonePe / Paytm UPI" },
                { name: "Credit Card", icon: "card-outline", desc: "Mastercard / Visa / American Express" },
              ].map((m) => {
                const isSelected = paymentMethod === m.name;
                return (
                  <TouchableOpacity
                    key={m.name}
                    style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardActive]}
                    onPress={() => setPaymentMethod(m.name)}
                  >
                    <View style={styles.paymentRadioContainer}>
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={isSelected ? COLORS.primary : COLORS.textMuted}
                      />
                    </View>
                    <Ionicons
                      name={m.icon as any}
                      size={24}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                      style={{ marginHorizontal: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.paymentMethodName, isSelected && styles.paymentMethodNameActive]}>{m.name}</Text>
                      <Text style={styles.paymentMethodDesc}>{m.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Coupon Section */}
            <View style={styles.couponCard}>
              <Text style={styles.couponHeading}>Coupon / Promo Code</Text>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code (try PAW50)"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.couponAddBtn} onPress={applyCoupon}>
                  <Text style={styles.couponAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {appliedCoupon && (
                <View style={styles.couponSuccessBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                  <Text style={styles.couponSuccessText}>Applied coupon code: {appliedCoupon}</Text>
                </View>
              )}
            </View>

            {/* Price Details */}
            <View style={styles.priceDetailsCard}>
              <Text style={styles.priceDetailsTitle}>Price Details</Text>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Items Price</Text>
                <Text style={styles.priceValue}>₹{itemPrice}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax (GST 18%)</Text>
                <Text style={styles.priceValue}>₹{gstTax}</Text>
              </View>

              {couponDiscount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: "#15803D" }]}>Promo Discount</Text>
                  <Text style={[styles.priceValue, { color: "#15803D" }]}>-₹{couponDiscount}</Text>
                </View>
              )}

              <View style={styles.priceDivider} />

              <View style={styles.priceRowGrand}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
              </View>
            </View>

            {/* Address Summary Bar */}
            <View style={styles.addressSummaryCard}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={styles.addressSummaryText} numberOfLines={1}>
                {bookingDraft.customerLocation?.address || "No address configured"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={step === 4 ? styles.placeOrderBtn : styles.continueBtn}
          onPress={handleNext}
          disabled={createBookingMutation.isPending}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.btnText}>{step === 4 ? "Place Order" : "Continue"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    maxWidth: "60%",
  },
  stepIndicator: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 20,
  },
  addPetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}30`,
    borderStyle: "dashed",
    marginBottom: 16,
    gap: 12,
  },
  addPetText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
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
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  dayChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  dayText: {
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  dayTextActive: {
    color: COLORS.primary,
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
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  slotChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  slotText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  slotTextActive: {
    color: COLORS.primary,
  },
  slotChipBooked: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F1F5F9",
    opacity: 0.5,
  },
  slotTextBooked: {
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },
  subLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
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
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
  },
  modeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  modeText: {
    color: COLORS.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  modeTextActive: {
    color: COLORS.primary,
  },
  savedLocationCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  savedLocationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  savedLocationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
    marginLeft: 6,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  locationDetailsBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationDetailText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
    marginBottom: 4,
  },
  boldLabel: {
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  detectLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  detectLocationBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  locationForm: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  textInputDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  coordsRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 12,
  },
  paymentMethodsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
  },
  paymentMethodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}02`,
  },
  paymentRadioContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  paymentMethodNameActive: {
    color: COLORS.primary,
  },
  paymentMethodDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  couponCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  couponHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  couponAddBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  couponAddBtnText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  couponSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  couponSuccessText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#15803D",
    marginLeft: 4,
  },
  priceDetailsCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  priceDetailsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  priceRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  addressSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  addressSummaryText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderBtn: {
    backgroundColor: "#EF4444", // Red button matching screenshot
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
});
