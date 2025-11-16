# Clip.Art

A modern, AI-powered clip art stock site built with Next.js, PostgreSQL, and Typesense.

## 🎨 Features

- **Free Clip Art Library**: Browse and download thousands of clip art images
- **Fast Search**: Powered by Typesense for instant, typo-tolerant search
- **Admin Dashboard**: Easy-to-use interface for uploading and managing images
- **Bulk Upload**: Upload up to 100 images at once
- **Automatic Optimization**: Images optimized via Cloudinary CDN
- **SEO Optimized**: Each image gets its own SEO-friendly URL
- **Analytics**: Track downloads and views
- **Categories & Tags**: Organize images with categories and tags

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for complete installation and configuration instructions.

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start database and services
docker-compose up -d

# Run database schema
psql -h localhost -U postgres -d clipart_dev -f db/schema.sql

# Start development server
yarn dev
```

Visit:
- **Public Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin/login

## 📁 Project Structure

```
clip.art/
├── pages/
│   ├── admin/              # Admin dashboard pages
│   │   ├── login.tsx       # Admin login
│   │   ├── upload.tsx      # Upload interface
│   │   ├── images/         # Image management
│   │   └── analytics.tsx   # Analytics dashboard
│   ├── api/                # API routes
│   │   ├── admin/          # Admin API endpoints
│   │   └── search.tsx      # Search endpoint
│   └── index.tsx           # Public homepage
├── src/
│   ├── components/
│   │   ├── Admin/          # Admin components
│   │   └── Search/         # Search components
│   └── utils/
│       ├── auth.ts         # Authentication utilities
│       ├── cloudinary.ts   # Cloudinary config
│       └── typesense/      # Typesense config
├── db/
│   ├── index.ts            # Database connection
│   └── schema.sql          # Database schema
├── middleware.ts           # Route protection
└── docker-compose.yml      # Local services
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Database**: PostgreSQL
- **Search**: Typesense
- **Image CDN**: Cloudinary
- **Auth**: JWT with jose
- **Styling**: Tailwind CSS
- **File Upload**: Formidable + react-dropzone

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Complete installation instructions
- [Database Schema](./db/schema.sql) - Database structure
- [API Documentation](./docs/API.md) - API endpoints (coming soon)

## 🔐 Security

- Password-protected admin panel
- JWT-based authentication
- HTTP-only cookies
- CSRF protection
- Input validation and sanitization

## 📊 Admin Features

### Upload Images
- Drag & drop interface
- Bulk upload (100+ images)
- Auto-generated metadata suggestions
- Schedule publishing

### Manage Images
- Edit metadata
- Update tags and categories
- Publish/unpublish
- Delete images

### Analytics
- Total downloads
- View counts
- Popular images
- Search trends

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables

Make sure to set these in your production environment:
- `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `TYPESENSE_API_KEY`, `NEXT_PUBLIC_TYPESENSE_HOST`, `NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_API_KEY`
- `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`

## 🤝 Contributing

This is a private project, but feel free to fork and adapt for your own use.

## 📝 License

All rights reserved.

## 🆘 Support

For setup help, see [SETUP.md](./SETUP.md) or check the troubleshooting section.

---

Built with ❤️ for creators who need high-quality, free clip art.
