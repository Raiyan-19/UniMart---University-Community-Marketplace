import { RegisterPayload } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Standard university/academic email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

export function isUniversityEmail(email: string, domain?: string): boolean {
  if (!isValidEmail(email)) return false;
  const cleanEmail = email.trim().toLowerCase();
  const emailDomain = cleanEmail.split('@')[1] || '';
  if (domain) {
    const cleanDomain = domain.trim().toLowerCase();
    return emailDomain === cleanDomain || emailDomain.endsWith(`.${cleanDomain}`);
  }
  // Generic university check
  return (
    emailDomain.includes('.edu') ||
    emailDomain.includes('.ac.') ||
    emailDomain.endsWith('.bd') ||
    emailDomain.startsWith('student.')
  );
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
}

export function validateRegistration(
  payload: Partial<RegisterPayload>,
  universityDomain?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.name || payload.name.trim().length < 2) {
    errors.name = 'Full name is required (at least 2 characters)';
  }

  if (!payload.email || !isValidEmail(payload.email)) {
    errors.email = 'A valid university email address is required';
  } else if (universityDomain && !isUniversityEmail(payload.email, universityDomain)) {
    errors.email = `Please use your official university email (@${universityDomain})`;
  }

  const passCheck = validatePassword(payload.password || '');
  if (!passCheck.isValid) {
    errors.password = passCheck.message || 'Invalid password';
  }

  if (!payload.role || !['student', 'teacher'].includes(payload.role)) {
    errors.role = 'Role must be either Student or Teacher';
  }

  if (!payload.universityId) {
    errors.universityId = 'Please select your university';
  }

  if (!payload.departmentId) {
    errors.departmentId = 'Please select your department';
  }

  if (payload.role === 'student' && (!payload.studentId || payload.studentId.trim().length === 0)) {
    errors.studentId = 'Student ID is required for student registration';
  }

  if (payload.role === 'teacher' && (!payload.designation || payload.designation.trim().length === 0)) {
    errors.designation = 'Teacher designation is required (e.g. Lecturer, Assistant Professor)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Image upload restrictions
export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function validateImageFile(file: { name: string; size: number; type?: string }): {
  isValid: boolean;
  error?: string;
} {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isMimeValid = file.type ? ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase()) : false;
  const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(extension);

  if (!isMimeValid && !isExtValid) {
    return {
      isValid: false,
      error: `"${file.name}" has an unsupported format. Please upload JPG, PNG, or WEBP images.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `"${file.name}" exceeds the 5 MB size limit (${sizeMB} MB).`,
    };
  }

  return { isValid: true };
}

export function validateImageSlots(
  currentCount: number,
  incomingCount: number,
  maxCount: number = MAX_IMAGE_COUNT
): {
  allowedCount: number;
  isExceeded: boolean;
  error?: string;
} {
  const remaining = Math.max(0, maxCount - currentCount);
  if (remaining === 0) {
    return {
      allowedCount: 0,
      isExceeded: true,
      error: `Maximum ${maxCount} images allowed per listing.`,
    };
  }

  if (incomingCount > remaining) {
    return {
      allowedCount: remaining,
      isExceeded: true,
      error: `Only ${remaining} more image${remaining > 1 ? 's' : ''} can be added (Maximum ${maxCount}).`,
    };
  }

  return {
    allowedCount: incomingCount,
    isExceeded: false,
  };
}
