import { UserRole } from '../types';

export type AppAction =
  | 'browse_listings'
  | 'search_products'
  | 'view_product_details'
  | 'create_listing'
  | 'edit_own_listing'
  | 'delete_own_listing'
  | 'make_offer'
  | 'accept_offer'
  | 'add_to_wishlist'
  | 'chat_with_users'
  | 'manage_users'
  | 'verify_user'
  | 'ban_user'
  | 'manage_universities'
  | 'manage_departments'
  | 'view_admin_analytics'
  | 'moderate_listings';

const ROLE_PERMISSIONS: Record<UserRole, AppAction[]> = {
  student: [
    'browse_listings',
    'search_products',
    'view_product_details',
    'create_listing',
    'edit_own_listing',
    'delete_own_listing',
    'make_offer',
    'accept_offer',
    'add_to_wishlist',
    'chat_with_users',
  ],
  teacher: [
    'browse_listings',
    'search_products',
    'view_product_details',
    'create_listing',
    'edit_own_listing',
    'delete_own_listing',
    'make_offer',
    'accept_offer',
    'add_to_wishlist',
    'chat_with_users',
  ],
  admin: [
    'browse_listings',
    'search_products',
    'view_product_details',
    'create_listing',
    'edit_own_listing',
    'delete_own_listing',
    'make_offer',
    'accept_offer',
    'add_to_wishlist',
    'chat_with_users',
    'manage_users',
    'verify_user',
    'ban_user',
    'manage_universities',
    'manage_departments',
    'view_admin_analytics',
    'moderate_listings',
  ],
};

export function canPerform(role: UserRole | undefined, action: AppAction): boolean {
  if (!role) {
    // Unauthenticated visitors can only browse and search
    return ['browse_listings', 'search_products', 'view_product_details'].includes(action);
  }
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function isAdmin(role?: UserRole): boolean {
  return role === 'admin';
}

export function isTeacher(role?: UserRole): boolean {
  return role === 'teacher';
}

export function isStudent(role?: UserRole): boolean {
  return role === 'student';
}
