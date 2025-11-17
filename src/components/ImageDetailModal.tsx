import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import downloadPhoto from 'src/utils/downloadPhoto';

interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageTitle: string;
  category?: string;
}

type ModalState = 'view' | 'email' | 'downloading' | 'success';

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageTitle,
  category
}) => {
  const [state, setState] = useState<ModalState>('view');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleDownloadClick = () => {
    setState('email');
    setError('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setState('downloading');

    try {
      // Call download API to track email + download
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
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

      setState('success');
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.');
      setState('email');
    }
  };

  const handleClose = () => {
    setState('view');
    setEmail('');
    setError('');
    onClose();
  };

  const handleBackToView = () => {
    setState('view');
    setError('');
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
              {state === 'email' ? 'Get Your Free Download' : imageTitle}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {state === 'view' && (
              <div className="p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 min-h-[400px]">
                {/* Image */}
                <div className="relative max-w-full max-h-[60vh] mb-6">
                  <Image
                    src={imageUrl}
                    alt={imageTitle}
                    width={800}
                    height={800}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    unoptimized
                  />
                </div>

                {/* Category Badge */}
                {category && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                      {category}
                    </span>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={handleDownloadClick}
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  <ArrowDownTrayIcon className="w-6 h-6" />
                  Download Free
                </button>

                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Free download • No license needed
                </p>
              </div>
            )}

            {state === 'email' && (
              <div className="p-8">
                <div className="max-w-md mx-auto">
                  {/* Image Preview (Small) */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      <Image
                        src={imageUrl}
                        alt={imageTitle}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    Enter your email to download <span className="font-semibold text-gray-900 dark:text-white">{imageTitle}</span> for free. 
                    We'll also notify you when our bundles launch!
                  </p>

                  {/* Email Form */}
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg"
                        autoFocus
                      />
                      {error && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleBackToView}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Download Free
                      </button>
                    </div>
                  </form>

                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                    By downloading, you agree to receive updates about our clip art bundles. 
                    Unsubscribe anytime.
                  </p>
                </div>
              </div>
            )}

            {state === 'downloading' && (
              <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Downloading...</p>
              </div>
            )}

            {state === 'success' && (
              <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Download Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Your image is downloading. Check your email for updates about our bundles!
                </p>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ImageDetailModal;
