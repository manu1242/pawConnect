export type UserRole = "user" | "manager";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  role: UserRole;
  profileImage?: string;
  notificationPreferences?: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    offersEnabled: boolean;
  };
}

export interface Pet {
  id: string;
  name: string;
  petType: "Dog" | "Cat" | string;
  breed: string;
  age: string;
  weight: string;
  gender: "Male" | "Female" | string;
  photo?: string;
  photos?: string[];
  vaccinated: boolean;
  vaccinationRecords?: string[];
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  temperament?: string;
  trainingStatus?: string;
  specialInstructions?: string;
  microchipNumber?: string;
  status: "Active" | "Inactive";
}

export interface BusinessHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Address {
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  area?: string;
}

export interface StoreService {
  name: string;
  price: number;
  duration?: number;
  description?: string;
}

export interface Store {
  id: string;
  _id?: any;
  ownerId?: any;
  ownerDetails?: {
    name: string;
    fullName?: string;
    email: string;
    phone: string;
    profilePhoto?: string;
  };
  storeDetails?: {
    name?: string;
    description?: string;
    category?: string;
    images?: string[];
    logo?: string;
  };
  name: string;
  description: string;
  logo?: string;
  logoImage?: string;
  bannerImage?: string;
  banner?: string;
  gallery?: string[];
  address: string | Address;
  addressDetails?: {
    city?: string;
    area?: string;
    country?: string;
    state?: string;
    pincode?: string;
  };
  services: StoreService[];
  storeTypes?: string[];
  paymentMethods: string[];
  facilities: string[];
  bookingMode: string;
  maxBookingsPerDay: number;
  maxHomeVisitsPerDay?: number;
  is24x7: boolean;
  emergencyContact?: string;
  emergencyCharges?: number;
  status: string;
  rating?: number;
  totalReviews?: number;
  totalBookings?: number;
  isFeatured?: boolean;
  isVerified?: boolean;
}

export interface CustomerLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface Booking {
  id: string;
  storeId: string;
  storeName?: string;
  serviceName: string;
  serviceId?: string;
  serviceMode?: string;
  petDetails: Partial<Pet>;
  date: string;
  timeSlot: string;
  price: number;
  paymentMethod: string;
  customerLocation: CustomerLocation;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt?: string;
}

export interface Review {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Feedback {
  type: "bug" | "suggestion" | "other";
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
