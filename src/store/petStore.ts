import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pet } from "../types";

interface PetState {
  petDraft: Partial<Pet>;
  setPetDraft: (draft: Partial<Pet>) => void;
  clearPetDraft: () => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set) => ({
      petDraft: {},
      setPetDraft: (draft) =>
        set((state) => ({
          petDraft: { ...state.petDraft, ...draft },
        })),
      clearPetDraft: () => set({ petDraft: {} }),
    }),
    {
      name: "pawconnect-pet-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
