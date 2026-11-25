import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Plus,
  GraduationCap,
  Building2,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  CheckCircle,
  X,
  Tag,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';
import { Product } from '../../types';
import { productsApi } from '../../services/api';

const CAMPUS_CATEGORIES = [
  'Books',
  'Laptops',
  'PC Components',
  'Electronics',
  'University Gear',
  'Services',
  'Notes & Materials',
  'Others',
];

const getProductThumbnail = (prod: Product): string => {
  if (Array.isArray(prod.images) && prod.images.length > 0 && prod.images[0]) {
    return prod.images[0];
  }
  if (typeof (prod as any).images === 'string') {
    const parts = ((prod as any).images as string).trim().split(/\s+/);
    if (parts.length > 0 && parts[0]) return parts[0];
  }
  return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=100&q=80';
};

interface HeaderProps {
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onNavigate: (view: string, category?: string, search?: string) => void;
  currentView: string;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenCreateListing?: () => void;
  onSelectProduct?: (product: Product) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  unreadNotificationsCount,
  onNavigate,
  onOpenAuth,
  onOpenCreateListing,
  onSelectProduct,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const { universities, selectedUniversityId, setSelectedUniversityId, selectedUniversity } = useUniversity();
  const [showUnivDropdown, setShowUnivDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDemoRoleMenu, setShowDemoRoleMenu] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Live Search Suggestions State
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const univDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const demoRoleDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Sync local search when external prop changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced Live Search Suggestions
  useEffect(() => {
    const query = localSearch.trim();
    if (!query) {
      setSuggestions([]);
      setSuggestedCategories([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    const matchedCats = CAMPUS_CATEGORIES.filter((c) =>
      c.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestedCategories(matchedCats);

    setIsSearching(true);
    const timer = setTimeout(() => {
      productsApi
        .getAll({
          search: query,
          universityId: selectedUniversity?.id,
        })
        .then((res) => {
          if (res.data) {
            const active = res.data.filter((p) => p.status === 'active');
            setSuggestions(active.slice(0, 5));
          }
        })
        .catch(() => setSuggestions([]))
        .finally(() => setIsSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [localSearch, selectedUniversity?.id]);

  // Click outside and Escape key handler for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (univDropdownRef.current && !univDropdownRef.current.contains(target)) {
        setShowUnivDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (demoRoleDropdownRef.current && !demoRoleDropdownRef.current.contains(target)) {
        setShowDemoRoleMenu(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target) &&
        (!mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(target))
      ) {
        setShowSuggestions(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUnivDropdown(false);
        setShowUserDropdown(false);
        setShowDemoRoleMenu(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
    onNavigate('browse', undefined, localSearch);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      if (onSearchChange) {
        onSearchChange(localSearch);
      }
      onNavigate('browse', undefined, localSearch);
    }
  };

  const handleSelectCategory = (catName: string) => {
    setShowSuggestions(false);
    onNavigate('browse', catName);
  };

  const handleSelectProductItem = (product: Product) => {
    setShowSuggestions(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onNavigate('browse', undefined, product.title);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSuggestedCategories([]);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 transition-shadow">
      <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-6 max-w-7xl mx-auto">
        {/* Brand Zone */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink-0 group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-sm shadow-emerald-900/10 transition-transform group-hover:scale-105 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">UniMart</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block -mt-0.5">
              University Community Marketplace
            </p>
          </div>
        </div>

        {/* Search Bar with Live Suggestions Dropdown */}
        <div ref={searchContainerRef} className="flex-1 max-w-xl hidden md:block relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <button
              type="submit"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition-colors"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={localSearch}
              onFocus={() => {
                if (localSearch.trim().length > 0) setShowSuggestions(true);
              }}
              onClick={() => {
                if (localSearch.trim().length > 0) setShowSuggestions(true);
              }}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search for books, laptops, services, and more..."
              className="w-full pl-10 pr-9 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-full border border-transparent focus:border-emerald-600 focus:outline-none transition-all shadow-inner"
            />
            {localSearch.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Floating Live Suggestions Dropdown */}
          {showSuggestions && localSearch.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-[440px] overflow-y-auto">
              {/* Category Matches */}
              {suggestedCategories.length > 0 && (
                <div className="p-3 bg-slate-50/80">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    Suggested Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg text-xs font-semibold border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{cat}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              <div>
                <div className="px-4 py-2 bg-slate-50/40 flex items-center justify-between border-b border-slate-100/60">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Campus Listings ({selectedUniversity?.shortName || 'Campus'})
                  </p>
                  {isSearching && <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />}
                </div>

                {suggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {suggestions.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProductItem(prod)}
                        className="p-3 hover:bg-emerald-50/50 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={getProductThumbnail(prod)}
                            alt={prod.title}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                              {prod.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                              <span className="capitalize">{prod.category}</span>
                              <span>•</span>
                              <span>{prod.condition}</span>
                              <span>•</span>
                              <span className="text-slate-400 truncate">
                                {prod.location || selectedUniversity?.shortName || 'Campus'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-emerald-700">
                            ৳ {prod.price.toLocaleString()}
                          </p>
                          <span className="text-[9px] text-slate-400 flex items-center justify-end gap-1 group-hover:text-emerald-600">
                            View <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !isSearching && suggestedCategories.length === 0 ? (
                  <div className="p-6 text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      No campus items found for "{localSearch}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching with another keyword or campus category.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Bottom Footer Row */}
              <div className="p-2.5 bg-slate-50 text-center">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full py-1.5 px-3 rounded-lg hover:bg-white text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <span>See all results for "{localSearch}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Zone Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors md:hidden ${
              isMobileSearchOpen ? 'bg-emerald-50 text-emerald-800' : ''
            }`}
            aria-label="Toggle mobile search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* University Selector Dropdown */}
          <div ref={univDropdownRef} className="relative">
            <button
              onClick={() => setShowUnivDropdown(!showUnivDropdown)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200/80 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none">
                {selectedUniversity?.shortName || 'BAUST'}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
            </button>

            {showUnivDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95"
                onMouseLeave={() => setShowUnivDropdown(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Campus Feed
                  </p>
                </div>
                {universities.map((univ) => (
                  <button
                    key={univ.id}
                    onClick={() => {
                      setSelectedUniversityId(univ.id);
                      setShowUnivDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      selectedUniversityId === univ.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{univ.shortName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{univ.name}</p>
                    </div>
                    {selectedUniversityId === univ.id && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher (For seamless testing of all 3 roles) */}
          <div ref={demoRoleDropdownRef} className="relative hidden xl:block">
            <button
              onClick={() => setShowDemoRoleMenu(!showDemoRoleMenu)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1"
              title="Test RBAC as Student, Teacher, or Admin"
            >
              <span>Demo Role: {user?.role ? user.role.toUpperCase() : 'GUEST'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDemoRoleMenu && (
              <div
                className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 text-xs"
                onMouseLeave={() => setShowDemoRoleMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  Switch Active Persona
                </div>
                <button
                  onClick={() => {
                    switchDemoRole('student');
                    setShowDemoRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    user?.role === 'student' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-700'
                  }`}
                >
                  🎓 Student (Raiyan)
                </button>
                <button
                  onClick={() => {
                    switchDemoRole('teacher');
                    setShowDemoRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    user?.role === 'teacher' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-700'
                  }`}
                >
                  🧑‍🏫 Teacher (Dr. Amin)
                </button>
                <button
                  onClick={() => {
                    switchDemoRole('admin');
                    setShowDemoRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    user?.role === 'admin' ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-700'
                  }`}
                >
                  🛡️ Admin (Sara Khan)
                </button>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          {isAuthenticated && (
            <button
              id="notification-bell-button"
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* User Account / Login Button */}
          {isAuthenticated && user ? (
            <div ref={userDropdownRef} className="relative shrink-0">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1 sm:gap-2 p-1 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <img
                  src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart'}
                  alt={user.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-emerald-600 shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=UniMart';
                    }
                  }}
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize leading-tight mt-0.5">
                    {user.role} {user.isVerified && '✓'}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
              </button>

              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95"
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-800 rounded capitalize">
                      {user.role} · {user.universityShortName || 'BAUST'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}

                  {/* Quick Persona Switcher for easy testing */}
                  <div className="border-t border-slate-100 mt-1 pt-1.5 px-3 py-1 bg-slate-50/70">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Switch Role (Demo)
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          switchDemoRole('student');
                          setShowUserDropdown(false);
                        }}
                        className={`px-1 py-1 text-[10px] font-semibold rounded text-center transition ${
                          user.role === 'student'
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          switchDemoRole('teacher');
                          setShowUserDropdown(false);
                        }}
                        className={`px-1 py-1 text-[10px] font-semibold rounded text-center transition ${
                          user.role === 'teacher'
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Teacher
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          switchDemoRole('admin');
                          setShowUserDropdown(false);
                          onNavigate('admin');
                        }}
                        className={`px-1 py-1 text-[10px] font-semibold rounded text-center transition ${
                          user.role === 'admin'
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={async () => {
                        setShowUserDropdown(false);
                        await logout();
                        onNavigate('home');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Post Listing CTA Button (Hidden on mobile < sm because mobile already has the prominent elevated + Post button in MobileNav) */}
          <button
            onClick={() => (onOpenCreateListing ? onOpenCreateListing() : onNavigate('my-listings'))}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-900/10 transition-all hover:scale-[1.02] shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Post Listing</span>
          </button>
        </div>
      </div>

      {/* Mobile Expandable Search Bar (Visible only on < md when toggled) */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          className="md:hidden mt-2 pt-2 border-t border-slate-100 max-w-7xl mx-auto relative animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={localSearch}
              onFocus={() => {
                if (localSearch.trim().length > 0) setShowSuggestions(true);
              }}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search books, laptops, services..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-inner"
            />
            {localSearch.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Floating Mobile Suggestions Dropdown */}
          {showSuggestions && localSearch.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {/* Category Matches */}
              {suggestedCategories.length > 0 && (
                <div className="p-2.5 bg-slate-50/80">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    Suggested Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          handleSelectCategory(cat);
                          setIsMobileSearchOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg text-xs font-semibold border border-slate-200"
                      >
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{cat}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              <div>
                <div className="px-3 py-1.5 bg-slate-50/40 flex items-center justify-between border-b border-slate-100/60">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Campus Listings ({selectedUniversity?.shortName || 'Campus'})
                  </p>
                  {isSearching && <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />}
                </div>

                {suggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {suggestions.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          handleSelectProductItem(prod);
                          setIsMobileSearchOpen(false);
                        }}
                        className="p-2.5 hover:bg-emerald-50/50 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={getProductThumbnail(prod)}
                            alt={prod.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {prod.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                              <span className="capitalize">{prod.category}</span>
                              <span>•</span>
                              <span>৳ {prod.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : !isSearching && suggestedCategories.length === 0 ? (
                  <div className="p-4 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      No campus items found for "{localSearch}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching with another keyword or category.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Bottom Row */}
              <div className="p-2 bg-slate-50 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    handleSearchSubmit(e);
                    setIsMobileSearchOpen(false);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-white text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
                >
                  <span>See all results for "{localSearch}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
