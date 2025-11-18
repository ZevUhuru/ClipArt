import type { NextPage, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Pool } from 'pg'
import PreLaunchHeader from 'src/components/PreLaunchHeader'
import FreeTrialSection from 'src/components/freeTrialSection'
import FAQSection from 'src/components/faqSection'
import ImageGallery from 'src/components/imageGallery'
import Footer from 'src/components/footer'
import HeroSection from 'src/components/Page/Home/Hero'
import BundlesTeaser from 'src/components/BundlesTeaser'
import ComparisonSection from 'src/components/ComparisonSection'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

interface HomeProps {
  foodImages: Array<{ src: string; slug: string; title: string }>;
  christmasImages: Array<{ src: string; slug: string; title: string }>;
  halloweenImages: Array<{ src: string; slug: string; title: string }>;
  flowerImages: Array<{ src: string; slug: string; title: string }>;
  catImages: Array<{ src: string; slug: string; title: string }>;
}

const Home: NextPage<HomeProps> = ({ foodImages, christmasImages, halloweenImages, flowerImages, catImages }) => {
  return (
    <>
      <Head>
        <title>Free Clip Art - Ai Generated with Modern Themes and Designs</title>
        <meta
          property="og:image"
          content="https://assets.codepen.io/9394943/clip-art-logo-cover.png"
        />
        <meta
          name="twitter:image"
          content="https://assets.codepen.io/9394943/clip-art-logo-cover.png"
        />
      </Head>

      <PreLaunchHeader />
      
      <main className="mx-auto w-full">
        <HeroSection />

        <ComparisonSection />

        {/* Browse anchor for header navigation */}
        <div id="browse" className="relative -top-20" />
        
        <ImageGallery categoryTitle={"Food"} images={foodImages} />
        <ImageGallery categoryTitle={"Christmas"} images={christmasImages} />
        <ImageGallery categoryTitle={"Halloween"} images={halloweenImages} />
        <ImageGallery categoryTitle={"Flowers"} images={flowerImages} />
        
        <BundlesTeaser />
        
        <ImageGallery categoryTitle={"Cats"} images={catImages} />

        <div id="signup">
          <FreeTrialSection />
        </div>

        <FAQSection />
        <Footer />
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const client = await pool.connect();
  
  try {
    // Fetch images by category from database
    const fetchImagesByCategory = async (category: string, limit: number = 6) => {
      const result = await client.query(`
        SELECT image_url as src, slug, title
        FROM images
        WHERE category = $1 AND published = true
        ORDER BY created_at DESC
        LIMIT $2
      `, [category, limit]);
      return result.rows;
    };

    const [foodImages, christmasImages, halloweenImages, flowerImages, catImages] = await Promise.all([
      fetchImagesByCategory('food', 6),
      fetchImagesByCategory('christmas', 6),
      fetchImagesByCategory('halloween', 6),
      fetchImagesByCategory('flowers', 6),
      fetchImagesByCategory('cats', 5),
    ]);

    return {
      props: {
        foodImages,
        christmasImages,
        halloweenImages,
        flowerImages,
        catImages,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } finally {
    client.release();
  }
};

export default Home