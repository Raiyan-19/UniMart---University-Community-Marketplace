import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Laptop,
  Cpu,
  Headphones,
  Shirt,
  Wrench,
  FileText,
  MoreHorizontal,
  ArrowRight,
  Plus,
  Heart,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { Product } from '../../types';
import { productsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';

interface HomeDashboardProps {
  onNavigate: (view: string, category?: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const CAMPUS_HERO_ASSETS: Record<
  string,
  { image: string; alt: string; name: string; location: string; tagline: string }
> = {
  'univ-baust': {
    image: '/assets/campus/baust-campus.jpg',
    alt: 'Bangladesh Army University of Science and Technology Campus',
    name: 'BAUST',
    location: 'Saidpur Cantonment',
    tagline: 'Saidpur Cantonment, Nilphamari',
  },
  'univ-brur': {
    image: '/assets/campus/brur-campus.jpg',
    alt: 'Begum Rokeya University Rangpur Campus',
    name: 'BRUR',
    location: 'Rangpur',
    tagline: 'Begum Rokeya University Community',
  },
  'univ-du': {
    image: '/assets/campus/du-campus.jpg',
    alt: 'University of Dhaka Curzon Hall',
    name: 'DU',
    location: 'Dhaka',
    tagline: 'University of Dhaka Community',
  },
  'univ-ru': {
    image: '/assets/campus/ru-campus.jpg',
    alt: 'Rajshahi University Campus',
    name: 'RU',
    location: 'Motihar, Rajshahi',
    tagline: 'Rajshahi University Community',
  },
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const { selectedUniversity } = useUniversity();

  const categories = [
    { id: 'books', name: 'Books', icon: BookOpen },
    { id: 'laptops', name: 'Laptops', icon: Laptop },
    { id: 'pc', name: 'PC Components', icon: Cpu },
    { id: 'electronics', name: 'Electronics', icon: Headphones },
    { id: 'gear', name: 'University Gear', icon: Shirt },
    { id: 'services', name: 'Services', icon: Wrench },
    { id: 'notes', name: 'Notes & Materials', icon: FileText },
    { id: 'others', name: 'Others', icon: MoreHorizontal },
  ];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCampusHero = (selectedUniversity?.id && CAMPUS_HERO_ASSETS[selectedUniversity.id]) || {
    image: '/assets/campus/baust-campus.jpg',
    alt: selectedUniversity?.name || 'Campus Architecture',
    name: selectedUniversity?.shortName || 'Campus',
    location: selectedUniversity?.location || 'Campus Area',
    tagline: 'University Community Marketplace',
  };

  useEffect(() => {
    setLoading(true);
    productsApi
      .getAll({ universityId: selectedUniversity?.id })
      .then((res) => {
        if (res.data) {
          const active = res.data.filter((p) => p.status === 'active');
          setProducts(active.slice(0, 5));
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedUniversity?.id]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 w-full">
      {/* Top Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Main Hero Banner with Dynamic Campus Photography */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden relative p-4 sm:p-7 lg:p-10 text-white flex flex-col justify-between shadow-xl min-h-[280px] sm:min-h-[320px]">
          {/* Background campus photography positioned on the right */}
          <div className="absolute inset-0 z-0">
            <img
              key={activeCampusHero.image}
              src={activeCampusHero.image}
              alt={activeCampusHero.alt}
              className="w-full h-full object-cover object-right sm:object-center transition-all duration-700 ease-in-out"
            />
          </div>

          {/* Left-to-right gradient overlay: Dark on left for readability, fading out to clear campus view on right */}
          <div className="absolute inset-0 z-1 bg-gradient-to-r from-emerald-950 via-emerald-950/90 sm:via-emerald-950/80 sm:to-transparent to-emerald-950/40 pointer-events-none" />
          
          {/* Subtle bottom-up vignette to ensure action buttons stay legible on any screen */}
          <div className="absolute inset-0 z-1 bg-gradient-to-t from-emerald-950/90 via-emerald-950/30 to-black/20 pointer-events-none" />
          
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row with Campus Portal badge & Location pill */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 border border-white/10">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{activeCampusHero.name} Campus Portal</span>
            </span>

            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] sm:text-[11px] font-semibold text-emerald-200 border border-white/10 shadow-xs">
              <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
              <span className="truncate max-w-[120px] sm:max-w-none">{activeCampusHero.location}</span>
            </div>
          </div>

          {/* Hero Headlines */}
          <div className="relative z-10 space-y-2 sm:space-y-3 max-w-lg my-auto py-3 sm:py-4">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              Same Campus.<br />
              <span className="text-emerald-300">Bigger Opportunities.</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              Buy, sell, and access verified services within {activeCampusHero.name}. Exclusively for students and faculty.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onNavigate('browse')}
              className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 hover:shadow-lg cursor-pointer"
            >
              <span>Explore Listings</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('services')}
              className="px-4 sm:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all backdrop-blur-xs cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-emerald-300" />
              <span>Campus Services</span>
            </button>
          </div>
        </div>

        {/* Right Card: Dynamic Campus Community Hub when Logged Out, Personal Dashboard when Logged In */}
        {!isAuthenticated ? (
          <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4">
              {/* Header Badge & Campus Location */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-extrabold border border-emerald-200/80">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="uppercase tracking-wider">Live Campus Hub</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold truncate max-w-[130px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{activeCampusHero.location}</span>
                </div>
              </div>

              {/* Campus Headline */}
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                  {activeCampusHero.name} Student Marketplace
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Exclusively built for verified students and faculty of {activeCampusHero.name}.
                </p>
              </div>

              {/* 3 Campus Trust & Value Points */}
              <div className="space-y-2 sm:space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-emerald-50/40 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">On-Campus Handover</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Meet peers directly inside campus. Zero courier delays or shipping fees.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-emerald-50/40 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Verified Peer Network</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      Trade safely with authenticated university classmates and seniors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-emerald-50/40 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">0% Platform Fee</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      100% free student exchange for used books, gadgets, materials & services.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons & Micro Footer */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join {activeCampusHero.name} Network</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-500 text-[11px]">Already have an account?</span>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Campus Dashboard</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {user?.universityShortName || activeCampusHero.name}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Hello, {user?.name || 'Student'}!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Active in {activeCampusHero.name} community. Manage your items or explore new deals today.
              </p>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => onNavigate('my-listings')}
                  className="p-2 sm:p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl text-center border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer"
                >
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">
                    {user?.id === 'user-raiyan' ? '1' : '0'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">My Listings</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('browse')}
                  className="p-2 sm:p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl text-center border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer"
                >
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">0</p>
                  <p className="text-[10px] text-slate-500 font-medium">Saved Items</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('messages')}
                  className="p-2 sm:p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl text-center border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer"
                >
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">3</p>
                  <p className="text-[10px] text-slate-500 font-medium">Messages</p>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              {/* Guide Prompt */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <p className="text-xs font-bold text-emerald-950">Campus Student Guide</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">Learn how to trade safely and create verified listings.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('guides')}
                  className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Need Help CTA */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px] sm:text-xs">Need help or support?</span>
                <button
                  type="button"
                  onClick={() => onNavigate('help')}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer text-[11px] sm:text-xs"
                >
                  Campus Helpdesk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Browse by Category */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Browse by Category</h2>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate('browse', cat.name)}
                className="p-2 sm:p-3 bg-white hover:bg-emerald-50/60 rounded-2xl border border-slate-200 hover:border-emerald-300 text-center flex flex-col items-center justify-center gap-1.5 sm:gap-2 transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-100/70 text-slate-600 group-hover:text-emerald-800 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-emerald-900 text-center line-clamp-1">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Listings Grid (Previewing Part 02 Architecture) */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Featured Listings</h2>
            <p className="text-xs text-slate-500">Verified items available in your campus community</p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map((prod) => (
              <div
                key={prod.id}
                onClick={() => onNavigate('browse')}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80'}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 backdrop-blur-xs shadow-xs transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {prod.condition}
                    </span>
                  </div>

                  <div className="p-3 sm:p-3.5 space-y-1">
                    <p className="text-sm font-extrabold text-slate-900 leading-snug truncate">
                      ৳ {prod.price.toLocaleString()}
                    </p>
                    <h3 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {prod.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 capitalize">{prod.category}</p>
                  </div>
                </div>

                <div className="px-3 sm:px-3.5 pb-2.5 sm:pb-3 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[65%]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{prod.location || selectedUniversity?.shortName || 'Campus'}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">
                No listings yet at {selectedUniversity?.shortName || 'this campus'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Be the first student or teacher to post a verified listing at {selectedUniversity?.name || 'your university'}!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Explore Marketplace
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sell CTA Callout */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl sm:rounded-3xl border border-emerald-100 p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xs">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Got something to sell?</h3>
          <p className="text-xs text-slate-600 max-w-md">
            Turn your unused textbooks, electronics, and supplies into cash while helping fellow students.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) onOpenAuth('login');
            else onNavigate('my-listings');
          }}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 shrink-0 transition-all hover:scale-105 cursor-pointer"
        >
          <span>Start Selling</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
