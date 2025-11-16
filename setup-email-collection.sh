#!/bin/bash

# Email Collection Setup Script
# This script helps you set up email collection for Clip.Art

echo "🚀 Clip.Art Email Collection Setup"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local from .env.example"
    else
        echo "❌ .env.example not found. Creating new .env.local..."
        cat > .env.local << 'EOF'
# Database Configuration
LOCAL_POSTGRES_DB=clipart_db
LOCAL_POSTGRES_USER=clipart_user
LOCAL_POSTGRES_PASSWORD=ChangeMe123!

# Database URL
DATABASE_URL=postgresql://clipart_user:ChangeMe123!@localhost:5433/clipart_db

# Admin Secret - CHANGE THIS!
ADMIN_SECRET=CHANGE_ME_TO_SECURE_SECRET

# Typesense
TYPESENSE_API_KEY=xyz
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http

# Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF
        echo "✅ Created basic .env.local"
    fi
    
    # Generate admin secret
    echo ""
    echo "🔐 Generating secure ADMIN_SECRET..."
    NEW_SECRET=$(openssl rand -base64 32)
    
    # Update .env.local with new secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|ADMIN_SECRET=.*|ADMIN_SECRET=$NEW_SECRET|g" .env.local
    else
        # Linux
        sed -i "s|ADMIN_SECRET=.*|ADMIN_SECRET=$NEW_SECRET|g" .env.local
    fi
    
    echo "✅ Generated and set ADMIN_SECRET"
    echo "   Secret: $NEW_SECRET"
    echo ""
    echo "⚠️  SAVE THIS SECRET! You'll need it to access /admin/waitlist"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Check if postgres is running
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL failed to start"
    echo "   Try: docker-compose logs postgres"
    exit 1
fi

echo ""
echo "📊 Creating email_waitlist table..."

# Create the table
docker-compose exec -T postgres psql -U clipart_user -d clipart_db << 'EOF'
-- Email waitlist table for lead collection
CREATE TABLE IF NOT EXISTS email_waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) DEFAULT 'homepage',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP,
  notes TEXT
);

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON email_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_subscribed ON email_waitlist(subscribed_at DESC);

-- Verify table was created
\dt email_waitlist
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database table created successfully"
else
    echo "⚠️  Table might already exist (this is okay)"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Start dev server:  npm run dev"
echo "   2. Visit:             http://localhost:3000"
echo "   3. Test email signup in the hero section"
echo "   4. View emails at:    http://localhost:3000/admin/waitlist"
echo ""
echo "🔑 Your Admin Secret (save this!):"
grep "ADMIN_SECRET=" .env.local
echo ""
echo "Happy collecting! 📧"

