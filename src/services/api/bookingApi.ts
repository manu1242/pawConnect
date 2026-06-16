import { axiosClient } from "../axios/axiosClient";
import { Booking, ApiResponse } from "../../types";

export const bookingApi = {
  listCustomerBookings: async () => {
    const response = await axiosClient.get<ApiResponse<{ bookings: Booking[] }>>("/bookings/my-bookings");
    return response.data;
  },

  listStoreBookings: async () => {
    const response = await axiosClient.get<ApiResponse<{ bookings: Booking[] }>>("/bookings/store-bookings");
    return response.data;
  },

  createBooking: async (payload: Partial<Booking>) => {
    const response = await axiosClient.post<ApiResponse<{ booking: Booking }>>("/bookings", payload);
    return response.data;
  },

  acceptBooking: async (bookingId: string) => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/bookings/${bookingId}/accept`);
    return response.data;
  },

  rejectBooking: async (bookingId: string) => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/bookings/${bookingId}/reject`);
    return response.data;
  },

  completeBooking: async (bookingId: string) => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/bookings/${bookingId}/complete`);
    return response.data;
  },

  cancelBooking: async (bookingId: string) => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  getAvailableSlots: async (storeId: string, date: string) => {
    const response = await axiosClient.get<ApiResponse<{ slots: string[] }>>("/bookings/slots", {
      params: { storeId, date },
    });
    return response.data;
  },
};
