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

  getStoreProducts: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ products: any[] }>>("/stores/modules/products", {
      params: { storeId }
    });
    return response.data;
  },

  getStoreDoctors: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ doctors: any[] }>>("/stores/modules/veterinary/doctors", {
      params: { storeId }
    });
    return response.data;
  },

  getStoreGroomingPackages: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ packages: any[] }>>("/stores/modules/grooming/packages", {
      params: { storeId }
    });
    return response.data;
  },

  getStoreBoardingPackages: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ packages: any[] }>>("/stores/modules/boarding/packages", {
      params: { storeId }
    });
    return response.data;
  },

  getStoreTrainingPrograms: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ programs: any[] }>>("/stores/modules/training/programs", {
      params: { storeId }
    });
    return response.data;
  },

  getStoreEmergency: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ emergencyDetail: any }>>("/stores/modules/emergency", {
      params: { storeId }
    });
    return response.data;
  },

  getStoreReviews: async (storeId: string) => {
    const response = await axiosClient.get<ApiResponse<{ reviews: any[] }>>(`/reviews/store/${storeId}`);
    return response.data;
  },
};
