import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Trash2, Loader2, Plus } from 'lucide-react';
import { uploadApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  MAX_IMAGE_COUNT,
  validateImageFile,
  validateImageSlots,
  ALLOWED_IMAGE_EXTENSIONS,
} from '../../utils/validation';

export interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  onUploadingChange?: (isUploading: boolean) => void;
}

interface UploadItem {
  id: string;
  previewUrl: string;
  file?: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = MAX_IMAGE_COUNT,
  onUploadingChange,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState<UploadItem[]>([]);

  const updateUploadingState = (uploads: UploadItem[]) => {
    const uploading = uploads.some((u) => u.status === 'uploading');
    onUploadingChange?.(uploading);
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const currentTotal = images.length + activeUploads.filter((u) => u.status === 'uploading').length;
    const slotCheck = validateImageSlots(currentTotal, files.length, maxImages);

    if (slotCheck.allowedCount <= 0) {
      showToast(slotCheck.error || `Maximum ${maxImages} images allowed per listing.`, 'error');
      return;
    }

    const filesToUpload: File[] = [];

    for (const file of files) {
      if (filesToUpload.length >= slotCheck.allowedCount) {
        if (slotCheck.error) {
          showToast(slotCheck.error, 'info');
        }
        break;
      }

      // Format and size validation
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        showToast(validation.error || 'Invalid image file.', 'error');
        continue;
      }

      // Prevent duplicate selection by name and size
      const isDuplicateInActive = activeUploads.some(
        (u) => u.file && u.file.name === file.name && u.file.size === file.size
      );
      if (isDuplicateInActive) {
        showToast(`"${file.name}" is already being uploaded.`, 'info');
        continue;
      }

      filesToUpload.push(file);
    }

    if (filesToUpload.length === 0) return;

    // Create temporary upload items for instant preview
    const newItems: UploadItem[] = filesToUpload.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      previewUrl: URL.createObjectURL(file),
      file,
      progress: 15,
      status: 'uploading',
    }));

    const nextUploads = [...activeUploads, ...newItems];
    setActiveUploads(nextUploads);
    updateUploadingState(nextUploads);

    // Upload each file individually to the backend
    for (const item of newItems) {
      if (!item.file) continue;

      try {
        // Read file as Base64 for upload API
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Failed to read file from local device.'));
          reader.readAsDataURL(item.file!);
        });

        // Update progress indication
        setActiveUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, progress: 65 } : u))
        );

        // Upload through secure backend endpoint
        const res = await uploadApi.uploadImage({
          data: base64Data,
          filename: item.file.name,
          mimeType: item.file.type || 'image/jpeg',
        });

        if (res.success && res.url) {
          // Success: clean up temporary object URL and add server image URL to form
          URL.revokeObjectURL(item.previewUrl);
          onChange([...images, res.url]);

          setActiveUploads((prev) => {
            const remaining = prev.filter((u) => u.id !== item.id);
            updateUploadingState(remaining);
            return remaining;
          });
        } else {
          throw new Error(res.error || 'Failed to upload image.');
        }
      } catch (err: any) {
        showToast(err.message || `Failed to upload "${item.file.name}".`, 'error');
        URL.revokeObjectURL(item.previewUrl);

        setActiveUploads((prev) => {
          const remaining = prev.filter((u) => u.id !== item.id);
          updateUploadingState(remaining);
          return remaining;
        });
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value so re-selecting same file after removal triggers event
      e.target.value = '';
    }
  };

  const handleRemoveExisting = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleCancelUpload = (uploadId: string) => {
    setActiveUploads((prev) => {
      const target = prev.find((u) => u.id === uploadId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const remaining = prev.filter((u) => u.id !== uploadId);
      updateUploadingState(remaining);
      return remaining;
    });
  };

  const totalCount = images.length + activeUploads.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          Product Images ({totalCount}/{maxImages}) *
        </label>
        <span className="text-[11px] text-gray-500">
          {totalCount >= maxImages ? (
            <span className="text-amber-600 font-semibold">Maximum limit reached</span>
          ) : (
            `Add up to ${maxImages - totalCount} more`
          )}
        </span>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_EXTENSIONS.join(',') + ',image/jpeg,image/png,image/webp'}
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Upload Zone */}
      {totalCount < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 group ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
              : 'border-gray-300 hover:border-emerald-500 bg-gray-50/60 hover:bg-emerald-50/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div
              className={`p-3 rounded-full transition-colors ${
                isDragging
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white text-gray-500 group-hover:text-emerald-600 group-hover:bg-emerald-100 shadow-xs'
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800">
                Drag and drop images here, or{' '}
                <span className="text-emerald-700 group-hover:underline">browse files</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Upload up to {maxImages} images (JPG, PNG, WEBP) · Max 5 MB each
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Images
            </button>
          </div>
        </div>
      )}

      {/* Responsive Image Preview Grid */}
      {(images.length > 0 || activeUploads.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
          {/* Uploaded / Saved Images */}
          {images.map((url, idx) => (
            <div
              key={`img-${idx}-${url}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group shadow-2xs hover:shadow-xs transition"
            >
              <img
                src={url}
                alt={`Product photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              {/* Cover badge for first image */}
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-700 text-white shadow-xs">
                  Cover Photo
                </span>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveExisting(idx)}
                title="Remove photo"
                aria-label="Remove photo"
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition shadow-sm backdrop-blur-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Active Uploading Previews with Progress Indicator */}
          {activeUploads.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden border border-emerald-300 bg-gray-100 shadow-2xs flex flex-col items-center justify-center"
            >
              <img
                src={item.previewUrl}
                alt="Uploading preview"
                className="w-full h-full object-cover opacity-60"
              />

              {/* Uploading Overlay */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-2 text-center text-white">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mb-1" />
                <span className="text-[10px] font-semibold">Uploading...</span>
                <div className="w-full bg-white/30 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              {/* Cancel upload button */}
              <button
                type="button"
                onClick={() => handleCancelUpload(item.id)}
                title="Cancel upload"
                aria-label="Cancel upload"
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition shadow-sm backdrop-blur-xs z-10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
