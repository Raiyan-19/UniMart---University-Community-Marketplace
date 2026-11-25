import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productsApi } from '../../services/api';
import { Product } from '../../types';
import { ImageUpload } from './ImageUpload';

interface CreateListingModalProps {
  onClose: () => void;
  onSuccess: (product: Product) => void;
  editingProduct?: Product | null;
}

const CATEGORIES = [
  'Laptops',
  'Phones & Tabs',
  'PC Components',
  'Books',
  'Electronics',
  'Furniture',
  'University Gear',
  'Others',
];

const CONDITIONS = ['Brand New', 'Like New', 'Good Condition', 'Fair Condition'] as const;

// Sample curated campus items photos for instant one-click image selection
const PRESET_PHOTOS = [
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80' },
  { label: 'Books', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
  { label: 'GPU / Hardware', url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80' },
  { label: 'Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Desk Chair', url: 'https://images.unsplash.com/photo-1580481077195-731da01f3799?auto=format&fit=crop&w=600&q=80' },
  { label: 'Keyboard', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80' },
  { label: 'Monitor', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80' },
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  onClose,
  onSuccess,
  editingProduct,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState(editingProduct?.title || '');
  const [category, setCategory] = useState(editingProduct?.category || 'Laptops');
  const [price, setPrice] = useState(editingProduct?.price ? String(editingProduct.price) : '');
  const [originalPrice, setOriginalPrice] = useState(
    editingProduct?.originalPrice ? String(editingProduct.originalPrice) : ''
  );
  const [condition, setCondition] = useState<any>(editingProduct?.condition || 'Good Condition');
  const [location, setLocation] = useState(
    editingProduct?.location || `${user?.universityId ? 'Campus Area' : 'BAUST (On Campus)'}`
  );
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [featuresInput, setFeaturesInput] = useState(
    editingProduct?.features ? editingProduct.features.join(', ') : ''
  );
  const [images, setImages] = useState<string[]>(
    editingProduct?.images || [PRESET_PHOTOS[0].url]
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddPresetImage = (url: string) => {
    if (!url.trim()) return;
    if (images.includes(url)) {
      showToast('Image already added.', 'info');
      return;
    }
    if (images.length >= 5) {
      showToast('Maximum 5 images allowed.', 'error');
      return;
    }
    setImages([...images, url.trim()]);
    showToast('Preset image added.', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingImages) {
      showToast('Please wait for images to finish uploading.', 'info');
      return;
    }
    if (!title.trim() || !price || Number(price) <= 0) {
      showToast('Title and valid price are required.', 'error');
      return;
    }
    if (images.length === 0) {
      showToast('Please add at least one product photo.', 'error');
      return;
    }

    setLoading(true);
    try {
      const features = featuresInput
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        title: title.trim(),
        description: description.trim() || 'No description provided.',
        category,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        condition,
        location: location.trim(),
        images,
        features,
        sellerType: (user?.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher',
      };

      let result: Product;
      if (editingProduct) {
        const res = await productsApi.update(editingProduct.id, payload);
        if (!res.data) throw new Error('Failed to update listing');
        result = res.data;
        showToast('Listing updated successfully!', 'success');
      } else {
        const res = await productsApi.create(payload);
        if (!res.data) throw new Error('Failed to create listing');
        result = res.data;
        showToast('Listing created and published to campus!', 'success');
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save listing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
              {editingProduct ? 'Edit Listing' : 'Post New Campus Listing'}
            </h3>
            <p className="text-xs text-gray-500">
              Share textbook, hardware, or campus gear with fellow students & teachers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Title / Item Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lenovo IdeaPad 5 (Core i5 11th Gen) or Calculus 9th Edition"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Original Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Selling Price (৳ BDT) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Original Bought Price (৳ BDT Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Location / Meetup Spot */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Campus Location / Meetup Spot *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. BAUST Library / Academic Building 2 Cafe"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Product Images Upload & Presets */}
          <div className="space-y-3 pt-1">
            {/* Quick preset selector */}
            <div>
              <span className="text-[11px] text-gray-500 font-medium">
                Quick campus photo presets (or upload your own below):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1.5">
                {PRESET_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetImage(p.url)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-gray-700 shrink-0 transition cursor-pointer"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modern Device Image Upload Component */}
            <ImageUpload
              images={images}
              onChange={setImages}
              onUploadingChange={setIsUploadingImages}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description & Reason for Selling
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included, any minor defects, battery health, or why you are selling..."
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
            />
          </div>

          {/* Key Features */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Features / Highlights (comma separated)
            </label>
            <input
              type="text"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="e.g. 16GB RAM, 512GB SSD, Original Charger, No scratches"
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isUploadingImages}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isUploadingImages
                ? 'Uploading Images...'
                : loading
                ? 'Publishing...'
                : editingProduct
                ? 'Save Changes'
                : 'Post Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
