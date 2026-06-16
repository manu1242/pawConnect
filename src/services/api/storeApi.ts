import { axiosClient } from "../axios/axiosClient";
import { Store, ApiResponse } from "../../types";

export const storeApi = {
  getStoreStatus: async () => {
    const response = await axiosClient.get<ApiResponse<{ store: Store }>>("/stores");
    return response.data;
  },

  registerStore: async (payload: any) => {
    const response = await axiosClient.post<ApiResponse<{ store: Store }>>("/stores", payload);
    return response.data;
  },

  editStore: async (payload: Partial<Store>) => {
    const response = await axiosClient.patch<ApiResponse<{ store: Store }>>("/stores", payload);
    return response.data;
  },

  updateSchedule: async (payload: { availableDays: string[]; availableTimes: string[] }) => {
    const response = await axiosClient.patch<ApiResponse<any>>("/stores/schedule", payload);
    return response.data;
  },

  listPublicStores: async () => {
    const response = await axiosClient.get<ApiResponse<{ stores: Store[] }>>("/stores/public");
    return response.data;
  },

  getPublicStoreDetails: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ store: Store }>>(`/stores/public/${storeId}`);
    return response.data;
  },

  getStoreDashboard: async () => {
    const response = await axiosClient.get<ApiResponse<any>>("/stores/dashboard");
    return response.data;
  },
};
