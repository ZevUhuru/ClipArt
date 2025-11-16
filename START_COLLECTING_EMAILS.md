# 📧 Start Collecting Emails - Setup Guide

## Step-by-Step Instructions

### Step 1: Set Up Environment Variables (2 minutes)

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your values:**
   ```bash
   # Open in your editor
   nano .env.local
   # or
   code .env.local
   ```

3. **Update these critical values:**
   ```bash
   # Database (keep these simple for local dev)
   LOCAL_POSTGRES_DB=clipart_db
   LOCAL_POSTGRES_USER=clipart_user
   LOCAL_POSTGRES_PASSWORD=SecurePassword123!
   
   # Database URL (must match above)
   DATABASE_URL=postgresql://clipart_user:SecurePassword123!@localhost:5433/clipart_db
   
   # Admin Secret (generate a secure one)
   ADMIN_SECRET=your_secret_here
   ```

4. **Generate a secure admin secret:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as your `ADMIN_SECRET`

---

### Step 2: Start PostgreSQL (1 minute)

```bash
# Start the database
docker-compose up -d postgres

# Verify it's running
docker-compose ps
```

You should see:
```
NAME                    STATUS
clip.art-postgres-1     Up
```

---

### Step 3: Create the Email Waitlist Table (1 minute)

```bash
# Connect to PostgreSQL and run the schema
docker-compose exec postgres psql -U clipart_user -d clipart_db -f /path/to/db/schema.sql
```

**OR manually run the SQL:**

```bash
# Connect to database
docker-compose exec postgres psql -U clipart_user -d clipart_db

# Then paste this SQL:
```

```sql
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
```

**Exit with:** `\q`

---

### Step 4: Start Your Development Server (1 minute)

```bash
npm run dev
# or
yarn dev
```

You should see:
```
✓ Ready on http://localhost:3000
```

---

### Step 5: Test Email Signup (2 minutes)

1. **Open your browser:**
   ```
   http://localhost:3000
   ```

2. **You should see:**
   - New clean header with "Join Waitlist" button
   - Hero section with email capture form
   - Premium bundles teaser with new pricing ($12-17)

3. **Test the signup:**
   - Scroll to hero email form
   - Enter a test email: `test@example.com`
   - Click "Get Early Access"
   - You should see a green success message! 🎉

---

### Step 6: View Your Collected Emails (1 minute)

1. **Open the admin dashboard:**
   ```
   http://localhost:3000/admin/waitlist
   ```

2. **Enter your admin secret:**
   - The one from your `.env.local` file (`ADMIN_SECRET`)

3. **You should see:**
   - Total signups count
   - List of all emails
   - Export to CSV button
   - Stats (today, this week, total)

---

## 🎉 You're Now Collecting Emails!

### What happens when someone signs up:

```
User enters email → API validates → Saves to PostgreSQL → Success message
                                        ↓
                              You can view in admin dashboard
```

---

## 📊 Where Are Emails Collected?

You have **3 collection points** on your site:

1. **Header Button** (sticky, always visible)
   - Click "Join Waitlist" → scrolls to signup
   
2. **Hero Section** (primary conversion)
   - Source tag: `hero`
   - First thing visitors see

3. **Bottom CTA** (final chance)
   - Source tag: `homepage-cta`
   - After they've seen samples & bundles

---

## 🔍 Checking If It's Working

### Method 1: Admin Dashboard
```
http://localhost:3000/admin/waitlist
```
- Most user-friendly
- See stats and trends
- Export to CSV

### Method 2: Direct Database Query
```bash
docker-compose exec postgres psql -U clipart_user -d clipart_db

# Run this query:
SELECT email, source, subscribed_at 
FROM email_waitlist 
ORDER BY subscribed_at DESC;
```

### Method 3: API Call
```bash
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"test"}'
```

---

## 🚨 Troubleshooting

### "Failed to subscribe" error:

**Check database connection:**
```bash
# Is PostgreSQL running?
docker-compose ps postgres

# Can you connect?
docker-compose exec postgres psql -U clipart_user -d clipart_db -c "SELECT NOW();"
```

**Check environment variables:**
```bash
# Print your DATABASE_URL (without exposing password)
echo $DATABASE_URL
```

### "Can't access admin dashboard":

**Check your ADMIN_SECRET:**
```bash
# Make sure it's set in .env.local
grep ADMIN_SECRET .env.local
```

**Try generating a new one:**
```bash
openssl rand -base64 32
```

### Email not saving:

**Check the database table exists:**
```bash
docker-compose exec postgres psql -U clipart_user -d clipart_db -c "\dt email_waitlist"
```

**Check browser console:**
- Open DevTools (F12)
- Go to Console tab
- Try submitting email
- Look for errors

---

## 🚀 Deploying to Production

Once everything works locally, deploy to production:

### 1. Push your code:
```bash
git push origin qa

# If ready for production:
git checkout main
git merge qa
git push origin main
```

### 2. Set production environment variables:

On your hosting platform (Vercel, Netlify, etc.), add:

```
DATABASE_URL=your_production_postgres_url
ADMIN_SECRET=your_production_secret
NEXT_PUBLIC_BASE_URL=https://clip.art
```

### 3. Run database migration on production:

Connect to your production database and run:
```sql
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

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON email_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_subscribed ON email_waitlist(subscribed_at DESC);
```

### 4. Test on production:
- Visit https://clip.art
- Submit test email
- Check admin dashboard

---

## 📈 What to Do With Collected Emails

### Daily (First Week):
1. Check admin dashboard for new signups
2. Celebrate each new email! 🎉
3. Monitor conversion rate

### Weekly:
1. Export emails to CSV
2. Import to email service (Mailchimp, ConvertKit, Resend)
3. Analyze which source converts best (hero vs bottom)

### When You Hit 50 Emails:
1. Send welcome email with free starter pack
2. Tease upcoming bundles
3. Ask for feedback on what they want

### When Ready to Launch:
1. Export all emails
2. Send launch announcement
3. Offer early-bird discount (30% off)
4. Track sales and conversions

---

## 🎯 Quick Reference

| Action | Command/URL |
|--------|-------------|
| Start database | `docker-compose up -d postgres` |
| Start dev server | `npm run dev` |
| View site | `http://localhost:3000` |
| View admin | `http://localhost:3000/admin/waitlist` |
| Check database | `docker-compose exec postgres psql -U clipart_user -d clipart_db` |
| Stop everything | `docker-compose down` |

---

## ✅ Checklist

Before going live, make sure:

- [ ] PostgreSQL is running
- [ ] `email_waitlist` table created
- [ ] Environment variables set
- [ ] Dev server starts without errors
- [ ] Can submit test email successfully
- [ ] Can view emails in admin dashboard
- [ ] All 3 signup locations work
- [ ] Mobile responsive (test on phone)
- [ ] Production environment variables set
- [ ] Database migration run on production

---

## 🎉 Success!

You're now ready to collect emails and start building your audience!

**Remember:**
- Every email is a potential customer
- Focus on quality over quantity
- Engage with early subscribers
- Use feedback to improve

Good luck with your launch! 🚀

