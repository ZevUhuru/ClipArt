import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Existing images from homepage
const existingImages = [
  // Food
  { url: "https://assets.codepen.io/9394943/pecan-pie-illustration.png", category: "food", title: "Pecan Pie Illustration" },
  { url: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg-2.png", category: "food", title: "Mexican Food Illustration" },
  { url: "https://assets.codepen.io/9394943/mexican-food-illustration-whitebg.png", category: "food", title: "Mexican Food Tacos Illustration" },
  { url: "https://assets.codepen.io/9394943/produce-basket-illustration-white-bg.png", category: "food", title: "Produce Basket Illustration" },
  { url: "https://assets.codepen.io/9394943/thanksgiving-illustration-1-white-bg.png", category: "food", title: "Thanksgiving Dinner Illustration" },
  { url: "https://assets.codepen.io/9394943/pancake-illustration-1-white-bg.png", category: "food", title: "Pancake Breakfast Illustration" },
  
  // Christmas
  { url: "https://assets.codepen.io/9394943/sitting-santa-illustration.png", category: "christmas", title: "Sitting Santa Claus Illustration" },
  { url: "https://assets.codepen.io/9394943/reindeer-clipart-white-bg.png", category: "christmas", title: "Reindeer Christmas Clipart" },
  { url: "https://assets.codepen.io/9394943/life-like-santa-illustration-1-wbg.png", category: "christmas", title: "Realistic Santa Claus Illustration" },
  { url: "https://assets.codepen.io/9394943/smiling-elves-christmas-clip-art-white-background.png", category: "christmas", title: "Smiling Christmas Elves Clipart" },
  { url: "https://assets.codepen.io/9394943/christmas-tree-cookie-wbg.png", category: "christmas", title: "Christmas Tree Cookie Clipart" },
  { url: "https://assets.codepen.io/9394943/santa-smiles-icons-white-bg.png", category: "christmas", title: "Santa Smile Icons Clipart" },
  
  // Halloween
  { url: "https://assets.codepen.io/9394943/witch-pencil-style-clip-art-white-bg.png", category: "halloween", title: "Witch Pencil Style Clipart" },
  { url: "https://assets.codepen.io/9394943/african-witch-with-broomstick-white-bg.png", category: "halloween", title: "Witch With Broomstick Halloween Clipart" },
  { url: "https://assets.codepen.io/9394943/two-halloween-clip-art-pumpkins-white-bg.png", category: "halloween", title: "Two Halloween Pumpkins Clipart" },
  { url: "https://assets.codepen.io/9394943/halloween-clip-art-ghost-white-bg.png", category: "halloween", title: "Halloween Ghost Clipart" },
  { url: "https://assets.codepen.io/9394943/halloween-clipart-voodoo-dollas-white-bg.png", category: "halloween", title: "Halloween Voodoo Dolls Clipart" },
  { url: "https://assets.codepen.io/9394943/halloween-clipart-ghost-pumpkin-white-bg.png", category: "halloween", title: "Ghost And Pumpkin Halloween Clipart" },
  
  // Flowers
  { url: "https://assets.codepen.io/9394943/white-rose-woman-hair-flower-clipart.png", category: "flowers", title: "White Rose In Hair Flower Clipart" },
  { url: "https://assets.codepen.io/9394943/colorful-roses-flower-clipart.png", category: "flowers", title: "Colorful Roses Flower Clipart" },
  { url: "https://assets.codepen.io/9394943/young-girl-holding-flowers-clipart-white-bg.png", category: "flowers", title: "Girl Holding Flowers Clipart" },
  { url: "https://assets.codepen.io/9394943/pink-rose-flower-clipart-white-bg.png", category: "flowers", title: "Pink Rose Flower Clipart" },
  { url: "https://assets.codepen.io/9394943/hawaiian-biscus-flower-clip-art.png", category: "flowers", title: "Hawaiian Hibiscus Flower Clipart" },
  { url: "https://assets.codepen.io/9394943/single-smiling-sunflower-emoji-flower-clipart.png", category: "flowers", title: "Smiling Sunflower Emoji Clipart" },
  
  // Cats
  { url: "https://assets.codepen.io/9394943/two-kittens-playing-with-golf-balls-in-paint-clip-art.png", category: "cats", title: "Two Kittens Playing With Golf Balls Clipart" },
  { url: "https://assets.codepen.io/9394943/cute-kittens-holding-golf-clubs-clip-art.png", category: "cats", title: "Cute Kittens Holding Golf Clubs Clipart" },
  { url: "https://assets.codepen.io/9394943/kitten-holding-dumbbell-cat-clip-art.png", category: "cats", title: "Kitten Holding Dumbbell Clipart" },
  { url: "https://assets.codepen.io/9394943/cats-laying-in-fruit-basket-clip-art.png", category: "cats", title: "Cats In Fruit Basket Clipart" },
  { url: "https://assets.codepen.io/9394943/cute-himalayan-kittens-playing-with-golf-balls-clip-art.png", category: "cats", title: "Himalayan Kittens Playing Golf Clipart" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration of existing images...\n');
    
    await client.query('BEGIN');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const img of existingImages) {
      const slug = generateSlug(img.title);
      
      try {
        // Check if already exists
        const existingCheck = await client.query(
          'SELECT id FROM images WHERE image_url = $1',
          [img.url]
        );
        
        if (existingCheck.rows.length > 0) {
          console.log(`⏭️  Skipping (already exists): ${img.title}`);
          skipCount++;
          continue;
        }
        
        // Insert new image
        // Generate fake cloudinary_public_id from URL
        const publicId = slug;
        const tags = [img.category]; // Tags array
        
        await client.query(`
          INSERT INTO images (
            title,
            slug,
            seo_slug,
            category,
            image_url,
            cloudinary_public_id,
            cloudinary_url,
            cloudinary_secure_url,
            published,
            published_at,
            file_format,
            tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP, 'png', $9)
        `, [img.title, slug, slug, img.category, img.url, publicId, img.url, img.url, tags]);
        
        console.log(`✅ Migrated: ${img.category}/${slug}`);
        successCount++;
      } catch (err: any) {
        console.error(`❌ Error migrating ${img.title}:`, err.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✨ Migration complete!`);
    console.log(`   - ${successCount} images migrated`);
    console.log(`   - ${skipCount} images skipped (already exist)`);
    console.log(`   - Total: ${existingImages.length} images processed`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch(console.error);

