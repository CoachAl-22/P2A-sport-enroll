import type { Express, Request } from "express";
import type { EnrolmentLink, InsertEnrolmentLinkClick } from "@shared/schema";

export interface EnrolmentLinkDeps {
  getEnrolmentLink(slug: string): Promise<EnrolmentLink | undefined>;
  logEnrolmentLinkClick(click: InsertEnrolmentLinkClick): Promise<void>;
}

const HUB = "/programs";

function readSrc(req: Request): string {
  const raw = req.query.src;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || value.trim() === "") return "direct";
  return value.trim().slice(0, 100);
}

export function registerEnrolmentLinkRoutes(app: Express, deps: EnrolmentLinkDeps): void {
  app.get("/enrol/:slug", async (req, res) => {
    const slug = req.params.slug.toLowerCase().slice(0, 100);
    const src = readSrc(req);

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

    if (!link || !link.active || !link.destinationUrl.trim()) {
      return res.redirect(302, `${HUB}?closed=${encodeURIComponent(slug)}`);
    }

    return res.redirect(302, link.destinationUrl);
  });
}
