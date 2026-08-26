export type RouteAccessUser = {
  role?: string;
  roles?: string[];
  permissions?: string[];
  accessProfile?: string;
};

export const PERMISSIONS_LIST = [
  { key: "view_dashboard", label: "Home", group: "Daily work" },
  { key: "view_crm", label: "Leads & Customers", group: "Daily work" },
  { key: "view_requests", label: "Requests", group: "Daily work" },
  { key: "view_action_centre", label: "What Needs Attention", group: "Daily work" },
  { key: "view_clients", label: "Clients", group: "Clients" },
  { key: "view_medical_review", label: "Medical Review", group: "Clients" },
  { key: "view_orders", label: "Orders", group: "Clients" },
  { key: "view_coaching", label: "Coaching", group: "Clients" },
  { key: "view_appointments", label: "Appointments", group: "Clients" },
  { key: "view_messages", label: "Messages", group: "Clients" },
  { key: "view_trials", label: "Trials", group: "Growth" },
  { key: "view_buddies", label: "Buddy System", group: "Growth" },
  { key: "view_broadcast", label: "Send a Message", group: "Growth" },
  { key: "view_social_media", label: "Marketing", group: "Growth" },
  { key: "view_billing", label: "Payments", group: "Revenue" },
  { key: "view_pricing", label: "Pricing", group: "Revenue" },
  { key: "view_supplements", label: "Supplements", group: "Revenue" },
  { key: "view_reports", label: "Reports", group: "Reports" },
  { key: "view_contact_info", label: "See client contact info", group: "Special" },
  { key: "view_financials", label: "See financials", group: "Special" },
] as const;

const STAFF_PERMISSION_KEYS = PERMISSIONS_LIST.map((permission) => permission.key);

export const ROLE_DEFAULTS: Record<string, string[]> = {
  staff: STAFF_PERMISSION_KEYS,
  doctor: [
    "view_dashboard",
    "view_clients",
    "view_medical_review",
    "view_appointments",
    "view_messages",
  ],
};

const LEGACY_STAFF_ROLES = ["admin", "coach", "sales"];

export function normalizeAccessProfile(
  userOrRoles: RouteAccessUser | string[] | null | undefined
): "staff" | "doctor" {
  if (!userOrRoles) return "staff";

  if (!Array.isArray(userOrRoles) && userOrRoles.accessProfile === "doctor") {
    return "doctor";
  }
  if (!Array.isArray(userOrRoles) && userOrRoles.accessProfile === "staff") {
    return "staff";
  }

  const roles = Array.isArray(userOrRoles)
    ? userOrRoles
    : userOrRoles.roles || (userOrRoles.role ? [userOrRoles.role] : []);

  const hasStaffRole = roles.some((role) =>
    ["staff", ...LEGACY_STAFF_ROLES].includes(role)
  );

  return !hasStaffRole && roles.includes("doctor") ? "doctor" : "staff";
}

export function accessProfileLabel(
  userOrRoles: RouteAccessUser | string[] | null | undefined
): string {
  return normalizeAccessProfile(userOrRoles) === "doctor" ? "Doctor" : "Staff";
}

export function defaultPermissionsForRoles(roles: string[] = []): string[] {
  return [...ROLE_DEFAULTS[normalizeAccessProfile(roles)]];
}

const ROUTE_TO_PERMISSION: Record<string, string> = {
  "/dashboard": "view_dashboard",
  "/dashboard/crm/medical-review": "view_medical_review",
  "/dashboard/crm": "view_crm",
  "/dashboard/requests": "view_requests",
  "/dashboard/action-centre": "view_action_centre",
  "/dashboard/clients/lifecycle": "view_coaching",
  "/dashboard/clients": "view_clients",
  "/dashboard/orders": "view_orders",
  "/dashboard/coaching": "view_coaching",
  "/dashboard/week-3-review": "view_coaching",
  "/dashboard/appointments": "view_appointments",
  "/dashboard/messages": "view_messages",
  "/dashboard/trials": "view_trials",
  "/dashboard/buddies": "view_buddies",
  "/dashboard/broadcast": "view_broadcast",
  "/dashboard/social-media": "view_social_media",
  "/dashboard/billing": "view_billing",
  "/dashboard/pricing": "view_pricing",
  "/dashboard/supplements": "view_supplements",
  "/dashboard/reports": "view_reports",
};

function routeMatches(route: string, base: string): boolean {
  return route === base || route.startsWith(base + "/");
}

export function canAccessRoute(
  user: RouteAccessUser | null | undefined,
  route: string
): boolean {
  if (!user) return false;

  // KhairoDietClinic currently exposes only two dashboard access profiles. Staff have
  // full business access. Doctor is deliberately restricted to clinical work.
  if (normalizeAccessProfile(user) === "staff") {
    return true;
  }

  const match = Object.entries(ROUTE_TO_PERMISSION)
    .sort(([a], [b]) => b.length - a.length)
    .find(([base]) => routeMatches(route, base));

  if (!match) return false;

  return (
    user.permissions?.includes(match[1]) ||
    ROLE_DEFAULTS.doctor.includes(match[1])
  );
}
