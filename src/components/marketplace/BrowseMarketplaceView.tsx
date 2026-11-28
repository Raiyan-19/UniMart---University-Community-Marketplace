import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Laptop,
  Smartphone,
  Cpu,
  BookOpen,
  Headphones,
  Armchair,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product } from '../../types';
import { productsApi } from '../../services/api';
import { useUniversity } from '../../context/UniversityContext';
import { useToast } from '../../context/ToastContext';
import { ProductCard } from './ProductCard';

interface BrowseMarketplaceViewProps {
  onSelectProduct: (product: Product) => void;
  onPostNewListing: () => void;
  selectedCategoryProp?: string;
  searchQueryProp?: string;
  onSearchChange?: (query: string) => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Items', icon: Sparkles },
  { id: 'Laptops', label: 'Laptops', icon: Laptop },
  { id: 'Phones & Tabs', label: 'Phones & Tabs', icon: Smartphone },
  { id: 'PC Components', label: 'PC Hardware', icon: Cpu },
  { id: 'Books', label: 'Books', icon: BookOpen },
  { id: 'Electronics', label: 'Electronics', icon: Headphones },
  { id: 'Furniture', label: 'Furniture', icon: Armchair },
  { id: 'University Gear', label: 'Campus Gear', icon: GraduationCap },
];

const CONDITIONS = ['All', 'Brand New', 'Like New', 'Good Condition', 'Fair Condition'];

export const BrowseMarketplaceView: React.FC<BrowseMarketplaceViewProps> = ({
  onSelectProduct,
  onPostNewListing,
  selectedCategoryProp,
  searchQueryProp,
  onSearchChange,
}) => {
  const { selectedUniversity, universities } = useUniversity();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchQueryProp || '');
  const [selectedCategory, setSelectedCategory] = useState(selectedCategoryProp || 'all');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSellerType, setSelectedSellerType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [univFilter, setUnivFilter] = useState(selectedUniversity?.id || 'all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync with global university selector
  useEffect(() => {
    if (selectedUniversity?.id) {
      setUnivFilter(selectedUniversity.id);
    }
  }, [selectedUniversity]);

  // Sync category if prop changes
  useEffect(() => {
    if (selectedCategoryProp) {
      setSelectedCategory(selectedCategoryProp);
    }
  }, [selectedCategoryProp]);

  // Sync search if prop changes
  useEffect(() => {
    if (searchQueryProp !== undefined) {
      setSearch(searchQueryProp);
    }
  }, [searchQueryProp]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({
        search: search.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        universityId: univFilter !== 'all' ? univFilter : undefined,
        condition: selectedCondition !== 'All' ? selectedCondition : undefined,
        sellerType: selectedSellerType !== 'all' ? selectedSellerType : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sortBy,
      });
      setProducts(res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedCondition, selectedSellerType, sortBy, univFilter]);

  useEffect(() => {
    const handleWishlistEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ productId: string; isSaved: boolean; saves?: number }>).detail;
      if (!detail) return;
      setProducts((prev) =>
        prev.map((p) =>
          p.id === detail.productId
            ? { ...p, isSaved: detail.isSaved, saves: detail.saves ?? p.saves }
            : p
        )
      );
    };
    window.addEventListener('unimart:wishlist-updated', handleWishlistEvent);
    return () => window.removeEventListener('unimart:wishlist-updated', handleWishlistEvent);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await productsApi.toggleWishlist(productId);
      const isSaved = res.data?.isSaved ?? res.isSaved;
      const saves = res.data?.saves ?? res.saves;
      if (isSaved === undefined) return;
      showToast(isSaved ? 'Added to Saved Items!' : 'Removed from Saved Items.', 'info');
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isSaved, saves: saves ?? p.saves } : p
        )
      );
      window.dispatchEvent(
        new CustomEvent('unimart:wishlist-updated', {
          detail: { productId, isSaved, saves },
        })
      );
    } catch (err: any) {
      showToast(err.message || 'Please log in to save items.', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    if (onSearchChange) onSearchChange('');
    setSelectedCategory('all');
    setSelectedCondition('All');
    setSelectedSellerType('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setUnivFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {CATEGORY_TABS.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 border cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            {mobileFilterOpen ? 'Hide Filters' : 'Filter Products'}
          </button>
          <span className="text-xs text-gray-500 font-medium">
            {products.length} items found
          </span>
        </div>

        {/* Filters Sidebar */}
        <div
          className={`${
            mobileFilterOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-6`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-gray-900 text-sm">Filter Listings</h3>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Search in Sidebar */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Keywords
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                placeholder="Laptop, book, monitor..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </form>
          </div>

          {/* University Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Campus / University
            </label>
            <select
              value={univFilter}
              onChange={(e) => setUnivFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="all">All Universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.shortName} - {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Condition
            </label>
            <div className="space-y-1.5">
              {CONDITIONS.map((cond) => (
                <label
                  key={cond}
                  className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer hover:text-emerald-800"
                >
                  <input
                    type="radio"
                    name="condition"
                    checked={selectedCondition === cond}
                    onChange={() => setSelectedCondition(cond)}
                    className="text-emerald-600 focus:ring-emerald-500 rounded"
                  />
                  <span>{cond}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Price Range (৳ BDT)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ৳"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <input
                type="number"
                placeholder="Max ৳"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={fetchProducts}
              className="mt-2 w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition"
            >
              Apply Price
            </button>
          </div>

          {/* Seller Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Seller Type
            </label>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-xs">
              {(['all', 'student', 'teacher'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedSellerType(st)}
                  className={`py-1.5 capitalize rounded-lg font-medium transition ${
                    selectedSellerType === st
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Header Controls & Product Grid */}
        <div className="lg:col-span-9 space-y-4">
          {/* Top Results Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">{products.length}</span> verified campus listings
              {selectedCategory !== 'all' && (
                <span> in <span className="text-emerald-700 font-semibold">{selectedCategory}</span></span>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-gray-500 font-medium hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              <button
                type="button"
                onClick={onPostNewListing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                + Post Listing
              </button>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl h-72 animate-pulse p-4 flex flex-col justify-between">
                  <div className="bg-gray-200 h-40 rounded-lg" />
                  <div className="space-y-2 pt-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-gray-900 text-base">No listings found</h3>
                <p className="text-xs text-gray-500">
                  We couldn't find any items matching your current filters. Try resetting filters or post the first listing yourself!
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={onPostNewListing}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  + Post New Listing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
