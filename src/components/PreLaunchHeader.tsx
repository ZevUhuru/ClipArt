import React from 'react';
import Link from 'next/link';

const PreLaunchHeader: React.FC = () => {
  const scrollToSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-800">
      <nav className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="https://assets.codepen.io/9394943/color-logo-no-bg.svg" 
              className="h-8 sm:h-10" 
              alt="Clip.Art Logo" 
            />
          </Link>

          {/* Right side - Simple navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Browse link (anchor to galleries below) */}
            <a
              href="#browse"
              className="hidden sm:inline-flex text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              Browse
            </a>

            {/* Blog/Learn link */}
            <Link
              href="/learn"
              className="hidden sm:inline-flex text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              Blog
            </Link>

            {/* Primary CTA Button */}
            <button
              onClick={scrollToSignup}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Join Waitlist</span>
              <span className="sm:hidden">Join</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default PreLaunchHeader;

