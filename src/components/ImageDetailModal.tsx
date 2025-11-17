import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DownloadEmailModal from './DownloadEmailModal';
import downloadPhoto from 'src/utils/downloadPhoto';

interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle: string;
  category?: string;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageTitle,
  category
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const handleDownloadClick = () => {
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (email: string) => {
    try {
      // Call download API to track email + download
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          imageUrl,
          imageTitle,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record download');
      }

      // Actually download the image
      const filename = imageUrl.split('/').pop() || 'clip-art.png';
      downloadPhoto(imageUrl, filename);

      setHasDownloaded(true);
      setShowEmailModal(false);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setHasDownloaded(false);
      }, 1500);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-40">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                {imageTitle}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <div className="relative max-w-full max-h-[60vh]">
                <Image
                  src={imageUrl}
                  alt={imageTitle}
                  width={800}
                  height={800}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  unoptimized
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold mr-2">
                      {category}
                    </span>
                  )}
                  <span>Free download • No license needed</span>
                </div>
                <button
                  onClick={handleDownloadClick}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  {hasDownloaded ? 'Downloaded!' : 'Download Free'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Email Capture Modal */}
      <DownloadEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onEmailSubmit={handleEmailSubmit}
        imageUrl={imageUrl}
        imageTitle={imageTitle}
      />
    </>
  );
};

export default ImageDetailModal;

