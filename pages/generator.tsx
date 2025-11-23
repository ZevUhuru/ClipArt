import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import PreLaunchHeader from 'src/components/PreLaunchHeader';
import Footer from 'src/components/footer';

const GeneratorPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'generator-landing',
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        // Track conversion for A/B test
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: 'generator_signup',
            value: 1.0,
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const examplePrompts = [
    "Watercolor Christmas tree with ornaments",
    "Cartoon style smiling sunflower",
    "Realistic Thanksgiving turkey dinner",
    "Cute kitten playing with yarn ball",
    "Halloween pumpkin with spooky face",
    "Elegant bouquet of pink roses"
  ];

  return (
    <>
      <Head>
        <title>AI Clip Art Generator - Create Custom Images in Seconds | Clip.Art</title>
        <meta
          name="description"
          content="Generate custom clip art with AI. Describe what you want, get professional images instantly. No design skills needed."
        />
        <meta property="og:title" content="AI Clip Art Generator - Clip.Art" />
        <meta property="og:description" content="Create custom clip art with AI in seconds" />
      </Head>

      <PreLaunchHeader />

      <main className="mx-auto w-full bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                New: AI-Powered Generator
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
                Create Custom Clip Art
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200">
                  In Seconds with AI
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl sm:text-2xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
                No design skills needed. Just describe what you want, and our AI creates professional clip art instantly.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 mb-10 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold">Instant Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">High Resolution</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-semibold">Commercial License</span>
                </div>
              </div>

              {/* CTA Form */}
              {!showSuccess ? (
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                    <div className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email to get started"
                        className="w-full px-6 py-4 rounded-xl text-gray-900 text-lg font-medium focus:ring-4 focus:ring-yellow-300 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Getting Your Access...
                          </>
                        ) : (
                          <>
                            Start Creating Free
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mt-4 text-blue-100 text-sm">
                      🎁 Get <strong>3 free generations</strong> when you sign up. No credit card required.
                    </p>
                  </div>
                </form>
              ) : (
                <div className="max-w-2xl mx-auto bg-green-500/20 backdrop-blur-md border border-green-300/30 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold">You're on the list!</h3>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Check your email for early access. We're launching the generator in <strong>3 days</strong>!
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Create Clip Art in 3 Simple Steps
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                From idea to download in under 30 seconds
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-300">1</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Describe Your Vision
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Type what you want: "watercolor Christmas tree" or "cartoon smiling cat"
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 font-mono">
                  "Cute kitten playing with yarn"
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-300">2</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  AI Creates Magic
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our AI generates professional clip art in seconds
                </p>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold">Generating...</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <span className="text-3xl font-black text-green-600 dark:text-green-300">3</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Download & Use
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get high-res PNG ready for any project
                </p>
                <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Example Prompts */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Try These Example Prompts
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Get inspired by what others are creating
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {examplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setPromptText(prompt)}
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {prompt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Loved by Creators Worldwide
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah M.",
                  role: "Small Business Owner",
                  text: "I needed custom clip art for my product labels. This saved me hours and hundreds of dollars!",
                  rating: 5
                },
                {
                  name: "James L.",
                  role: "Teacher",
                  text: "Perfect for creating unique educational materials. My students love the custom illustrations!",
                  rating: 5
                },
                {
                  name: "Maria C.",
                  role: "Freelance Designer",
                  text: "As a designer, this is a game-changer for quick mockups and client presentations.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              Start free, upgrade when you need more
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
                <div className="text-4xl font-black text-gray-900 dark:text-white mb-6">
                  $0<span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    3 generations per month
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    High-res PNG downloads
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Personal use license
                  </li>
                </ul>
                <button className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-xl transition-colors">
                  Get Started Free
                </button>
              </div>

              {/* Pro */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 border-2 border-blue-400 relative overflow-hidden shadow-2xl">
                <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="text-4xl font-black text-white mb-6">
                  $9.99<span className="text-lg font-normal text-blue-100">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <strong>Unlimited</strong> generations
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    No watermarks
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <strong>Commercial license</strong>
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority generation
                  </li>
                  <li className="flex items-center gap-2 text-white">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access to all bundles
                  </li>
                </ul>
                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-xl transition-colors shadow-lg">
                  Start Pro Trial
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Create Amazing Clip Art?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Join thousands of creators using AI to bring their ideas to life
            </p>
            {!showSuccess && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg px-10 py-5 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </button>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default GeneratorPage;

