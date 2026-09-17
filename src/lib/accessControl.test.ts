import { describe, expect, it } from "vitest";

import {
  ROLE_DEFAULTS,
  accessProfileLabel,
  canAccessRoute,
  defaultPermissionsForRoles,
  normalizeAccessProfile,
} from "./accessControl";

describe("accessControl", () => {
  it("defaults missing access data to staff", () => {
    expect(normalizeAccessProfile(undefined)).toBe("staff");
    expect(accessProfileLabel(null)).toBe("Staff");
  });

  it("honors an explicit access profile", () => {
    expect(normalizeAccessProfile({ accessProfile: "doctor" })).toBe("doctor");
    expect(normalizeAccessProfile({ accessProfile: "staff", roles: ["doctor"] })).toBe("staff");
    expect(accessProfileLabel({ accessProfile: "doctor" })).toBe("Doctor");
  });

  it("normalizes legacy staff roles as staff", () => {
    expect(normalizeAccessProfile(["admin"])).toBe("staff");
    expect(normalizeAccessProfile(["coach"])).toBe("staff");
    expect(normalizeAccessProfile(["sales"])).toBe("staff");
    expect(normalizeAccessProfile({ role: "staff" })).toBe("staff");
  });

  it("identifies a doctor only when there is no staff role", () => {
    expect(normalizeAccessProfile(["doctor"])).toBe("doctor");
    expect(normalizeAccessProfile(["doctor", "admin"])).toBe("staff");
  });

  it("returns a copy of the default permission set", () => {
    const permissions = defaultPermissionsForRoles(["doctor"]);

    expect(permissions).toEqual(ROLE_DEFAULTS.doctor);
    expect(permissions).not.toBe(ROLE_DEFAULTS.doctor);
  });

  it("rejects unauthenticated users", () => {
    expect(canAccessRoute(null, "/dashboard")).toBe(false);
  });

  it("allows staff profiles to reach dashboard routes", () => {
    expect(canAccessRoute({ roles: ["staff"] }, "/dashboard")).toBe(true);
    expect(canAccessRoute({ roles: ["admin"] }, "/dashboard/anything/new")).toBe(true);
  });

  it("allows doctors only into clinical routes covered by their defaults", () => {
    const doctor = { roles: ["doctor"] };

    expect(canAccessRoute(doctor, "/dashboard")).toBe(true);
    expect(canAccessRoute(doctor, "/dashboard/clients")).toBe(true);
    expect(canAccessRoute(doctor, "/dashboard/clients/123")).toBe(true);
    expect(canAccessRoute(doctor, "/dashboard/crm/medical-review")).toBe(true);
    expect(canAccessRoute(doctor, "/dashboard/appointments")).toBe(true);
    expect(canAccessRoute(doctor, "/dashboard/messages")).toBe(true);
  });

  it("does not let the /dashboard root permission catch every subroute", () => {
    const doctor = { roles: ["doctor"] };

    expect(canAccessRoute(doctor, "/dashboard/crm")).toBe(false);
    expect(canAccessRoute(doctor, "/dashboard/billing")).toBe(false);
    expect(canAccessRoute(doctor, "/dashboard/unknown")).toBe(false);
  });

  it("uses the most specific route mapping first", () => {
    const doctor = {
      roles: ["doctor"],
      permissions: ["view_crm"],
    };

    expect(canAccessRoute(doctor, "/dashboard/crm")).toBe(true);
    expect(canAccessRoute(doctor, "/dashboard/crm/medical-review")).toBe(true);
  });

  it("accepts explicit doctor permissions beyond the defaults", () => {
    const doctor = {
      roles: ["doctor"],
      permissions: ["view_reports"],
    };

    expect(canAccessRoute(doctor, "/dashboard/reports")).toBe(true);
  });
});
