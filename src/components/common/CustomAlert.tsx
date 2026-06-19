import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUiStore } from "../../store/uiStore";
import { COLORS } from "../../theme/colors";

export function CustomAlert() {
  const { alert, hideAlert } = useUiStore();

  if (!alert.title) return null;

  const titleLower = alert.title.toLowerCase();
  
  // Decide Icon color and name based on title/message content
  let iconName: any = "information-circle-outline";
  let iconColor = COLORS.emergencyPrimaryOrange;

  if (titleLower.includes("fail") || titleLower.includes("error") || titleLower.includes("required") || titleLower.includes("remove") || titleLower.includes("delete")) {
    iconName = "alert-circle";
    iconColor = COLORS.emergencyRed;
  } else if (titleLower.includes("success") || titleLower.includes("scheduled") || titleLower.includes("booked") || titleLower.includes("complete")) {
    iconName = "checkmark-circle";
    iconColor = COLORS.emergencySuccess;
  } else if (titleLower.includes("call") || titleLower.includes("hotline") || titleLower.includes("contact")) {
    iconName = "call";
    iconColor = COLORS.emergencyPrimaryOrange;
  } else if (titleLower.includes("sign out") || titleLower.includes("logout") || titleLower.includes("exit")) {
    iconName = "log-out-outline";
    iconColor = COLORS.emergencyRed;
  }

  const buttons = alert.buttons && alert.buttons.length > 0
    ? alert.buttons
    : [{ text: "OK", onPress: () => {}, style: "default" as const }];

  return (
    <Modal
      visible={!!alert.title}
      transparent={true}
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name={iconName} size={44} color={iconColor} style={styles.icon} />
            <Text style={styles.title}>{alert.title}</Text>
          </View>

          {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}

          <View style={[styles.buttonsRow, buttons.length > 2 && styles.buttonsCol]}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === "destructive" || btn.text.toLowerCase().includes("remove") || btn.text.toLowerCase().includes("delete") || btn.text.toLowerCase().includes("sign out");
              const isCancel = btn.style === "cancel" || btn.text.toLowerCase().includes("cancel");

              let btnBg = COLORS.emergencySurfaceLight;
              let btnBorderColor = COLORS.emergencyBorder;
              let textColor = "#FFFFFF";

              if (isDestructive) {
                btnBg = COLORS.emergencyRed;
                btnBorderColor = COLORS.emergencyRed;
              } else if (!isCancel) {
                btnBg = COLORS.emergencyPrimaryOrange;
                btnBorderColor = COLORS.emergencyPrimaryOrange;
              }

              return (
                <TouchableOpacity
                  key={`custom-alert-btn-${idx}`}
                  style={[
                    styles.button,
                    { backgroundColor: btnBg, borderColor: btnBorderColor },
                    buttons.length > 2 && { width: "100%", marginBottom: 8 }
                  ]}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) {
                      btn.onPress();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnText, { color: textColor }]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyBorder,
    width: "100%",
    maxWidth: 320,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: COLORS.emergencyTextMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  buttonsCol: {
    flexDirection: "column",
    gap: 0,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
