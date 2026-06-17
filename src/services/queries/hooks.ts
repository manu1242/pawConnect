import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { petApi } from "../api/petApi";
import { storeApi } from "../api/storeApi";
import { bookingApi } from "../api/bookingApi";
import { feedbackApi } from "../api/feedbackApi";
import { notificationApi } from "../api/notificationApi";
import { promoApi } from "../api/promoApi";
import { User, Pet, Booking, Store, Feedback } from "../../types";

// Auth & Profile Hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await authApi.getProfile();
      return res.data.user;
    },
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<User>) => authApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

// Store Hooks
export const useStores = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const res = await storeApi.listPublicStores();
      return res.data.stores;
    },
  });
};

export const useStoreDetails = (storeId: string) => {
  return useQuery({
    queryKey: ["store", storeId],
    queryFn: async () => {
      const res = await storeApi.getPublicStoreDetails(storeId);
      return res.data.store;
    },
    enabled: !!storeId,
  });
};

export const useMyStore = () => {
  return useQuery({
    queryKey: ["my-store"],
    queryFn: async () => {
      const res = await storeApi.getStoreStatus();
      return res.data.store;
    },
  });
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await storeApi.getStoreDashboard();
      return res.data;
    },
  });
};

export const useStoreMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => storeApi.registerStore(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useEditStoreMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Store>) => storeApi.editStore(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });
};

// Pet Hooks
export const usePets = () => {
  return useQuery({
    queryKey: ["pets"],
    queryFn: async () => {
      const res = await petApi.listPets();
      return res.data.pets;
    },
  });
};

export const useCreatePetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Pet>) => petApi.createPet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
};

export const usePet = (petId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["pets", petId],
    queryFn: async () => {
      // 1. Try to find the pet in the cached list first
      const cachedPets = queryClient.getQueryData<Pet[]>(["pets"]);
      if (cachedPets) {
        const found = cachedPets.find(p => (p.id === petId || (p as any)._id === petId));
        if (found) {
          return found;
        }
      }

      // 2. If not in cache, fetch from the API
      try {
        const res = await petApi.getPet(petId);
        return res.data.pet;
      } catch (err) {
        // 3. Fallback: if API fails (e.g., endpoint not deployed yet on remote server), return from cache
        const allPets = queryClient.getQueryData<Pet[]>(["pets"]);
        const found = allPets?.find(p => (p.id === petId || (p as any)._id === petId));
        if (found) {
          return found;
        }
        throw err;
      }
    },
    enabled: !!petId,
  });
};

export const useUpdatePetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, payload }: { petId: string; payload: Partial<Pet> }) =>
      petApi.updatePet(petId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      queryClient.invalidateQueries({ queryKey: ["pets", variables.petId] });
    },
  });
};

export const useDeletePetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => petApi.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
};

// Booking Hooks
export const useBookings = (role: "user" | "manager") => {
  return useQuery({
    queryKey: ["bookings", role],
    queryFn: async () => {
      if (role === "user") {
        const res = await bookingApi.listCustomerBookings();
        return res.data.bookings;
      } else {
        const res = await bookingApi.listStoreBookings();
        return res.data.bookings;
      }
    },
  });
};

export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Booking>) => bookingApi.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "user"] });
    },
  });
};

export const useUpdateBookingStatusMutation = (role: "user" | "manager") => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, action }: { bookingId: string; action: "accept" | "reject" | "complete" | "cancel" }) => {
      switch (action) {
        case "accept":
          return bookingApi.acceptBooking(bookingId);
        case "reject":
          return bookingApi.rejectBooking(bookingId);
        case "complete":
          return bookingApi.completeBooking(bookingId);
        case "cancel":
          return bookingApi.cancelBooking(bookingId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", role] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useBookingDetails = (bookingId: string, role: "user" | "manager") => {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (role === "user") {
        const res = await bookingApi.listCustomerBookings();
        const found = res.data.bookings.find(b => (b.id === bookingId || (b as any)._id === bookingId));
        if (found) return found;
      } else {
        const res = await bookingApi.listStoreBookings();
        const found = res.data.bookings.find(b => (b.id === bookingId || (b as any)._id === bookingId));
        if (found) return found;
      }
      throw new Error("Booking not found");
    },
    enabled: !!bookingId,
  });
};

// Feedback Mutation
export const useFeedbackMutation = () => {
  return useMutation({
    mutationFn: (payload: Feedback) => feedbackApi.submitFeedback(payload),
  });
};

// Notification Hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 10000, // Polling notifications every 10 seconds for real-time update feel
  });
};

export const useMarkNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const usePublicPromos = () => {
  return useQuery({
    queryKey: ["public-promos"],
    queryFn: async () => {
      const res = await promoApi.getPublicPromos();
      return res.data.promos;
    },
  });
};
