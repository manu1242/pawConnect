import { axiosClient } from "../axios/axiosClient";
import { ApiResponse, Feedback } from "../../types";

export const uploadApi = {
  uploadSingleImage: async (imageUri: string, folder: string = "general") => {
    const formData = new FormData();
    const uriParts = imageUri.split(".");
    const fileType = uriParts[uriParts.length - 1];

    formData.append("image", {
      uri: imageUri,
      name: `upload.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    formData.append("folder", folder);

    const response = await axiosClient.post<ApiResponse<{ url: string }>>(
      "/uploads/single",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
