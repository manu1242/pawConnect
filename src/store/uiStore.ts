import { create } from "zustand";

interface ToastState {
  message: string | null;
  type: "success" | "error" | "info" | null;
}

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "destructive" | "cancel";
}

export interface AlertState {
  title: string | null;
  message: string | null;
  buttons: AlertButton[] | null;
}

interface UiState {
  toast: ToastState;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  hideToast: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  activeModal: string | null;
  modalData: any;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  alert: AlertState;
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toast: { message: null, type: null },
  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((state) => {
        if (state.toast.message === message) {
          return { toast: { message: null, type: null } };
        }
        return {};
      });
    }, 4000);
  },
  hideToast: () => set({ toast: { message: null, type: null } }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  activeModal: null,
  modalData: null,
  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  alert: { title: null, message: null, buttons: null },
  showAlert: (title, message, buttons) => set({ alert: { title, message, buttons: buttons || null } }),
  hideAlert: () => set({ alert: { title: null, message: null, buttons: null } }),
}));
