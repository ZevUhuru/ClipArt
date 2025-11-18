# Production Deployment Guide

## 🚀 Deploy Image System to Production

### Step 1: Migrate Images to Supabase

Your 29 images are currently in **local PostgreSQL**. They need to be in **Supabase (production)**.

#### Option A: Run Migration Script (Recommended)

```bash
# 1. Set production DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres:[clipart987654123]@db.twzrjshsyvqmhqjolbzy.supabase.co:6543/postgres"

# 2. Run migration
npm run migrate:images

# 3. Verify
psql $DATABASE_URL -c "SELECT category, COUNT(*) FROM images GROUP BY category;"
```

#### Option B: Via Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/twzrjshsyvqmhqjolbzy/sql
2. Copy contents of `scripts/migrate-existing-images.ts` (the INSERT statements)
3. Run in SQL Editor

**Expected Result:**
```
✅ 29 images migrated
   - 6 Christmas
   - 6 Food
   - 6 Halloween
   - 6 Flowers
   - 5 Cats
```

---

### Step 2: Verify Netlify Environment Variables

Go to: Netlify → Site Settings → Environment Variables

**Required:**
```bash
DATABASE_URL=postgresql://postgres:[clipart987654123]@db.twzrjshsyvqmhqjolbzy.supabase.co:6543/postgres
ADMIN_PASSWORD=[your-password]
ADMIN_JWT_SECRET=[your-secret]
ADMIN_SECRET=[your-secret]
NODE_ENV=production
```

⚠️ **Critical:** Use connection pooler port **6543** (not 5432) for Netlify serverless functions!

---

### Step 3: Commit and Deploy

```bash
# 1. Check what's changed
git status

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "feat: Add database-driven image system with SEO URLs

- Migrate 29 images to database
- Add category pages (/christmas, /food, etc)
- Add individual image pages with SEO-friendly URLs
- Update homepage to pull from database
- Implement email-first download flow
- Fix modal UX for direct email input"

# 4. Push to main
git push origin main
```

**Netlify will automatically:**
1. Detect push to main
2. Run `npm run build`
3. Connect to Supabase
4. Fetch images from database
5. Generate static pages for all 29 images
6. Deploy to production

---

### Step 4: Verify Production URLs

After deployment, test these URLs:

**Category Pages:**
```
https://clip.art/christmas
https://clip.art/food
https://clip.art/halloween
https://clip.art/flowers
https://clip.art/cats
```

**Individual Images:**
```
https://clip.art/christmas/sitting-santa-claus-illustration
https://clip.art/food/pecan-pie-illustration
https://clip.art/halloween/witch-pencil-style-clipart
https://clip.art/flowers/pink-rose-flower-clipart
https://clip.art/cats/kitten-holding-dumbbell-clipart
```

**Expected:**
- ✅ All pages load (200 OK)
- ✅ Images display correctly
- ✅ Download buttons work
- ✅ Email capture works
- ✅ Downloads tracked in database

---

### Step 5: Test Download Flow

1. Go to any image page (e.g., `/christmas/sitting-santa-claus-illustration`)
2. Click "Download Free"
3. Modal opens with email input
4. Enter email
5. Download starts
6. Check Supabase:
   ```sql
   SELECT * FROM email_waitlist ORDER BY subscribed_at DESC LIMIT 5;
   SELECT * FROM downloads_by_url ORDER BY downloaded_at DESC LIMIT 5;
   ```

---

## 📊 How It Works in Production

### Build Time (When You Deploy)

```
Netlify Build
  ↓
npm run build
  ↓
Next.js getStaticProps runs
  ↓
Connects to Supabase (DATABASE_URL)
  ↓
Fetches all images from database
  ↓
Generates static HTML pages:
  - Homepage
  - 5 category pages
  - 29 individual image pages
  ↓
Deploys to CDN
```

**Result:** 
- ⚡ Super fast (static HTML)
- 🌍 Globally distributed (CDN)
- 💰 Cheap (no server per request)

---

### Runtime (When User Visits)

```
User visits clip.art/christmas/sitting-santa-claus-illustration
  ↓
Netlify CDN serves pre-built static HTML (instant!)
  ↓
User clicks "Download Free"
  ↓
Modal opens → Email input
  ↓
User enters email → Clicks "Download Free"
  ↓
POST /api/download (serverless function)
  ↓
Connects to Supabase
  ↓
Inserts into email_waitlist + downloads_by_url
  ↓
Returns success
  ↓
Browser downloads image
```

---

## 🔄 Adding New Images After Launch

### Method 1: Via Admin Panel (Coming Soon)

```
1. Login to clip.art/admin/login
2. Go to /admin/upload
3. Upload image, set title, category, tags
4. Image saved to Cloudinary + Supabase
5. Trigger Netlify rebuild via webhook
6. New image appears on site
```

### Method 2: Manual Database Insert

```sql
-- 1. Upload image to Cloudinary or CodePen
-- 2. Insert into Supabase:

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
  file_format,
  tags
) VALUES (
  'New Santa Sleigh Illustration',
  'new-santa-sleigh-illustration',
  'new-santa-sleigh-illustration',
  'christmas',
  'https://your-cdn.com/santa-sleigh.png',
  'new-santa-sleigh-illustration',
  'https://your-cdn.com/santa-sleigh.png',
  'https://your-cdn.com/santa-sleigh.png',
  true,
  'png',
  ARRAY['christmas', 'santa', 'sleigh']
);

-- 3. Trigger Netlify rebuild:
--    - Go to Netlify → Deploys → Trigger Deploy
--    - Or set up a webhook
```

---

## 📈 Incremental Static Regeneration (ISR)

Currently configured:
```typescript
revalidate: 3600 // Rebuild pages every hour if traffic
```

**What this means:**
- First visitor after 1 hour triggers page rebuild
- Page rebuilds in background
- Visitor sees cached version (fast)
- Next visitor sees updated version

**Adjust if needed:**
```typescript
revalidate: 86400   // Daily (24 hours)
revalidate: 604800  // Weekly
revalidate: false   // Never auto-rebuild (manual only)
```

---

## 🐛 Troubleshooting

### Pages show 404 in production

**Cause:** Database not accessible during build

**Fix:**
```bash
# 1. Check Netlify build logs
# 2. Verify DATABASE_URL in Netlify env vars
# 3. Test connection from local:
psql "postgresql://postgres:[password]@db.twzrjshsyvqmhqjolbzy.supabase.co:6543/postgres" -c "SELECT COUNT(*) FROM images;"
```

### Images not loading

**Cause:** Image URLs blocked or incorrect

**Fix:**
```sql
-- Check image URLs in database
SELECT image_url FROM images LIMIT 5;

-- Should be accessible:
-- https://assets.codepen.io/9394943/...
```

### Download not working

**Cause:** Email API or database connection issue

**Fix:**
```bash
# 1. Check Netlify function logs
# 2. Verify DATABASE_URL uses port 6543 (connection pooler)
# 3. Test API endpoint:
curl -X POST https://clip.art/api/download \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","imageUrl":"https://...", "imageTitle":"Test", "category":"christmas"}'
```

### Slow builds

**Cause:** Too many pages regenerating

**Fix:**
- Increase `revalidate` time
- Use manual deploys
- Optimize database queries

---

## 📝 Deployment Checklist

Before deploying:

- [ ] Run migration script on Supabase
- [ ] Verify 29 images in production database
- [ ] Check Netlify environment variables
- [ ] Test local build: `npm run build`
- [ ] Commit all changes
- [ ] Push to main

After deploying:

- [ ] Verify homepage loads
- [ ] Test 5 category pages
- [ ] Test 5+ individual image pages
- [ ] Test download flow end-to-end
- [ ] Check email in Supabase
- [ ] Check download tracking in Supabase
- [ ] Submit sitemap to Google Search Console

---

## 🎉 Success Metrics

After successful deployment:

✅ **Homepage:** Loads in < 1s  
✅ **Image Pages:** All 29 accessible  
✅ **SEO URLs:** Properly formatted (`/category/slug`)  
✅ **Downloads:** Email + tracking working  
✅ **Database:** Emails and downloads recording  
✅ **Analytics:** Ahrefs + Google Analytics tracking  

---

## 🚀 Next Steps

After launch:
1. Monitor analytics for popular images
2. Create bundles based on download data
3. Add more images via admin panel
4. Submit sitemap to Google
5. Monitor Supabase database size
6. Set up automated backups

**You're ready to deploy!** 🎊

