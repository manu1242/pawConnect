import { axiosClient } from "../axios/axiosClient";
import { ApiResponse } from "../../types";

export interface PromoCode {
  _id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  startDate: string;
  endDate?: string;
  usageLimit?: number;
  usedCount: number;
  bannerImage?: string;
  displayOnHome: boolean;
  active: boolean;
  storeId?: {
    _id: string;
    name: string;
  };
}

export const promoApi = {
  getPublicPromos: async () => {
    const response = await axiosClient.get<ApiResponse<{ promos: PromoCode[] }>>("/promos/public");
    return response.data;
  },

  validatePromo: async (code: string, orderValue: number, storeId?: string) => {
    const response = await axiosClient.get<ApiResponse<{
      code: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      discountAmount: number;
      title: string;
      description: string;
    }>>(`/promos/validate/${code}`, {
      params: { orderValue, storeId }
    });
    return response.data;
  }
};
