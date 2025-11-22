'use client';

import { Camera, Eye, Image as ImageIcon, Loader2, Star, Trash2, Upload, X } from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';

import {
  createEquipmentMedia,
  deleteEquipmentMedia,
  fetchEquipmentMedia,
} from '@/lib/api/admin/equipment';
import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface EquipmentMedia {
  id: string;
  equipment_id: string;
  media_type: 'image' | 'video' | 'document';
  storage_path: string;
  caption?: string;
  metadata?: Record<string, unknown>;
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

  const fetchMedia = useCallback(async () => {
    if (!equipmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('Fetching media for equipment', {
        component: 'EquipmentMediaGallery',
        action: 'fetch_media',
        metadata: { equipmentId },
      });
      const mediaData = await fetchEquipmentMedia(equipmentId);
      logger.debug('Received media data', {
        component: 'EquipmentMediaGallery',
        action: 'media_data_received',
        metadata: { equipmentId, mediaCount: mediaData?.length || 0 },
      });

      if (!Array.isArray(mediaData)) {
        logger.warn('Media data is not an array', {
          component: 'EquipmentMediaGallery',
          action: 'invalid_media_data',
          metadata: { equipmentId, dataType: typeof mediaData },
        });
        setMedia([]);
        return;
      }

      if (mediaData.length === 0) {
        logger.debug('No media found for equipment', {
          component: 'EquipmentMediaGallery',
          action: 'no_media_found',
          metadata: { equipmentId },
        });
        setMedia([]);
        return;
      }

      // Log each media item to verify structure
      mediaData.forEach((item, index) => {
        logger.debug(`Media item ${index}`, {
          component: 'EquipmentMediaGallery',
          action: 'media_item_debug',
          metadata: {
            id: item.id,
            media_type: item.media_type,
            hasUrl: !!item.url,
            url: item.url || 'missing',
            urlType: typeof item.url,
            urlStartsWithHttp: item.url ? item.url.startsWith('http') : false,
            storage_path: item.storage_path,
            fileMissing: (item as { fileMissing?: boolean }).fileMissing,
            fullItem: item,
          },
        });
      });

      // API now returns signed URLs directly, so we can use the data as-is
      setMedia(mediaData);
    } catch (error) {
      logger.error(
        'Failed to fetch equipment media',
        {
          component: 'EquipmentMediaGallery',
          action: 'fetch_media_error',
          metadata: { equipmentId },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      // Only show toast if it's not a 404 (media might not exist yet)
      if (error instanceof Error && !error.message.includes('404')) {
        toast.error('Failed to load media', 'Unable to fetch equipment media');
      }
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      logger.debug('No file selected', {
        component: 'EquipmentMediaGallery',
        action: 'no_file_selected',
      });
      return;
    }

    logger.debug('File selected', {
      component: 'EquipmentMediaGallery',
      action: 'file_selected',
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });

    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];
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

      // Create FormData for direct server-side upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type || 'application/octet-stream');
      formData.append('mediaType', mediaType);
      formData.append('caption', '');
      formData.append('isPrimary', 'false');

      logger.debug('Uploading file via FormData', {
        component: 'EquipmentMediaGallery',
        action: 'upload_start',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          mediaType,
        },
      });

      // Upload file directly via API (server handles storage upload)
      const result = await createEquipmentMedia(equipmentId, formData);

      if (!result.media) {
        throw new Error('Failed to upload media');
      }

      logger.info('Upload successful', {
        component: 'EquipmentMediaGallery',
        action: 'upload_success',
        metadata: {
          mediaId: result.media.id,
          storagePath: result.media.storage_path,
        },
      });

      toast.success('Media uploaded', 'Equipment media uploaded successfully');
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchMedia();
      onMediaChange?.();
    } catch (error) {
      logger.error(
        'Upload error',
        {
          component: 'EquipmentMediaGallery',
          action: 'upload_error',
          metadata: { equipmentId },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error(
        'Upload failed',
        error instanceof Error ? error.message : 'Failed to upload media'
      );
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
      toast.error(
        'Delete failed',
        error instanceof Error ? error.message : 'Failed to delete media'
      );
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
      toast.error(
        'Failed to set primary',
        error instanceof Error ? error.message : 'Unable to update primary image'
      );
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
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
            className="mt-4 text-sm text-premium-gold hover:text-premium-gold-dark"
          >
            Upload your first image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => {
            const hasValidUrl =
              item.media_type === 'image' && item.url && item.url.startsWith('http');
            const showPlaceholder = !hasValidUrl || (item as { fileMissing?: boolean }).fileMissing;

            return (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
              >
                {hasValidUrl ? (
                  <>
                    <img
                      src={item.url}
                      alt={item.caption || 'Equipment image'}
                      className="h-full w-full object-cover transition-opacity"
                      loading="lazy"
                      onLoad={() => {
                        logger.debug('Image loaded successfully', {
                          component: 'EquipmentMediaGallery',
                          action: 'image_loaded',
                          metadata: { mediaId: item.id },
                        });
                      }}
                      onError={(e) => {
                        logger.error('Image failed to load', {
                          component: 'EquipmentMediaGallery',
                          action: 'image_load_error',
                          metadata: {
                            id: item.id,
                            url: item.url,
                            storage_path: item.storage_path,
                          },
                        });
                        // Hide image and show placeholder
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="image-placeholder hidden h-full items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-xs text-gray-500">Failed to load</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-2">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    {showPlaceholder && (
                      <p className="mt-1 text-center text-xs text-gray-500">
                        {(item as { fileMissing?: boolean }).fileMissing
                          ? 'File missing'
                          : 'No image'}
                      </p>
                    )}
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
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <AdminModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        title="Upload Media"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
            <label
              htmlFor="file-upload-input"
              className="flex cursor-pointer flex-col items-center"
              onClick={(e) => {
                // Prevent label click from bubbling if input is disabled
                if (uploading) {
                  e.preventDefault();
                  return;
                }
                logger.debug('Label clicked, triggering file input', {
                  component: 'EquipmentMediaGallery',
                  action: 'label_clicked',
                });
              }}
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-600">Click to select file</span>
              <span className="text-xs text-gray-500">Images or videos (max 10MB)</span>
              <input
                id="file-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  logger.debug('File input onChange triggered', {
                    component: 'EquipmentMediaGallery',
                    action: 'file_input_change',
                    metadata: {
                      files: e.target.files?.length,
                      fileName: e.target.files?.[0]?.name,
                    },
                  });
                  handleFileSelect(e);
                }}
                onClick={(e) => {
                  logger.debug('File input clicked', {
                    component: 'EquipmentMediaGallery',
                    action: 'file_input_clicked',
                  });
                }}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      </AdminModal>

      {/* View Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90">
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
