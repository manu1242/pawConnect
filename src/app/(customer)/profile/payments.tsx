import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../../theme/colors";

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments & Billing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Saved Cards */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Saved Cards</Text>
          <View style={styles.paymentCard}>
            <Ionicons name="logo-visa" size={24} color="#1A1F71" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentName}>Visa Ending in 4242</Text>
              <Text style={styles.paymentSub}>Expires 12/28</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert("Remove Card", "Card removed.")}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert("Add Card", "Add card coming soon.")}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
            <Text style={styles.addText}>Add Credit/Debit Card</Text>
          </TouchableOpacity>
        </View>

        {/* Saved UPI */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Saved UPI IDs</Text>
          <View style={styles.upiRow}>
            <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={styles.upiText}>user@paytm</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert("Add UPI", "UPI setup coming soon.")}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
            <Text style={styles.addText}>Link New UPI ID</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.emptyText}>No recent billing transactions found.</Text>
        </View>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 14,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  paymentSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  removeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.danger,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  addText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 6,
  },
  upiRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  upiText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    paddingVertical: 8,
  },
});
