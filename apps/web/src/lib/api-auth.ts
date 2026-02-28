import { createClient } from '@/lib/supabase/server';
import { getUserPlan, PLAN_LIMITS, hasFeature, type PlanType } from '@linkrescue/types';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export type RateLimitType = 'read' | 'scan';

// API Key format: lr_<random_32_chars>
// Example: lr_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

export const API_KEY_PREFIX = 'lr_';
export const API_KEY_LENGTH = 35; // prefix (3) + 32 random chars

export interface ApiAuthContext {
  userId: string;
  plan: PlanType;
  apiKeyId: string;
}

/**
 * Generate a new API key
 * Returns the full key (to show once) and the hash/prefix for storage
 */
export function generateApiKey(): { fullKey: string; prefix: string } {
  const randomPart = Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
  
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;
  const prefix = fullKey.slice(0, 11); // lr_ + first 8 chars
  
  return { fullKey, prefix };
}

/**
 * Hash an API key for storage
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

/**
 * Verify an API key against a hash
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

/**
 * Create a Supabase client for API routes (no cookies needed)
 */
export function createApiClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // No-op for API routes
        },
        remove(name: string, options: CookieOptions) {
          // No-op for API routes
        },
      },
    }
  );
}

/**
 * Authenticate a request using API key from Authorization header
 * Format: Authorization: Bearer lr_xxxxxxxx...
 */
export async function authenticateApiRequest(
  request: Request
): Promise<{ success: true; context: ApiAuthContext } | { success: false; error: string; status: number }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return { success: false, error: 'Missing Authorization header', status: 401 };
  }
  
  const [scheme, key] = authHeader.split(' ');
  
  if (scheme !== 'Bearer' || !key) {
    return { success: false, error: 'Invalid Authorization header format. Use: Bearer <api_key>', status: 401 };
  }
  
  if (!key.startsWith(API_KEY_PREFIX)) {
    return { success: false, error: 'Invalid API key format', status: 401 };
  }
  
  const supabase = createApiClient();
  
  // Find the API key by prefix first (faster lookup)
  const prefix = key.slice(0, 11);
  const { data: apiKeys, error: fetchError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .or('expires_at.is.null');
  
  if (fetchError || !apiKeys || apiKeys.length === 0) {
    return { success: false, error: 'Invalid or expired API key', status: 401 };
  }
  
  // Check each key against the hash
  let matchedKey = null;
  for (const apiKey of apiKeys) {
    if (await verifyApiKey(key, apiKey.key_hash)) {
      matchedKey = apiKey;
      break;
    }
  }
  
  if (!matchedKey) {
    return { success: false, error: 'Invalid API key', status: 401 };
  }
  
  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', matchedKey.id);
  
  // Get user's plan
  const { data: user } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', matchedKey.user_id)
    .single();
  
  const plan = getUserPlan(user?.stripe_price_id ?? null);
  
  // Check if plan has API access
  if (!hasFeature(plan, 'api_access')) {
    return { success: false, error: 'API access not available on your plan. Upgrade to Pro or Agency.', status: 403 };
  }
  
  return {
    success: true,
    context: {
      userId: matchedKey.user_id,
      plan,
      apiKeyId: matchedKey.id,
    },
  };
}

/**
 * Check and update rate limit for a user
 * Returns true if request is allowed, false if rate limited
 * 
 * Read limits: Per hour, for GET requests
 * Scan limits: Per day (resets at midnight UTC), for POST /scans
 */
export async function checkRateLimit(
  userId: string,
  plan: PlanType,
  type: RateLimitType = 'read'
): Promise<{ allowed: boolean; limit: number; remaining: number; resetAt: Date }> {
  const supabase = createApiClient();
  
  const now = new Date();
  
  if (type === 'read') {
    // Read limits: per hour
    const limit = PLAN_LIMITS[plan].apiReadRequestsPerHour;
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const nextWindow = new Date(windowStart.getTime() + 60 * 60 * 1000);
    
    // Try to increment existing counter
    const { data: existing } = await supabase
      .from('api_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('limit_type', 'read')
      .eq('window_start', windowStart.toISOString())
      .single();
    
    if (existing) {
      if (existing.request_count >= limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetAt: nextWindow,
        };
      }
      
      // Increment counter
      await supabase
        .from('api_rate_limits')
        .update({ 
          request_count: existing.request_count + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id);
      
      return {
        allowed: true,
        limit,
        remaining: limit - existing.request_count - 1,
        resetAt: nextWindow,
      };
    }
    
    // Create new counter
    await supabase
      .from('api_rate_limits')
      .insert({
        user_id: userId,
        limit_type: 'read',
        window_start: windowStart.toISOString(),
        request_count: 1,
      });
    
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: nextWindow,
    };
  } else {
    // Scan limits: per day (resets at midnight UTC)
    const limit = PLAN_LIMITS[plan].apiScanRequestsPerDay;
    
    // Get today's midnight UTC
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
    
    // Try to increment existing counter
    const { data: existing } = await supabase
      .from('api_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('limit_type', 'scan')
      .eq('window_start', todayMidnight.toISOString())
      .single();
    
    if (existing) {
      if (existing.request_count >= limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetAt: tomorrowMidnight,
        };
      }
      
      // Increment counter
      await supabase
        .from('api_rate_limits')
        .update({ 
          request_count: existing.request_count + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id);
      
      return {
        allowed: true,
        limit,
        remaining: limit - existing.request_count - 1,
        resetAt: tomorrowMidnight,
      };
    }
    
    // Create new counter
    await supabase
      .from('api_rate_limits')
      .insert({
        user_id: userId,
        limit_type: 'scan',
        window_start: todayMidnight.toISOString(),
        request_count: 1,
      });
    
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: tomorrowMidnight,
    };
  }
}
