import React from 'react';
import Image from 'next/image';
import EmailSignup from 'src/components/EmailSignup';

const HeroSection = () => {
    return (
        <div className="relative hero-container flex flex-col justify-center items-center h-full w-full bg-black border-b border-gray-900 bg-no-repeat bg-center bg-cover min-h-[650px]">
            {/* Background Image */}
            <Image
                src="https://assets.codepen.io/9394943/laughing-santa-2.png"
                alt="Hero Background"
                layout="fill"
                objectFit="cover"
                quality={100}
                priority={true}
                className="z-0 opacity-40"
            />
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-0" />
            
            {/* Content */}
            <div className="z-10 relative flex flex-col items-center justify-center text-center px-4 py-16 max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/40 text-yellow-300 px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Launching Soon • Bundles from $7.99
                </div>

                {/* Main Headline */}
                <h1 className="font-header text-white text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    Professional Clip Art
                    <br />
                    <span className="text-blue-400">Without the Professional Price</span>
                </h1>

                {/* Subheadline */}
                <p className="text-gray-300 text-lg sm:text-xl mb-4 max-w-2xl leading-relaxed">
                    Get 100+ high-quality AI clip art images for <span className="text-yellow-400 font-bold">under $10.</span>
                    <span className="text-white font-semibold"> Join the waitlist for early-bird pricing + a free starter pack.</span>
                </p>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-8 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Commercial license</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">High-res PNG</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-yellow-400">30% off early access</span>
                    </div>
                </div>

                {/* Email Signup Form */}
                <div className="w-full max-w-2xl">
                    <EmailSignup 
                        source="hero"
                        title=""
                        description=""
                        buttonText="Get My Free Pack + 30% Off"
                        placeholderText="Enter your email"
                        successMessage="🎉 You're in! We'll email you when we launch with your free pack and exclusive 30% discount."
                        centered={true}
                    />
                </div>

                {/* Small print */}
                <p className="text-gray-400 text-xs mt-4 flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    100% spam-free. Unsubscribe anytime.
                </p>
            </div>
        </div>
    )
}

export default HeroSection;
