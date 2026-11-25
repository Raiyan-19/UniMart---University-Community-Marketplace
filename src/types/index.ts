/**
 * UniMart - Core TypeScript Type Definitions
 * Complete Contracts across Frontend and Backend (Parts 01, 02, 03)
 */

export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  universityId: string;
  universityName?: string;
  universityShortName?: string;
  departmentId: string;
  departmentName?: string;
  phone: string;
  avatar?: string;
  bio?: string;
  studentId?: string;       // Populated when role === 'student'
  designation?: string;     // Populated when role === 'teacher'
  currentSemester?: string;
  isEmailVerified: boolean;
  isVerified: boolean;      // Admin verification
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  logo?: string;
  location: string;
  departmentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: string;
}

export type ProductCondition = 'New' | 'Like New' | 'Good Condition' | 'Used';
export type ProductStatus = 'active' | 'sold' | 'inactive' | 'suspended';

export interface Product {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerRole?: UserRole;
  sellerIsVerified?: boolean;
  sellerPhone?: string;
  universityId: string;
  universityShortName?: string;
  departmentId: string;
  departmentName?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  condition: ProductCondition;
  location: string;
  images: string[];
  features?: string[];
  status: ProductStatus;
  views: number;
  saves: number;
  sellerType: 'student' | 'teacher';
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface Offer {
  id: string;
  productId: string;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  buyerId: string;
  buyerName?: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  amount: number;
  message?: string;
  notes?: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  offerId: string;
  productId: string;
  productTitle?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  agreedPrice: number;
  status: 'COMPLETED' | 'CONFIRMED' | 'CANCELLED';
  completedAt: string;
}

export interface Review {
  id: string;
  transactionId?: string;
  productId?: string;
  productTitle?: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  reviewerRole?: string;
  targetUserId?: string;
  targetUserName?: string;
  sellerId?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  content?: string;
  isOffer?: boolean;
  offerAmount?: number;
  image?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle: string;
  productPrice?: number;
  productImage?: string;
  participantIds: string[];
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserRole?: string;
  otherUserUniversity?: string;
  otherUser?: User;
  lastMessage?: string;
  lastMessageAt: string;
  lastMessageTimestamp?: string;
  unreadCount: number;
}

export interface CampusService {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  universityId: string;
  title: string;
  category: string;
  rate: string;
  location: string;
  rating: number;
  reviewsCount: number;
  description: string;
  status: 'active' | 'inactive';
}

export interface GraduationSale {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  universityId: string;
  universityShortName?: string;
  departmentCode: string;
  graduatingTerm: string;
  quote: string;
  itemCount: number;
  featuredProducts: Product[];
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: 'listing' | 'user' | 'service' | 'system' | 'product' | 'content';
  targetId: string;
  targetTitle?: string;
  reason: string;
  details?: string;
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'pending' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  adminNotes?: string;
  createdAt: string;
}

export type NotificationType = 
  | 'message' 
  | 'offer' 
  | 'wishlist' 
  | 'system' 
  | 'listing_approved' 
  | 'review' 
  | 'service';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  timestamp: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  universityId: string;
  departmentId: string;
  phone: string;
  studentId?: string;
  designation?: string;
  currentSemester?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  requiresEmailVerification?: boolean;
  emailSent?: boolean;
  emailDeliveryError?: string;
  emailDeliveryProvider?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalUniversities: number;
  totalDepartments: number;
  pendingVerifications: number;
  activeListings: number;
  completedDeals: number;
  totalOffers: number;
  pendingReports: number;
}

export interface GuideItem {
  id: string;
  category: 'freshers' | 'trade' | 'safety' | 'faq';
  title: string;
  summary: string;
  content: string;
  order?: number;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetTitle?: string;
  details?: string;
  createdAt: string;
}
