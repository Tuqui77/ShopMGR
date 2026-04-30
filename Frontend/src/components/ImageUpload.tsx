import { useState, useRef, useCallback } from 'react';
import { Plus, X, Loader2, Upload } from 'lucide-react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface Props {
  onUpload?: (files: File[]) => Promise<void>;
  onUploadComplete?: (files: File[]) => void;
  maxFiles?: number;
}

export function ImageUpload({
  onUpload,
  onUploadComplete,
  maxFiles,
}: Props = {}) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Filter by accepted formats
    const validFiles = files.filter(file => {
      return file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
    });

    if (validFiles.length === 0) return;

    // Check max files limit
    const availableSlots = maxFiles !== undefined ? maxFiles - images.length : validFiles.length;
    const filesToAdd = maxFiles ? validFiles.slice(0, availableSlots) : validFiles;
    
    if (maxFiles && filesToAdd.length < validFiles.length) {
      console.warn(`Limitado a ${filesToAdd.length} archivos (maximo: ${maxFiles})`);
    }

    // Create preview URLs
    const newImages: ImageFile[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (onUpload) {
        // Use actual upload function
        await onUpload(filesToAdd);
        setUploadProgress(100);
      } else {
        // Mock upload for development
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return Math.min(prev + Math.random() * 15 + 5, 100);
          });
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 2000));
        clearInterval(progressInterval);
        setUploadProgress(100);
      }
      
      // Success - notify parent but don't store locally
      // The work detail page will refresh with updated photos from server
      setImages([]); // Clear any pending images
      onUploadComplete?.(filesToAdd);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error al subir las imágenes');
      
      // Clean up preview URLs on error
      newImages.forEach(img => URL.revokeObjectURL(img.preview));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [maxFiles, images.length, onUploadComplete, onUpload]);

  const handleRemove = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        // Revoke URL to avoid memory leaks
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  return (
    <div className="mt-4">
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={ ".jpg,.jpeg,.png,.webp" }
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-danger)', color: 'white' }}>
          {error}
        </div>
      )}

      {/* Upload button or progress bar */}
      {isUploading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Subiendo...</span>
            <span className="ml-auto font-mono">{Math.round(uploadProgress)}%</span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--color-accent)',
              }}
            />
          </div>
        </div>
      ) : images.length > 0 ? (
        <div className="space-y-3">
          {/* Preview grid */}
          <div className="grid grid-cols-4 gap-2">
            {images.map(img => (
              <div 
                key={img.id}
                className="relative group aspect-square rounded-lg overflow-hidden"
              >
                <img 
                  src={img.preview} 
                  alt={img.file.name}
                  className="w-full h-full object-cover"
                />
                {/* Remove button overlay */}
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Eliminar ${img.file.name}`}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}
            
            {/* Add more button */}
            <button
              type="button"
              onClick={handleClick}
              className="aspect-square rounded-lg flex items-center justify-center transition-colors border-2 border-dashed cursor-pointer"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-muted)',
                opacity: 1,
              }}
              aria-label="Agregar más fotos"
            >
              <Plus className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
            </button>
          </div>
          
          {/* Clear all button */}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs"
            style={{ color: 'var(--color-danger)' }}
          >
            Borrar todas las fotos
          </button>
        </div>
      ) : (
        /* Empty state - Upload button */
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border cursor-pointer"
          style={{ 
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-muted)',
            opacity: 1,
          }}
        >
          <Upload className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text)' }}>
            Agregar fotos
          </span>
        </button>
      )}
    </div>
  );
}