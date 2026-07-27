import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { POST } from "../route";

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    })
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/revalidate", () => {
  // Regression: with REVALIDATE_SECRET unset, `undefined !== undefined` used to
  // pass the check and let any request revalidate paths.
  it("fails closed when REVALIDATE_SECRET is unset", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    delete process.env.REVALIDATE_SECRET;

    const res = await post({ slug: "some-post" });
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();

    const resUndefinedSecret = await post({ secret: undefined });
    expect(resUndefinedSecret.status).toBe(401);
  });

  it("rejects a wrong secret when REVALIDATE_SECRET is set", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "right-secret");
    const res = await post({ secret: "wrong-secret", slug: "some-post" });
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates with the correct secret", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "right-secret");
    const res = await post({ secret: "right-secret", slug: "some-post" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toBe(true);
    expect(json.slug).toBe("some-post");
    expect(revalidatePath).toHaveBeenCalledWith("/blog/some-post");
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("returns 400 on a malformed body", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "right-secret");
    const res = await POST(
      new NextRequest("http://localhost/api/revalidate", {
        method: "POST",
        body: "not json",
      })
    );
    expect(res.status).toBe(400);
  });
});
