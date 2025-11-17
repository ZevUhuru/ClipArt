import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

interface DownloadEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => Promise<void>;
  imageUrl: string;
  imageTitle?: string;
}

const DownloadEmailModal: React.FC<DownloadEmailModalProps> = ({
  isOpen,
  onClose,
  onEmailSubmit,
  imageUrl,
  imageTitle = 'this image'
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    try {
      await onEmailSubmit(email.trim().toLowerCase());
      // Don't close modal here - let parent handle it after download
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[60]">
      {/* Backdrop - darker to show it's on top */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[61]">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
          <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Get Your Free Download
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your email to download <span className="font-semibold">{imageTitle}</span> for free. 
            We'll also notify you when our bundles launch!
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Downloading...' : 'Download Free'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            By downloading, you agree to receive updates about our clip art bundles. 
            Unsubscribe anytime.
          </p>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DownloadEmailModal;

