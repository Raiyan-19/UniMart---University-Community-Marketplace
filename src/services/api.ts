import {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  User,
  University,
  Department,
  Notification,
  AdminStats,
  Product,
  Offer,
  Conversation,
  ChatMessage,
  Review,
  ReportItem,
  CampusService,
  GraduationSale,
  GuideItem,
  AuditLogItem,
} from '../types';

const TOKEN_KEY = 'unimart_auth_token';
const ACTIVE_USER_ID_KEY = 'unimart_active_user_id';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACTIVE_USER_ID_KEY);
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ACTIVE_USER_ID_KEY);
  } catch {}
}

export function setStoredToken(token: string | null, userId?: string) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    if (userId) localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
  } else {
    clearStoredAuth();
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const userId = localStorage.getItem(ACTIVE_USER_ID_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: 'Failed to parse server response',
  }));

  if (!response.ok) {
    if (
      response.status === 401 &&
      !endpoint.includes('/api/auth/login') &&
      !endpoint.includes('/api/auth/register')
    ) {
      clearStoredAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unimart:unauthorized'));
      }
    }
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }

  return data as T;
}

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: RegisterPayload) =>
    request<AuthResponse & { otpPreview?: string; emailSent?: boolean; emailDeliveryError?: string; emailDeliveryProvider?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (code: string, userId?: string, email?: string) =>
    request<AuthResponse & ApiResponse<{ user: User }>>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code, userId, email }),
    }),

  resendCode: (email?: string, userId?: string) =>
    request<ApiResponse<{ otpPreview?: string }> & { otpPreview?: string; emailSent?: boolean; emailDeliveryProvider?: string }>('/api/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email, userId }),
    }),

  getEmailStatus: () =>
    request<ApiResponse<{ provider: string; configured: boolean; senderAddress: string }>>('/api/auth/email-status'),

  getMe: () =>
    request<AuthResponse & ApiResponse<{ user: User }>>('/api/auth/me'),

  logout: () =>
    request<ApiResponse>('/api/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<ApiResponse<{ resetTokenPreview?: string }>>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<ApiResponse>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
};

// University & Department API
export const universityApi = {
  getAll: () =>
    request<ApiResponse<University[]>>('/api/universities'),

  getById: (id: string) =>
    request<ApiResponse<University & { departments: Department[] }>>(`/api/universities/${id}`),

  getDepartments: (universityId?: string) =>
    request<ApiResponse<Department[]>>(`/api/universities/meta/departments${universityId ? `?universityId=${universityId}` : ''}`),

  createUniversity: (payload: { name: string; shortName: string; domain: string; location?: string; logo?: string }) =>
    request<ApiResponse<University>>('/api/universities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUniversity: (id: string, payload: Partial<University>) =>
    request<ApiResponse<University>>(`/api/universities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteUniversity: (id: string) =>
    request<ApiResponse>(`/api/universities/${id}`, {
      method: 'DELETE',
    }),

  createDepartment: (payload: { name: string; code: string; universityId: string }) =>
    request<ApiResponse<Department>>('/api/universities/departments/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDepartment: (id: string, payload: { name?: string; code?: string }) =>
    request<ApiResponse<Department>>(`/api/universities/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteDepartment: (id: string) =>
    request<ApiResponse>(`/api/universities/departments/${id}`, {
      method: 'DELETE',
    }),
};

// User Profile API
export const userApi = {
  getProfile: () =>
    request<ApiResponse<User>>('/api/users/profile'),

  updateProfile: (payload: Partial<User>) =>
    request<ApiResponse<User>>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<ApiResponse>('/api/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getPublicProfile: (id: string) =>
    request<ApiResponse<User>>(`/api/users/${id}`),
};

// Admin API
export const adminApi = {
  getAllUsers: (params?: { search?: string; role?: string; universityId?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    if (params?.universityId) q.append('universityId', params.universityId);
    return request<ApiResponse<User[]> & { total: number }>(`/api/admin/users?${q.toString()}`);
  },

  toggleVerify: (id: string) =>
    request<ApiResponse<User>>(`/api/admin/users/${id}/verify`, { method: 'PUT' }),

  updateStatus: (id: string, status: 'active' | 'suspended') =>
    request<ApiResponse<User>>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateRole: (id: string, role: 'student' | 'teacher' | 'admin') =>
    request<ApiResponse<User>>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  getStats: () =>
    request<ApiResponse<AdminStats>>('/api/admin/stats'),

  getServiceCategories: () =>
    request<ApiResponse<string[]>>('/api/products/service-categories'),

  addServiceCategory: (name: string) =>
    request<ApiResponse<string[]>>('/api/admin/service-categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteServiceCategory: (name: string) =>
    request<ApiResponse<string[]>>(`/api/admin/service-categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  bulkVerifyUsers: (userIds: string[], verify = true) =>
    request<ApiResponse<User[]> & { count: number }>('/api/admin/users/bulk-verify', {
      method: 'POST',
      body: JSON.stringify({ userIds, verify }),
    }),

  getAllListings: (params?: { search?: string; status?: string; universityId?: string; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.universityId) q.append('universityId', params.universityId);
    if (params?.category) q.append('category', params.category);
    return request<ApiResponse<Product[]> & { total: number }>(`/api/admin/listings?${q.toString()}`);
  },

  updateListingStatus: (id: string, status: 'active' | 'suspended' | 'sold', reason?: string) =>
    request<ApiResponse<Product>>(`/api/admin/listings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),

  deleteListing: (id: string) =>
    request<ApiResponse>(`/api/admin/listings/${id}`, {
      method: 'DELETE',
    }),

  getAuditLogs: () =>
    request<ApiResponse<AuditLogItem[]>>('/api/admin/audit-logs'),
};

// Notification API
export const notificationApi = {
  getAll: () =>
    request<ApiResponse<Notification[]> & { unreadCount: number }>('/api/notifications'),

  markAsRead: (id: string) =>
    request<ApiResponse>(`/api/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: () =>
    request<ApiResponse<{ count: number }>>('/api/notifications/read-all', { method: 'POST' }),
};

// Products & Marketplace API
export const productsApi = {
  getAll: (params?: {
    search?: string;
    category?: string;
    universityId?: string;
    departmentId?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerType?: string;
    status?: string;
    sort?: string;
  }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          q.append(key, String(val));
        }
      });
    }
    return request<ApiResponse<Product[]> & { total: number }>(`/api/products?${q.toString()}`);
  },

  getById: (id: string) =>
    request<ApiResponse<Product>>(`/api/products/${id}`),

  create: (payload: {
    title: string;
    description: string;
    category: string;
    price: number;
    originalPrice?: number;
    condition: string;
    location: string;
    images?: string[];
    features?: string[];
    sellerType?: string;
  }) =>
    request<ApiResponse<Product>>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Product>) =>
    request<ApiResponse<Product>>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<ApiResponse>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  toggleWishlist: (productId: string) =>
    request<ApiResponse<{ isSaved: boolean; saves: number }>>(`/api/products/${productId}/wishlist`, {
      method: 'POST',
    }),

  getWishlist: () =>
    request<ApiResponse<Product[]>>('/api/products/wishlist'),

  getMyListings: (status?: string) =>
    request<
      ApiResponse<{
        products: Product[];
        stats: { total: number; active: number; sold: number; inactive: number; totalViews: number };
      }>
    >(`/api/products/my-listings${status ? `?status=${status}` : ''}`),

  getServices: (params?: { category?: string; universityId?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.universityId) query.append('universityId', params.universityId);
    const qs = query.toString();
    return request<ApiResponse<CampusService[]>>(`/api/products/services${qs ? `?${qs}` : ''}`);
  },

  createService: (payload: {
    title: string;
    category: string;
    rate: string;
    location: string;
    description: string;
  }) =>
    request<ApiResponse<CampusService>>('/api/products/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGraduationSales: (params?: { universityId?: string }) => {
    const query = new URLSearchParams();
    if (params?.universityId) query.append('universityId', params.universityId);
    const qs = query.toString();
    return request<ApiResponse<GraduationSale[]>>(`/api/products/graduation-sales${qs ? `?${qs}` : ''}`);
  },

  createGraduationSale: (payload: {
    graduatingTerm: string;
    quote: string;
    featuredProductIds?: string[];
  }) =>
    request<ApiResponse<GraduationSale>>('/api/products/graduation-sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateGraduationSale: (
    id: string,
    payload: {
      graduatingTerm?: string;
      quote?: string;
      featuredProductIds?: string[];
    }
  ) =>
    request<ApiResponse<GraduationSale>>(`/api/products/graduation-sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteGraduationSale: (id: string) =>
    request<ApiResponse<{ success: boolean }>>(`/api/products/graduation-sales/${id}`, {
      method: 'DELETE',
    }),

  getServiceCategories: () =>
    request<ApiResponse<string[]>>('/api/products/service-categories'),
};

// Offers API
export const offersApi = {
  getUserOffers: (type?: 'all' | 'sent' | 'received') =>
    request<ApiResponse<Offer[]>>(`/api/offers${type ? `?type=${type}` : ''}`),

  createOffer: (payload: { productId: string; amount: number; notes?: string }) =>
    request<ApiResponse<Offer>>('/api/offers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  acceptOffer: (id: string) =>
    request<ApiResponse<Offer>>(`/api/offers/${id}/accept`, {
      method: 'PUT',
    }),

  rejectOffer: (id: string) =>
    request<ApiResponse<Offer>>(`/api/offers/${id}/reject`, {
      method: 'PUT',
    }),

  cancelOffer: (id: string) =>
    request<ApiResponse<Offer>>(`/api/offers/${id}/cancel`, {
      method: 'PUT',
    }),
};

// Chat & Negotiation API
export const chatApi = {
  getConversations: () =>
    request<ApiResponse<Conversation[]>>('/api/chat/conversations'),

  getMessages: (conversationId: string) =>
    request<ApiResponse<ChatMessage[]>>(`/api/chat/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, text: string) =>
    request<ApiResponse<ChatMessage>>(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  startConversation: (productId: string, initialMessage?: string) =>
    request<ApiResponse<Conversation>>('/api/chat/start', {
      method: 'POST',
      body: JSON.stringify({ productId, initialMessage }),
    }),
};

// Reviews API
export const reviewsApi = {
  getReviews: (targetUserId?: string) =>
    request<ApiResponse<Review[]>>(`/api/reviews${targetUserId ? `?targetUserId=${targetUserId}` : ''}`),

  createReview: (payload: {
    targetUserId: string;
    transactionId?: string;
    productId?: string;
    rating: number;
    comment: string;
  }) =>
    request<ApiResponse<Review>>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Upload API
export const uploadApi = {
  uploadImage: (payload: { data: string; filename?: string; mimeType?: string }) =>
    request<ApiResponse & { url: string; filename: string; size: number; mimeType: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Support & Moderation Reports API
export const reportsApi = {
  createReport: (payload: {
    targetType: 'listing' | 'user' | 'service' | 'system';
    targetId?: string;
    reason: string;
    details?: string;
  }) =>
    request<ApiResponse<ReportItem>>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminReports: () =>
    request<ApiResponse<ReportItem[]>>('/api/reports/admin'),

  resolveReport: (id: string, status: 'RESOLVED' | 'DISMISSED', resolutionNotes?: string) =>
    request<ApiResponse<ReportItem>>(`/api/reports/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionNotes }),
    }),
};

// Guides API
export const guidesApi = {
  getAll: () =>
    request<ApiResponse<GuideItem[]>>('/api/products/guides'),

  create: (payload: { category: string; title: string; summary: string; content: string; order?: number }) =>
    request<ApiResponse<GuideItem>>('/api/admin/guides', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<GuideItem>) =>
    request<ApiResponse<GuideItem>>(`/api/admin/guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<ApiResponse>(`/api/admin/guides/${id}`, {
      method: 'DELETE',
    }),
};

