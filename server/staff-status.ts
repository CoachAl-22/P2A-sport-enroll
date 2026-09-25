import type { User } from "@shared/schema";

type StaffAccount = Pick<User, "id" | "role" | "active">;

export function adminAccountChangeError(
  actorId: string,
  target: StaffAccount,
  nextRole: User["role"],
  nextActive: boolean,
  activeAdminCount: number,
): string | null {
  if (actorId === target.id && (!nextActive || nextRole !== "admin")) {
    return "You cannot deactivate or remove admin access from your own account";
  }
  if (
    target.role === "admin" &&
    target.active &&
    (!nextActive || nextRole !== "admin") &&
    activeAdminCount <= 1
  ) {
    return "The last active administrator cannot be deactivated or demoted";
  }
  return null;
}