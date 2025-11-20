'use client';

import { useRef, useState } from 'react';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Profile Picture Upload Component
 *
 * Features:
 * - Image upload with drag & drop support
 * - File validation (type, size)
 * - Image preview before upload
 * - Automatic compression and optimization
 * - Error handling and user feedback
 * - Accessible keyboard navigation
 *
 * @param currentAvatarUrl - Current avatar URL (if exists)
 * @param onUploadSuccess - Callback when upload succeeds
 * @param size - Avatar display size (default: 'medium')
 */
export default function ProfilePictureUpload({
  currentAvatarUrl,
  onUploadSuccess,
  size = 'medium',
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Size configurations
  const sizeClasses = {
    small: 'h-16 w-16',
    medium: 'h-24 w-24',
    large: 'h-32 w-32',
  };

  const avatarSize = sizeClasses[size];

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.',
      };
    }

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Please upload an image smaller than 2MB.',
      };
    }

    return { valid: true };
  };

  /**
   * Compress and optimize image before upload
   */
  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve: unknown, reject: unknown) => {
      const reader = new FileReader();
      reader.onload = (e: unknown) => {
        const img = document.createElement('img');
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate dimensions (max 800x800, maintain aspect ratio)
          const maxDimension = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob: unknown) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/webp', // Convert to WebP for better compression
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Handle file selection
   */
  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload automatically after selection
    await uploadAvatar(file);
  };

  /**
   * Upload avatar to Supabase Storage
   */
  const uploadAvatar = async (file: File) => {
    if (!user) {
      setError('You must be logged in to upload a profile picture');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      logger.info('Starting avatar upload', {
        component: 'ProfilePictureUpload',
        action: 'upload_start',
        metadata: { fileSize: file.size, fileType: file.type },
      });

      // Optimize image
      const optimizedBlob = await optimizeImage(file);

      // ✅ BULLETPROOF FIX: Use UNIQUE filename with timestamp
      // This prevents browser caching issues - each upload gets a NEW URL!
      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.webp`;

      // ✅ Delete old avatar BEFORE upload (proper cleanup)
      if (currentAvatarUrl && currentAvatarUrl.includes('supabase.co')) {
        try {
          // Extract path from URL (handle query params like ?v=123)
          const url = new URL(currentAvatarUrl);
          const pathParts = url.pathname.split('/');
          const oldPath = pathParts.slice(-2).join('/');

          logger.info('Cleaning up old avatar before upload', {
            component: 'ProfilePictureUpload',
            action: 'cleanup_old_avatar',
            metadata: { oldPath },
          });

          const { error: deleteError } = await supabase.storage.from('avatars').remove([oldPath]);

          if (deleteError) {
            logger.warn('Failed to delete old avatar (continuing anyway)', {
              component: 'ProfilePictureUpload',
              action: 'cleanup_warning',
              metadata: { error: deleteError.message },
            });
          }
        } catch (cleanupError: unknown) {
          // Non-critical error - continue with upload
          logger.warn('Error during old avatar cleanup (continuing)', {
            component: 'ProfilePictureUpload',
            action: 'cleanup_error',
            metadata: { error: cleanupError.message },
          });
        }
      }

      // ✅ Upload new avatar with UNIQUE filename
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, optimizedBlob, {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000', // 1 year cache (safe - unique filename!)
          upsert: false, // Don't overwrite - each upload is unique
        });

      if (uploadError) throw uploadError;

      // ✅ Get public URL with cache-busting query param
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Add timestamp to URL to force browser refresh
      const publicUrl = `${urlData.publicUrl}?v=${timestamp}`;

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) throw updateError;

      // Also update users table for RLS access
      const supabaseAny: any = supabase;
      const { error: dbError } = await supabaseAny
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) {
        logger.warn('Failed to update users table (non-critical)', {
          component: 'ProfilePictureUpload',
          action: 'db_update_warning',
          metadata: { error: dbError.message },
        });
      }

      logger.info('Avatar uploaded successfully', {
        component: 'ProfilePictureUpload',
        action: 'upload_success',
        metadata: { url: publicUrl },
      });

      // ✅ FIX: Force page reload to refresh avatar everywhere
      // This ensures Navigation, Profile, and all components update immediately
      window.location.reload();
    } catch (err: unknown) {
      logger.error(
        'Avatar upload error:',
        {
          component: 'ProfilePictureUpload',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  /**
   * Remove avatar
   */
  const handleRemoveAvatar = async () => {
    if (!user || !currentAvatarUrl) return;

    try {
      setUploading(true);
      setError(null);

      // ✅ FIX: Check if avatar is from our storage or external provider (Google, GitHub)
      const isExternalAvatar =
        currentAvatarUrl.includes('googleusercontent.com') ||
        currentAvatarUrl.includes('githubusercontent.com') ||
        currentAvatarUrl.includes('graph.facebook.com') ||
        !currentAvatarUrl.includes('supabase.co');

      // Only delete from storage if it's OUR avatar
      if (!isExternalAvatar) {
        // Extract path from URL
        const oldPath = currentAvatarUrl.split('/').slice(-2).join('/');

        // Delete from storage
        const { error: deleteError } = await supabase.storage.from('avatars').remove([oldPath]);

        if (deleteError) {
          logger.warn('Failed to delete avatar from storage (continuing anyway)', {
            component: 'ProfilePictureUpload',
            action: 'storage_delete_warning',
            metadata: { error: deleteError.message },
          });
          // Don't throw - continue with metadata update
        }
      }

      // Update user metadata to remove avatar
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        },
      });

      if (updateError) throw updateError;

      // Update users table
      const supabaseAny: any = supabase;
      await supabaseAny.from('users').update({ avatar_url: null }).eq('id', user.id);

      logger.info('Avatar removed successfully', {
        component: 'ProfilePictureUpload',
        action: 'remove_success',
      });

      // ✅ FIX: Force page reload to refresh avatar everywhere
      // This ensures Navigation, Profile, and all components update
      window.location.reload();
    } catch (err: unknown) {
      logger.error(
        'Avatar removal error:',
        {
          component: 'ProfilePictureUpload',
          action: 'error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to remove profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Get display URL (preview if uploading, otherwise current avatar)
  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Display */}
      <div className="relative">
        <div
          className={`${avatarSize} relative overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {displayUrl ? (
            <img src={displayUrl} alt="Profile picture" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white">
              <span
                className={
                  size === 'small' ? 'text-2xl' : size === 'medium' ? 'text-4xl' : 'text-5xl'
                }
              >
                {user?.user_metadata?.firstName?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase() ||
                  '?'}
              </span>
            </div>
          )}

          {/* Upload overlay on hover */}
          {!uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 opacity-0 transition-all hover:bg-opacity-60 hover:opacity-100">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-white"
                aria-label="Upload profile picture"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            </div>
          )}

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center border-4 border-dashed border-blue-500 bg-blue-50 bg-opacity-90">
              <p className="text-sm font-medium text-blue-600">Drop image here</p>
            </div>
          )}
        </div>

        {/* Remove button (if avatar exists) */}
        {displayUrl && !uploading && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute -bottom-1 -right-1 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-all hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Remove profile picture"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={(e: unknown) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
        aria-label="Upload profile picture file"
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-4 rounded-lg bg-[#E1BC56] px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:bg-[#d4af49] focus:outline-none focus:ring-2 focus:ring-[#E1BC56] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <span className="flex items-center">
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Uploading...
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {displayUrl ? 'Change Picture' : 'Upload Picture'}
          </span>
        )}
      </button>

      {/* Help Text */}
      <p className="mt-2 text-center text-xs text-gray-500">
        JPG, PNG, WebP, or GIF
        <br />
        Max size: 2MB
      </p>

      {/* Drag & Drop Hint */}
      <p className="mt-1 text-center text-xs text-gray-400">or drag and drop</p>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {preview && !uploading && !error && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm text-green-600">✓ Profile picture updated successfully!</p>
        </div>
      )}
    </div>
  );
}
