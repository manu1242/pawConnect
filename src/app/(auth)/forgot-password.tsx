import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useUiStore } from "../../store/uiStore";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { showToast } = useUiStore();

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      if (res.success) {
        showToast("Password reset link sent to your email!", "success");
        router.push({
          pathname: "/reset-password" as any,
          params: { email },
        });
      } else {
        showToast(res.message || "Failed to trigger reset", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Error resetting password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Forgot Password</Text>
          <Text style={styles.sub}>
            Enter your email address and we'll send you a password reset code.
          </Text>

          <CustomInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(undefined);
            }}
            error={error}
            keyboardType="email-address"
          />

          <CustomButton
            title="Send Reset Link"
            onPress={handleForgotPassword}
            loading={loading}
            style={styles.submitBtn}
          />

          <CustomButton
            title="Back to Login"
            variant="outline"
            onPress={() => router.back()}
            style={styles.backBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 12,
  },
  backBtn: {
    marginTop: 12,
  },
});
