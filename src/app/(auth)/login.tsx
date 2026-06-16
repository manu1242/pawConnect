import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Animated, 
  Image 
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { setAuth } = useAuthStore();
  const { showToast } = useUiStore();

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Please enter a valid email";
    }
    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data) {
        const { user, accessToken } = response.data;
        await SecureStore.setItemAsync("pawconnect_access_token", accessToken);
        setAuth(user, accessToken);
        showToast(`Welcome back, ${user.fullName}!`, "success");
      } else {
        showToast(response.message || "Login failed", "error");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Invalid credentials. Please try again.";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Login here...</Text>

        {/* Animated illustration area */}
        <View style={styles.petContainer}>
          <View>
            <Image 
              source={require("../../../assets/images/Loginimage.jpg")} 
              style={styles.petImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Form fields directly in the container */}
        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
            keyboardType="email-address"
            containerStyle={styles.inputSpacing}
          />

          <CustomInput
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            secureTextEntry
            containerStyle={styles.inputSpacing}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/forgot-password" as any)}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Sign in"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Connect */}
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Or</Text>
          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "400",
    color: "#27272A",
    textAlign: "center",
    marginBottom: 10,
  },
  petContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  petImage: {
    width: 280,
    height: 200,
  },
  formContainer: {
    width: "100%",
    marginTop: 10,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  socialSection: {
    marginTop: 24,
    alignItems: "center",
    width: "100%",
  },
  socialTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 16,
  },
  googleBtn: {
    flexDirection: "row",
    width: "100%",
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#27272A",
  },
});
