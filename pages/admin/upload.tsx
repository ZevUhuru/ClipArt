import { useState } from 'react';
import AdminLayout from 'src/components/Admin/Layout';
import UploadZone from 'src/components/Admin/UploadZone';
import ImageEditor from 'src/components/Admin/ImageEditor';
import { ImageFormData, UploadedFile } from 'src/utils/types';

interface UploadedImageData {
  file: File;
  uploadedData: UploadedFile;
  metadata?: ImageFormData;
}

export default function AdminUploadPage() {
  const [step, setStep] = useState<'select' | 'upload' | 'edit'>('select');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageData[]>([]);
  const [currentEditIndex, setCurrentEditIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setError(null);
  };

  const handleUploadToCloudinary = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setStep('upload');

    const uploaded: UploadedImageData[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload-to-cloudinary', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Upload error:', errorData);
          throw new Error(errorData.details || errorData.error || `Failed to upload ${file.name}`);
        }

        const data = await response.json();
        console.log('Upload success:', data);
        uploaded.push({
          file,
          uploadedData: data,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: '',
            alt_text: '',
            tags: [],
            category: '',
            published: true,
          },
        });

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      setUploadedImages(uploaded);
      setStep('edit');
      setCurrentEditIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('select');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMetadata = async (metadata: ImageFormData) => {
    const currentImage = uploadedImages[currentEditIndex];
    
    try {
      // Save to database
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentImage.uploadedData,
          ...metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save image');
      }

      // Move to next image or finish
      if (currentEditIndex < uploadedImages.length - 1) {
        setCurrentEditIndex(currentEditIndex + 1);
      } else {
        // All done!
        alert(`Successfully uploaded and saved ${uploadedImages.length} images!`);
        resetUpload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleSkip = () => {
    if (currentEditIndex < uploadedImages.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    } else {
      resetUpload();
    }
  };

  const resetUpload = () => {
    setSelectedFiles([]);
    setUploadedImages([]);
    setCurrentEditIndex(0);
    setStep('select');
    setError(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Images</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload clip art images to your collection
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Files */}
        {step === 'select' && (
          <div className="space-y-4">
            <UploadZone onFilesSelected={handleFilesSelected} />
            
            {selectedFiles.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleUploadToCloudinary}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'} to Cloudinary
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Uploading */}
        {step === 'upload' && uploading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">⏳</div>
              <h3 className="text-lg font-medium text-gray-900">
                Uploading to Cloudinary...
              </h3>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {uploadProgress}% complete
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Edit Metadata */}
        {step === 'edit' && uploadedImages.length > 0 && (
          <ImageEditor
            imageUrl={uploadedImages[currentEditIndex].uploadedData.cloudinary_secure_url}
            initialData={uploadedImages[currentEditIndex].metadata}
            onSave={handleSaveMetadata}
            onSkip={handleSkip}
            currentIndex={currentEditIndex}
            totalImages={uploadedImages.length}
          />
        )}
      </div>
    </AdminLayout>
  );
}

