/**
 * UniMart - Database Schemas and Relationships
 * Designed to reflect MongoDB Atlas / Mongoose schema structure and UML class diagram
 */

export interface IUserDocument {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'student' | 'teacher' | 'admin';
  universityId: string;
  departmentId: string;
  phone: string;
  avatar: string;
  bio: string;
  studentId?: string;       // Required if student
  designation?: string;     // Required if teacher
  currentSemester?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  isVerified: boolean;      // Admin verification
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface IUniversityDocument {
  _id: string;
  name: string;
  shortName: string;
  domain: string;
  location: string;
  logo: string;
  departmentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IDepartmentDocument {
  _id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationDocument {
  _id: string;
  userId: string;
  type: 'message' | 'offer' | 'wishlist' | 'system' | 'listing_approved' | 'review' | 'service';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  avatar?: string;
  createdAt: string;
}

export interface IProductDocument {
  _id: string;
  sellerId: string;
  universityId: string;
  departmentId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  condition: 'New' | 'Like New' | 'Good Condition' | 'Used';
  location: string;
  images: string[];
  features?: string[];
  status: 'active' | 'sold' | 'inactive' | 'suspended';
  views: number;
  saves: number;
  sellerType: 'student' | 'teacher';
  createdAt: string;
  updatedAt: string;
}

export interface IWishlistDocument {
  _id: string;
  userId: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IOfferDocument {
  _id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  message?: string;
  notes?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface ITransactionDocument {
  _id: string;
  offerId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  agreedPrice: number;
  status: 'COMPLETED' | 'CONFIRMED' | 'CANCELLED';
  completedAt: string;
}

export interface IReviewDocument {
  _id: string;
  transactionId?: string;
  productId?: string;
  reviewerId: string;
  sellerId?: string;
  targetUserId?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IMessageDocument {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content?: string;
  text?: string;
  isOffer?: boolean;
  offerAmount?: number;
  image?: string;
  isRead?: boolean;
  createdAt: string;
}

export interface IConversationDocument {
  _id: string;
  productId: string;
  participantIds: string[]; // [buyerId, sellerId]
  lastMessage?: string;
  lastMessageTimestamp?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  unreadCountByUser?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface IReportDocument {
  _id: string;
  reporterId: string;
  targetType: 'listing' | 'user' | 'service' | 'system' | 'product' | 'content';
  targetId: string;
  reason: string;
  description?: string;
  details?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'pending' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IServiceDocument {
  _id: string;
  providerId: string;
  universityId: string;
  title: string;
  category: string;
  rate: string; // e.g. "৳ 300", "৳ 500/hour"
  location: string;
  rating: number;
  reviewsCount: number;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface IGraduationSaleDocument {
  _id: string;
  studentId: string;
  universityId: string;
  departmentCode: string;
  graduatingTerm: string;
  quote: string;
  itemCount: number;
  featuredProductIds: string[];
  createdAt: string;
}

export interface IGuideDocument {
  _id: string;
  category: 'freshers' | 'trade' | 'safety' | 'faq';
  title: string;
  summary: string;
  content: string;
  order: number;
  updatedAt: string;
}

export interface IAuditLogDocument {
  _id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetTitle?: string;
  details?: string;
  createdAt: string;
}
