import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { Pool } from 'pg';
import PreLaunchHeader from 'src/components/PreLaunchHeader';
import Footer from 'src/components/footer';
import ImageGallery from 'src/components/imageGallery';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface CategoryPageProps {
  category: string;
  images: Array<{
    id: string;
    title: string;
    slug: string;
    image_url: string;
  }>;
}

export default function CategoryPage({ category, images }: CategoryPageProps) {
  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
  
  // Transform images to match ImageGallery format
  const galleryImages = images.map(img => ({
    src: img.image_url,
    title: img.title,
    slug: img.slug,
  }));

  return (
    <>
      <Head>
        <title>{categoryTitle} Clip Art - Free AI-Generated Images | Clip.Art</title>
        <meta
          name="description"
          content={`Browse our collection of ${categoryTitle.toLowerCase()} clip art. Free downloads, no license needed, AI-generated high-quality images.`}
        />
        <meta property="og:title" content={`${categoryTitle} Clip Art - Clip.Art`} />
        <meta property="og:description" content={`Free ${categoryTitle.toLowerCase()} clip art images`} />
      </Head>

      <PreLaunchHeader />

      <main className="mx-auto w-full">
        <div className="bg-footer-gradient py-12 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {categoryTitle} Clip Art
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {images.length} free {categoryTitle.toLowerCase()} images • No license needed • High-res PNG
          </p>
        </div>

        <ImageGallery 
          categoryTitle={categoryTitle}
          images={galleryImages}
        />

        <Footer />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const client = await pool.connect();
  
  try {
    // Get all unique categories
    const result = await client.query(`
      SELECT DISTINCT category
      FROM images
      WHERE published = true AND category IS NOT NULL
      ORDER BY category
    `);
    
    const paths = result.rows.map(row => ({
      params: { category: row.category },
    }));
    
    return {
      paths,
      fallback: 'blocking', // Allow new categories to be generated
    };
  } finally {
    client.release();
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const category = params?.category as string;
  
  if (!category) {
    return { notFound: true };
  }
  
  const client = await pool.connect();
  
  try {
    // Get all images in this category
    const result = await client.query(`
      SELECT id, title, slug, image_url
      FROM images
      WHERE category = $1 AND published = true
      ORDER BY created_at DESC
    `, [category]);
    
    if (result.rows.length === 0) {
      return { notFound: true };
    }
    
    return {
      props: {
        category,
        images: result.rows,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } finally {
    client.release();
  }
};

