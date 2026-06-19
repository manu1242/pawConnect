import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Dimensions, Animated } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStoreDetails } from "../../../services/queries/hooks";
import { useBookingStore } from "../../../store/bookingStore";
import { useUiStore } from "../../../store/uiStore";
import { COLORS } from "../../../theme/colors";
import { CustomButton } from "../../../components/common/CustomButton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Reusable Pulsing Skeleton Component for premium UX
const SkeletonPulse = ({ style }: { style: any }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return <Animated.View style={[style, { opacity: pulseAnim }]} />;
};

function StoreDetailsSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonPulse style={styles.skeletonBanner} />
      <View style={styles.skeletonContent}>
        <SkeletonPulse style={styles.skeletonTitle} />
        <SkeletonPulse style={styles.skeletonAddress} />
        <View style={styles.skeletonStatsRow}>
          <SkeletonPulse style={styles.skeletonStatBox} />
          <SkeletonPulse style={styles.skeletonStatBox} />
          <SkeletonPulse style={styles.skeletonStatBox} />
        </View>
        <View style={styles.skeletonTabRow}>
          <SkeletonPulse style={styles.skeletonTabPill} />
          <SkeletonPulse style={styles.skeletonTabPill} />
          <SkeletonPulse style={styles.skeletonTabPill} />
          <SkeletonPulse style={styles.skeletonTabPill} />
        </View>
        <SkeletonPulse style={styles.skeletonMainCard} />
        <SkeletonPulse style={styles.skeletonLine} />
        <SkeletonPulse style={styles.skeletonLineShort} />
      </View>
    </View>
  );
}

const InfoRow = ({ label, value }: { label: string; value: any }) => {
  if (!value) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F4F4F5",
      }}
    >
      <Text
        style={{
          color: COLORS.textMuted,
          fontSize: 13,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: COLORS.text,
          fontWeight: "600",
          flex: 1,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
};

const Chip = ({
  title,
  color = COLORS.primary,
}: {
  title: string;
  color?: string;
}) => (
  <View
    style={{
      backgroundColor: `${color}10`,
      borderRadius: 24,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: `${color}25`,
    }}
  >
    <Text
      style={{
        color,
        fontSize: 12,
        fontWeight: "700",
      }}
    >
      {title}
    </Text>
  </View>
);

const KEY_MAP = {
  category: "c",
  shortDescription: "s",
  images: "im",
  video: "v",
  originalPrice: "op",
  offerPrice: "of",
  discountPercentage: "dp",
  taxIncluded: "t",
  homeVisitCharges: "hv",
  emergencyCharges: "ec",
  weekendCharges: "we",
  festivalCharges: "fe",
  suitableBreeds: "b",
  suitableAgeGroups: "a",
  minWeight: "wn",
  maxWeight: "wx",
  notIncludes: "ni",
  includes: "in",
  specialOffers: "so",
  availability: "av",
  requirementsBeforeService: "rq",
  afterServiceCareInstructions: "ac",
  cancellationPolicy: "cp",
  serviceStatus: "ss",
  ratingsAnalytics: "ra",
  seoSearch: "seo"
} as any;

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v as string, k])
) as any;

const cleanServiceDescription = (desc: string) => {
  if (!desc) return "";
  let result = "";
  let i = 0;
  while (i < desc.length) {
    if (desc.startsWith("[SERVICE_METADATA:", i)) {
      let bracketCount = 0;
      let j = i;
      while (j < desc.length) {
        if (desc[j] === "[") {
          bracketCount++;
        } else if (desc[j] === "]") {
          bracketCount--;
          if (bracketCount === 0) {
            i = j + 1;
            break;
          }
        }
        j++;
      }
      if (j >= desc.length) {
        i += 18;
      }
    } else {
      result += desc[i];
      i++;
    }
  }
  return result.trim();
};

export default function StoreDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: store, isLoading } = useStoreDetails(id as string);
  const { setBookingDraft } = useBookingStore();
  const { openModal } = useUiStore();

  const [descCollapsed, setDescCollapsed] = useState(true);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("About");
  const scrollRef = useRef<ScrollView>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Smooth scroll down to tab content area (approximately 330px from top)
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 330, animated: true });
    }, 100);
  };

  if (isLoading) {
    return <StoreDetailsSkeleton />;
  }

  if (!store) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Store details not found.</Text>
        <CustomButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const details = store.storeDetails || {};
  const name = store.name || details.name || "Happy Paws";
  const category = store.storeTypes?.[0] || details.category || "Pet Store";
  const description = store.description || details.description || "Professional pet services";
  const bannerUri = store.banner || store.bannerImage || details.images?.[0] || "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80";
  const logoUri = store.logo || store.logoImage || details.logo || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&q=80";
  const services = store.services || [];

  let addressText = "";
  if (typeof store.address === "string") {
    addressText = store.address;
  } else if (store.address) {
    const addr = store.address as any;
    addressText = `${addr.area ? `${addr.area}, ` : ""}${addr.city}${addr.pincode ? ` - ${addr.pincode}` : ""}`;
  }

  const toggleServiceSelection = (service: any) => {
    const serviceId = service._id || service.id;
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((sid) => sid !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Resolve selected service items details for the checkout bar
  const selectedServicesList = services.filter((s: any) => {
    const sId = s._id || s.id;
    return selectedServiceIds.includes(sId);
  });

  const totalSelectedPrice = selectedServicesList.reduce((sum: number, s: any) => sum + s.price, 0);

  const handleBookSelected = () => {
    if (selectedServicesList.length === 0) return;

    // Format for multiple selectedServices schema on both frontend and backend
    const selectedServicesPayload = selectedServicesList.map((s: any) => ({
      serviceId: s._id || s.id,
      name: s.name,
      price: s.price,
    }));

    setBookingDraft({
      storeId: store.id || store._id,
      storeName: name,
      serviceName: selectedServicesList.map((s: any) => s.name).join(", "),
      serviceId: selectedServicesList[0]._id || selectedServicesList[0].id,
      selectedServices: selectedServicesPayload,
      serviceMode: store.serviceMode || "store",
      price: totalSelectedPrice,
    });
    router.push("/booking-wizard" as any);
  };

  const toggleServiceExpand = (serviceId: string) => {
    if (expandedServiceIds.includes(serviceId)) {
      setExpandedServiceIds(expandedServiceIds.filter(id => id !== serviceId));
    } else {
      setExpandedServiceIds([...expandedServiceIds, serviceId]);
    }
  };

  const parseServiceMetadata = (service: any) => {
    let description = service.description || "";
    let metadata: any = {};
    
    let i = 0;
    while (i < description.length) {
      if (description.startsWith("[SERVICE_METADATA:", i)) {
        let bracketCount = 0;
        let j = i;
        while (j < description.length) {
          if (description[j] === "[") {
            bracketCount++;
          } else if (description[j] === "]") {
            bracketCount--;
            if (bracketCount === 0) {
              try {
                const jsonStr = description.slice(i + 18, j);
                const parsedMeta = JSON.parse(jsonStr);
                
                for (const [k, v] of Object.entries(parsedMeta)) {
                  const longKey = REVERSE_KEY_MAP[k] || k;
                  metadata[longKey] = v;
                }
              } catch (e) {
                console.error("Failed to parse nested metadata block", e);
              }
              i = j + 1;
              break;
            }
          }
          j++;
        }
        if (j >= description.length) {
          i += 18;
        }
      } else {
        i++;
      }
    }

    const cleanDesc = cleanServiceDescription(service.description);

    return {
      ...service,
      ...metadata,
      description: cleanDesc
    };
  };

  const getServiceInclusions = (service: any) => {
    if (service.includes && Array.isArray(service.includes)) {
      const filtered = service.includes.filter((item: any) => typeof item === "string" && item.trim() !== "");
      if (filtered.length > 0) {
        return filtered;
      }
    }
    const sName = (service.name || "").toLowerCase();
    if (
      sName.includes("groom") ||
      sName.includes("gromm") ||
      sName.includes("grom") ||
      sName.includes("spa") ||
      sName.includes("cut") ||
      sName.includes("bath")
    ) {
      return ["Shampoo Bath & Wash", "Nail Clipping", "Blow Dry & Brush", "Ear Cleaning"];
    }
    if (sName.includes("vet") || sName.includes("clinic") || sName.includes("consult") || sName.includes("doctor")) {
      return ["Full Health Examination", "Expert Consultation", "Vitals & Temp Monitoring", "Medical Advice"];
    }
    if (sName.includes("board") || sName.includes("stay") || sName.includes("hostel")) {
      return ["Cozy Individual Cabin", "Healthy Pet Meals", "3x Outdoor Walks", "Regular Play Sessions"];
    }
    if (sName.includes("train") || sName.includes("school")) {
      return ["Behavioral Coaching", "Basic/Advanced Commands", "Socialization Drills", "Progress Report"];
    }
    return ["Professional Handlers", "Safe Treatment", "Sanitized Tools"];
  };

  const shouldShowSeeMore = description.length > 140;
  const displayDescription = descCollapsed && shouldShowSeeMore
    ? `${description.slice(0, 140)}...`
    : description;

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = daysOfWeek[new Date().getDay()];
  const todayHours = store.businessHours?.find((h: any) => h.day.toLowerCase() === todayName.toLowerCase());

  const getPaymentMethodStyle = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes("cash")) {
      return { icon: "cash-outline" as const, bg: "#E8FBF0", border: "#BFEFCD", text: "#15803D" };
    }
    if (m.includes("card") || m.includes("credit") || m.includes("debit")) {
      return { icon: "card-outline" as const, bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" };
    }
    if (m.includes("upi") || m.includes("gpay") || m.includes("phonepe") || m.includes("paytm") || m.includes("scan")) {
      return { icon: "qr-code-outline" as const, bg: "#FAF5FF", border: "#E9D5FF", text: "#7E22CE" };
    }
    return { icon: "wallet-outline" as const, bg: "#FFF7ED", border: "#FFEDD5", text: "#C2410C" };
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Hero */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: bannerUri }}
            style={styles.banner}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Floating Brand Section */}
        <View style={styles.brandHeaderContainer}>
          <View style={styles.logoWrapper}>
            <Image source={{ uri: logoUri }} style={styles.storeLogo} />
          </View>
          <View style={styles.brandTextContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.storeName} numberOfLines={1}>{name}</Text>
              {(store.isVerified || store.verifiedBadge) && (
                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginLeft: 5 }} />
              )}
            </View>
            <Text style={styles.storeCategory}>{category}</Text>
          </View>
        </View>

        {/* Quick Rating Actions Bar */}
        <View style={styles.quickRatingBar}>
          <View style={styles.ratingInfo}>
            <Ionicons name="star" size={18} color={COLORS.warning} />
            <Text style={styles.ratingValue}>
              {store.rating !== undefined ? Number(store.rating.toFixed(1)) : 0}
            </Text>
            <Text style={styles.ratingCount}>
              ({store.totalReviews || 0} reviews)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => openModal("ratingReview", { storeName: name, storeId: store.id || store._id })}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.rateBtnText}>Rate Provider</Text>
          </TouchableOpacity>
        </View>

        {/* Address and Timing Block */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="location" size={18} color={COLORS.primary} style={styles.summaryIcon} />
            <Text style={styles.summaryText}>{addressText || "Vijayawada, India"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time" size={18} color={COLORS.primary} style={styles.summaryIcon} />
            <Text style={styles.summaryText}>Mon - Sat (9:00 AM - 6:00 PM)</Text>
          </View>
        </View>

        {/* Horizontal Scrollable Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {["About", "Services", "Gallery", "Business Info", "Hours"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content Wrapper */}
        <View style={styles.tabContentWrapper}>
          {activeTab === "About" && (
            <View style={styles.tabContentArea}>
              {/* About Us description with collapse toggle */}
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>About Us</Text>
                <Text style={styles.descriptionText}>{displayDescription}</Text>
                {shouldShowSeeMore && (
                  <TouchableOpacity onPress={() => setDescCollapsed(!descCollapsed)} style={styles.seeMoreBtn}>
                    <Text style={styles.seeMoreText}>{descCollapsed ? "Read More" : "Read Less"}</Text>
                    <Ionicons name={descCollapsed ? "chevron-down" : "chevron-up"} size={14} color={COLORS.primary} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Highlights Row */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{store.yearsOfExperience || 0}</Text>
                  <Text style={styles.statLabel}>Years Exp.</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{store.numberOfEmployees || 0}</Text>
                  <Text style={styles.statLabel}>Employees</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{store.profileViews || 0}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
              </View>

              {/* Facilities */}
              {store.facilities && store.facilities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.tabSectionTitle}>Facilities</Text>
                  <View style={styles.chipContainer}>
                    {store.facilities.map((item: string, index: number) => (
                      <Chip key={`${item}-${index}`} title={item} />
                    ))}
                  </View>
                </View>
              )}

              {/* Store Categories */}
              {store.storeTypes && store.storeTypes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.tabSectionTitle}>Store Categories</Text>
                  <View style={styles.chipContainer}>
                    {store.storeTypes.map((item: string, index: number) => (
                      <Chip key={`${item}-${index}`} title={item} />
                    ))}
                  </View>
                </View>
              )}

              {/* Products Available */}
              {store.productCategories && store.productCategories.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.tabSectionTitle}>Products Available</Text>
                  <View style={styles.chipContainer}>
                    {store.productCategories.map((item: string, index: number) => (
                      <Chip key={`${item}-${index}`} title={item} />
                    ))}
                  </View>
                </View>
              )}

              {/* Pets Available */}
              {store.petSaleTypes && store.petSaleTypes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.tabSectionTitle}>Pets Available</Text>
                  <View style={styles.chipContainer}>
                    {store.petSaleTypes.map((item: string, index: number) => (
                      <Chip key={`${item}-${index}`} title={item} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === "Services" && (
            <View style={styles.tabContentArea}>
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Our Services</Text>
                <Text style={styles.subTitleInfo}>Select one or more services to book an appointment</Text>
                {services.length > 0 ? (
                  services.map((srv: any) => {
                    const parsedSrv = parseServiceMetadata(srv);
                    const srvId = parsedSrv._id || parsedSrv.id;
                    const isSelected = selectedServiceIds.includes(srvId);
                    return (
                      <TouchableOpacity
                        key={`service-${srvId}`}
                        style={[
                          styles.serviceSelectCard,
                          isSelected && styles.serviceSelectCardActive,
                        ]}
                        onPress={() => toggleServiceSelection(parsedSrv)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.serviceHeaderRow}>
                          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                            <Ionicons
                              name={isSelected ? "checkbox" : "square-outline"}
                              size={22}
                              color={isSelected ? COLORS.primary : COLORS.textMuted}
                              style={{ marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.serviceName}>{parsedSrv.name}</Text>
                              {parsedSrv.description ? (
                                <Text style={styles.serviceDesc} numberOfLines={2}>
                                  {parsedSrv.description}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                          <Text style={styles.servicePrice}>₹{parsedSrv.offerPrice || parsedSrv.price}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.noDataText}>No services registered for this store.</Text>
                )}
              </View>
            </View>
          )}

          {activeTab === "Gallery" && (
            <View style={styles.tabContentArea}>
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Store Gallery</Text>
                {store.gallery && store.gallery.length > 0 ? (
                  <View style={styles.galleryGrid}>
                    {store.gallery.map((img: string, index: number) => (
                      <TouchableOpacity
                        key={`gallery-grid-${index}`}
                        activeOpacity={0.85}
                        onPress={() => setViewerImage(img)}
                        style={styles.galleryGridItem}
                      >
                        <Image source={{ uri: img }} style={styles.galleryGridPhoto} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyGalleryCard}>
                    <Ionicons name="images-outline" size={44} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                    <Text style={styles.noDataText}>No gallery photos available.</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activeTab === "Business Info" && (
            <View style={styles.tabContentArea}>
              {/* Service Features */}
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Service Features</Text>
                <View style={styles.detailCard}>
                  <InfoRow label="Home Pickup" value={store.homePickup ? "Available" : "No"} />
                  <InfoRow label="Home Delivery" value={store.homeDelivery ? "Available" : "No"} />
                  <InfoRow label="Emergency Visit" value={store.emergencyHomeVisit ? "Available" : "No"} />
                  <InfoRow label="Service Radius" value={`${store.serviceRadius || 0} KM`} />
                  <InfoRow label="Emergency Charges" value={`₹${store.emergencyCharges || 0}`} />
                </View>
              </View>

              {/* Business Information */}
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Business Information</Text>
                <View style={styles.detailCard}>
                  <InfoRow label="GST Number" value={store.gstNumber} />
                  <InfoRow label="Business Reg." value={store.businessRegNumber} />
                  <InfoRow label="Service Mode" value={store.serviceMode} />
                  <InfoRow label="Booking Mode" value={store.bookingMode} />
                  <InfoRow label="24 x 7" value={store.is24x7 ? "Yes" : "No"} />
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Contact Information</Text>
                <View style={styles.detailCard}>
                  <InfoRow label="Owner" value={store.ownerDetails?.fullName || store.ownerDetails?.name} />
                  <InfoRow label="Phone" value={store.phone} />
                  <InfoRow label="Alternate" value={store.ownerDetails?.alternatePhone} />
                  <InfoRow label="Emergency" value={store.emergencyContact} />
                  <InfoRow label="Email" value={store.ownerDetails?.email} />
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Payment Methods</Text>
                <View style={styles.paymentsGrid}>
                  {store.paymentMethods?.map((item: string, index: number) => {
                    const details = getPaymentMethodStyle(item);
                    return (
                      <View
                        key={`${item}-${index}`}
                        style={[
                          styles.paymentCard,
                          { backgroundColor: details.bg, borderColor: details.border },
                        ]}
                      >
                        <Ionicons name={details.icon} size={20} color={details.text} />
                        <Text style={[styles.paymentCardText, { color: details.text }]}>
                          {item}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {activeTab === "Hours" && (
            <View style={styles.tabContentArea}>
              <View style={styles.section}>
                <Text style={styles.tabSectionTitle}>Operating Schedule</Text>
                <View style={styles.hoursCard}>
                  {store.businessHours && store.businessHours.length > 0 ? (
                    store.businessHours.map((item, index) => (
                      <View key={index} style={styles.hourRow}>
                        <Text style={styles.dayText}>{item.day}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: item.isOpen ? "#DCFCE7" : "#FEE2E2",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: item.isOpen ? COLORS.success : COLORS.danger,
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {item.isOpen ? `${item.openTime} - ${item.closeTime}` : "Closed"}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No operating schedule registered.</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Action Bar */}
      {selectedServiceIds.length > 0 ? (
        <View style={styles.stickyFooter}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.footerLabel}>
              {selectedServiceIds.length} {selectedServiceIds.length === 1 ? "Service" : "Services"} Selected
            </Text>
            <Text style={styles.footerPrice}>₹{totalSelectedPrice}</Text>
          </View>
          <CustomButton
            title="Book Selected"
            onPress={handleBookSelected}
            style={styles.footerBookBtn}
          />
        </View>
      ) : (
        <View style={styles.stickyFooter}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.footerLabel}>Ready to Book?</Text>
            <Text style={styles.footerPrice}>Book services now</Text>
          </View>
          <CustomButton
            title="Book the service"
            onPress={() => handleTabChange("Services")}
            style={styles.footerBookBtn}
          />
        </View>
      )}

      {/* Fullscreen Photo modal viewer */}
      <Modal
        visible={!!viewerImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setViewerImage(null)}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.modalFullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  errorText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  bannerContainer: {
    position: "relative",
    height: 200,
    width: "100%",
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  backBtn: {
    position: "absolute",
    top: 24,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -28,
    marginBottom: 16,
  },
  logoWrapper: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  storeLogo: {
    width: "100%",
    height: "100%",
  },
  brandTextContainer: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 28,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#27272A",
    flexShrink: 1,
  },
  storeCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryLight,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickRatingBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F4F4F5",
    marginBottom: 16,
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#27272A",
    marginLeft: 5,
  },
  ratingCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.15)",
  },
  rateBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  summaryCard: {
    backgroundColor: "#FAF9F6",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    marginRight: 8,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  subTitleInfo: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#27272A",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#52525B",
    lineHeight: 22,
    fontWeight: "400",
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F4F4F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  galleryImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: "italic",
  },
  serviceSelectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F4F4F5",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceSelectCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.02)",
  },
  serviceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  originalPriceText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  expandedDetailsPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
  },
  expandedDescText: {
    fontSize: 13,
    color: "#52525B",
    lineHeight: 18,
    marginBottom: 10,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    marginLeft: 4,
  },
  detailsGroup: {
    marginTop: 10,
  },
  detailsGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#27272A",
    marginBottom: 6,
  },
  exclusionsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  exclusionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exclusionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B91C1C",
  },
  suitabilityContainer: {
    backgroundColor: "#FAF9F6",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F4F4F5",
  },
  suitabilityRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  suitabilityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  suitabilityValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#27272A",
  },
  offersWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offerBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7E22CE",
  },
  serviceCheckbox: {
    marginRight: 12,
  },
  serviceMetaTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#27272A",
    flex: 1,
    marginRight: 8,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },
  serviceDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  inclusionsSection: {
    marginTop: 4,
  },
  inclusionsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717A",
    marginBottom: 4,
  },
  inclusionsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  inclusionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inclusionBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#52525B",
  },
  bookBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  hoursHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 53, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dropdownToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 2,
  },
  todayHoursSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F4F4F5",
  },
  todayHoursLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginRight: 6,
  },
  todayHoursValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  hoursCard: {
    backgroundColor: "#FAF9F6",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#27272A",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#F4F4F5",
  },
  paymentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  paymentCardText: {
    fontSize: 12,
    fontWeight: "700",
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 15,
  },
  footerPriceCol: {
    flexDirection: "column",
  },
  footerLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: "#27272A",
    marginTop: 2,
  },
  footerBookBtn: {
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  modalFullscreenImage: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.8,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginVertical: 14,
    height: 48,
  },
  tabsContentContainer: {
    gap: 8,
    alignItems: "center",
    paddingRight: 40,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F4F4F5",
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  tabContentWrapper: {
    flex: 1,
  },
  tabContentArea: {
    flex: 1,
  },
  tabSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#27272A",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  galleryGridItem: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
  },
  galleryGridPhoto: {
    width: "100%",
    height: "100%",
  },
  emptyGalleryCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skeletonBanner: {
    height: 200,
    width: "100%",
    backgroundColor: "#E4E4E7",
  },
  skeletonContent: {
    padding: 20,
  },
  skeletonTitle: {
    height: 24,
    width: "60%",
    backgroundColor: "#E4E4E7",
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonAddress: {
    height: 16,
    width: "80%",
    backgroundColor: "#E4E4E7",
    borderRadius: 4,
    marginBottom: 20,
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  skeletonStatBox: {
    flex: 1,
    height: 50,
    backgroundColor: "#E4E4E7",
    borderRadius: 10,
  },
  skeletonTabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  skeletonTabPill: {
    width: 80,
    height: 36,
    backgroundColor: "#E4E4E7",
    borderRadius: 18,
  },
  skeletonMainCard: {
    height: 120,
    backgroundColor: "#E4E4E7",
    borderRadius: 14,
    marginBottom: 16,
  },
  skeletonLine: {
    height: 14,
    width: "90%",
    backgroundColor: "#E4E4E7",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 14,
    width: "50%",
    backgroundColor: "#E4E4E7",
    borderRadius: 4,
  },
});
