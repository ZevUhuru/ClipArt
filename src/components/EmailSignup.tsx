import React, { useState, FormEvent } from 'react';

interface EmailSignupProps {
  source?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  successMessage?: string;
  placeholderText?: string;
  centered?: boolean;
}

export default function EmailSignup({
  source = 'homepage',
  title = 'Join Our Waitlist',
  description = 'Be the first to get notified when we launch premium bundles',
  buttonText = 'Join Waitlist',
  successMessage = 'Success! Check your email for confirmation.',
  placeholderText = 'Enter your email',
  centered = true,
}: EmailSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setEmail('');
      
      // Reset to idle after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      
      // Reset error after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const textAlignClass = centered ? 'text-center' : 'text-left';

  return (
    <div className={`w-full max-w-xl mx-auto ${textAlignClass}`}>
      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 animate-fade-in">
          <div className="flex items-center justify-center mb-2">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-1">You're In!</h3>
          <p className="text-green-700">{successMessage}</p>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholderText}
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  Joining...
                </span>
              ) : (
                buttonText
              )}
            </button>
          </form>

          {status === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

