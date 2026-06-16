import { axiosClient } from "../axios/axiosClient";
import { Pet, ApiResponse } from "../../types";

export const petApi = {
  listPets: async () => {
    const response = await axiosClient.get<ApiResponse<{ pets: Pet[] }>>("/pets");
    return response.data;
  },

  createPet: async (payload: Partial<Pet>) => {
    const response = await axiosClient.post<ApiResponse<{ pet: Pet }>>("/pets", payload);
    return response.data;
  },

  getPet: async (petId: string) => {
    const response = await axiosClient.get<ApiResponse<{ pet: Pet }>>(`/pets/${petId}`);
    return response.data;
  },

  updatePet: async (petId: string, payload: Partial<Pet>) => {
    const response = await axiosClient.put<ApiResponse<{ pet: Pet }>>(`/pets/${petId}`, payload);
    return response.data;
  },

  deletePet: async (petId: string) => {
    const response = await axiosClient.delete<ApiResponse<any>>(`/pets/${petId}`);
    return response.data;
  },
};
