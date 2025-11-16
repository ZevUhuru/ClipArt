# Clip.Art Architecture

## 🏗️ System Overview

Your clip art site uses a **three-tier architecture** for maximum performance and flexibility:

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
      BROWSE/SEARCH            DOWNLOAD
           │                       │
           ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │  TYPESENSE   │        │  CLOUDINARY  │
    │   (Search)   │        │   (Images)   │
    └──────────────┘        └──────────────┘
           │                       │
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
               ┌──────────────┐
               │  POSTGRESQL  │
               │ (Source of   │
               │    Truth)    │
               └──────────────┘
```

## 📦 Component Roles

### 1. **PostgreSQL** - The Database (Source of Truth)

**Purpose:** Permanent, reliable storage of ALL data

**Stores:**
- ✅ Complete image metadata (title, description, tags, category, etc.)
- ✅ User data (when you add user accounts)
- ✅ Download history and analytics
- ✅ View counts and engagement metrics
- ✅ Relationships between data (foreign keys)

**Why:**
- ACID compliance (data integrity)
- Complex queries (joins, aggregations)
- Transactions (all-or-nothing operations)
- Relational data modeling
- Historical data and analytics

**Port:** `5433` (Docker: localhost:5433)

---

### 2. **Typesense** - The Search Engine

**Purpose:** Lightning-fast search and discovery

**Stores:**
- ✅ Searchable fields only (title, tags, description, category)
- ✅ Image URL (for displaying results)
- ✅ Denormalized data (optimized for speed, not completeness)

**Features:**
- ⚡ Sub-50ms search responses
- 🔍 Typo tolerance ("cristmas" → "christmas")
- 🏷️ Faceted search (filter by category, tags)
- 📊 Relevance ranking
- 🎯 Prefix search (instant search as you type)

**Port:** `8108` (Docker: localhost:8108)

**Important:** Typesense data is **synced FROM PostgreSQL**, not stored independently

---

### 3. **Cloudinary** - The Image CDN

**Purpose:** Store and deliver image files globally

**Features:**
- 📸 Image storage
- 🌍 Global CDN (fast delivery everywhere)
- 🔧 On-the-fly transformations (resize, format, optimize)
- 💾 Automatic backups
- 🚀 WebP/AVIF support

---

## 🔄 Data Flow

### **Upload Flow:**
```
Admin uploads image
        ↓
1. Frontend → API → Cloudinary
   (image file stored, get URL)
        ↓
2. API → PostgreSQL
   (save complete metadata + Cloudinary URL)
        ↓
3. PostgreSQL → Typesense
   (sync searchable fields)
        ↓
✅ Image is live!
```

### **Search Flow:**
```
User searches "christmas"
        ↓
1. Frontend → Typesense
   (fast search, ~20ms)
        ↓
2. Returns: image URLs + basic metadata
        ↓
3. Frontend displays results from Cloudinary
```

### **Download Flow:**
```
User clicks download
        ↓
1. Frontend → API
        ↓
2. API → PostgreSQL
   (record download, update count)
        ↓
3. API → Cloudinary
   (get optimized image URL)
        ↓
4. User downloads from Cloudinary
```

---

## 🗄️ Database Schema (PostgreSQL)

### **images** - Main table
```sql
id                    UUID (primary key)
cloudinary_public_id  VARCHAR (unique)
cloudinary_url        TEXT
cloudinary_secure_url TEXT
title                 VARCHAR
description           TEXT
alt_text              TEXT
tags                  TEXT[]
category              VARCHAR
file_format           VARCHAR
width                 INTEGER
height                INTEGER
file_size             INTEGER
seo_slug              VARCHAR (unique)
published             BOOLEAN
published_at          TIMESTAMP
download_count        INTEGER
view_count            INTEGER
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### **categories**
- Organize images by theme (Christmas, Halloween, etc.)

### **downloads**
- Track every download (analytics)

### **image_views**
- Track every view (analytics)

### **tag_stats**
- Popular tags (autocomplete, trending)

---

## 🎯 Why This Architecture?

### **Separation of Concerns:**
- 📸 Cloudinary = Images (what it's best at)
- 🗄️ PostgreSQL = Data integrity (what it's best at)
- 🔍 Typesense = Search speed (what it's best at)

### **Performance:**
- Users get sub-50ms search
- Images served from global CDN
- Complex queries don't slow down search

### **Reliability:**
- If Typesense fails → rebuild from PostgreSQL
- If Cloudinary fails → URLs stored in PostgreSQL
- PostgreSQL is the single source of truth

### **Scalability:**
- PostgreSQL: Millions of records
- Typesense: Instant search on millions
- Cloudinary: Unlimited bandwidth

### **Cost-Effective:**
- PostgreSQL: Free (Docker) or $7/month (hosted)
- Typesense: $22/month or self-hosted $5/month
- Cloudinary: Free tier or ~$89/month

---

## 🚀 Production Setup

### **Database:**
```bash
# Option 1: Managed PostgreSQL
- Heroku Postgres: $7/month
- Railway: $5/month
- Neon: $19/month (serverless)

# Option 2: Self-hosted
- DigitalOcean droplet: $6/month
- AWS RDS: $15/month
```

### **Search:**
```bash
# Option 1: Typesense Cloud
- $22/month for 0.5GB cluster

# Option 2: Self-hosted
- DigitalOcean droplet: $5/month
```

### **Images:**
```bash
# Cloudinary
- Free tier: 25GB storage + 25GB bandwidth
- Paid: $89/month for 75GB storage + 150GB bandwidth

# Alternative: Cloudflare R2
- $5-10/month (recommended for scale)
```

---

## 📈 Growth Path

### **Year 1: 36,500 images**
- PostgreSQL: ~50MB data
- Typesense: ~20MB index
- Cloudinary: ~20GB storage
- **Monthly cost:** ~$30-50

### **Year 5: 182,500 images**
- PostgreSQL: ~250MB data
- Typesense: ~100MB index  
- Cloudinary: ~100GB storage
- **Monthly cost:** ~$100-150

---

## 🔧 Docker Services

### **Start Services:**
```bash
docker-compose up -d
```

### **Stop Services:**
```bash
docker-compose down
```

### **View Logs:**
```bash
docker-compose logs postgres
docker-compose logs typesense
```

### **Connect to Database:**
```bash
docker-compose exec postgres psql -U postgres -d clipart_dev
```

---

## 💡 Key Takeaways

1. **PostgreSQL** = Source of truth for ALL data
2. **Typesense** = Fast search (synced from PostgreSQL)
3. **Cloudinary** = Image delivery
4. **Never write directly to Typesense** - always write to PostgreSQL first
5. **Typesense can be rebuilt** from PostgreSQL at any time
6. **Cloudinary URLs** stored in PostgreSQL for reliability

---

## 🆘 Troubleshooting

### PostgreSQL not connecting?
```bash
docker-compose ps  # Check if running
docker-compose logs postgres  # Check logs
```

### Typesense not working?
```bash
docker-compose logs typesense
# Rebuild index from PostgreSQL if needed
```

### Image not appearing in search?
- Check if saved to PostgreSQL: ✅
- Check if published: ✅
- Check Typesense sync (console logs)
- Manual sync if needed

---

Built with ❤️ for scalable, performant clip art delivery.


