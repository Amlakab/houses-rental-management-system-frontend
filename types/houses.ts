export enum PropertyType {
  APARTMENT = "APARTMENT",
  VILLA = "VILLA",
  CONDO = "CONDO",
  HOUSE = "HOUSE",
  LAND = "LAND"
}

export type AllPropertyTypes = PropertyType | string;

export enum TransactionType {
  RENT = "RENT",
  BUY = "BUY",
  SHORT_STAY = "SHORT_STAY"
}

export enum IntendedPurpose {
  LIVING = "LIVING",
  FAMILY = "FAMILY",
  STUDENT = "STUDENT",
  TEMPORARY = "TEMPORARY",
  BUSINESS = "BUSINESS",
  STORAGE_INDUSTRIAL = "STORAGE_INDUSTRIAL",
  RESIDENTIAL_OWNERSHIP = "RESIDENTIAL_OWNERSHIP",
  COMMERCIAL_INVESTMENT = "COMMERCIAL_INVESTMENT",
  DEVELOPMENT = "DEVELOPMENT",
  AGRICULTURE = "AGRICULTURE",
  OTHER = "OTHER"
}

export enum HouseStatus {
  AVAILABLE = "AVAILABLE",
  SOLD = "SOLD",
  RENTED = "RENTED",
  UNAVAILABLE = "UNAVAILABLE",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  UNDER_OFFER = "UNDER_OFFER",
  RESERVED = "RESERVED"
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum VerificationStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
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
  caption?: string;
  roomLabel?: string;
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
  neighborhood?: string;
  landmark?: string;
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
  furnishingStatus?: 'furnished' | 'partially_furnished' | 'unfurnished';
  amenities: string[];
  features: string[];
}

export interface Pricing {
  price: number;
  pricePerSqft: number;
  maintenanceFee: number;
  taxAmount: number;
  securityDeposit: number;
  quantity: number;
}

export interface VirtualTour {
  enabled: boolean;
  url: string;
  embedCode: string;
}

export interface NearbyAmenity {
  name: string;
  type: 'school' | 'hospital' | 'transit' | 'shopping' | 'landmark';
  distanceKm: number;
}

export interface FloorPlanRoom {
  name: string;
  dimensions: string;
  areaSqM: number;
}

export interface House {
  _id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  transactionType?: TransactionType;
  intendedPurpose?: IntendedPurpose;
  status: HouseStatus;
  approvalStatus: ApprovalStatus;
  verificationStatus?: VerificationStatus;
  isVerified?: boolean;
  verificationNotes?: string;
  location: Location;
  details: HouseDetails;
  pricing: Pricing;
  rentalPricing?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    securityDeposit: number;
    advancePayments: number;
    minLeaseDuration: number;
    maxLeaseDuration?: number;
    availableFrom?: string;
    availableTo?: string;
  };
  saleTerms?: {
    askingPrice: number;
    ownershipDocType: string;
    isNegotiable: boolean;
    escrowSupported: boolean;
    downPaymentMin?: number;
  };
  categoryAttributes?: Record<string, any>;
  tags?: string[];
  likes?: string[];
  likesCount?: number;
  images: ImageData[];
  threeDModels: ThreeDModel[];
  virtualTour: VirtualTour;
  videoUrl?: string;
  panoramic360?: {
    enabled: boolean;
    imageUrl?: string;
    caption?: string;
  };
  floorPlan?: {
    url?: string;
    rooms: FloorPlanRoom[];
  };
  nearbyAmenities?: NearbyAmenity[];
  inspectionChecklist?: Array<{
    item: string;
    condition: 'good' | 'fair' | 'needs_repair';
    notes?: string;
  }>;
  agentId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    agencyName?: string;
    isVerified?: boolean;
    profile?: {
      phone: string;
      avatar?: ImageData;
    };
  };
  agentName: string;
  agentContact: string;
  views: number;
  uniqueViews?: number;
  inquiries: number;
  rating?: number;
  numReviews?: number;
  featured?: boolean;
  trendingScore?: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  _id: string;
  houseId: string;
  userId: string;
  userName: string;
  userRole: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedResident: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Appointment {
  _id: string;
  houseId: House | string;
  customerId: any;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  hostId: any;
  visitDate: string;
  timeSlot: string;
  visitType: 'IN_PERSON' | 'VIRTUAL_TOUR';
  numberOfVisitors: number;
  notes?: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED';
  rescheduledDate?: string;
  rescheduledTimeSlot?: string;
  createdAt: string;
}

export interface LeaseAgreement {
  _id: string;
  agreementNumber: string;
  houseId: House | any;
  tenantId: any;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  landlordId: any;
  startDate: string;
  endDate: string;
  rentAmount: number;
  billingFrequency: 'daily' | 'weekly' | 'monthly';
  securityDeposit: number;
  terms: string;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  tenantSignedAt?: string;
  landlordSignedAt?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PENDING_SIGNATURE' | 'RENEWED' | 'TERMINATED' | 'EXPIRED';
  paymentSchedule: Array<{
    installmentNumber: number;
    dueDate: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
    paidAmount?: number;
    paidDate?: string;
    receiptNumber?: string;
    transactionReference?: string;
  }>;
  createdAt: string;
}

export interface PurchaseOffer {
  _id: string;
  houseId: House | any;
  buyerId: any;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  sellerId: any;
  initialOfferAmount: number;
  currentOfferAmount: number;
  askingPriceAtOffer: number;
  earnestDepositAmount: number;
  proposedClosingDate?: string;
  financingType: 'CASH' | 'BANK_MORTGAGE' | 'INSTALLMENT_PLAN' | 'OTHER';
  status: 'INQUIRY' | 'OFFER_SUBMITTED' | 'UNDER_NEGOTIATION' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'COMPLETED_SALE';
  contingencies: string[];
  negotiationTimeline: Array<{
    senderId: any;
    senderRole: 'buyer' | 'seller' | 'agent';
    proposedAmount: number;
    message: string;
    timestamp: string;
  }>;
  milestones: Array<{
    _id?: string;
    title: string;
    amount: number;
    percentage: number;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'VERIFIED';
    paidAt?: string;
    transactionReference?: string;
  }>;
  createdAt: string;
}

export interface MaintenanceRequest {
  _id: string;
  houseId: House | any;
  tenantId: any;
  tenantName: string;
  tenantPhone: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  title: string;
  description: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTechnician?: string;
  technicianContact?: string;
  estimatedCost?: number;
  resolutionNotes?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SavedSearch {
  _id: string;
  name: string;
  filters: any;
  frequency: string;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface OrderDetails {
  visitDate?: string;
  visitTime?: string;
  numberOfPeople?: number;
  specialRequests?: string;
  preferredContactMethod: string[];
  quantity: number;
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

export interface ListingReport {
  _id: string;
  houseId: House | any;
  reporterId?: any;
  reporterEmail: string;
  reason: string;
  description: string;
  evidenceUrl?: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  createdAt: string;
}

export interface RentalApplication {
  _id: string;
  houseId: House | any;
  userId?: any;
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  monthlyIncome: number;
  numberOfOccupants: number;
  preferredMoveInDate: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNotes?: string;
  created_at: string;
  updated_at: string;
}