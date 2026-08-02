import type { Express, Request } from "express";
import type { EnrolmentLink, InsertEnrolmentLinkClick } from "@shared/schema";

export interface EnrolmentLinkDeps {
  getEnrolmentLink(slug: string): Promise<EnrolmentLink | undefined>;
  logEnrolmentLinkClick(click: InsertEnrolmentLinkClick): Promise<void>;
}

const HUB = "/programs";

// Real slugs are lowercase letters, digits and hyphens only, e.g.
// "foundation", "toorak-foundation-tue", "team-speed-430".
const SLUG_PATTERN = /^[a-z0-9-]{1,100}$/;

function readSrc(req: Request): string {
  const raw = req.query.src;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || value.trim() === "") return "direct";
  return value.trim().slice(0, 100);
}

// Only a same-origin absolute path ("/foundation", not "//evil.example" which
// browsers treat as protocol-relative) or an absolute http(s) URL is trusted
// as a redirect target. Everything else - javascript:, data:, mailto:,
// malformed strings - is treated the same as an inactive link.
function isSafeDestination(destination: string): boolean {
  const value = destination.trim();
  if (value === "") return false;

  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function registerEnrolmentLinkRoutes(app: Express, deps: EnrolmentLinkDeps): void {
  // /classes is retired in favour of /programs. It is redirected rather than
  // removed because the URL is in school newsletters, past emails, Instagram
  // and Google's index, and a parent holding an old link should arrive
  // somewhere useful rather than at a 404. 302 while the new page beds in;
  // make it 301 once we are sure.
  app.get("/classes", (req, res) => {
    const src = readSrc(req);
    void deps
      .logEnrolmentLinkClick({
        slug: "legacy-classes-page",
        src,
        referrer: req.get("referer") ?? null,
        userAgent: req.get("user-agent") ?? null,
      })
      .catch((err) => console.error("[enrol] legacy /classes log failed", err));
    return res.redirect(302, HUB);
  });

  app.get("/enrol/:slug", async (req, res) => {
    const rawSlug = req.params.slug.toLowerCase().slice(0, 100);
    const src = readSrc(req);

    if (!SLUG_PATTERN.test(rawSlug)) {
      // Not a real slug - do not touch the DB with it. Still record a
      // sanitized trace so we can see junk/attack traffic, then send the
      // parent somewhere useful.
      const sanitized = rawSlug.replace(/[^a-z0-9-]/g, "").slice(0, 100) || "invalid";
      void deps
        .logEnrolmentLinkClick({
          slug: sanitized,
          src,
          referrer: req.get("referer") ?? null,
          userAgent: req.get("user-agent") ?? null,
        })
        .catch((err) => console.error("[enrol] click log failed", sanitized, err));
      return res.redirect(302, HUB);
    }

    const slug = rawSlug;

    // Fire and forget. A logging failure must never cost us an enrolment.
    void deps
      .logEnrolmentLinkClick({
        slug,
        src,
        referrer: req.get("referer") ?? null,
        userAgent: req.get("user-agent") ?? null,
      })
      .catch((err) => console.error("[enrol] click log failed", slug, err));

    let link: EnrolmentLink | undefined;
    try {
      link = await deps.getEnrolmentLink(slug);
    } catch (err) {
      console.error("[enrol] lookup failed", slug, err);
      return res.redirect(302, HUB);
    }

    if (!link || !link.active || !isSafeDestination(link.destinationUrl)) {
      return res.redirect(302, `${HUB}?closed=${encodeURIComponent(slug)}`);
    }

    return res.redirect(302, link.destinationUrl);
  });
}
