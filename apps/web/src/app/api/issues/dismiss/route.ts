import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ISSUE_TYPES = [
  'BROKEN_4XX',
  'SERVER_5XX',
  'TIMEOUT',
  'REDIRECT_TO_HOME',
  'LOST_PARAMS',
  'SOFT_404',
  'CONTENT_CHANGED',
] as const;

const dismissSchema = z.object({
  linkId: z.string().uuid(),
  scope: z.enum(['single', 'host']),
  issueType: z.enum(ISSUE_TYPES).nullable().optional(),
  reason: z.string().max(500).optional(),
});

function hostnameFromHref(href: string): string | null {
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dismissSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }

  const { linkId, scope, issueType, reason } = parsed.data;

  const { data: link, error: linkError } = await supabase
    .from('links')
    .select('id, href, site:sites!inner(user_id)')
    .eq('id', linkId)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  const ownerId = Array.isArray(link.site) ? link.site[0]?.user_id : (link.site as any)?.user_id;
  if (ownerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const insert =
    scope === 'single'
      ? {
          user_id: user.id,
          link_id: link.id,
          pattern_host: null as string | null,
          issue_type: issueType ?? null,
          reason: reason ?? null,
        }
      : {
          user_id: user.id,
          link_id: null as string | null,
          pattern_host: hostnameFromHref(link.href),
          issue_type: issueType ?? null,
          reason: reason ?? null,
        };

  if (scope === 'host' && !insert.pattern_host) {
    return NextResponse.json({ error: 'Could not derive host from link' }, { status: 400 });
  }

  // Plain insert + unique-violation catch. The migration's partial unique
  // indexes (NULLS NOT DISTINCT) enforce idempotency at the DB layer, so
  // repeat clicks return 200 ok:duplicate instead of creating a second row.
  const { data, error } = await supabase
    .from('issue_dismissals')
    .insert(insert)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
