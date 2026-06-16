import React from "react";
import { View, ActivityIndicator, StyleSheet, Modal, Text } from "react-native";
import { COLORS } from "../../theme/colors";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = "Loading...",
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)", // Slate 900 opacity
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    minWidth: 140,
  },
  message: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
