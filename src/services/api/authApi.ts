import { axiosClient } from "../axios/axiosClient";
import { User, ApiResponse } from "../../types";

export const authApi = {
  login: async (payload: any) => {
    const response = await axiosClient.post<ApiResponse<{ accessToken: string; user: User }>>(
      "/auth/login",
      payload
    );
    return response.data;
  },

  register: async (payload: any) => {
    const response = await axiosClient.post<ApiResponse<any>>(
      "/auth/register",
      payload
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get<ApiResponse<{ user: User }>>("/auth/profile");
    return response.data;
  },

  updateProfile: async (payload: Partial<User>) => {
    const response = await axiosClient.put<ApiResponse<{ user: User }>>("/auth/profile", payload);
    return response.data;
  },

  changePassword: async (payload: any) => {
    const response = await axiosClient.put<ApiResponse<any>>("/auth/change-password", payload);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await axiosClient.post<ApiResponse<any>>("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (payload: any) => {
    const response = await axiosClient.post<ApiResponse<any>>("/auth/reset-password", payload);
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post<ApiResponse<any>>("/auth/logout", {});
    return response.data;
  },

  submitFeedback: async (payload: { type: "bug" | "suggestion" | "other"; message: string }) => {
    const response = await axiosClient.post<ApiResponse<any>>("/auth/feedback", payload);
    return response.data;
  },
};
