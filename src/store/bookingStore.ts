import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Booking } from "../types";

interface BookingState {
  bookingDraft: Partial<Booking>;
  setBookingDraft: (draft: Partial<Booking>) => void;
  clearBookingDraft: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      bookingDraft: {},
      setBookingDraft: (draft) =>
        set((state) => ({
          bookingDraft: { ...state.bookingDraft, ...draft },
        })),
      clearBookingDraft: () => set({ bookingDraft: {} }),
    }),
    {
      name: "pawconnect-booking-draft",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
