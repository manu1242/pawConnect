import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StoreFormData, INITIAL_FORM_DATA } from "../constants/storeRegistration";

interface StoreRegistrationState {
  formData: StoreFormData;
  step: number;
  updateStep: (step: number) => void;
  updateOwnerDetails: (details: Partial<StoreFormData["ownerDetails"]>) => void;
  updateStoreDetails: (details: Partial<StoreFormData["storeDetails"]>) => void;
  updateAddress: (details: Partial<StoreFormData["address"]>) => void;
  updateCategories: (categories: string[]) => void;
  updateServices: (services: StoreFormData["services"]) => void;
  updateProducts: (sellsProducts: boolean, productCategories: string[]) => void;
  updatePets: (sellsPets: boolean, petSaleTypes: string[]) => void;
  updateServiceMode: (fields: Partial<Pick<StoreFormData, "serviceMode" | "homePickup" | "homeDelivery" | "emergencyHomeVisit" | "serviceRadius">>) => void;
  updateHours: (hours: StoreFormData["businessHours"]) => void;
  updatePayments: (methods: string[]) => void;
  updateFacilities: (facilities: string[]) => void;
  updateDocuments: (docs: StoreFormData["documents"]) => void;
  updateSocials: (socials: StoreFormData["socialLinks"]) => void;
  updateCustomerEmergency: (fields: Partial<Pick<StoreFormData, "bookingMode" | "maxBookingsPerDay" | "maxHomeVisitsPerDay" | "is24x7" | "emergencyContact" | "emergencyCharges">>) => void;
  resetStore: () => void;
}

export const useStoreRegistrationStore = create<StoreRegistrationState>()(
  persist(
    (set) => ({
      formData: JSON.parse(JSON.stringify(INITIAL_FORM_DATA)),
      step: 1,
      updateStep: (step) => set({ step }),
      updateOwnerDetails: (payload) =>
        set((state) => ({
          formData: {
            ...state.formData,
            ownerDetails: { ...state.formData.ownerDetails, ...payload },
          },
        })),
      updateStoreDetails: (payload) =>
        set((state) => ({
          formData: {
            ...state.formData,
            storeDetails: { ...state.formData.storeDetails, ...payload },
          },
        })),
      updateAddress: (payload) =>
        set((state) => ({
          formData: {
            ...state.formData,
            address: { ...state.formData.address, ...payload },
          },
        })),
      updateCategories: (payload) =>
        set((state) => ({
          formData: { ...state.formData, storeTypes: payload },
        })),
      updateServices: (payload) =>
        set((state) => ({
          formData: { ...state.formData, services: payload },
        })),
      updateProducts: (sellsProducts, productCategories) =>
        set((state) => ({
          formData: {
            ...state.formData,
            sellsProducts,
            productCategories,
          },
        })),
      updatePets: (sellsPets, petSaleTypes) =>
        set((state) => ({
          formData: {
            ...state.formData,
            sellsPets,
            petSaleTypes,
          },
        })),
      updateServiceMode: (payload) =>
        set((state) => ({
          formData: { ...state.formData, ...payload },
        })),
      updateHours: (payload) =>
        set((state) => ({
          formData: { ...state.formData, businessHours: payload },
        })),
      updatePayments: (payload) =>
        set((state) => ({
          formData: { ...state.formData, paymentMethods: payload },
        })),
      updateFacilities: (payload) =>
        set((state) => ({
          formData: { ...state.formData, facilities: payload },
        })),
      updateDocuments: (payload) =>
        set((state) => ({
          formData: { ...state.formData, documents: payload },
        })),
      updateSocials: (payload) =>
        set((state) => ({
          formData: { ...state.formData, socialLinks: payload },
        })),
      updateCustomerEmergency: (payload) =>
        set((state) => ({
          formData: { ...state.formData, ...payload },
        })),
      resetStore: () =>
        set({
          formData: JSON.parse(JSON.stringify(INITIAL_FORM_DATA)),
          step: 1,
        }),
    }),
    {
      name: "pawconnect-store-registration",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
