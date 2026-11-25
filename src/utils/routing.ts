export interface RouteState {
  view: string;
  category?: string;
  search?: string;
  productId?: string;
}

const VIEW_MAP: Record<string, string> = {
  '': 'home',
  'home': 'home',
  'browse': 'browse',
  'my-listings': 'my-listings',
  'messages': 'messages',
  'saved': 'saved',
  'services': 'services',
  'graduating-sale': 'graduating-sale',
  'help': 'help',
  'guides': 'guides',
  'settings': 'settings',
  'profile': 'settings',
  'admin': 'admin',
};

export const PROTECTED_VIEWS = new Set<string>([
  'messages',
  'my-listings',
  'saved',
  'settings',
  'profile',
  'admin',
]);

/**
 * Checks whether a view requires an authenticated session
 */
export function isProtectedRoute(view: string): boolean {
  return PROTECTED_VIEWS.has(view);
}

/**
 * Parses the current window.location into a route state
 */
export function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { view: 'home', category: 'all' };
  }

  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes
  const segments = pathname ? pathname.split('/') : [];
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get('category') || undefined;
  const searchParam = searchParams.get('q') || searchParams.get('search') || undefined;

  const firstSegment = segments[0] || '';
  const view = VIEW_MAP[firstSegment] || 'home';

  let productId: string | undefined;

  // Check for nested route /browse/product/:id or /product/:id
  if (firstSegment === 'browse' && segments[1] === 'product' && segments[2]) {
    productId = segments[2];
  } else if (firstSegment === 'product' && segments[1]) {
    productId = segments[1];
  }

  return {
    view,
    category: categoryParam || (view === 'browse' ? 'all' : undefined),
    search: searchParam || undefined,
    productId,
  };
}

/**
 * Builds the URL path and search query for a view, category, search query, or product
 */
export function buildRouteUrl(
  view: string,
  category?: string,
  productId?: string,
  search?: string
): string {
  if (view === 'home') {
    return '/';
  }

  if (view === 'browse') {
    if (productId) {
      return `/browse/product/${encodeURIComponent(productId)}`;
    }
    const params = new URLSearchParams();
    if (category && category !== 'all') {
      params.set('category', category);
    }
    if (search && search.trim()) {
      params.set('q', search.trim());
    }
    const query = params.toString();
    return query ? `/browse?${query}` : '/browse';
  }

  return `/${view}`;
}
