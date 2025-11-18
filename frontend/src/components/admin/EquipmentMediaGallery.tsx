'use client';

import { useAdminToast } from './AdminToastProvider';
import { fetchEquipmentMedia, createEquipmentMedia, deleteEquipmentMedia } from '@/lib/api/admin/equipment';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import { Camera, Image as ImageIcon, Upload, X, Star, Trash2, Loader2, Eye } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface EquipmentMedia {
  id: string;
  equipment_id: string;
  media_type: 'image' | 'video' | 'document';
  storage_path: string;
  caption?: string;
  metadata?: Record<string, any>;
  is_primary: boolean;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  url?: string; // Signed URL for display
}

interface EquipmentMediaGalleryProps {
  equipmentId: string;
  onMediaChange?: () => void;
}

export function EquipmentMediaGallery({ equipmentId, onMediaChange }: EquipmentMediaGalleryProps) {
  const [media, setMedia] = useState<EquipmentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<EquipmentMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useAdminToast();

  useEffect(() => {
    fetchMedia();
  }, [equipmentId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await fetchEquipmentMedia(equipmentId);

      // Generate signed URLs for each media item
      const mediaWithUrls = await Promise.all(
        mediaData.map(async (item: any) => {
          try {
            const { data } = await supabase.storage
              .from('equipment-media')
              .createSignedUrl(item.storage_path, 3600);
            return { ...item, url: data?.signedUrl };
          } catch {
            return item;
          }
        })
      );

      setMedia(mediaWithUrls);
    } catch (error) {
      toast.error('Failed to load media', 'Unable to fetch equipment media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', 'Please select an image or video file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', 'Maximum file size is 10MB');
      return;
    }

    try {
      setUploading(true);

      // Determine media type
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

      // Create media record and get signed upload URL
      const result = await createEquipmentMedia(equipmentId, {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        mediaType,
        caption: '',
        isPrimary: false,
      });

      if (!result.upload?.url) {
        throw new Error('Failed to get upload URL');
      }

      // Upload file to signed URL
      const uploadResponse = await fetch(result.upload.url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      toast.success('Media uploaded', 'Equipment media uploaded successfully');
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchMedia();
      onMediaChange?.();
    } catch (error) {
      toast.error('Upload failed', error instanceof Error ? error.message : 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      await deleteEquipmentMedia(equipmentId, { mediaId });
      toast.success('Media deleted', 'Equipment media deleted successfully');
      await fetchMedia();
      onMediaChange?.();
    } catch (error) {
      toast.error('Delete failed', error instanceof Error ? error.message : 'Failed to delete media');
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    try {
      // Update primary status via API
      const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, isPrimary: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to update primary status');
      }

      await fetchMedia();
      toast.success('Primary image updated', 'Primary image set successfully');
      onMediaChange?.();
    } catch (error) {
      toast.error('Failed to set primary', error instanceof Error ? error.message : 'Unable to update primary image');
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Media Gallery</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-md bg-kubota-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Upload className="h-4 w-4" />
          Upload Media
        </button>
      </div>

      {media.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <Camera className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No media uploaded yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
          >
            Upload your first image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              {item.media_type === 'image' && item.url ? (
                <img
                  src={item.url}
                  alt={item.caption || 'Equipment image'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {item.is_primary && (
                <div className="absolute left-2 top-2 rounded-full bg-yellow-500 p-1">
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/50">
                <div className="flex h-full items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setSelectedMedia(item)}
                    className="rounded-md bg-white/90 p-2 hover:bg-white"
                    aria-label="View media"
                  >
                    <Eye className="h-4 w-4 text-gray-700" />
                  </button>
                  {!item.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(item.id)}
                      className="rounded-md bg-white/90 p-2 hover:bg-white"
                      aria-label="Set as primary"
                    >
                      <Star className="h-4 w-4 text-gray-700" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-md bg-white/90 p-2 hover:bg-white"
                    aria-label="Delete media"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload Media</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
                <label className="flex cursor-pointer flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-600">Click to select file</span>
                  <span className="text-xs text-gray-500">Images or videos (max 10MB)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 hover:bg-white"
            >
              <X className="h-5 w-5 text-gray-900" />
            </button>
            {selectedMedia.media_type === 'image' && selectedMedia.url && (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption || 'Equipment image'}
                className="max-h-[90vh] max-w-[90vw] rounded-lg"
              />
            )}
            {selectedMedia.caption && (
              <div className="mt-2 rounded-lg bg-white/90 p-4 text-sm text-gray-900">
                {selectedMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

