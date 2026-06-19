import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Store } from "../types";

interface StoresCacheState {
  cachedStores: Store[];
  setCachedStores: (stores: Store[]) => void;
  clearCachedStores: () => void;
}

export const useStoresCacheStore = create<StoresCacheState>()(
  persist(
    (set) => ({
      cachedStores: [],
      setCachedStores: (stores) => set({ cachedStores: stores }),
      clearCachedStores: () => set({ cachedStores: [] }),
    }),
    {
      name: "pawconnect-stores-cache",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
