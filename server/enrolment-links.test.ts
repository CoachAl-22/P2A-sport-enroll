import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerEnrolmentLinkRoutes } from "./enrolment-links";
import type { EnrolmentLink } from "@shared/schema";

const link = (over: Partial<EnrolmentLink> = {}): EnrolmentLink =>
  ({
    id: "00000000-0000-0000-0000-000000000001",
    slug: "foundation",
    label: "Foundation",
    destinationUrl: "https://sportsbiz.example/foundation",
    kind: "sportsbiz",
    active: true,
    notes: null,
    updatedAt: new Date(),
    ...over,
  }) as EnrolmentLink;

function buildApp(deps: any) {
  const app = express();
  registerEnrolmentLinkRoutes(app, deps);
  return app;
}

describe("GET /enrol/:slug", () => {
  let logEnrolmentLinkClick: any;

  beforeEach(() => {
    logEnrolmentLinkClick = vi.fn().mockResolvedValue(undefined);
  });

  it("redirects a known active slug to its destination", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link()),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation?src=flodesk");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://sportsbiz.example/foundation");
  });

  it("logs the click with the src", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link()),
      logEnrolmentLinkClick,
    });

    await request(app).get("/enrol/foundation?src=flodesk");

    expect(logEnrolmentLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "foundation", src: "flodesk" }),
    );
  });

  it("records src as direct when absent", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link()),
      logEnrolmentLinkClick,
    });

    await request(app).get("/enrol/foundation");

    expect(logEnrolmentLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({ src: "direct" }),
    );
  });

  it("sends an unknown slug to /programs and still logs the miss", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(undefined),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/does-not-exist");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/programs?closed=does-not-exist");
    expect(logEnrolmentLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "does-not-exist" }),
    );
  });

  it("sends an inactive slug to /programs", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link({ active: false })),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.headers.location).toBe("/programs?closed=foundation");
  });

  it("treats an empty destination as inactive", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link({ destinationUrl: "" })),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.headers.location).toBe("/programs?closed=foundation");
  });

  it("still redirects when logging throws", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link()),
      logEnrolmentLinkClick: vi.fn().mockRejectedValue(new Error("db down")),
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://sportsbiz.example/foundation");
  });

  it("still redirects to /programs when the lookup throws", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockRejectedValue(new Error("db down")),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/programs");
  });

  it("rejects a slug containing path characters without hitting the DB", async () => {
    const getEnrolmentLink = vi.fn().mockResolvedValue(link());
    const app = buildApp({ getEnrolmentLink, logEnrolmentLinkClick });

    const res = await request(app).get("/enrol/foo%2f..%2fbar");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/programs");
    expect(getEnrolmentLink).not.toHaveBeenCalled();
  });

  it("rejects a slug containing a CRLF sequence without hitting the DB", async () => {
    const getEnrolmentLink = vi.fn().mockResolvedValue(link());
    const app = buildApp({ getEnrolmentLink, logEnrolmentLinkClick });

    const res = await request(app).get("/enrol/foundation%0d%0aSet-Cookie:x");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/programs");
    expect(getEnrolmentLink).not.toHaveBeenCalled();
  });

  it("treats a protocol-relative destination as inactive", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link({ destinationUrl: "//evil.example" })),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/programs?closed=foundation");
  });

  it("treats a javascript: destination as inactive", async () => {
    const app = buildApp({
      getEnrolmentLink: vi
        .fn()
        .mockResolvedValue(link({ destinationUrl: "javascript:alert(1)" })),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/programs?closed=foundation");
  });

  it("allows an internal absolute path destination", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link({ destinationUrl: "/foundation" })),
      logEnrolmentLinkClick,
    });

    const res = await request(app).get("/enrol/foundation");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/foundation");
  });

  it("truncates an overlong slug to 100 characters before validating", async () => {
    const getEnrolmentLink = vi.fn().mockResolvedValue(link());
    const app = buildApp({ getEnrolmentLink, logEnrolmentLinkClick });
    const longSlug = "a".repeat(150);

    await request(app).get(`/enrol/${longSlug}`);

    expect(getEnrolmentLink).toHaveBeenCalledWith("a".repeat(100));
  });

  it("truncates an overlong src to 100 characters", async () => {
    const app = buildApp({
      getEnrolmentLink: vi.fn().mockResolvedValue(link()),
      logEnrolmentLinkClick,
    });
    const longSrc = "b".repeat(150);

    await request(app).get(`/enrol/foundation?src=${longSrc}`);

    expect(logEnrolmentLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({ src: "b".repeat(100) }),
    );
  });
});
