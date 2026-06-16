import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../../theme/colors";
import { useUiStore } from "../../../store/uiStore";
import { useFeedbackMutation } from "../../../services/queries/hooks";
import { CustomButton } from "../../../components/common/CustomButton";

export default function SupportScreen() {
  const { showToast } = useUiStore();
  const feedbackMutation = useFeedbackMutation();

  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const handleSubmitFeedback = () => {
    if (!feedbackMsg.trim()) {
      showToast("Please enter a message", "info");
      return;
    }

    feedbackMutation.mutate(
      { type: feedbackType, message: feedbackMsg },
      {
        onSuccess: () => {
          showToast("Feedback submitted successfully. Thank you!", "success");
          setFeedbackMsg("");
        },
        onError: () => {
          showToast("Failed to submit feedback. Try again.", "error");
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Channels */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Customer Care</Text>

          <TouchableOpacity style={styles.rowItem} onPress={() => Linking.openURL("https://wa.me/15550199")}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={{ marginRight: 10 }} />
              <Text style={styles.rowItemText}>WhatsApp Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => Linking.openURL("tel:+15550199")}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.rowItemText}>Call Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => Linking.openURL("mailto:support@pawconnect.com")}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
              <Text style={styles.rowItemText}>Email Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Feedback & Report Bugs</Text>
          <Text style={styles.subTitle}>Select Feedback Type</Text>
          <View style={styles.typeRow}>
            {(["bug", "suggestion", "other"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, feedbackType === type ? styles.typeChipActive : null]}
                onPress={() => setFeedbackType(type)}
              >
                <Text style={[styles.typeChipText, feedbackType === type ? styles.typeChipTextActive : null]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.feedbackInput}
            placeholder="Tell us what we can improve..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={feedbackMsg}
            onChangeText={setFeedbackMsg}
          />

          <CustomButton
            title="Submit Feedback"
            onPress={handleSubmitFeedback}
            loading={feedbackMutation.isPending}
          />
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
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  typeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  typeChipTextActive: {
    color: COLORS.primary,
  },
  feedbackInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    textAlignVertical: "top",
  },
});
