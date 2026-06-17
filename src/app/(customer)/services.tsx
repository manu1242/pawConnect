import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../theme/colors";

export default function ServicesScreen() {
  const { select } = useLocalSearchParams<{ select?: string }>();

  const handleBookService = (category: string) => {
    router.push({
      pathname: "/stores" as any,
      params: { category },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>All Services</Text>
          <Text style={styles.subtitle}>Professional care for your loved pets</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Card 1: Grooming */}
        <View style={[styles.premiumServiceCard, { backgroundColor: "#FFF8F6", borderColor: "#FEEAE4" }]}>
          <View style={styles.premiumServiceLeft}>
            <View style={styles.premiumHeaderRow}>
              <View style={[styles.premiumIconContainer, { backgroundColor: "#FFEBE5" }]}>
                <Ionicons name="cut" size={16} color="#FF6B35" />
              </View>
              <Text style={styles.premiumServiceTitle}>Grooming</Text>
            </View>
            <Text style={styles.premiumServiceSubtitle}>
              Keep your pet clean, fresh & looking their best
            </Text>
            
            <View style={styles.premiumBulletsContainer}>
              {["Bath & Dry", "Hair Trim & Styling", "Nail Cutting", "Ear Cleaning"].map((item) => (
                <View key={item} style={styles.premiumBulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#FF6B35" style={{ marginRight: 6 }} />
                  <Text style={styles.premiumBulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.premiumCtaButton, { backgroundColor: "#FF6B35" }]}
              onPress={() => handleBookService("Grooming")}
            >
              <Text style={styles.premiumCtaButtonText}>Book Session</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.premiumServiceRight}>
            <Image 
              source={require("../../../assets/images/grooming_dog.png")} 
              style={styles.premiumServiceImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card 2: Vet Clinic */}
        <View style={[styles.premiumServiceCard, { backgroundColor: "#F0F6FF", borderColor: "#DFEBFE" }]}>
          <View style={styles.premiumServiceLeft}>
            <View style={styles.premiumHeaderRow}>
              <View style={[styles.premiumIconContainer, { backgroundColor: "#E1EDFF" }]}>
                <Ionicons name="pulse" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.premiumServiceTitle}>Vet Clinic</Text>
            </View>
            <Text style={styles.premiumServiceSubtitle}>
              Expert care for a healthy & happy pet
            </Text>
            
            <View style={styles.premiumBulletsContainer}>
              {["Health Check-ups", "Vaccinations", "Consultation", "Diagnostics"].map((item) => (
                <View key={item} style={styles.premiumBulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text style={styles.premiumBulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.premiumCtaButton, { backgroundColor: "#3B82F6" }]}
              onPress={() => handleBookService("Vet Clinic")}
            >
              <Text style={styles.premiumCtaButtonText}>Find a Vet</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.premiumServiceRight}>
            <Image 
              source={require("../../../assets/images/vet_clinic.png")} 
              style={styles.premiumServiceImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card 3: Boarding */}
        <View style={[styles.premiumServiceCard, { backgroundColor: "#F0FDF4", borderColor: "#DCFCE7" }]}>
          <View style={styles.premiumServiceLeft}>
            <View style={styles.premiumHeaderRow}>
              <View style={[styles.premiumIconContainer, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="home" size={16} color="#16A34A" />
              </View>
              <Text style={styles.premiumServiceTitle}>Boarding</Text>
            </View>
            <Text style={styles.premiumServiceSubtitle}>
              A safe, cozy home away from home
            </Text>
            
            <View style={styles.premiumBulletsContainer}>
              {["24/7 Supervision", "Clean & Secure Space", "Regular Updates", "Play & Comfort"].map((item) => (
                <View key={item} style={styles.premiumBulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text style={styles.premiumBulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.premiumCtaButton, { backgroundColor: "#16A34A" }]}
              onPress={() => handleBookService("Boarding")}
            >
              <Text style={styles.premiumCtaButtonText}>Check Availability</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.premiumServiceRight}>
            <Image 
              source={require("../../../assets/images/boarding_dog.png")} 
              style={styles.premiumServiceImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card 4: Training */}
        <View style={[styles.premiumServiceCard, { backgroundColor: "#FAF5FF", borderColor: "#F3E8FF" }]}>
          <View style={styles.premiumServiceLeft}>
            <View style={styles.premiumHeaderRow}>
              <View style={[styles.premiumIconContainer, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="school" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.premiumServiceTitle}>Training</Text>
            </View>
            <Text style={styles.premiumServiceSubtitle}>
              Build better habits & a stronger bond
            </Text>
            
            <View style={styles.premiumBulletsContainer}>
              {["Obedience Training", "Behavior Improvement", "Puppy Training", "Tricks & Commands"].map((item) => (
                <View key={item} style={styles.premiumBulletRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#7C3AED" style={{ marginRight: 6 }} />
                  <Text style={styles.premiumBulletText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.premiumCtaButton, { backgroundColor: "#7C3AED" }]}
              onPress={() => handleBookService("Training")}
            >
              <Text style={styles.premiumCtaButtonText}>Enroll Now</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.premiumServiceRight}>
            <Image 
              source={require("../../../assets/images/training_dog.png")} 
              style={styles.premiumServiceImage} 
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  premiumServiceCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    height: 200,
    position: "relative",
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
  },
  premiumServiceLeft: {
    flex: 1.5,
    zIndex: 2,
    justifyContent: "space-between",
  },
  premiumHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  premiumIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumServiceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  premiumServiceSubtitle: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 14,
    marginBottom: 8,
    maxWidth: "90%",
  },
  premiumBulletsContainer: {
    gap: 5,
    marginBottom: 10,
  },
  premiumBulletRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumBulletText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  premiumCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: "flex-start",
    zIndex: 3,
  },
  premiumCtaButtonText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  premiumServiceRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: "38%",
    height: "85%",
    zIndex: 1,
  },
  premiumServiceImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
});
