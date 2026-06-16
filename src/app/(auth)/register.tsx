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
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUiStore } from "../../store/uiStore";
import { authApi } from "../../services/api/authApi";
import { COLORS } from "../../theme/colors";
import { CustomInput } from "../../components/common/CustomInput";
import { CustomButton } from "../../components/common/CustomButton";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { role: roleParam } = useLocalSearchParams<{ role: "user" | "manager" }>();
  const role = roleParam === "manager" ? "manager" : "user";
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  
  const { showToast } = useUiStore();

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!fullName) nextErrors.fullName = "Full Name is required";
    if (!email) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Enter a valid email";
    }
    if (!phone) {
      nextErrors.phone = "Phone number is required";
    } else if (phone.length < 10) {
      nextErrors.phone = "Phone must be at least 10 digits";
    }
    if (!username) nextErrors.username = "Username is required";
    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).filter(k => nextErrors[k]).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await authApi.register({
        fullName,
        email,
        phone,
        username,
        password,
        role,
      });
      if (response.success) {
        showToast("Registration successful! Please sign in.", "success");
        router.replace("/login" as any);
      } else {
        showToast(response.message || "Registration failed", "error");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Registration failed. Try a different username/email.";
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
        <Text style={styles.title}>Register here...</Text>

        {/* Animated illustration area */}
        <View style={styles.petContainer}>
          <View>
            <Image 
              source={require("../../../assets/images/Registerimage.png")} 
              style={styles.petImage} 
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Form fields directly in the container */}
        <View style={styles.formContainer}>
          <CustomInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors({ ...errors, fullName: undefined });
            }}
            error={errors.fullName}
            autoCapitalize="words"
            containerStyle={styles.inputSpacing}
          />

          <CustomInput
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors({ ...errors, username: undefined });
            }}
            error={errors.username}
            containerStyle={styles.inputSpacing}
          />

          <CustomInput
            placeholder="Email Address"
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
            placeholder="Phone Number"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            error={errors.phone}
            keyboardType="phone-pad"
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



          <CustomButton
            title="Sign up"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login" as any)}>
              <Text style={styles.linkText}>Log in</Text>
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
    paddingTop: 50,
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
    marginTop: 0,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  roleLabel: {
    color: "#27272A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  roleBox: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E4E4E7",
    justifyContent: "center",
    alignItems: "center",
  },
  roleBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(255, 107, 53, 0.08)",
  },
  roleText: {
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  roleTextActive: {
    color: COLORS.primary,
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
