import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { XMarkIcon, PhotoIcon, PencilIcon } from '@heroicons/react/24/outline';
import 'react-image-crop/dist/ReactCrop.css';

// Define crop types locally to avoid import issues
interface Crop {
  unit: '%' | 'px';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PixelCrop {
  unit: 'px';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUpdate: (photoUrl: string) => void;
  onUpload: (file: File) => Promise<{ photoUrl: string }>;
  className?: string;
}

function centerAspectCrop(
  _mediaWidth: number,
  _mediaHeight: number,
  aspect: number,
): Crop {
  // Calculate crop dimensions maintaining aspect ratio
  const cropWidth = 90; // 90% width
  const cropHeight = cropWidth / aspect;
  
  // Center the crop
  const x = (100 - cropWidth) / 2;
  const y = Math.max(0, (100 - cropHeight) / 2);
  
  return {
    unit: '%',
    x,
    y,
    width: cropWidth,
    height: cropHeight,
  };
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUpdate,
  onUpload,
  className = ''
}) => {
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aspect = 1; // Square aspect ratio

  const onSelectFile = useCallback((files: File[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const imageUrl = reader.result?.toString() || '';
        setImageSrc(imageUrl);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onSelectFile(Array.from(files));
    }
  }, [onSelectFile]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onSelectFile,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    multiple: false,
    noClick: true // Disable dropzone click, we handle it manually
  });

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const getCroppedImg = useCallback((
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.9);
    });
  }, []);

  const handleEditPhoto = useCallback(async () => {
    if (currentPhotoUrl) {
      try {
        // Convert the current photo to a blob to avoid CORS issues
        const response = await fetch(currentPhotoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onload = () => {
          setCrop(undefined);
          setImageSrc(reader.result as string);
          setShowCropModal(true);
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to load image for editing:', error);
        toast.error('Failed to load image for editing');
      }
    }
  }, [currentPhotoUrl]);

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      toast.error('Please select a crop area');
      return;
    }

    setIsUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      if (!croppedImageBlob) {
        toast.error('Failed to crop image');
        return;
      }

      const file = new File([croppedImageBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      const result = await onUpload(file);
      
      onPhotoUpdate(result.photoUrl);
      toast.success('Profile photo updated successfully!');
      setShowCropModal(false);
      setImageSrc('');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, getCroppedImg, onUpload, onPhotoUpdate]);

  return (
    <>
      <div className={className}>
        <div className="flex items-center space-x-4">
          {/* Current Photo Preview */}
          <div className="relative">
            {currentPhotoUrl ? (
              <div className="relative group">
                <img
                  src={currentPhotoUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  onClick={handleEditPhoto}
                  className="absolute inset-0 w-20 h-20 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200"
                  title="Edit Photo"
                >
                  <PencilIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                <PhotoIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div className="flex-1">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            {/* Visible upload area with drag & drop */}
            <div
              {...getRootProps()}
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <input {...getInputProps()} style={{ display: 'none' }} />
              <PhotoIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop the image here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG up to 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crop Your Photo</h3>
              <button
                onClick={() => setShowCropModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={100}
                minHeight={100}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  className="max-h-96 w-auto"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCropModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                disabled={isUploading || !completedCrop}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
