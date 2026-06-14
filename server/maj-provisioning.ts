import { storage } from "./storage";
import { schoolCodeForVenue, majUsernameBase, resolveUsername, majPassword } from "@shared/maj-provisioning";
import type { MajAthlete } from "@shared/schema";

// Create a MAJ athlete for a child if they don't already have one. Idempotent.
// Returns the athlete (new or existing-linked), or null if the child is missing.
export async function provisionMajAccess(childId: string, classId: string): Promise<MajAthlete | null> {
  const child = await storage.getChild(childId);
  if (!child) return null;
  if (child.majAthleteId) {
    return await storage.getMajAthleteById(child.majAthleteId) ?? null;
  }

  const cls = await storage.getClass(classId);
  const venue = cls?.venueId ? await storage.getVenue(cls.venueId) : undefined;
  const schoolCode = schoolCodeForVenue(venue?.name);
  const year = cls?.year ?? new Date().getFullYear();
  const password = majPassword(schoolCode, year);

  const taken = new Set(await storage.getAllMajUsernames());
  const username = resolveUsername(majUsernameBase(child.firstName, child.lastName), (u) => taken.has(u));

  const athlete = await storage.createMajAthlete({
    username,
    password,
    fullName: `${child.firstName} ${child.lastName}`,
    school: venue?.name ?? undefined,
    schoolCode,
    enabled: true,
  });
  await storage.updateChild(childId, { majAthleteId: athlete.id });
  return athlete;
}
