import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pet } from "../../types";
import { COLORS } from "../../theme/colors";

interface PetCardProps {
  pet: Pet;
  onDelete: () => void;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, onDelete }) => {
  const router = useRouter();
  const petId = pet.id || (pet as any)._id;

  const handlePress = () => {
    if (petId) {
      router.push(`/(customer)/pets/${petId}`);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.iconContainer}>
        {pet.photo || (pet as any).profileImage ? (
          <Image
            source={{ uri: pet.photo || (pet as any).profileImage }}
            style={styles.petPhoto}
          />
        ) : (
          <Ionicons
            name={pet.petType === "Cat" ? "logo-github" : "paw"}
            size={24}
            color={COLORS.primaryLight}
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.details}>
          {pet.breed} • {pet.age} • {pet.weight} • {pet.gender}
        </Text>
        <View style={styles.row}>
          <View
            style={[
              styles.badge,
              { backgroundColor: pet.vaccinated ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: pet.vaccinated ? COLORS.success : COLORS.danger },
              ]}
            >
              {pet.vaccinated ? "Vaccinated" : "Not Vaccinated"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
          <Ionicons name="eye-outline" size={18} color={COLORS.primaryLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  details: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  petPhoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
});
