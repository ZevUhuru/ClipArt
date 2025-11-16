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
                <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Premium Bundles Coming Soon
                </div>

                {/* Main Headline */}
                <h1 className="font-header text-white text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    High-Quality AI Clip Art
                    <br />
                    <span className="text-blue-400">Ready When You Are</span>
                </h1>

                {/* Subheadline */}
                <p className="text-gray-300 text-lg sm:text-xl mb-4 max-w-2xl leading-relaxed">
                    Join the waitlist and be first to access exclusive AI-generated clip art bundles. 
                    <span className="text-white font-semibold"> Plus, get a free starter pack!</span>
                </p>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-4 mb-8 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Commercial use</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>High resolution</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Early bird pricing</span>
                    </div>
                </div>

                {/* Email Signup Form */}
                <div className="w-full max-w-2xl">
                    <EmailSignup 
                        source="hero"
                        title=""
                        description=""
                        buttonText="Get Early Access"
                        placeholderText="Enter your email"
                        successMessage="🎉 You're on the list! Check your email for your free starter pack."
                        centered={true}
                    />
                </div>

                {/* Small print */}
                <p className="text-gray-500 text-xs mt-4">
                    No spam, ever. Unsubscribe anytime.
                </p>
            </div>
        </div>
    )
}

export default HeroSection;
