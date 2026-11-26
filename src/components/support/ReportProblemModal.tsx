import React, { useState } from 'react';
import { X, Flag, AlertCircle } from 'lucide-react';
import { reportsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';

interface ReportProblemModalProps {
  onClose: () => void;
  targetProduct?: Product | null;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({
  onClose,
  targetProduct,
}) => {
  const { showToast } = useToast();
  const targetType: 'listing' | 'user' | 'service' | 'system' = targetProduct ? 'listing' : 'system';
  const [reason, setReason] = useState('Inappropriate Content or Item');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      showToast('Please provide details explaining the problem.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await reportsApi.createReport({
        targetType,
        targetId: targetProduct?.id || 'general-issue',
        reason,
        details: details.trim(),
      });
      showToast('Report submitted. Our moderation team has been notified.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Report a Problem</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {targetProduct && (
            <div className="p-3 bg-red-50/60 border border-red-100 rounded-xl text-xs text-red-950 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Reporting listing: <span className="font-bold">{targetProduct.title}</span> (Seller: {targetProduct.sellerName})
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Issue Category
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="Inappropriate Content or Item">Inappropriate Content or Item</option>
              <option value="Suspected Fraud or Scam">Suspected Fraud or Scam</option>
              <option value="Duplicate or Spam Listing">Duplicate or Spam Listing</option>
              <option value="Misleading Price or Description">Misleading Price or Description</option>
              <option value="User Harassment or Offensive Behavior">User Harassment or Offensive Behavior</option>
              <option value="Bug or Technical Problem">Bug or Technical Problem</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Details & Explanation *
            </label>
            <textarea
              rows={4}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue in detail so campus moderators can take swift action..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
