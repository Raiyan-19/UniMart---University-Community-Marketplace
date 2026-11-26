import React, { useState } from 'react';
import { X, BadgeDollarSign, ShieldCheck, Send } from 'lucide-react';
import { Product } from '../../types';
import { offersApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface MakeOfferModalProps {
  product: Product;
  onClose: () => void;
  onOfferSubmitted: () => void;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  product,
  onClose,
  onOfferSubmitted,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState<number>(Math.round(product.price * 0.9));
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const applyDiscount = (pct: number) => {
    setAmount(Math.round(product.price * (1 - pct / 100)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      showToast('Please enter a valid offer amount.', 'error');
      return;
    }
    if (amount > product.price * 1.5) {
      showToast('Offer amount seems abnormally high.', 'error');
      return;
    }

    setLoading(true);
    try {
      await offersApi.createOffer({
        productId: product.id,
        amount,
        notes: notes.trim() || undefined,
      });
      showToast(`Offer of ৳ ${amount.toLocaleString()} sent to ${product.sellerName}!`, 'success');
      onOfferSubmitted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit offer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Make an Offer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Target Product Summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <img
              src={product.images[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80'}
              alt={product.title}
              className="w-14 h-14 object-cover rounded-lg shrink-0"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = 'true';
                  target.src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80';
                }
              }}
            />
            <div className="overflow-hidden">
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                {product.title}
              </h4>
              <p className="text-xs text-gray-500">
                Asking price: <span className="font-bold text-gray-800">৳ {product.price.toLocaleString()}</span>
              </p>
              <p className="text-[11px] text-emerald-700">
                Seller: {product.sellerName} ({product.universityShortName || 'BAUST'})
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Quick Suggestions
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAmount(product.price)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${amount === product.price
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
              >
                Asking
              </button>
              <button
                type="button"
                onClick={() => applyDiscount(5)}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => applyDiscount(10)}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition"
              >
                -10%
              </button>
              <button
                type="button"
                onClick={() => applyDiscount(15)}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition"
              >
                -15%
              </button>
            </div>
          </div>

          {/* Offer Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Your Offer Amount (৳ BDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-gray-400">
                ৳
              </span>
              <input
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl font-bold text-gray-900 text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Note to Seller (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Can meet near campus cafeteria tomorrow at 1:30 PM..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          {/* Safety hint */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Offers are non-binding negotiations. You only pay after meeting the student seller on campus.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Submitting...' : 'Send Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
