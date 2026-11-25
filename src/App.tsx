/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { UniversityProvider } from './context/UniversityContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { HomeDashboard } from './components/home/HomeDashboard';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BrowseMarketplaceView } from './components/marketplace/BrowseMarketplaceView';
import { MyListingsView } from './components/marketplace/MyListingsView';
import { SavedItemsView } from './components/marketplace/SavedItemsView';
import { MessagesChatView } from './components/chat/MessagesChatView';
import { ServicesView } from './components/services/ServicesView';
import { GraduatingSaleView } from './components/graduating/GraduatingSaleView';
import { HelpSupportView } from './components/support/HelpSupportView';
import { GuidesView } from './components/views/Placeholders';
import { ProductDetailsModal } from './components/marketplace/ProductDetailsModal';
import { MakeOfferModal } from './components/marketplace/MakeOfferModal';
import { CreateListingModal } from './components/marketplace/CreateListingModal';
import { ReportProblemModal } from './components/support/ReportProblemModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Product } from './types';
import { productsApi, notificationApi } from './services/api';
import { parseCurrentRoute, buildRouteUrl, isProtectedRoute } from './utils/routing';

function MainLayout() {
  const { user, requiresEmailVerification, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const initialRoute = parseCurrentRoute();
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [searchQuery, setSearchQuery] = useState<string>(initialRoute.search || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Sync initial unread notifications count from backend
  useEffect(() => {
    if (isAuthenticated) {
      notificationApi
        .getAll()
        .then((res) => {
          if (res.success && res.data) {
            const count = res.data.filter((n) => !n.isRead).length;
            setUnreadCount(count);
          }
        })
        .catch(() => {});
    } else {
      setUnreadCount(0);
      setIsNotificationsOpen(false);
    }
  }, [isAuthenticated, user?.id]);

  // Marketplace Interactive State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForOffer, setProductForOffer] = useState<Product | null>(null);
  const [productForReport, setProductForReport] = useState<Product | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isCreateListingOpen, setIsCreateListingOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(initialRoute.category || 'all');

  const mainContentRef = React.useRef<HTMLElement>(null);

  // Load product if direct URL access has productId
  useEffect(() => {
    if (initialRoute.productId) {
      productsApi
        .getById(initialRoute.productId)
        .then((res) => {
          if (res.data) {
            setSelectedProduct(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load product from route:', err);
        });
    }
  }, []);

  const handleOpenAuth = (mode: AuthMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Sync state when logout or 401 unauthorized event is dispatched
  useEffect(() => {
    const handleLogoutSync = () => {
      setCurrentView('home');
      window.history.replaceState({ view: 'home' }, '', '/');
      setIsNotificationsOpen(false);
      setUnreadCount(0);
      setSelectedProduct(null);
      setProductForOffer(null);
      setIsCreateListingOpen(false);
      setEditingProduct(null);
    };

    window.addEventListener('unimart:logout', handleLogoutSync);
    window.addEventListener('unimart:unauthorized', handleLogoutSync);
    return () => {
      window.removeEventListener('unimart:logout', handleLogoutSync);
      window.removeEventListener('unimart:unauthorized', handleLogoutSync);
    };
  }, []);

  // Listen for browser popstate (back / forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();

      // Guard protected routes on back/forward
      if (!isAuthLoading && isProtectedRoute(route.view) && !isAuthenticated) {
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/');
        handleOpenAuth('login');
        return;
      }

      if (!isAuthLoading && route.view === 'admin' && user?.role !== 'admin') {
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/');
        return;
      }

      setCurrentView(route.view);
      if (route.category) {
        setActiveCategoryFilter(route.category);
      }
      setSearchQuery(route.search || '');
      if (route.productId) {
        productsApi
          .getById(route.productId)
          .then((res) => {
            if (res.data) setSelectedProduct(res.data);
          })
          .catch(() => {});
      } else {
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthLoading, isAuthenticated, user?.role]);

  // Guard protected route on initial load or auth state transition
  useEffect(() => {
    if (!isAuthLoading) {
      if (isProtectedRoute(currentView) && !isAuthenticated) {
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/');
        handleOpenAuth('login');
      } else if (currentView === 'admin' && user?.role !== 'admin') {
        setCurrentView('home');
        window.history.replaceState({ view: 'home' }, '', '/');
      }
    }
  }, [isAuthLoading, currentView, isAuthenticated, user?.role]);

  const handleNavigate = (view: string, category?: string, search?: string) => {
    // Intercept navigation to protected routes for unauthenticated users
    if (isProtectedRoute(view) && !isAuthenticated) {
      handleOpenAuth('login');
      return;
    }

    if (view === 'admin' && !isAuthLoading && user?.role !== 'admin') {
      setCurrentView('home');
      window.history.pushState({ view: 'home' }, '', '/');
      return;
    }

    const cat = category || (view === 'browse' ? activeCategoryFilter : undefined);
    if (category) {
      setActiveCategoryFilter(category);
    }
    const s = search !== undefined ? search : view === 'browse' ? searchQuery : undefined;
    if (search !== undefined) {
      setSearchQuery(search);
    }
    setCurrentView(view);
    setSelectedProduct(null);

    const newUrl = buildRouteUrl(view, cat, undefined, s);
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState({ view, category: cat, search: s }, '', newUrl);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      const newUrl = buildRouteUrl('browse', undefined, product.id);
      window.history.pushState({ view: 'browse', productId: product.id }, '', newUrl);
    } else {
      const newUrl = buildRouteUrl(currentView, activeCategoryFilter, undefined, searchQuery);
      window.history.pushState(
        { view: currentView, category: activeCategoryFilter, search: searchQuery },
        '',
        newUrl
      );
    }
  };

  const handleOpenCreateListing = () => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setEditingProduct(null);
    setIsCreateListingOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setEditingProduct(prod);
    setIsCreateListingOpen(true);
  };

  const handleStartChatWithSeller = (product: Product) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setSelectedProduct(null);
    setCurrentView('messages');
    window.history.pushState({ view: 'messages' }, '', '/messages');
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    try {
      const res = await productsApi.toggleWishlist(productId);
      if (!res.data) return;
      const isSaved = res.data.isSaved;
      showToast(isSaved ? 'Item saved to your Wishlist!' : 'Item removed from Wishlist.', 'info');
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({
          ...selectedProduct,
          isSaved,
          saves: res.data.saves,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Please log in to save items.', 'error');
    }
  };

  const handleContactServiceProvider = (providerName: string, serviceTitle: string) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    showToast(`Opening campus direct chat with provider ${providerName}...`, 'info');
    setCurrentView('messages');
    window.history.pushState({ view: 'messages' }, '', '/messages');
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 overflow-x-clip w-full">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenNotifications={() => setIsNotificationsOpen((prev) => !prev)}
        unreadNotificationsCount={unreadCount}
        onOpenAuth={handleOpenAuth}
        onOpenCreateListing={handleOpenCreateListing}
        onSelectProduct={handleSelectProduct}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0 lg:overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />

        {/* Main Content View */}
        <main ref={mainContentRef} className="flex-1 lg:h-full lg:overflow-y-auto p-3 sm:p-5 lg:p-8 min-w-0 pb-24 lg:pb-8 overscroll-contain">
          {currentView === 'home' && (
            <HomeDashboard onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
          )}

          {currentView === 'browse' && (
            <BrowseMarketplaceView
              selectedCategoryProp={activeCategoryFilter}
              searchQueryProp={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              onSelectProduct={handleSelectProduct}
              onPostNewListing={handleOpenCreateListing}
            />
          )}

          {currentView === 'my-listings' && (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              isLoading={isAuthLoading}
              onRedirectLogin={() => handleOpenAuth('login')}
            >
              <MyListingsView
                onOpenCreateListing={handleOpenCreateListing}
                onSelectProduct={handleSelectProduct}
                onEditProduct={handleEditProduct}
              />
            </ProtectedRoute>
          )}

          {currentView === 'messages' && (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              isLoading={isAuthLoading}
              onRedirectLogin={() => handleOpenAuth('login')}
            >
              <MessagesChatView
                onViewProduct={(pid) => {
                  productsApi.getById(pid).then((res) => {
                    if (res.data) handleSelectProduct(res.data);
                  });
                }}
                onOpenMakeOffer={(p) => setProductForOffer(p)}
              />
            </ProtectedRoute>
          )}

          {currentView === 'saved' && (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              isLoading={isAuthLoading}
              onRedirectLogin={() => handleOpenAuth('login')}
            >
              <SavedItemsView
                onSelectProduct={handleSelectProduct}
                onExploreMarketplace={() => handleNavigate('browse')}
              />
            </ProtectedRoute>
          )}

          {currentView === 'services' && (
            <ServicesView
              onContactProvider={handleContactServiceProvider}
              onOpenAuthModal={() => handleOpenAuth('login')}
            />
          )}

          {currentView === 'graduating-sale' && (
            <GraduatingSaleView
              onSelectProduct={handleSelectProduct}
              onOpenAuthModal={() => handleOpenAuth('login')}
            />
          )}

          {currentView === 'help' && (
            <HelpSupportView
              onOpenReportModal={() => {
                setProductForReport(null);
                setIsReportModalOpen(true);
              }}
            />
          )}

          {currentView === 'guides' && <GuidesView />}

          {currentView === 'settings' && (
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              isLoading={isAuthLoading}
              onRedirectLogin={() => handleOpenAuth('login')}
            >
              <ProfileSettingsView />
            </ProtectedRoute>
          )}

          {currentView === 'admin' && (
            <ProtectedRoute
              isAuthenticated={isAuthenticated && user?.role === 'admin'}
              isLoading={isAuthLoading}
              requiredRole="admin"
              userRole={user?.role}
              onRedirectLogin={() => handleOpenAuth('login')}
            >
              <AdminDashboard />
            </ProtectedRoute>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenCreateListing={handleOpenCreateListing}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => handleSelectProduct(null)}
          onMakeOffer={(p) => {
            handleSelectProduct(null);
            setProductForOffer(p);
          }}
          onStartChat={handleStartChatWithSeller}
          onToggleWishlist={handleToggleWishlist}
          onOpenReport={(p) => {
            setProductForReport(p);
            setIsReportModalOpen(true);
          }}
        />
      )}

      {/* Make Offer Modal */}
      {productForOffer && (
        <MakeOfferModal
          product={productForOffer}
          onClose={() => setProductForOffer(null)}
          onOfferSubmitted={() => {
            setCurrentView('messages');
            window.history.pushState({ view: 'messages' }, '', '/messages');
          }}
        />
      )}

      {/* Create / Edit Listing Modal */}
      {isCreateListingOpen && (
        <CreateListingModal
          editingProduct={editingProduct}
          onClose={() => {
            setIsCreateListingOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setCurrentView('my-listings');
            window.history.pushState({ view: 'my-listings' }, '', '/my-listings');
          }}
        />
      )}

      {/* Report A Problem / Flag Listing Modal */}
      {isReportModalOpen && (
        <ReportProblemModal
          targetProduct={productForReport}
          onClose={() => {
            setIsReportModalOpen(false);
            setProductForReport(null);
          }}
        />
      )}

      {/* Auth Modal (Login / Register / 6-Digit Email Verification) */}
      <AuthModal
        isOpen={isAuthModalOpen || requiresEmailVerification}
        initialMode={requiresEmailVerification ? 'verify' : authModalMode}
        onClose={() => {
          setIsAuthModalOpen(false);
          handleNavigate('home');
        }}
      />

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNotificationRead={() => setUnreadCount((c) => Math.max(0, c - 1))}
        onUpdateUnreadCount={(count) => setUnreadCount(count)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <UniversityProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </UniversityProvider>
    </ToastProvider>
  );
}
