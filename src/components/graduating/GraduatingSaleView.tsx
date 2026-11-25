import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Package,
  ArrowRight,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  CheckSquare,
  Square,
  Pencil,
  Trash2,
} from 'lucide-react';
import { GraduationSale, Product } from '../../types';
import { productsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useUniversity } from '../../context/UniversityContext';
import { ProductCard } from '../marketplace/ProductCard';

interface GraduatingSaleViewProps {
  onSelectProduct: (product: Product) => void;
  onOpenAuthModal?: () => void;
}

export const GraduatingSaleView: React.FC<GraduatingSaleViewProps> = ({
  onSelectProduct,
  onOpenAuthModal,
}) => {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { selectedUniversity } = useUniversity();
  const [sales, setSales] = useState<GraduationSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Active clearance bundle for current logged-in student
  const myExistingSale = sales.find((s) => s.studentId === user?.id);

  // Bundle Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [graduatingTerm, setGraduatingTerm] = useState('Graduating Spring 2026');
  const [quote, setQuote] = useState('');
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loadingUserProducts, setLoadingUserProducts] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getGraduationSales({ universityId: selectedUniversity?.id });
      setSales(res.data || []);
    } catch (err: any) {
      console.error('Failed to load graduation sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedUniversity?.id]);

  const handleOpenCommonModal = async (initialSelectedIds: string[]) => {
    if (!isAuthenticated) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        showToast('Please log in to manage graduation bundles.', 'info');
      }
      return;
    }

    setIsModalOpen(true);
    setLoadingUserProducts(true);
    try {
      const res = await productsApi.getMyListings('active');
      const prods = res.data?.products || [];
      setUserProducts(prods);
      if (initialSelectedIds.length > 0) {
        setSelectedProductIds(initialSelectedIds);
      } else {
        setSelectedProductIds(prods.map((p) => p.id));
      }
    } catch (err) {
      console.error('Failed to load my listings:', err);
    } finally {
      setLoadingUserProducts(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSaleId(null);
    setGraduatingTerm('Graduating Spring 2026');
    setQuote('');
    handleOpenCommonModal([]);
  };

  const handleOpenEditModal = (sale: GraduationSale) => {
    setEditingSaleId(sale.id);
    setGraduatingTerm(sale.graduatingTerm);
    setQuote(sale.quote);
    handleOpenCommonModal(sale.featuredProducts?.map((p) => p.id) || []);
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this graduation clearance bundle?')) {
      return;
    }

    try {
      const res = await productsApi.deleteGraduationSale(id);
      if (res.success) {
        setSales((prev) => prev.filter((s) => s.id !== id));
        showToast('Graduation clearance bundle deleted.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete graduation sale.', 'error');
    }
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graduatingTerm.trim() || !quote.trim()) {
      showToast('Please fill in graduating term and farewell note.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSaleId) {
        const res = await productsApi.updateGraduationSale(editingSaleId, {
          graduatingTerm: graduatingTerm.trim(),
          quote: quote.trim(),
          featuredProductIds: selectedProductIds,
        });

        if (res.data) {
          const updated = res.data;
          setSales((prev) => prev.map((s) => (s.id === editingSaleId ? updated : s)));
          showToast('Graduation clearance bundle updated! 🎓', 'success');
          setIsModalOpen(false);
          setEditingSaleId(null);
        }
      } else {
        const res = await productsApi.createGraduationSale({
          graduatingTerm: graduatingTerm.trim(),
          quote: quote.trim(),
          featuredProductIds: selectedProductIds,
        });

        if (res.data) {
          const newSale = res.data;
          setSales((prev) => {
            const alreadyInList = prev.some((s) => s.id === newSale.id);
            if (alreadyInList) {
              return prev.map((s) => (s.id === newSale.id ? newSale : s));
            }
            return [newSale, ...prev];
          });
          showToast(res.message || 'Graduation clearance bundle posted! 🎓', 'success');
          setIsModalOpen(false);
          setQuote('');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save graduation bundle.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Create Button */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-6 lg:p-8 overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Senior Farewell Clearance</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Graduating Senior Sales
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Graduating students are packing up! Grab full semester textbook packs, lab equipment, monitors, and dorm essentials directly from graduating seniors at major discounts.
            </p>
          </div>

          {myExistingSale ? (
            <button
              type="button"
              onClick={() => handleOpenEditModal(myExistingSale)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl sm:rounded-2xl text-xs font-bold shadow-lg shadow-emerald-950/30 transition shrink-0 cursor-pointer w-full md:w-auto"
            >
              <Pencil className="w-4 h-4" />
              <span>Manage My Clearance</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl sm:rounded-2xl text-xs font-bold shadow-lg shadow-emerald-950/30 transition shrink-0 cursor-pointer w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Post Senior Clearance</span>
            </button>
          )}
        </div>
      </div>

      {/* Senior Bundles Showcase */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : sales.length > 0 ? (
        <div className="space-y-8">
          {sales.map((sale) => {
            const canManage = user && (user.id === sale.studentId || user.role === 'admin');

            return (
              <div
                key={sale.id}
                className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Senior Profile & Quote Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {sale.studentAvatar ? (
                      <img
                        src={sale.studentAvatar}
                        alt={sale.studentName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                        {sale.studentName ? sale.studentName.charAt(0) : 'S'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {sale.studentName || 'Graduating Senior'}'s Clearance Bundle
                      </h3>
                      <p className="text-xs text-gray-500">
                        {sale.departmentCode} • {sale.universityShortName || 'BAUST'} • {sale.graduatingTerm}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {sale.itemCount} Items in Bundle
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sale)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Edit Clearance Bundle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Delete Clearance Bundle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Senior Quote */}
                <blockquote className="italic text-xs sm:text-sm text-gray-600 bg-gray-50 p-3.5 rounded-xl border-l-4 border-emerald-600">
                  "{sale.quote}"
                </blockquote>

                {/* Featured Items Grid */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Available in this Senior's Clearance:
                  </h4>
                  {sale.featuredProducts && sale.featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {sale.featuredProducts.map((p) => (
                        <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No specific products attached to this clearance.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Friendly Empty State */
        <div className="bg-white border border-gray-200 rounded-3xl p-10 sm:p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-gray-900 text-base">
              No Senior Clearance Bundles Yet at {selectedUniversity?.shortName || 'this campus'}
            </h3>
            <p className="text-xs text-gray-500">
              Are you in your final semester at {selectedUniversity?.name || 'this campus'}? Pass your textbooks, dorm essentials, and lab gear down to junior students.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Senior Clearance Bundle
          </button>
        </div>
      )}

      {/* Post/Edit Clearance Bundle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingSaleId ? 'Edit Graduation Clearance' : 'Post Graduation Clearance'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Package and pass on your campus gear to fellow university students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBundle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Graduating Term / Batch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={graduatingTerm}
                  onChange={(e) => setGraduatingTerm(e.target.value)}
                  placeholder="e.g. Graduating Spring 2026 or Batch '22"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Farewell Note / Senior Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="e.g. Wrapping up my 4 years of CSE at BAUST! Passing down my complete course books, mini drafter, and monitor to juniors."
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
                />
              </div>

              {/* Items Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Include Your Active Listings in this Bundle:
                </label>

                {loadingUserProducts ? (
                  <div className="py-4 text-center text-xs text-gray-400">Loading your items...</div>
                ) : userProducts.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    {userProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelect(p.id)}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 hover:border-emerald-300 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            <span className="font-semibold text-gray-800 line-clamp-1">{p.title}</span>
                          </div>
                          <span className="font-bold text-emerald-700">৳ {p.price.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    You don't have any active product listings yet. You can still publish this clearance message, and post your items later via "+ Post Listing"!
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSaleId ? 'Save Changes' : 'Publish Clearance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};