/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { UniversityProvider, useUniversity } from './context/UniversityContext';
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
import { GuidesView } from './components/guides/GuidesView';
import { ProductDetailsModal } from './components/marketplace/ProductDetailsModal';
import { MakeOfferModal } from './components/marketplace/MakeOfferModal';
import { CreateListingModal } from './components/marketplace/CreateListingModal';
import { ReportProblemModal } from './components/support/ReportProblemModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Product } from './types';
import { productsApi, notificationApi, chatApi } from './services/api';
import { parseCurrentRoute, buildRouteUrl, isProtectedRoute } from './utils/routing';

function MainLayout() {
  const { user, requiresEmailVerification, dismissEmailVerification, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { setSelectedUniversityId } = useUniversity();
  const { showToast } = useToast();
  const lastSyncedUserIdRef = useRef<string | null>(null);

  // Sync active campus interface to the logged-in user's university on sign-in or session restore
  useEffect(() => {
    if (!user) {
      lastSyncedUserIdRef.current = null;
      return;
    }
    if (user.id !== lastSyncedUserIdRef.current) {
      lastSyncedUserIdRef.current = user.id;
      if (user.universityId) {
        setSelectedUniversityId(user.universityId);
      }
    }
  }, [user, setSelectedUniversityId]);

  const initialRoute = parseCurrentRoute();
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [searchQuery, setSearchQuery] = useState<string>(initialRoute.search || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // Sync unread notifications and chat messages count from backend
  const syncUnreadCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, chatRes] = await Promise.all([
        notificationApi.getAll().catch(() => null),
        chatApi.getConversations().catch(() => null),
      ]);
      if (notifRes?.success && notifRes.data) {
        setUnreadCount(notifRes.data.filter((n) => !n.isRead).length);
      }
      if (chatRes?.success && chatRes.data) {
        const totalUnread = chatRes.data.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadMessagesCount(totalUnread);
      }
    } catch {
      // Ignore background polling errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setUnreadMessagesCount(0);
      setIsNotificationsOpen(false);
      return;
    }

    syncUnreadCounts();
    const interval = setInterval(syncUnreadCounts, 10000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncUnreadCounts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, user?.id, syncUnreadCounts]);

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

  const handleStartChatWithSeller = (_product: Product) => {
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
      const isSaved = res.data?.isSaved ?? res.isSaved;
      const saves = res.data?.saves ?? res.saves;
      if (isSaved === undefined) return;
      showToast(isSaved ? 'Item saved to your Wishlist!' : 'Item removed from Wishlist.', 'info');
      window.dispatchEvent(
        new CustomEvent('unimart:wishlist-updated', {
          detail: { productId, isSaved, saves },
        })
      );
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({
          ...selectedProduct,
          isSaved,
          saves: saves ?? selectedProduct.saves,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Please log in to save items.', 'error');
    }
  };

  const handleContactServiceProvider = (providerName: string, _serviceTitle: string) => {
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
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          unreadMessagesCount={unreadMessagesCount}
        />

        {/* Main Content View */}
        <main ref={mainContentRef} className="flex-1 lg:h-full lg:overflow-y-auto p-3 sm:p-5 lg:p-8 min-w-0 pb-24 lg:pb-8 overscroll-contain">
          {currentView === 'home' && (
            <HomeDashboard
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
              onSelectProduct={handleSelectProduct}
              onToggleWishlist={handleToggleWishlist}
            />
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
                onUnreadMessagesChange={setUnreadMessagesCount}
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
        unreadMessagesCount={unreadMessagesCount}
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
          if (requiresEmailVerification) {
            dismissEmailVerification();
          }
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
