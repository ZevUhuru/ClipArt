import React from 'react';
import EmailSignup from './EmailSignup';

function FreeTrialSection() {
    return (
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <div className="py-12 px-4 mx-auto max-w-screen-xl sm:py-20 lg:px-6">
                <div className="mx-auto max-w-3xl">
                    <EmailSignup 
                        source="homepage-cta"
                        title="Get Early Access to Premium Bundles"
                        description="Join our waitlist and be the first to access exclusive AI-generated clip art bundles. Plus, get a free starter pack when we launch!"
                        buttonText="Join Waitlist"
                        placeholderText="Enter your email"
                        successMessage="🎉 You're on the list! We'll send you exclusive early access."
                        centered={true}
                    />
                    
                    {/* Trust indicators */}
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Free starter pack</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Early access pricing</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Unsubscribe anytime</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default FreeTrialSection;
