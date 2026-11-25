import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { Product } from '../../types';
import { productsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from './ProductCard';

interface MyListingsViewProps {
  onOpenCreateListing: () => void;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
}

export const MyListingsView: React.FC<MyListingsViewProps> = ({
  onOpenCreateListing,
  onSelectProduct,
  onEditProduct,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    sold: 0,
    inactive: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMyListings = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getMyListings(activeTab !== 'all' ? activeTab : undefined);
      if (res.data) {
        const rawProducts: Product[] = Array.isArray(res.data)
          ? res.data
          : (res.data.products || (res as any).products || []);

        const rawStats = !Array.isArray(res.data) && res.data.stats
          ? res.data.stats
          : ((res as any).stats || {
              total: rawProducts.length,
              active: rawProducts.filter((p) => p.status === 'active').length,
              sold: rawProducts.filter((p) => p.status === 'sold').length,
              inactive: rawProducts.filter((p) => p.status === 'inactive').length,
              totalViews: rawProducts.reduce((acc, curr) => acc + (curr.views || 0), 0),
            });

        setProducts(rawProducts);
        setStats(rawStats);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch your listings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setStats({ total: 0, active: 0, sold: 0, inactive: 0, totalViews: 0 });
      setLoading(false);
      return;
    }
    fetchMyListings();
  }, [activeTab, user?.id]);

  const handleStatusChange = async (
    product: Product,
    newStatus: 'active' | 'sold' | 'inactive',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await productsApi.update(product.id, { status: newStatus });
      showToast(`Listing status updated to ${newStatus}.`, 'success');
      fetchMyListings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await productsApi.delete(productId);
      showToast('Listing removed successfully.', 'info');
      fetchMyListings();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage your items and services. Edit, delete, or mark as sold.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateListing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          Post New Listing
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'all'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'active'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setActiveTab('sold')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'sold'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          Sold ({stats.sold})
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
            activeTab === 'inactive'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          Inactive ({stats.inactive})
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Total Listings</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-600" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.active}</div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Active</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.sold}</div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Sold</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.inactive}</div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Inactive</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.totalViews}</div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Total Views</div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center gap-2.5 sm:gap-3 col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-emerald-950 truncate">Keep Going!</div>
            <div className="text-[10px] text-emerald-800 leading-tight">Items getting views.</div>
          </div>
        </div>
      </div>

      {/* Search Bar within listings */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your listings..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Product Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl h-64 animate-pulse p-4" />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={onSelectProduct}
              showManageActions
              onEdit={(prod) => onEditProduct(prod)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}

          {/* "+ Post New Listing" Promotional Card */}
          <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 rounded-xl p-6 bg-emerald-50/30 flex flex-col items-center justify-center text-center space-y-3 transition group">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">List More. Help More.</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                Turn your unused items into opportunities for someone else in the campus.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateListing}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              + Post New Listing
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-gray-900 text-sm">No listings found in this tab</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You don't have any items here yet. Have old textbooks, gadgets, or campus gear?
          </p>
          <button
            type="button"
            onClick={onOpenCreateListing}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl"
          >
            + Post Your First Listing
          </button>
        </div>
      )}
    </div>
  );
};
