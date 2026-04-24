import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/revalidate
 *
 * Revalidates blog pages when CMS content changes.
 * Called by Supabase webhook on blog_posts insert/update.
 *
 * Body: { secret: string, slug?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secret = body.secret;

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const slug = body.slug as string | undefined;

    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }

    // Always revalidate the blog index and sitemap
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      revalidated: true,
      slug: slug || "(all)",
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
