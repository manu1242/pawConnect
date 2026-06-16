import { axiosClient } from "../axios/axiosClient";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await axiosClient.get("/auth/notifications");
    return res.data?.data?.notifications || [];
  },

  markAllAsRead: async (): Promise<boolean> => {
    const res = await axiosClient.put("/auth/notifications/read-all");
    return res.data?.success || false;
  },
};
