import React, { useState, useEffect } from 'react';
import { Heart, Search, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { productsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from './ProductCard';

interface SavedItemsViewProps {
  onSelectProduct: (product: Product) => void;
  onExploreMarketplace: () => void;
}

export const SavedItemsView: React.FC<SavedItemsViewProps> = ({
  onSelectProduct,
  onExploreMarketplace,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getWishlist();
      setItems(res.data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load saved items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchWishlist();
  }, [user?.id]);

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await productsApi.toggleWishlist(productId);
      const isSaved = res.data?.isSaved ?? res.isSaved ?? false;
      const saves = res.data?.saves ?? res.saves;
      showToast(isSaved ? 'Added to saved items' : 'Removed from saved items', 'info');
      if (!isSaved) {
        setItems((prev) => prev.filter((p) => p.id !== productId));
      }
      window.dispatchEvent(
        new CustomEvent('unimart:wishlist-updated', {
          detail: { productId, isSaved, saves },
        })
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update wishlist.', 'error');
    }
  };

  const filtered = items.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            You have <span className="font-semibold text-emerald-700">{items.length}</span> items saved in your university wishlist.
          </p>
        </div>

        {items.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved items..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Grid or Empty */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl h-64 animate-pulse p-4" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, isSaved: true }}
              onSelect={onSelectProduct}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="font-bold text-gray-900 text-base">Your wishlist is empty</h3>
            <p className="text-xs text-gray-500">
              Browse campus listings and click the heart icon on any item you'd like to save for later.
            </p>
          </div>
          <button
            type="button"
            onClick={onExploreMarketplace}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Campus Listings
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
