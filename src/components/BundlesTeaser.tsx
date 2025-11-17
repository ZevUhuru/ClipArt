import React from 'react';
import Link from 'next/link';

interface Bundle {
  title: string;
  description: string;
  imageCount: string;
  previewImage: string;
  price: string;
  tags: string[];
  comingSoon?: boolean;
}

const bundles: Bundle[] = [
  {
    title: 'Holiday Magic Bundle',
    description: 'Complete collection of Christmas, Halloween, and seasonal clip art',
    imageCount: '150+ images',
    previewImage: 'https://assets.codepen.io/9394943/sitting-santa-illustration.png',
    price: '$9.99',
    tags: ['Christmas', 'Halloween', 'Seasonal'],
    comingSoon: true,
  },
  {
    title: 'Nature & Flowers Pack',
    description: 'Beautiful florals, landscapes, and nature-themed illustrations',
    imageCount: '100+ images',
    previewImage: 'https://assets.codepen.io/9394943/colorful-roses-flower-clipart.png',
    price: '$7.99',
    tags: ['Flowers', 'Nature', 'Spring'],
    comingSoon: true,
  },
  {
    title: 'Cute Animals Collection',
    description: 'Adorable cats, dogs, and wildlife perfect for any project',
    imageCount: '120+ images',
    previewImage: 'https://assets.codepen.io/9394943/cute-cats-cuddling-clip-art.png',
    price: '$8.99',
    tags: ['Animals', 'Cats', 'Pets'],
    comingSoon: true,
  },
];

export default function BundlesTeaser() {
  return (
    <section className="bg-white dark:bg-gray-900 py-16 px-4">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Coming Soon
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Premium Clip Art Bundles
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Save big with our curated collections. Each bundle includes high-quality, 
            AI-generated clip art ready for commercial use.
          </p>
        </div>

        {/* Bundles Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {bundles.map((bundle, index) => (
            <div
              key={index}
              className="relative group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-xl"
            >
              {/* Coming Soon Badge */}
              {bundle.comingSoon && (
                <div className="absolute top-4 right-4 z-10 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                  Coming Soon
                </div>
              )}

              {/* Preview Image */}
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center p-8 relative overflow-hidden">
                <img
                  src={bundle.previewImage}
                  alt={bundle.title}
                  className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {bundle.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {bundle.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {bundle.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {bundle.imageCount}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bundle.price}
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  disabled
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Available Soon
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">
            Want early access and exclusive discounts?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our waitlist to get notified when bundles launch, plus receive a special 
            early-bird discount and a free starter pack.
          </p>
          <Link 
            href="#signup"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
      </div>
    </section>
  );
}

