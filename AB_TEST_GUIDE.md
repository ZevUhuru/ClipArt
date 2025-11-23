# 🧪 A/B Test: Homepage vs Generator Landing Page

## What We're Testing

**Control (A):** Current homepage with image gallery  
**Variant (B):** New generator landing page

**Goal:** Measure which page converts more visitors to email signups

---

## ✅ A/B Test Implementation

### How It Works:

1. **50/50 Random Split**
   - First-time visitors randomly assigned
   - Cookie stored for 30 days (consistent experience)
   - 50% see homepage
   - 50% see generator page

2. **Tracking Setup**
   - Variant assignment tracked in Google Analytics
   - Conversion events tracked per variant
   - Email source tagged (`homepage-cta` vs `generator-landing`)

3. **User Flow**
   - Visitor lands on `clip.art`
   - JavaScript checks A/B test cookie
   - Redirects to `/generator` if variant B
   - User completes signup
   - Conversion tracked with variant tag

---

## 📊 How to Monitor Results

### Via Supabase (Email Database)

Check which source is converting better:

```sql
-- Compare conversion rates by source
SELECT 
  source,
  COUNT(*) as signups,
  COUNT(*) * 100.0 / (
    SELECT COUNT(*) FROM email_waitlist 
    WHERE source IN ('homepage-cta', 'generator-landing')
  ) as percentage
FROM email_waitlist
WHERE source IN ('homepage-cta', 'generator-landing')
  AND subscribed_at >= NOW() - INTERVAL '7 days'
GROUP BY source
ORDER BY signups DESC;
```

Expected sources:
- `homepage-cta` = Control (current homepage)
- `generator-landing` = Variant (generator page)

### Via Google Analytics

1. Go to Google Analytics → Reports → Events
2. Look for events:
   - `ab_test_assigned` (variant assignment)
   - `conversion` (email signup)
3. Compare conversion rates by variant

### Manual Calculation

```
Conversion Rate = (Signups / Visitors) × 100

Control: (homepage-cta signups / 50% of traffic) × 100
Variant: (generator-landing signups / 50% of traffic) × 100
```

---

## 🎯 Success Metrics

### Current Baseline (Control):
- **Traffic:** 109 visitors in 7 days
- **Signups:** 1
- **Conversion Rate:** 0.9%

### Target for Variant (Generator):
- **Goal:** 5-10% conversion rate (5-10x improvement)
- **Minimum:** 3% to be considered successful
- **Signups needed:** 5+ in first week

### Statistical Significance:
- Run test for **minimum 1 week**
- Need at least **100 visitors per variant** (200 total)
- Confidence level: 95%

---

## 📈 Expected Results

### Hypothesis:
Generator landing page will convert **5-10x better** because:

1. ✅ **Active vs Passive**
   - Control: Browse images (passive)
   - Variant: Create your own (active engagement)

2. ✅ **Immediate Value**
   - Control: "Join waitlist for future bundles"
   - Variant: "Get 3 free generations now"

3. ✅ **Clearer CTA**
   - Control: Multiple CTAs (confusing)
   - Variant: Single focus (generator)

4. ✅ **Urgency**
   - Control: No time pressure
   - Variant: "Launching in 3 days!"

---

## 🔧 How to Control the Test

### View Specific Variant:

**Force Control (Homepage):**
```
https://clip.art?ab=off
```

**Force Variant (Generator):**
```
https://clip.art/generator
```

### Disable A/B Test:

Edit `src/utils/abTest.ts`:
```typescript
const AB_TEST_ENABLED = false; // Disable test
```

### Change Split Ratio:

Edit `src/utils/abTest.ts`:
```typescript
// Current: 50/50
const variant: Variant = Math.random() < 0.5 ? 'control' : 'generator';

// Change to 25/75 (25% control, 75% generator):
const variant: Variant = Math.random() < 0.25 ? 'control' : 'generator';
```

---

## 📊 Sample Results Table

After 7 days, you should see something like:

| Metric | Control (Homepage) | Variant (Generator) | Winner |
|--------|-------------------|---------------------|--------|
| Visitors | ~55 | ~55 | - |
| Signups | 1 | 5-10 | 🏆 Generator |
| Conversion Rate | 1.8% | 9-18% | 🏆 Generator |
| Improvement | Baseline | **5-10x** | 🏆 Generator |

---

## 🎬 Action Plan

### Week 1: Test & Monitor
- ✅ Deploy A/B test to production
- 📊 Check Supabase daily for signups
- 📈 Monitor Google Analytics events
- 🔍 Watch for any bugs/issues

### Week 2: Analyze Results
```sql
-- Get final results
SELECT 
  source,
  COUNT(*) as total_signups,
  MIN(subscribed_at) as first_signup,
  MAX(subscribed_at) as last_signup
FROM email_waitlist
WHERE source IN ('homepage-cta', 'generator-landing')
GROUP BY source;
```

### Week 3: Make Decision

**If Generator Wins (expected):**
1. Make generator the default homepage
2. Move current homepage to `/library`
3. Focus on building generator MVP

**If Homepage Wins (unlikely):**
1. Keep current homepage
2. Add generator as secondary feature
3. Focus on image library + bundles

**If Inconclusive:**
1. Extend test another week
2. Review messaging/design
3. Consider hybrid approach

---

## 🚨 Troubleshooting

### Not Seeing Redirects?

1. Clear cookies:
```javascript
// In browser console:
document.cookie = 'clip_ab_variant=; Max-Age=0';
```

2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

3. Check if A/B test is enabled in `src/utils/abTest.ts`

### Signups Not Tracking Source?

1. Check Supabase `email_waitlist` table
2. Verify `source` column has correct values
3. Look for API errors in browser console

### Uneven Split?

- Normal! Will balance out over time
- Check after 200+ visitors
- JavaScript random is good enough for this

---

## 💡 Next Steps After Test

### If Generator Wins:

**Priority 1: Build Generator MVP**
- Integrate Midjourney/Replicate/Stability AI
- Payment processing (Stripe)
- Credit system
- Gallery of generations

**Priority 2: Migrate Homepage**
- New homepage = generator
- Old homepage = `/library`
- Update all internal links

**Priority 3: Marketing**
- Promote generator feature
- "Create custom clip art with AI"
- Share on Product Hunt, Reddit, Twitter

### Pricing After Launch:

**Free:**
- 3 generations/month
- Watermarked

**Pro ($9.99/month):**
- Unlimited generations
- No watermarks
- Commercial license

**Credits ($4.99 for 20):**
- Pay-as-you-go option

---

## 📝 Current Status

- ✅ A/B test code deployed
- ✅ Generator landing page created
- ✅ Tracking implemented
- ✅ Email capture working
- ⏳ Waiting for traffic data
- ⏳ Need 1 week minimum for results

---

## 🎯 Key Questions This Test Answers

1. **Do people want a generator?** (Yes if conversion > 5%)
2. **Is active better than passive?** (Engagement metric)
3. **Does "create your own" beat "browse library"?** (Value prop test)
4. **Should we pivot to generator-first?** (Strategic decision)

---

**Check Results Daily:**

```bash
# Quick check via terminal
psql $DATABASE_URL -c "
  SELECT source, COUNT(*) 
  FROM email_waitlist 
  WHERE source IN ('homepage-cta', 'generator-landing') 
  GROUP BY source;
"
```

---

**Want me to help analyze results or adjust the test?** Let me know! 🚀

