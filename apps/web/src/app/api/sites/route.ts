import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getUserPlan, getPlanLimits } from '@linkrescue/types';

// RFC-compliant domain: labels separated by dots, each 1-63 chars (alphanumeric + hyphens), no leading/trailing hyphens
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const createSiteSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .transform((d) => d.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase())
    .pipe(z.string().regex(DOMAIN_REGEX, 'Invalid domain format')),
  sitemap_url: z.string().url().optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Check plan limits
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null);
  const limits = getPlanLimits(plan);

  const { count } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count ?? 0) >= limits.sites) {
    return NextResponse.json(
      { error: `You can only have ${limits.sites} site(s) on the ${plan} plan. Upgrade to add more.` },
      { status: 403 }
    );
  }

  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      user_id: user.id,
      domain: parsed.data.domain,
      sitemap_url: parsed.data.sitemap_url ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This domain is already registered.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(site, { status: 201 });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(sites);
}
