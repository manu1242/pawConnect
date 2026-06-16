import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../../theme/colors";
import { useNotifications, useMarkNotificationsReadMutation } from "../../services/queries/hooks";

export default function NotificationsScreen() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationsReadMutation();

  // Mark all unread notifications as read when entering the notifications screen
  useEffect(() => {
    if (notifications.some((n) => !n.read)) {
      markReadMutation.mutate();
    }
  }, [notifications]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {notifications.length > 0 ? (
            notifications.map((n, index) => (
              <View 
                key={n._id || `notif-${index}`} 
                style={[styles.notificationItem, !n.read && styles.notificationUnread]}
              >
                <View style={styles.notifyHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons 
                      name={
                        n.type === "booking_created" ? "calendar-outline" :
                        n.type === "booking_accepted" ? "checkmark-circle-outline" :
                        n.type === "booking_cancelled" ? "close-circle-outline" :
                        n.type === "booking_completed" ? "ribbon-outline" : "notifications-outline"
                      } 
                      size={20} 
                      color={COLORS.primary} 
                      style={{ marginRight: 8 }} 
                    />
                    <Text style={styles.notifyTitle}>{n.title}</Text>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifyText}>{n.message}</Text>
                <Text style={styles.notifyTime}>
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>All caught up! No notifications yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: "rgba(255, 107, 53, 0.04)",
    borderColor: "rgba(255, 107, 53, 0.2)",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notifyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notifyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notifyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  notifyTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 10,
    alignSelf: "flex-end",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
});
