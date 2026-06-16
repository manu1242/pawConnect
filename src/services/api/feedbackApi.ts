import { axiosClient } from "../axios/axiosClient";
import { ApiResponse, Feedback } from "../../types";

export const feedbackApi = {
  submitFeedback: async (feedback: Feedback) => {
    const response = await axiosClient.post<ApiResponse<any>>("/auth/feedback", feedback);
    return response.data;
  },
};
