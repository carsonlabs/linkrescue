#!/usr/bin/env node
/**
 * LinkRescue Activation Funnel Analysis
 * 
 * This script analyzes the user activation funnel to identify drop-off points.
 * Run: node scripts/analyze-activation-funnel.js
 * 
 * Required env vars:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (for full analytics access)
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    highlight: `${colors.magenta}→${colors.reset}`,
  }[type];
  console.log(`${prefix} ${message}`);
}

function header(message) {
  console.log(`\n${colors.bold}${colors.cyan}${message}${colors.reset}`);
  console.log(colors.cyan('='.repeat(message.length)) + colors.reset);
}

function subheader(message) {
  console.log(`\n${colors.bold}${message}${colors.reset}`);
  console.log('-'.repeat(message.length));
}

function metric(label, value, pct = null) {
  const pctStr = pct !== null ? ` ${colors.yellow}(${pct}%)${colors.reset}` : '';
  console.log(`  ${label}: ${colors.bold}${colors.green}${value}${colors.reset}${pctStr}`);
}

function dropoff(label, value, hypothesis) {
  console.log(`  ${colors.red}↓${colors.reset} ${label}: ${colors.bold}${colors.red}${value}${colors.reset}`);
  console.log(`     ${colors.yellow}Hypothesis:${colors.reset} ${hypothesis}`);
}

class ActivationFunnelAnalyzer {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.results = {};
  }

  async query(sql) {
    const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Query failed: ${error}`);
    }

    return response.json();
  }

  async fetchTable(table, select = '*', filters = '') {
    const url = `${this.supabaseUrl}/rest/v1/${table}?select=${select}${filters}`;
    const response = await fetch(url, {
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
    }

    return response.json();
  }

  // Get date 30 days ago
  getThirtyDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }

  // 1. Overall funnel metrics (last 30 days)
  async getFunnelMetrics() {
    const since = this.getThirtyDaysAgo();

    // Total signups (users created in last 30 days)
    const users = await this.fetchTable('users', 'id,created_at,stripe_price_id', `&created_at=gte.${since}`);
    
    // Sites added in last 30 days
    const sites = await this.fetchTable('sites', 'id,user_id,created_at,verified_at', `&created_at=gte.${since}`);
    
    // Scans in last 30 days
    const scans = await this.fetchTable('scans', 'id,site_id,created_at,status', `&created_at=gte.${since}`);

    // Unique users who added sites
    const usersWithSites = new Set(sites.map(s => s.user_id));
    
    // Unique users who ran scans
    const siteIds = sites.map(s => s.id);
    const scansBySite = scans.filter(s => siteIds.includes(s.site_id));
    const usersWithScans = new Set();
    for (const scan of scansBySite) {
      const site = sites.find(s => s.id === scan.site_id);
      if (site) usersWithScans.add(site.user_id);
    }

    // Users with 2+ scans (retention proxy)
    const userScanCounts = {};
    for (const scan of scansBySite) {
      const site = sites.find(s => s.id === scan.site_id);
      if (site) {
        userScanCounts[site.user_id] = (userScanCounts[site.user_id] || 0) + 1;
      }
    }
    const usersWithMultipleScans = Object.entries(userScanCounts)
      .filter(([_, count]) => count >= 2)
      .map(([userId, _]) => userId);

    // Paid conversions
    const paidUsers = users.filter(u => u.stripe_price_id !== null);

    return {
      totalSignups: users.length,
      addedSite: usersWithSites.size,
      ranScan: usersWithScans.size,
      returnedForSecondScan: usersWithMultipleScans.length,
      convertedToPaid: paidUsers.length,
      raw: { users, sites, scans }
    };
  }

  // 2. Time-to-activation analysis
  async getTimeToActivation() {
    const since = this.getThirtyDaysAgo();
    
    const users = await this.fetchTable('users', 'id,created_at', `&created_at=gte.${since}`);
    const sites = await this.fetchTable('sites', 'id,user_id,created_at', `&created_at=gte.${since}`);
    const scans = await this.fetchTable('scans', 'id,site_id,created_at,started_at', `&created_at=gte.${since}`);

    const signupToSiteTimes = [];
    const siteToScanTimes = [];
    let sameSessionCount = 0;
    let within24hCount = 0;
    let within7dCount = 0;
    let beyond7dCount = 0;

    for (const user of users) {
      const userSites = sites.filter(s => s.user_id === user.id);
      if (userSites.length === 0) continue;

      const firstSite = userSites.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
      const signupTime = new Date(user.created_at);
      const siteTime = new Date(firstSite.created_at);
      const hoursToSite = (siteTime - signupTime) / (1000 * 60 * 60);
      signupToSiteTimes.push(hoursToSite);

      // Categorize
      if (hoursToSite <= 1) sameSessionCount++;
      else if (hoursToSite <= 24) within24hCount++;
      else if (hoursToSite <= 168) within7dCount++; // 7 days = 168 hours
      else beyond7dCount++;

      const siteScans = scans.filter(s => s.site_id === firstSite.id && s.started_at);
      if (siteScans.length > 0) {
        const firstScan = siteScans.sort((a, b) => new Date(a.started_at) - new Date(b.started_at))[0];
        const scanTime = new Date(firstScan.started_at);
        const hoursToScan = (scanTime - siteTime) / (1000 * 60 * 60);
        siteToScanTimes.push(hoursToScan);
      }
    }

    const avgSignupToSite = signupToSiteTimes.length > 0 
      ? (signupToSiteTimes.reduce((a, b) => a + b, 0) / signupToSiteTimes.length).toFixed(1)
      : 0;
    
    const avgSiteToScan = siteToScanTimes.length > 0
      ? (siteToScanTimes.reduce((a, b) => a + b, 0) / siteToScanTimes.length).toFixed(1)
      : 0;

    return {
      avgSignupToSiteHours: avgSignupToSite,
      avgSiteToScanHours: avgSiteToScan,
      distribution: {
        sameSession: sameSessionCount,
        within24h: within24hCount,
        within7d: within7dCount,
        beyond7d: beyond7dCount,
        total: signupToSiteTimes.length
      }
    };
  }

  // 3. Site-level patterns
  async getSitePatterns() {
    const since = this.getThirtyDaysAgo();
    
    const sites = await this.fetchTable('sites', 'id,user_id,domain,verified_at,created_at', `&created_at=gte.${since}`);
    const scans = await this.fetchTable('scans', 'id,site_id,status,pages_scanned,created_at', `&created_at=gte.${since}`);

    // Users with at least 1 site
    const userSiteCounts = {};
    for (const site of sites) {
      userSiteCounts[site.user_id] = (userSiteCounts[site.user_id] || 0) + 1;
    }
    const usersWithSites = Object.values(userSiteCounts);
    const avgSitesPerUser = usersWithSites.length > 0
      ? (usersWithSites.reduce((a, b) => a + b, 0) / usersWithSites.length).toFixed(1)
      : 0;

    // Domain patterns (TLD analysis)
    const domainTypes = {};
    for (const site of sites) {
      const domain = site.domain;
      let type = 'other';
      if (domain.includes('.com')) type = '.com';
      else if (domain.includes('.io')) type = '.io';
      else if (domain.includes('.co')) type = '.co';
      else if (domain.includes('.org')) type = '.org';
      else if (domain.includes('.net')) type = '.net';
      else if (domain.includes('.ai')) type = '.ai';
      domainTypes[type] = (domainTypes[type] || 0) + 1;
    }

    // Verification success rate
    const verifiedSites = sites.filter(s => s.verified_at !== null);
    const verificationRate = sites.length > 0
      ? ((verifiedSites.length / sites.length) * 100).toFixed(1)
      : 0;

    // Scan success rate
    const completedScans = scans.filter(s => s.status === 'completed');
    const failedScans = scans.filter(s => s.status === 'failed');
    const scanSuccessRate = scans.length > 0
      ? ((completedScans.length / scans.length) * 100).toFixed(1)
      : 0;

    // Users with 0 pages crawled
    const zeroPageScans = scans.filter(s => s.pages_scanned === 0);
    const usersWithZeroPages = new Set();
    for (const scan of zeroPageScans) {
      const site = sites.find(s => s.id === scan.site_id);
      if (site) usersWithZeroPages.add(site.user_id);
    }

    return {
      avgSitesPerUser,
      domainTypes,
      verificationRate,
      scanSuccessRate,
      zeroPageScans: zeroPageScans.length,
      usersWithZeroPages: usersWithZeroPages.size,
      totalSites: sites.length,
      totalScans: scans.length,
      completedScans: completedScans.length,
      failedScans: failedScans.length
    };
  }

  // 4. Error patterns
  async getErrorPatterns() {
    const since = this.getThirtyDaysAgo();
    
    const scans = await this.fetchTable('scans', 'id,site_id,status,error_message,pages_scanned', `&created_at=gte.${since}`);
    const scanEvents = await this.fetchTable('scan_events', 'scan_id,level,message,created_at', `&created_at=gte.${since}`);

    // Failed scans analysis
    const failedScans = scans.filter(s => s.status === 'failed');
    const errorMessages = {};
    for (const scan of failedScans) {
      const msg = scan.error_message || 'Unknown error';
      const category = this.categorizeError(msg);
      errorMessages[category] = (errorMessages[category] || 0) + 1;
    }

    // Scan events by level
    const eventsByLevel = {};
    for (const event of scanEvents) {
      eventsByLevel[event.level] = (eventsByLevel[event.level] || 0) + 1;
    }

    return {
      failedScanCount: failedScans.length,
      errorCategories: errorMessages,
      eventsByLevel,
      totalEvents: scanEvents.length
    };
  }

  categorizeError(message) {
    const msg = message.toLowerCase();
    if (msg.includes('timeout')) return 'Timeout';
    if (msg.includes('dns') || msg.includes('ENOTFOUND')) return 'DNS Error';
    if (msg.includes('ssl') || msg.includes('certificate')) return 'SSL/Certificate';
    if (msg.includes('403') || msg.includes('forbidden')) return 'Access Denied (403)';
    if (msg.includes('404') || msg.includes('not found')) return 'Not Found (404)';
    if (msg.includes('5') || msg.includes('server error')) return 'Server Error (5xx)';
    if (msg.includes('rate') || msg.includes('limit')) return 'Rate Limited';
    return 'Other';
  }

  // Generate full report
  generateReport(funnel, timeToActivation, sitePatterns, errorPatterns) {
    const calcPct = (part, whole) => whole > 0 ? ((part / whole) * 100).toFixed(1) : 0;

    console.log(`\n${colors.bold}${colors.green}` + '='.repeat(60) + colors.reset);
    console.log(`${colors.bold}${colors.green}     LINKRESCUE ACTIVATION FUNNEL ANALYSIS${colors.reset}`);
    console.log(`${colors.bold}${colors.green}     Generated: ${new Date().toLocaleString()}${colors.reset}`);
    console.log(`${colors.bold}${colors.green}` + '='.repeat(60) + colors.reset);

    // TOP LINE METRICS
    header('📊 TOP LINE (Last 30 Days)');
    metric('Total Signups', funnel.totalSignups);
    metric('Added Site', funnel.addedSite, calcPct(funnel.addedSite, funnel.totalSignups));
    metric('Ran Scan', funnel.ranScan, calcPct(funnel.ranScan, funnel.totalSignups));
    metric('Returned for 2nd Scan', funnel.returnedForSecondScan, calcPct(funnel.returnedForSecondScan, funnel.totalSignups));
    metric('Converted to Paid', funnel.convertedToPaid, calcPct(funnel.convertedToPaid, funnel.totalSignups));

    // DROP-OFF ANALYSIS
    header('📉 DROP-OFF ANALYSIS');
    
    const signupToSiteDropoff = 100 - parseFloat(calcPct(funnel.addedSite, funnel.totalSignups));
    const siteToScanDropoff = funnel.addedSite > 0 
      ? (100 - parseFloat(calcPct(funnel.ranScan, funnel.addedSite))).toFixed(1)
      : 0;
    const scanToReturnDropoff = funnel.ranScan > 0
      ? (100 - parseFloat(calcPct(funnel.returnedForSecondScan, funnel.ranScan))).toFixed(1)
      : 0;

    const dropoffs = [
      { stage: 'Signup → Site Added', value: signupToSiteDropoff, hypothesis: 'Users may not understand value proposition or site addition is too complex' },
      { stage: 'Site Added → Scan Triggered', value: siteToScanDropoff, hypothesis: 'Verification may be failing or scan trigger is not obvious' },
      { stage: 'First Scan → Return Visit', value: scanToReturnDropoff, hypothesis: 'Users may not see enough value or results are not actionable' },
    ];

    // Sort by biggest drop-off
    dropoffs.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

    for (let i = 0; i < dropoffs.length; i++) {
      const d = dropoffs[i];
      console.log(`\n  ${i + 1}. ${colors.bold}${d.stage}${colors.reset}: ${colors.red}${d.value}% lost${colors.reset}`);
      console.log(`     ${colors.yellow}Hypothesis:${colors.reset} ${d.hypothesis}`);
    }

    // TIME TO ACTIVATION
    header('⏱️ TIME TO ACTIVATION');
    metric('Avg Signup → First Site', `${timeToActivation.avgSignupToSiteHours} hours`);
    metric('Avg Site Added → First Scan', `${timeToActivation.avgSiteToScanHours} hours`);
    
    subheader('Time Distribution (Signup → Site)');
    const dist = timeToActivation.distribution;
    if (dist.total > 0) {
      metric('  Same session (<1h)', dist.sameSession, calcPct(dist.sameSession, dist.total));
      metric('  Within 24 hours', dist.within24h, calcPct(dist.within24h, dist.total));
      metric('  Within 7 days', dist.within7d, calcPct(dist.within7d, dist.total));
      metric('  Beyond 7 days', dist.beyond7d, calcPct(dist.beyond7d, dist.total));
    }

    // SITE PATTERNS
    header('🌐 SITE PATTERNS');
    metric('Avg Sites per User', sitePatterns.avgSitesPerUser);
    metric('Verification Success Rate', `${sitePatterns.verificationRate}%`);
    metric('Scan Success Rate', `${sitePatterns.scanSuccessRate}%`);
    
    subheader('Domain Types');
    for (const [type, count] of Object.entries(sitePatterns.domainTypes)) {
      metric(`  ${type}`, count, calcPct(count, sitePatterns.totalSites));
    }

    if (sitePatterns.zeroPageScans > 0) {
      subheader('⚠️ Zero Pages Crawled');
      metric('  Scans with 0 pages', sitePatterns.zeroPageScans);
      metric('  Affected users', sitePatterns.usersWithZeroPages);
    }

    // ERROR PATTERNS
    header('⚠️ ERROR PATTERNS');
    metric('Failed Scans', errorPatterns.failedScanCount);
    
    if (Object.keys(errorPatterns.errorCategories).length > 0) {
      subheader('Error Categories');
      for (const [category, count] of Object.entries(errorPatterns.errorCategories)) {
        metric(`  ${category}`, count);
      }
    }

    if (Object.keys(errorPatterns.eventsByLevel).length > 0) {
      subheader('Scan Events by Level');
      for (const [level, count] of Object.entries(errorPatterns.eventsByLevel)) {
        metric(`  ${level}`, count);
      }
    }

    // RECOMMENDATIONS
    header('💡 RECOMMENDATIONS');
    
    const recommendations = this.generateRecommendations(funnel, timeToActivation, sitePatterns, errorPatterns, dropoffs);
    for (let i = 0; i < recommendations.length; i++) {
      const r = recommendations[i];
      console.log(`\n  ${i + 1}. ${colors.bold}${r.title}${colors.reset}`);
      console.log(`     ${colors.cyan}Impact:${colors.reset} ${r.impact}`);
      console.log(`     ${colors.yellow}Effort:${colors.reset} ${r.effort}`);
      console.log(`     ${r.description}`);
    }

    // SUMMARY
    header('🎯 SUMMARY');
    console.log(`  Biggest drop-off: ${colors.bold}${dropoffs[0].stage}${colors.reset} (${dropoffs[0].value}% lost)`);
    console.log(`  Conversion to paid: ${colors.bold}${calcPct(funnel.convertedToPaid, funnel.totalSignups)}%${colors.reset}`);
    console.log(`  Activation rate (signup → scan): ${colors.bold}${calcPct(funnel.ranScan, funnel.totalSignups)}%${colors.reset}`);

    console.log(`\n${colors.bold}${colors.green}` + '='.repeat(60) + colors.reset);
  }

  generateRecommendations(funnel, timeToActivation, sitePatterns, errorPatterns, dropoffs) {
    const recommendations = [];

    // Based on biggest drop-off
    const biggestDropoff = dropoffs[0];
    
    if (biggestDropoff.stage === 'Signup → Site Added') {
      recommendations.push({
        title: 'Streamline Onboarding Flow',
        impact: 'HIGH - Could recover ' + biggestDropoff.value + '% of drop-offs',
        effort: 'Medium',
        description: 'Add inline site addition during signup. Use a 3-step wizard: 1) Signup 2) Add site 3) Verification. Consider pre-filling common domains or offering example sites.'
      });
    }

    if (biggestDropoff.stage === 'Site Added → Scan Triggered') {
      recommendations.push({
        title: 'Auto-Trigger First Scan + Better Verification UX',
        impact: 'HIGH - Could recover ' + biggestDropoff.value + '% of drop-offs',
        effort: 'Low-Medium',
        description: 'Automatically trigger scan after verification. Show verification progress in real-time. Add "Verify & Scan" single-button action. Send email with verification instructions.'
      });
    }

    if (biggestDropoff.stage === 'First Scan → Return Visit') {
      recommendations.push({
        title: 'Improve Scan Results Value + Email Nudges',
        impact: 'MEDIUM - Could improve retention by 20-30%',
        effort: 'Medium',
        description: 'Send email summary of scan results with clear next steps. Show "broken links found" prominently. Add scheduling prompts. Create urgency with "X links need attention".'
      });
    }

    // If verification rate is low
    if (parseFloat(sitePatterns.verificationRate) < 80) {
      recommendations.push({
        title: 'Fix Site Verification Issues',
        impact: 'HIGH - Currently only ' + sitePatterns.verificationRate + '% success',
        effort: 'Medium',
        description: 'Add alternative verification methods (DNS TXT record, HTML file upload). Better error messages when verification fails. Retry verification automatically. Support more site configurations.'
      });
    }

    // If there are many zero-page scans
    if (sitePatterns.zeroPageScans > 0) {
      recommendations.push({
        title: 'Debug Crawler Issues (Zero Pages)',
        impact: 'MEDIUM - ' + sitePatterns.zeroPageScans + ' scans affected',
        effort: 'Low',
        description: 'Investigate why crawler returns 0 pages. Common causes: JavaScript-heavy sites, robots.txt blocking, paywalls, or sitemap parsing errors. Add better error logging.'
      });
    }

    // Quick wins
    if (recommendations.length < 3) {
      recommendations.push({
        title: 'Add Progress Indicators',
        impact: 'MEDIUM - Reduces perceived friction',
        effort: 'Low',
        description: 'Show "Step 2 of 3" during onboarding. Display scan progress bar. Add "almost done" messaging. Visual progress reduces abandonment.'
      });
    }

    return recommendations.slice(0, 3);
  }

  async run() {
    try {
      header('Fetching Activation Funnel Data...');

      log('Getting funnel metrics...', 'info');
      const funnel = await this.getFunnelMetrics();

      log('Analyzing time-to-activation...', 'info');
      const timeToActivation = await this.getTimeToActivation();

      log('Analyzing site patterns...', 'info');
      const sitePatterns = await this.getSitePatterns();

      log('Analyzing error patterns...', 'info');
      const errorPatterns = await this.getErrorPatterns();

      this.generateReport(funnel, timeToActivation, sitePatterns, errorPatterns);

    } catch (error) {
      log(`Analysis failed: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`${colors.red}Error: Missing environment variables${colors.reset}`);
    console.error('\nPlease set:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('\nExample:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \\\');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=your-key \\\');
    console.error('  node scripts/analyze-activation-funnel.js');
    process.exit(1);
  }

  const analyzer = new ActivationFunnelAnalyzer(supabaseUrl, supabaseKey);
  await analyzer.run();
}

main();
