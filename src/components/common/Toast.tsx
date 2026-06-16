import React, { useEffect, useRef } from "react";
import { Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";

export const Toast: React.FC = () => {
  const { toast, hideToast } = useUiStore();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (toast.message) {
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [toast.message]);

  if (!toast.message) return null;

  let bgColor = COLORS.info;
  if (toast.type === "success") bgColor = COLORS.success;
  if (toast.type === "error") bgColor = COLORS.danger;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bgColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
