# Clip.Art Admin Setup Guide

Complete setup instructions for the Clip.Art admin system.

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Yarn package manager
- Cloudinary account
- Typesense Cloud account (or self-hosted)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clipart
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Cloudinary (get from https://cloudinary.com/console)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Typesense (get from https://cloud.typesense.org)
NEXT_PUBLIC_TYPESENSE_HOST=your-cluster.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_API_KEY=your_search_key
TYPESENSE_API_KEY=your_admin_key

# Admin Auth
ADMIN_PASSWORD=ChooseAStrongPassword123!
ADMIN_JWT_SECRET=generate-a-random-32-char-string-here
```

### 3. Set Up Database

#### Option A: Using Docker Compose (Recommended for Local Development)

```bash
# Start PostgreSQL and Typesense
docker-compose up -d

# Wait a few seconds for services to start, then run schema
psql -h localhost -U postgres -d clipart_dev -f db/schema.sql
```

#### Option B: Existing PostgreSQL Instance

```bash
# Create database
createdb clipart

# Run schema
psql -d clipart -f db/schema.sql
```

### 4. Set Up Typesense Collection

#### Using Typesense Cloud

Go to your Typesense dashboard and create a collection with this schema:

```json
{
  "name": "clip_art_collection",
  "fields": [
    {"name": "id", "type": "string", "facet": false, "index": true},
    {"name": "title", "type": "string", "facet": false, "index": true},
    {"name": "tags", "type": "string", "facet": true, "index": true},
    {"name": "description", "type": "string", "facet": false, "index": true},
    {"name": "image_url", "type": "string", "facet": false, "index": false, "optional": true},
    {"name": "creation_timestamp", "type": "int32", "facet": false, "index": true}
  ],
  "default_sorting_field": "creation_timestamp",
  "enable_nested_fields": true
}
```

#### Using Self-Hosted Typesense

The collection will be created automatically when you start the Docker container.

### 5. Install Additional Dependencies

```bash
# Required for file uploads
yarn add formidable
yarn add react-dropzone
yarn add jose cookie
yarn add pg

# Type definitions
yarn add -D @types/formidable @types/cookie
```

### 6. Run the Development Server

```bash
yarn dev
```

Visit:
- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## 🔐 Admin Access

### Login Credentials

Use the `ADMIN_PASSWORD` you set in your `.env.local` file.

### Admin Routes

- `/admin/login` - Admin login page
- `/admin/upload` - Upload new images
- `/admin/images` - Manage existing images
- `/admin/analytics` - View statistics

## 📤 Uploading Images

### Via Web Interface

1. Go to http://localhost:3000/admin/upload
2. Drag & drop images or click to browse
3. Click "Upload to Cloudinary"
4. Edit metadata for each image
5. Click "Save & Next" to publish

### Bulk Upload Workflow (100 images daily)

**Recommended approach:**

1. Prepare all 100 images in a folder
2. Upload all at once via the web interface
3. Optionally: Generate titles/tags with AI (can be added later)
4. Review and edit metadata
5. Publish all

**Time estimate:** ~15-20 minutes for 100 images

## 🗄️ Database Schema

The main tables:

- `images` - All image metadata
- `categories` - Image categories
- `downloads` - Download tracking
- `image_views` - View tracking
- `tag_stats` - Popular tags

See `db/schema.sql` for complete schema.

## 🔍 Search Configuration

Images are automatically synced to Typesense when published. The sync happens:

- On image creation (if published)
- On image update (if published)
- On image deletion

To manually sync all images:

```bash
# Coming soon: sync script
yarn sync-typesense
```

## 🎨 Cloudinary Configuration

Images are stored in the `clip-art` folder in your Cloudinary account.

**Optimization settings:**
- Quality: `auto:best`
- Format: `auto` (WebP when supported)
- Transformations available on-the-fly

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Typesense Connection Issues

```bash
# Test Typesense connection
curl https://your-cluster.typesense.net:443/health

# Check if collection exists
curl "https://your-cluster.typesense.net/collections/clip_art_collection" \
  -H "X-TYPESENSE-API-KEY: your_api_key"
```

### Upload Failures

- Check Cloudinary credentials
- Verify file size limits (default: 10MB)
- Check server logs for detailed errors

### Authentication Issues

- Make sure `ADMIN_JWT_SECRET` is at least 32 characters
- Clear cookies and try logging in again
- Check if `middleware.ts` is running correctly

## 📊 Production Deployment

### Environment Variables

Set these in your production environment:

```env
NODE_ENV=production
ADMIN_PASSWORD=<strong-password>
ADMIN_JWT_SECRET=<random-secret>
# ... other vars from .env.example
```

### Database

1. Create production PostgreSQL database
2. Run `db/schema.sql`
3. Set up automatic backups

### Typesense

Use Typesense Cloud for production or deploy your own instance.

### Security Checklist

- [ ] Strong `ADMIN_PASSWORD` set
- [ ] Unique `ADMIN_JWT_SECRET` (32+ characters)
- [ ] HTTPS enabled
- [ ] Database connection encrypted
- [ ] Regular backups configured
- [ ] Cloudinary API keys secured
- [ ] Rate limiting on login endpoint (optional)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `docker-compose logs`
3. Check browser console for frontend errors

## 📝 Next Steps

After setup:
1. Upload your first batch of images
2. Test the search functionality
3. Customize categories in `db/schema.sql`
4. Add more metadata fields as needed
5. Set up automated backups

## 🔄 Maintenance

### Daily Tasks
- Upload new images via admin panel

### Weekly Tasks
- Review analytics
- Check for popular searches
- Optimize tags

### Monthly Tasks
- Database backup
- Review and clean up unused images
- Update categories if needed


