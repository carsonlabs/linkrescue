# LinkRescue Activation Funnel Analysis

**Date:** February 26, 2026  
**Analysis Period:** Last 30 days  
**Tools Created:**
- `scripts/analyze-activation-funnel.js` - Automated analysis script
- `scripts/activation-funnel-queries.sql` - SQL queries for Supabase

---

## 🎯 EXECUTIVE SUMMARY

To complete this analysis, you need to run the provided tools against your live Supabase database. This document provides:
1. **How to run the analysis** (step-by-step)
2. **Expected output format** with placeholder insights
3. **What to look for** in the data

---

## 🚀 HOW TO RUN THE ANALYSIS

### Option A: SQL Queries (Fastest)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/activation-funnel-queries.sql`
3. Run each query block individually
4. Export results or screenshot for analysis

### Option B: Node.js Script (Automated Report)
```bash
cd /home/carson/.openclaw/workspace/linkrescue

# Set your Supabase credentials
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run the analysis
node scripts/analyze-activation-funnel.js
```

**Note:** Use `SUPABASE_SERVICE_ROLE_KEY` for full access to all user data. The anon key has RLS restrictions.

---

## 📊 EXPECTED REPORT STRUCTURE

Once you run the analysis, you'll see output like this:

### TOP LINE (Last 30 Days)
```
Total Signups: [X]
Added Site: [Y] ([Z]%)
Ran Scan: [A] ([B]%)
Returned for 2nd Scan: [C] ([D]%)
Converted to Paid: [E] ([F]%)
```

### DROP-OFF POINTS (Ranked by severity)
1. **[Biggest Drop-off Stage]**: X% lost
   - Hypothesis: [Why users might be dropping off here]
   
2. **[Second Biggest]**: Y% lost
   - Hypothesis: [Why users might be dropping off here]

### KEY METRICS TO WATCH

| Metric | Healthy Benchmark | Action if Below |
|--------|-------------------|-----------------|
| Signup → Site Added | >60% | Simplify onboarding |
| Site → Scan Triggered | >70% | Fix verification UX |
| First Scan → Return | >30% | Improve value delivery |
| Verification Success | >80% | Add alternative methods |
| Scan Success Rate | >90% | Debug crawler issues |

---

## 🔍 WHAT TO LOOK FOR

### 1. Biggest Drop-off Point

**If Signup → Site Added is biggest drop-off:**
- Users don't understand the value proposition
- Site addition form is too complex
- No clear CTA after signup
- Missing onboarding guidance

**If Site Added → Scan Triggered is biggest drop-off:**
- Verification is failing (check verification success rate)
- Users don't know they need to verify
- Verification method is too hard
- No auto-trigger after verification

**If First Scan → Return Visit is biggest drop-off:**
- Scan results aren't valuable enough
- Users don't understand what to do with results
- No email follow-up
- No broken links found (empty state problem)

### 2. Time-to-Activation Patterns

**Same session activation (< 1 hour):**
- These are your most engaged users
- Study their behavior for optimization clues
- Likely came with clear intent

**24-48 hour activation:**
- Normal for thoughtful users
- Good target for reminder emails
- May need more nurturing

**7+ day activation:**
- High risk of churn
- Need aggressive re-engagement
- May have encountered blockers

### 3. Error Patterns

**Common issues to investigate:**
- **DNS errors:** Domain typos or unavailable sites
- **Timeouts:** Crawler timeout too aggressive
- **403 errors:** Sites blocking crawlers
- **Zero pages crawled:** JavaScript-heavy sites, sitemap issues

---

## 💡 RECOMMENDATIONS TEMPLATE

Once you have the data, prioritize fixes based on:

### 1. Highest Impact Fix
Target the biggest drop-off point with:
- A/B test of new flow
- Clearer UX copy
- Progress indicators
- Email intervention at drop-off point

### 2. Quick Win
- Add email reminder 24h after signup if no site added
- Auto-trigger scan after verification
- Show "you're almost done" messaging
- Fix top 3 error patterns

### 3. Longer Term Improvement
- Build better onboarding wizard
- Add alternative verification methods
- Implement progressive profiling
- Create activation email sequence

---

## 📈 SAMPLE INSIGHTS (Replace with Real Data)

### Example Scenario A: Good Activation, Poor Retention
```
Signups: 500
Site Added: 350 (70%) ✓
Ran Scan: 280 (80% of site adders) ✓
Returned: 50 (18% of scanners) ✗
```
**Diagnosis:** Users are activating but not seeing ongoing value. Focus on retention emails and recurring scan scheduling.

### Example Scenario B: Big Drop-off at Verification
```
Signups: 500
Site Added: 400 (80%) ✓
Ran Scan: 160 (40% of site adders) ✗
Verification Rate: 45%
```
**Diagnosis:** Verification is a major blocker. Add DNS TXT verification, better error messages, and manual verification option.

### Example Scenario C: Empty Funnel
```
Signups: 50
Site Added: 10 (20%) ✗
Ran Scan: 8 (80% of site adders)
```
**Diagnosis:** Sample size too small or traffic quality issue. Focus on acquisition before activation optimization.

---

## 🛠️ NEXT STEPS

1. **Run the analysis** using SQL queries or Node.js script
2. **Identify the biggest drop-off** (usually has >30% loss)
3. **Form hypothesis** about why users are dropping off
4. **Implement one fix** and measure change
5. **Repeat monthly** to track trends

---

## 📞 SUPPORT

If you need help interpreting results:
- Check `scripts/activation-funnel-queries.sql` for query details
- Review `scripts/analyze-activation-funnel.js` for calculation logic
- Typical benchmarks available in SaaS metrics guides

---

**Files Created:**
- `/home/carson/.openclaw/workspace/linkrescue/scripts/analyze-activation-funnel.js`
- `/home/carson/.openclaw/workspace/linkrescue/scripts/activation-funnel-queries.sql`
- `/home/carson/.openclaw/workspace/linkrescue/scripts/ACTIVATION_FUNNEL_REPORT.md` (this file)
