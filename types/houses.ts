export enum PropertyType {
  APARTMENT = "APARTMENT",
  VILLA = "VILLA",
  CONDO = "CONDO",
  HOUSE = "HOUSE",
  LAND = "LAND"
}

export enum HouseStatus {
  AVAILABLE = "AVAILABLE",
  SOLD = "SOLD",
  RENTED = "RENTED",
  UNAVAILABLE = "UNAVAILABLE",
  PENDING_APPROVAL = "PENDING_APPROVAL"
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum OrderType {
  PURCHASE = "PURCHASE",
  RENT = "RENT",
  INQUIRY = "INQUIRY",
  APPLICATION = "APPLICATION"
}

export enum OrderStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum SenderType {
  CUSTOMER = "CUSTOMER",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN"
}

export interface ImageData {
  data?: string;
  contentType: string;
  fileName: string;
  isPrimary?: boolean;
}

export interface ThreeDModel {
  data?: string;
  contentType: string;
  fileName: string;
  isDefault?: boolean;
  thumbnail?: string;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface HouseDetails {
  bedrooms: number;
  bathrooms: number;
  area: number;
  lotSize: number;
  yearBuilt: number;
  floors: number;
  parkingSpaces: number;
  furnished: boolean;
  amenities: string[];
  features: string[];
}

export interface Pricing {
  price: number;
  pricePerSqft: number;
  maintenanceFee: number;
  taxAmount: number;
  securityDeposit: number;
  quantity: number;  // ADD THIS LINE

}

export interface VirtualTour {
  enabled: boolean;
  url: string;
  embedCode: string;
}

export interface House {
  _id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  status: HouseStatus;
  approvalStatus: ApprovalStatus;
  location: Location;
  details: HouseDetails;
  pricing: Pricing;
  images: ImageData[];
  threeDModels: ThreeDModel[];
  virtualTour: VirtualTour;
  agentId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      phone: string;
      avatar?: ImageData;
    };
  };
  agentName: string;
  agentContact: string;
  views: number;
  inquiries: number;
  created_at: string;
  updated_at: string;
}

export interface OrderDetails {
  visitDate?: string;
  visitTime?: string;
  numberOfPeople?: number;
  specialRequests?: string;
  preferredContactMethod: string[];
  quantity: number; // ADD THIS LINE
}

export interface Order {
  _id: string;
  houseId: House | string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      phone: string;
      avatar?: ImageData;
    };
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: OrderType;
  details: OrderDetails;
  status: OrderStatus;
  timeline: Array<{
    status: OrderStatus;
    timestamp: string;
    comment: string;
    updatedBy: {
      _id: string;
      name: string;
      email: string;
    };
  }>;
  totalAmount: number;
  paymentStatus: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  _id: string;
  orderId: string;
  houseId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: ImageData;
    };
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
  };
  senderType: SenderType;
  content: string;
  attachments: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  isRead: boolean;
  readAt?: string;
  created_at: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: ImageData;
    };
  }>;
  orderId: Order;
  houseId: House;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface HouseStats {
  totalHouses: number;
  availableHouses: number;
  soldHouses: number;
  rentedHouses: number;
  pendingApproval: number;
  totalViews: number;
  propertyTypeStats: Array<{ _id: string; count: number; avgPrice: number }>;
  priceStats: { minPrice: number; maxPrice: number; avgPrice: number};
  topViewedHouses: Array<{ _id: string; title: string; views: number; price: number; propertyType: string; city: string }>;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  underReviewOrders: number;
  approvedOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  ordersByType: Array<{ _id: string; count: number }>;
  recentOrders: Order[];
}