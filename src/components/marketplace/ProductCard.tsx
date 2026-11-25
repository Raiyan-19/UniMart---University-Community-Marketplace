import React from 'react';
import { Heart, MapPin, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onToggleWishlist?: (productId: string, e: React.MouseEvent) => void;
  showManageActions?: boolean;
  onEdit?: (product: Product, e: React.MouseEvent) => void;
  onStatusChange?: (product: Product, status: 'active' | 'sold' | 'inactive', e: React.MouseEvent) => void;
  onDelete?: (productId: string, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onToggleWishlist,
  showManageActions,
  onEdit,
  onStatusChange,
  onDelete,
}) => {
  const isSold = product.status === 'sold';
  const isInactive = product.status === 'inactive';

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Thumbnail & Badges */}
      <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallbackApplied) {
              target.dataset.fallbackApplied = 'true';
              target.src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80';
            }
          }}
        />

        {/* Status Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {product.status === 'active' && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
              Active
            </span>
          )}
          {product.status === 'sold' && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-white shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Sold
            </span>
          )}
          {product.status === 'inactive' && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-600 text-white shadow-sm">
              Inactive
            </span>
          )}
          {product.condition && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-white backdrop-blur-xs">
              {product.condition}
            </span>
          )}
        </div>

        {/* Wishlist Button (if not managing own listings) */}
        {!showManageActions && onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => onToggleWishlist(product.id, e)}
            aria-label={product.isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm transition hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition ${
                product.isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </button>
        )}

        {/* Bottom bar overlay inside image: views & saves */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-medium text-white drop-shadow-md">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {product.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 fill-white/80" /> {product.saves || 0}
            </span>
          </div>
          <span className="bg-emerald-700/80 px-2 py-0.5 rounded text-[11px] font-medium">
            {product.universityShortName || 'Campus'}
          </span>
        </div>
      </div>

      {/* Info Card Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
              {product.title}
            </h3>
          </div>

          {/* Pricing */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              ৳ {product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ৳ {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Category & Location */}
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              {product.category}
            </span>
            <span className="flex items-center gap-1 truncate max-w-[130px]" title={product.location}>
              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
              {product.location}
            </span>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            {product.sellerAvatar ? (
              <img
                src={product.sellerAvatar}
                alt={product.sellerName}
                className="w-4 h-4 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center justify-center">
                {product.sellerName ? product.sellerName.charAt(0) : 'U'}
              </div>
            )}
            <span className="text-gray-600 font-medium truncate max-w-[90px]">
              {product.sellerName || 'Student'}
            </span>
          </div>

          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            {new Date(product.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Manage Action Buttons (for My Listings view) */}
        {showManageActions && (
          <div
            className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-3 gap-1 text-[11px] sm:text-xs font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => onEdit && onEdit(product, e)}
              className="py-1.5 px-1 sm:px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-center border border-gray-200 transition truncate"
            >
              Edit
            </button>
            {product.status === 'active' ? (
              <button
                type="button"
                onClick={(e) => onStatusChange && onStatusChange(product, 'sold', e)}
                className="py-1.5 px-1 sm:px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-center border border-emerald-200 transition truncate"
              >
                Mark Sold
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => onStatusChange && onStatusChange(product, 'active', e)}
                className="py-1.5 px-1 sm:px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-center border border-blue-200 transition truncate"
              >
                Reactivate
              </button>
            )}
            <button
              type="button"
              onClick={(e) => onDelete && onDelete(product.id, e)}
              className="py-1.5 px-1 sm:px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-center border border-rose-200 transition truncate"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
