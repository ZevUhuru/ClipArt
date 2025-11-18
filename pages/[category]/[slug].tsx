import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { Pool } from 'pg';
import { useState } from 'react';
import PreLaunchHeader from 'src/components/PreLaunchHeader';
import Footer from 'src/components/footer';
import ImageDetailModal from 'src/components/ImageDetailModal';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface ImagePageProps {
  image: {
    id: string;
    title: string;
    slug: string;
    category: string;
    image_url: string;
    description?: string;
  };
  relatedImages: Array<{
    id: string;
    title: string;
    slug: string;
    image_url: string;
  }>;
}

export default function ImagePage({ image, relatedImages }: ImagePageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const categoryTitle = image.category.charAt(0).toUpperCase() + image.category.slice(1);

  return (
    <>
      <Head>
        <title>{image.title} | {categoryTitle} Clip Art - Clip.Art</title>
        <meta
          name="description"
          content={image.description || `Free ${image.title} - High-quality AI-generated clip art. Download free, no license needed.`}
        />
        <meta property="og:title" content={`${image.title} - Free Clip Art`} />
        <meta property="og:description" content={`Free ${categoryTitle.toLowerCase()} clip art image`} />
        <meta property="og:image" content={image.image_url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={image.image_url} />
      </Head>

      <PreLaunchHeader />

      <main className="mx-auto w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Image Section */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <li><a href="/" className="hover:text-blue-600">Home</a></li>
              <li>/</li>
              <li><a href={`/${image.category}`} className="hover:text-blue-600 capitalize">{image.category}</a></li>
              <li>/</li>
              <li className="text-gray-900 dark:text-white">{image.title}</li>
            </ol>
          </nav>

          {/* Image Display */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-auto rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsModalOpen(true)}
              />
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {image.title}
                </h1>
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold capitalize">
                    {image.category}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Free Download • No License Needed
                  </span>
                </div>
              </div>

              {image.description && (
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  {image.description}
                </p>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Free
              </button>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What you get:</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    High-resolution PNG image
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    No license restrictions
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Use for personal or commercial projects
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Transparent background
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Related Images */}
        {relatedImages.length > 0 && (
          <div className="bg-white dark:bg-gray-800 py-12">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                More {categoryTitle} Clip Art
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relatedImages.map((related) => (
                  <a
                    key={related.id}
                    href={`/${image.category}/${related.slug}`}
                    className="group"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={related.image_url}
                        alt={related.title}
                        className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <div className="p-2">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                          {related.title}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>

      {/* Download Modal */}
      <ImageDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={image.image_url}
        imageTitle={image.title}
        category={image.category}
      />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const client = await pool.connect();
  
  try {
    // Get all published images
    const result = await client.query(`
      SELECT category, slug
      FROM images
      WHERE published = true AND category IS NOT NULL AND slug IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1000
    `);
    
    const paths = result.rows.map(row => ({
      params: { 
        category: row.category,
        slug: row.slug
      },
    }));
    
    return {
      paths,
      fallback: 'blocking', // Allow new images to be generated
    };
  } finally {
    client.release();
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = params?.category as string;
  const slug = params?.slug as string;
  
  if (!category || !slug) {
    return { notFound: true };
  }
  
  const client = await pool.connect();
  
  try {
    // Get the image
    const imageResult = await client.query(`
      SELECT id, title, slug, category, image_url, description
      FROM images
      WHERE category = $1 AND slug = $2 AND published = true
    `, [category, slug]);
    
    if (imageResult.rows.length === 0) {
      return { notFound: true };
    }
    
    const image = imageResult.rows[0];
    
    // Get related images from same category
    const relatedResult = await client.query(`
      SELECT id, title, slug, image_url
      FROM images
      WHERE category = $1 AND slug != $2 AND published = true
      ORDER BY RANDOM()
      LIMIT 12
    `, [category, slug]);
    
    return {
      props: {
        image,
        relatedImages: relatedResult.rows,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } finally {
    client.release();
  }
};

