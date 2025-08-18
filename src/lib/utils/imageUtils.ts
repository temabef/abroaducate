/**
 * Image compression and upload utilities for the blog system
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Compress an image file to reduce size for Supabase storage
 */
export function compressImage(
  file: File, 
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        const outputFormat = format === 'png' ? 'image/png' : 
                           format === 'webp' ? 'image/webp' : 'image/jpeg';
        
        canvas.toBlob((blob) => {
          if (blob) {
            const extension = format === 'png' ? 'png' : 
                            format === 'webp' ? 'webp' : 'jpg';
            
            const compressedFile = new File([blob], 
              file.name.replace(/\.[^/.]+$/, `.${extension}`), {
              type: outputFormat,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, outputFormat, quality);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a unique filename for blog images
 */
export function generateImageFilename(originalName: string, prefix = 'blog'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Image file must be smaller than 10MB' 
    };
  }
  
  return { valid: true };
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Cleanup preview URL to prevent memory leaks
 */
export function cleanupImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

