import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Monitor,
  BookOpen,
  Palette,
  GraduationCap,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { CampusService } from '../../types';
import { productsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';

interface ServicesViewProps {
  onContactProvider: (providerName: string, serviceTitle: string) => void;
  onOpenAuthModal?: () => void;
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('pc') || lower.includes('software') || lower.includes('tech') || lower.includes('code')) return Monitor;
  if (lower.includes('academic') || lower.includes('book') || lower.includes('study')) return BookOpen;
  if (lower.includes('design') || lower.includes('creative') || lower.includes('art') || lower.includes('photo')) return Palette;
  if (lower.includes('tutor') || lower.includes('teach') || lower.includes('math')) return GraduationCap;
  return Sparkles;
};

export const ServicesView: React.FC<ServicesViewProps> = ({ onContactProvider, onOpenAuthModal }) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { selectedUniversity } = useUniversity();
  const [services, setServices] = useState<CampusService[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'PC & Software',
    'Academic Help',
    'Design & Creative',
    'Tutoring',
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('PC & Software');
  const [formRate, setFormRate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await productsApi.getServiceCategories();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
        setFormCategory((prev) => (res.data?.includes(prev) ? prev : res.data![0]));
      }
    } catch {
      // Fallback to default
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getServices({ universityId: selectedUniversity?.id });
      setServices(res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedUniversity?.id]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        showToast('Please log in to offer a service.', 'info');
      }
      return;
    }
    setFormLocation(`${selectedUniversity?.shortName || 'Campus'} (On Campus)`);
    setIsModalOpen(true);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formRate.trim() || !formDescription.trim()) {
      showToast('Please fill in title, rate, and description.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await productsApi.createService({
        title: formTitle.trim(),
        category: formCategory,
        rate: formRate.trim(),
        location: formLocation.trim() || 'BAUST (On Campus)',
        description: formDescription.trim(),
      });

      if (res.data) {
        const newService = res.data;
        setServices((prev) => [newService, ...prev]);
        showToast('Service published successfully! 🎉', 'success');
        setIsModalOpen(false);
        setFormTitle('');
        setFormRate('');
        setFormDescription('');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to publish service.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = services.filter((s) => {
    const matchesCat =
      selectedCategory === 'all' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      (s.providerName && s.providerName.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campus Services</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Find trusted students and teachers offering skills and academic assistance in our university community.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Offer a Service
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
            selectedCategory === 'all'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>All Services</span>
        </button>

        {categories.map((catName) => {
          const Icon = getCategoryIcon(catName);
          const isActive = selectedCategory.toLowerCase() === catName.toLowerCase();
          return (
            <button
              key={catName}
              onClick={() => setSelectedCategory(catName)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{catName}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & Service Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services (e.g. PC repair, Calculus tutoring, poster design)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl h-60 animate-pulse p-4" />
              ))}
            </div>
          ) : services.length === 0 ? (
            /* Friendly Empty State when no services exist */
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-xs space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-gray-900">No Campus Services Offered Yet</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Be the first student or faculty member to offer your skills, tutoring, or technical assistance to the university community!
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Offer the First Service
              </button>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((service) => (
                <div
                  key={service.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800">
                        {service.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{service.rating}</span>
                        <span className="text-gray-400 font-normal">({service.reviewsCount})</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="pt-1 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-gray-900">
                        {service.rate}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        {service.location}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {service.providerAvatar ? (
                        <img
                          src={service.providerAvatar}
                          alt={service.providerName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {service.providerName ? service.providerName.charAt(0) : 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-gray-900">
                          {service.providerName || 'Campus Expert'}
                        </div>
                        <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Online
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onContactProvider(service.providerName || 'Campus Expert', service.title)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition"
                    >
                      Request Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
              No campus services found matching your search.
            </div>
          )}
        </div>

        {/* Right Column: Promotional & Safety */}
        <div className="lg:col-span-4 space-y-4">
          {/* Banner Box */}
          <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                Need Help?
              </span>
              <h3 className="text-lg font-extrabold leading-snug">
                Get it done by your fellow students!
              </h3>
            </div>

            <div className="space-y-2 text-xs text-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Trusted Campus Community</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Student Affordable Pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>On Campus / Online Sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fast & Reliable Support</span>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-gray-900 text-sm">How It Works?</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Browse Services</span>
                  <span className="text-gray-500">Find the skill or tutoring you need.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Contact Provider</span>
                  <span className="text-gray-500">Send a request or chat directly.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <span className="font-semibold text-gray-900 block">Get It Done</span>
                  <span className="text-gray-500">Meet up on campus or collaborate online.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Safe Tips */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Stay Safe
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Meet in public places (on campus) and verify the service provider before payment.
            </p>
          </div>
        </div>
      </div>

      {/* Offer Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Offer a Campus Service</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Share your technical, creative, or academic skills with peers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Windows 11 & Official Drivers Installation"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rate / Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    placeholder="e.g. ৳ 300 or ৳ 400/hr"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Meetup / Session Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. BAUST Library / On Campus / Online"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe what services you provide, tools you use, and how you will help..."
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publish Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
