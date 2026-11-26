import React, { useState } from 'react';
import {
  X,
  Heart,
  MessageSquare,
  BadgeDollarSign,
  MapPin,
  Clock,
  Eye,
  ShieldCheck,
  Share2,
  Flag,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onMakeOffer: (product: Product) => void;
  onStartChat: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onOpenReport?: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onMakeOffer,
  onStartChat,
  onToggleWishlist,
  onOpenReport,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isOwner = user?.id === product.sellerId;
  const isSold = product.status === 'sold';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Listing link copied to clipboard!', 'success');
    } else {
      showToast('Sharing link: ' + window.location.href, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              {product.category}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
              {product.universityShortName || 'Campus Marketplace'}
            </span>
            {isSold && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-800 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sold
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Share Listing"
              className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {onOpenReport && (
              <button
                onClick={() => onOpenReport(product)}
                title="Report Listing"
                className="p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Gallery */}
            <div className="md:col-span-7 space-y-3">
              {/* Main Image */}
              <div className="relative aspect-4/3 w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={
                    product.images[selectedImageIndex] ||
                    product.images[0] ||
                    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={product.title}
                  className="w-full h-full object-contain bg-neutral-900/5"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80';
                    }
                  }}
                />
                {product.condition && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-black/75 text-white backdrop-blur-xs">
                    {product.condition}
                  </span>
                )}
              </div>

              {/* Thumbnails row */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                        selectedImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                          : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = 'true';
                            target.src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80';
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Safety banner */}
              <div className="mt-4 p-3.5 bg-emerald-50/80 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-950">Campus Safe Trade:</span> Always meet in public campus zones (e.g., University Cafeteria, Library, or Faculty lobby) to test items before making payments.
                </div>
              </div>
            </div>

            {/* Right Column: Pricing, Specs & Actions */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                    {product.title}
                  </h1>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
                      ৳ {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ৳ {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{product.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{product.views || 0} campus views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{product.saves || 0} interested</span>
                  </div>
                </div>

                {/* Seller Profile Card */}
                <div className="p-3.5 border border-gray-200 rounded-xl bg-white shadow-xs space-y-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Seller Information
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {product.sellerAvatar ? (
                        <img
                          src={product.sellerAvatar}
                          alt={product.sellerName}
                          className="w-11 h-11 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          {product.sellerName ? product.sellerName.charAt(0) : 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
                          {product.sellerName || 'Campus Member'}
                          {product.sellerIsVerified && (
                            <span title="Verified Campus Member">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="capitalize font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {product.sellerRole || product.sellerType || 'Student'}
                          </span>
                          <span>• {product.universityShortName || 'BAUST'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {product.sellerPhone && (
                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>Contact: {product.sellerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isOwner ? (
                  <div className="space-y-2.5 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      <button
                        type="button"
                        disabled={isSold}
                        onClick={() => onMakeOffer(product)}
                        className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition ${
                          isSold
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow cursor-pointer'
                        }`}
                      >
                        <BadgeDollarSign className="w-4 h-4 shrink-0" />
                        <span>Make Offer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartChat(product)}
                        className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gray-900 hover:bg-black text-white shadow-sm hover:shadow transition cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>Chat with Seller</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleWishlist(product.id)}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                        product.isSaved
                          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${product.isSaved ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span>{product.isSaved ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    This is your listing. You can manage status, edit pricing, or view incoming offers from the <span className="font-semibold">My Listings</span> tab.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description & Features Full Width Section */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Description</h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900">Features & Condition Highlights</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
