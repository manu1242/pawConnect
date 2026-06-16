export interface OwnerDetails {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  profilePhoto: string;
  dateOfBirth: string;
}

export interface StoreDetails {
  name: string;
  description: string;
  logo: string;
  bannerImage: string;
  gallery: string[];
  yearsOfExperience: string;
  numberOfEmployees: string;
  businessRegNumber: string;
  gstNumber: string;
}

export interface AddressDetails {
  shopNumber: string;
  buildingName: string;
  streetName: string;
  landmark: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  photo: string;
  suitableFor: string[];
  active: boolean;
}

export interface BusinessHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface StoreFormData {
  ownerDetails: OwnerDetails;
  storeDetails: StoreDetails;
  address: AddressDetails;
  storeTypes: string[];
  services: ServiceItem[];
  sellsProducts: boolean;
  productCategories: string[];
  sellsPets: boolean;
  petSaleTypes: string[];
  serviceMode: string;
  homePickup: boolean;
  homeDelivery: boolean;
  emergencyHomeVisit: boolean;
  serviceRadius: number;
  businessHours: BusinessHour[];
  paymentMethods: string[];
  facilities: string[];
  documents: {
    govtIdProof: string;
    storePhoto: string;
    ownerSelfie: string;
    businessLicense: string;
    gstCertificate: string;
    veterinaryLicense: string;
    trainingCertification: string;
  };
  socialLinks: {
    website: string;
    instagram: string;
    facebook: string;
    youtube: string;
    whatsappBusiness: string;
  };
  bookingMode: string;
  maxBookingsPerDay: string;
  maxHomeVisitsPerDay: string;
  is24x7: boolean;
  emergencyContact: string;
  emergencyCharges: string;
}

export const INITIAL_FORM_DATA: StoreFormData = {
  ownerDetails: { name: "", email: "", phone: "", alternatePhone: "", profilePhoto: "", dateOfBirth: "" },
  storeDetails: { name: "", description: "", logo: "", bannerImage: "", gallery: [], yearsOfExperience: "", numberOfEmployees: "", businessRegNumber: "", gstNumber: "" },
  address: { shopNumber: "", buildingName: "", streetName: "", landmark: "", area: "", city: "", district: "", state: "", country: "India", pincode: "", latitude: null, longitude: null },
  storeTypes: [],
  services: [],
  sellsProducts: false,
  productCategories: [],
  sellsPets: false,
  petSaleTypes: [],
  serviceMode: "Store Service Only",
  homePickup: false,
  homeDelivery: false,
  emergencyHomeVisit: false,
  serviceRadius: 10,
  businessHours: [
    { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "18:00" },
    { day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "16:00" },
    { day: "Sunday", isOpen: false, openTime: "10:00", closeTime: "14:00" },
  ],
  paymentMethods: ["Cash", "UPI"],
  facilities: [],
  documents: { govtIdProof: "", storePhoto: "", ownerSelfie: "", businessLicense: "", gstCertificate: "", veterinaryLicense: "", trainingCertification: "" },
  socialLinks: { website: "", instagram: "", facebook: "", youtube: "", whatsappBusiness: "" },
  bookingMode: "Both",
  maxBookingsPerDay: "20",
  maxHomeVisitsPerDay: "5",
  is24x7: false,
  emergencyContact: "",
  emergencyCharges: "0",
};

export const STORE_CATEGORIES = [
  "Pet Grooming", "Veterinary Clinic", "Pet Boarding", "Pet Day Care",
  "Pet Training", "Pet Walking", "Pet Sitting", "Pet Taxi",
  "Pet Adoption Center", "Pet Photography", "Emergency Pet Care",
  "Pet Insurance Partner", "Pet Cremation Services", "Multi-Service Pet Center",
];

export const PRODUCT_CATEGORIES = [
  "Pet Food", "Pet Toys", "Pet Medicines", "Pet Accessories", "Pet Beds",
  "Pet Clothing", "Pet Cages", "Grooming Products", "Health Supplements", "Pet Hygiene Products",
];

export const PET_TYPES = ["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Hamsters", "Exotic Pets"];
export const SERVICE_MODES = ["Store Service Only", "Home Service Only", "Both Store & Home Service"];
export const SERVICE_RADII = [5, 10, 20, 50];
export const PAYMENT_METHODS = ["Cash", "UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet Payments"];
export const FACILITIES = [
  "Parking Available", "Air Conditioned", "Waiting Area", "CCTV Security",
  "Pet Play Area", "Wheelchair Accessible", "Pet Friendly Environment",
  "Drinking Water", "Emergency Support",
];
export const PET_SUITABLE = ["Dogs", "Cats", "Birds", "Rabbits", "All Pets"];
export const BOOKING_MODES = ["Walk-ins Allowed", "Appointment Required", "Both"];
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Puducherry", "Chandigarh",
];
