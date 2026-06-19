import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useUiStore } from "../../store/uiStore";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const [token, setToken] = useState(params.token || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (params.token) {
      setToken(params.token);
    }
  }, [params.token]);
  
  const { showToast } = useUiStore();

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!token) nextErrors.token = "Reset code is required";
    if (!password) {
      nextErrors.password = "New password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).filter(k => nextErrors[k]).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ token, password });
      if (res.success) {
        showToast("Password reset successful! Please login.", "success");
        router.replace("/login" as any);
      } else {
        showToast(res.message || "Failed to reset password", "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Invalid or expired reset code", "error");
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
          <Text style={styles.cardTitle}>Reset Password</Text>
          <Text style={styles.sub}>
            Enter the reset token code sent to {params.email || "your email"} and choose a new password.
          </Text>

          <CustomInput
            label="Reset Token Code"
            placeholder="Enter reset code"
            value={token}
            onChangeText={(text) => {
              setToken(text);
              if (errors.token) setErrors({ ...errors, token: undefined });
            }}
            error={errors.token}
          />

          <CustomInput
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            secureTextEntry
          />

          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.submitBtn}
          />

          <CustomButton
            title="Back to Login"
            variant="outline"
            onPress={() => router.replace("/login" as any)}
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
