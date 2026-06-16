import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { COLORS } from "../../theme/colors";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  let buttonStyle: ViewStyle = styles.primary;
  let txtStyle: TextStyle = styles.textLight;

  if (variant === "secondary") {
    buttonStyle = styles.secondary;
  } else if (variant === "danger") {
    buttonStyle = styles.danger;
  } else if (variant === "outline") {
    buttonStyle = styles.outline;
    txtStyle = styles.textOutline;
  }

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, buttonStyle, style, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "outline" ? COLORS.primary : "#FFF"} />
      ) : (
        <Text style={[styles.text, txtStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
  },
  textLight: {
    color: "#FFFFFF",
  },
  textOutline: {
    color: COLORS.primary,
  },
});
