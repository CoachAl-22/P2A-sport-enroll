import { describe, expect, it } from "vitest";
import { adminAccountChangeError } from "./staff-status";

describe("admin account status safeguards", () => {
  const admin = { id: "admin-1", role: "admin" as const, active: true };

  it("prevents admins from deactivating themselves through either update path", () => {
    expect(adminAccountChangeError("admin-1", admin, "admin", false, 2)).toMatch(/own account/);
  });

  it("prevents admins from demoting themselves", () => {
    expect(adminAccountChangeError("admin-1", admin, "parent", true, 2)).toMatch(/own account/);
  });

  it("protects the last active administrator", () => {
    expect(adminAccountChangeError("other-admin", admin, "admin", false, 1)).toMatch(/last active/);
    expect(adminAccountChangeError("other-admin", admin, "parent", true, 1)).toMatch(/last active/);
  });

  it("allows disabling another admin while an active admin remains", () => {
    expect(adminAccountChangeError("other-admin", admin, "admin", false, 2)).toBeNull();
  });

  it("does not block ordinary staff status updates", () => {
    expect(adminAccountChangeError("admin-1", { id: "coach-1", role: "coach", active: true }, "coach", false, 1)).toBeNull();
  });
});