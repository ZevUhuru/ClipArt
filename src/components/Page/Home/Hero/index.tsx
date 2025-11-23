import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import EmailSignup from 'src/components/EmailSignup';

const HeroSection = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Curated hero images showcasing variety
    const heroImages = [
        {
            src: "https://assets.codepen.io/9394943/sitting-santa-illustration.png",
            alt: "Christmas Santa Clip Art"
        },
        {
            src: "https://assets.codepen.io/9394943/two-kittens-playing-with-golf-balls-in-paint-clip-art.png",
            alt: "Cute Kittens Clip Art"
        },
        {
            src: "https://assets.codepen.io/9394943/colorful-roses-flower-clipart.png",
            alt: "Flowers Clip Art"
        },
        {
            src: "https://assets.codepen.io/9394943/halloween-clipart-ghost-pumpkin-white-bg.png",
            alt: "Halloween Clip Art"
        },
        {
            src: "https://assets.codepen.io/9394943/thanksgiving-illustration-1-white-bg.png",
            alt: "Thanksgiving Food Clip Art"
        },
        {
            src: "https://assets.codepen.io/9394943/smiling-elves-christmas-clip-art-white-background.png",
            alt: "Christmas Elves Clip Art"
        }
    ];

    // Auto-rotate images every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative hero-container flex flex-col justify-center items-center h-full w-full bg-black border-b border-gray-900 bg-no-repeat bg-center bg-cover min-h-[650px] overflow-hidden">
            {/* Background Image Carousel */}
            {heroImages.map((image, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 z-0 ${
                        index === currentImageIndex ? 'opacity-40' : 'opacity-0'
                    }`}
                >
                    <Image
                        src={image.src}
                        alt={image.alt}
                        layout="fill"
                        objectFit="cover"
                        quality={100}
                        priority={index === 0}
                        className="z-0"
                    />
                </div>
            ))}
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-0" />
            
            {/* Content */}
            <div className="z-10 relative flex flex-col items-center justify-center text-center px-4 py-16 max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-400/40 text-green-300 px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    100% Free • No Credit Card Required
                </div>

                {/* Main Headline */}
                <h1 className="font-header text-white text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    Free AI-Generated Clip Art
                    <br />
                    <span className="text-green-400">Download Now. No License Needed.</span>
                </h1>

                {/* Subheadline */}
                <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-2xl leading-relaxed">
                    High-quality clip art for any project. Download free, use forever.
                    <span className="text-white font-semibold block mt-2">29 images available now. 100+ new images added weekly.</span>
                </p>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-8 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">100% Free Forever</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">High-Res PNG</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">No License Needed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Instant Download</span>
                    </div>
                </div>

                {/* Email Signup Form */}
                <div className="w-full max-w-2xl">
                    <EmailSignup 
                        source="hero"
                        title=""
                        description=""
                        buttonText="Get Free Updates"
                        placeholderText="Enter your email"
                        successMessage="🎉 You're in! Scroll down to browse and download 29 free images now. ⬇️"
                        centered={true}
                    />
                </div>

                {/* Small print */}
                <p className="text-gray-400 text-xs mt-4 flex items-center justify-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Get notified when new images are added. 29 images available now. ⬇️
                </p>
            </div>
        </div>
    )
}

export default HeroSection;
