import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// This is the published Apps Script web app endpoint supplied for the
// /programs enquiry form. Forward from the server so we can check the HTTP
// response; browser "no-cors" requests otherwise report success even on error.
const ENQUIRY_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwB6eqse8cv-GmixB2SrSdXR6ak4BmUmIFDktIwm-f8HmhCUatBLGIf9X5nhNIoM_8qKw/exec";

const enquirySchema = z.object({
  website: z.string().max(200).optional().default(""),
  parent_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  child_name: z.string().trim().max(120).optional().default(""),
  school_year: z.enum(["prep-2", "3-6", "7-9", "10-12", "adult"]),
  venue: z.enum(["peninsula", "toorak", "frankston", "mornington", "other"]),
  goal: z.enum(["speed", "technique", "development", "injury", "performance"]),
  days: z.union([
    z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
    z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])).max(5),
  ]).optional(),
  sport: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
});

export function registerProgramEnquiryRoute(app: Express): void {
  app.post(
    "/api/programs/enquiry",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many enquiries. Please try again later." },
    }),
    async (req, res) => {
      const parsed = enquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please check the enquiry form and try again." });
      }
      const data = parsed.data;
      if (data.website) return res.json({ ok: true }); // honeypot: do not forward bot submissions

      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        if (key === "days") {
          for (const day of Array.isArray(value) ? value : value ? [value] : []) {
            body.append("days", day);
          }
        } else {
          body.set(key, String(value));
        }
      }

      try {
        const response = await fetch(ENQUIRY_WEB_APP_URL, {
          method: "POST",
          body,
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          console.error("Program enquiry web app returned HTTP", response.status);
          return res.status(502).json({ message: "Enquiry could not be sent. Please try again or email info@power2adapt.com." });
        }
        // Apps Script can return HTTP 200 for an application error. A lead
        // is accepted only after the webhook explicitly acknowledges it.
        const acknowledgement: unknown = await response.json();
        if (!acknowledgement || typeof acknowledgement !== "object" ||
            !("ok" in acknowledgement) || acknowledgement.ok !== true) {
          console.error("Program enquiry web app did not acknowledge the enquiry");
          return res.status(502).json({ message: "Enquiry could not be sent. Please try again or email info@power2adapt.com." });
        }
        return res.json({ ok: true });
      } catch (error) {
        console.error("Program enquiry web app request failed", error instanceof Error ? error.message : "Unknown error");
        return res.status(502).json({ message: "Enquiry could not be sent. Please try again or email info@power2adapt.com." });
      }
    },
  );
}