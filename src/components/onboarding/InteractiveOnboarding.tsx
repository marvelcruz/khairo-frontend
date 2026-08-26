"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { api } from "@/lib/api";
import {
  canAccessRoute,
} from "@/lib/accessControl";

type StaffProfile = {
  _id: string;
  name: string;
  email?: string;
  roles: string[];
  permissions?: string[];
};

type ClientProfile = {
  _id?: string;
  id?: string;
  fullName: string;
  portalAccess?: {
    stage?: string | null;
  };
};

type Audience =
  | "client"
  | "admin"
  | "staff"
  | "coach"
  | "doctor"
  | "sales";

type Identity =
  | {
      kind: "staff";
      id: string;
      name: string;
      audience: Exclude<Audience, "client">;
      user: StaffProfile;
    }
  | {
      kind: "client";
      id: string;
      name: string;
      audience: "client";
      client: ClientProfile;
    };

type TourStep = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  href: string;
};

type StoredTour = {
  status:
    | "in_progress"
    | "completed"
    | "skipped";
  completed: string[];
  stepIndex?: number;
};

type Spotlight = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PUBLIC_PORTAL_PATHS = new Set([
  "/portal/login",
  "/portal/register",
  "/portal/activate",
]);

const CLIENT_FULL: TourStep[] = [
  {
    id: "client-home",
    title: "Your Khairo Diet Clinic home",
    description:
      "This is your personal starting point. It brings your program, progress and support together.",
    instruction:
      "Open Home and look around your personal dashboard.",
    href: "/portal",
  },
  {
    id: "client-plan",
    title: "Follow your plan",
    description:
      "Your Plan shows the meals, guidance and activities prepared for you.",
    instruction:
      "Open My Plan and see what Khairo Diet Clinic has prepared for you today.",
    href: "/portal/plan",
  },
  {
    id: "client-log",
    title: "Log your progress",
    description:
      "Use your Log to record progress and help your care team understand how things are going.",
    instruction:
      "Open Log and explore the information you can record. You do not need to submit anything during the tutorial.",
    href: "/portal/log",
  },
  {
    id: "client-messages",
    title: "Stay connected",
    description:
      "Messages is where you communicate with the Khairo Diet Clinic team supporting you.",
    instruction:
      "Open Messages so you know where to come when you need support.",
    href: "/portal/messages",
  },
  {
    id: "client-book",
    title: "Appointments",
    description:
      "Use Book to view or arrange sessions with your Khairo Diet Clinic team.",
    instruction:
      "Open Book and see how appointments work. Nothing will be booked automatically.",
    href: "/portal/book",
  },
  {
    id: "client-documents",
    title: "Your documents",
    description:
      "Important documents shared with you are kept together here.",
    instruction:
      "Open Documents and see where your Khairo Diet Clinic documents live.",
    href: "/portal/documents",
  },
  {
    id: "client-resources",
    title: "Resources",
    description:
      "Resources gives you useful Khairo Diet Clinic information without having to search for it.",
    instruction:
      "Open Resources and explore what is available to you.",
    href: "/portal/resources",
  },
  {
    id: "client-settings",
    title: "Make Khairo Diet Clinic yours",
    description:
      "Settings is where you manage your account preferences.",
    instruction:
      "Open Settings so you know where to manage your account later.",
    href: "/portal/settings",
  },
];

const CLIENT_PREVIEW: TourStep[] = [
  CLIENT_FULL[0],
  {
    id: "client-preview-resources",
    title: "Explore Khairo Diet Clinic resources",
    description:
      "Your preview account gives you a place to learn more while your full program access is being prepared.",
    instruction:
      "Open Resources and explore what is available.",
    href: "/portal/resources",
  },
  CLIENT_FULL[7],
];

const STAFF_TOURS: Record<
  Exclude<Audience, "client">,
  TourStep[]
> = {
  admin: [
    {
      id: "admin-dashboard",
      title: "Your command centre",
      description:
        "The dashboard gives you the operational picture of Khairo Diet Clinic.",
      instruction:
        "Open Dashboard and review the information waiting for your attention.",
      href: "/dashboard",
    },
    {
      id: "admin-crm",
      title: "CRM",
      description:
        "CRM tracks leads, opportunities and follow-up activity.",
      instruction:
        "Open CRM and explore the current pipeline.",
      href: "/dashboard/crm",
    },
    {
      id: "admin-clients",
      title: "Clients",
      description:
        "Clients brings together the people currently moving through Khairo Diet Clinic.",
      instruction:
        "Open Clients and see how client records are organized.",
      href: "/dashboard/clients",
    },
    {
      id: "admin-coaching",
      title: "Coaching",
      description:
        "Coaching helps the team review client progress, follow-up and coaching activity.",
      instruction:
        "Open Coaching and explore the coaching workspace.",
      href: "/dashboard/coaching",
    },
    {
      id: "admin-appointments",
      title: "Appointments",
      description:
        "Appointments shows scheduled client and team sessions.",
      instruction:
        "Open Appointments and review the scheduling workspace.",
      href: "/dashboard/appointments",
    },
    {
      id: "admin-messages",
      title: "Messages",
      description:
        "Messages keeps permitted client conversations inside the Khairo Diet Clinic workflow.",
      instruction:
        "Open Messages and see how conversations are organized.",
      href: "/dashboard/messages",
    },

    // GROWTH
    {
      id: "growth-trials",
      title: "Growth — Trials",
      description:
        "Trials helps the team manage prospective clients moving through the trial process.",
      instruction:
        "Open Trials and see how trial activity is managed.",
      href: "/dashboard/trials",
    },
    {
      id: "growth-buddies",
      title: "Growth — Buddy System",
      description:
        "Buddy System helps organize Khairo Diet Clinic buddy relationships and activity.",
      instruction:
        "Open Buddy System and explore how buddy relationships are managed.",
      href: "/dashboard/buddies",
    },
    {
      id: "growth-broadcasts",
      title: "Growth — Broadcasts",
      description:
        "Broadcasts lets authorized team members communicate with groups at scale.",
      instruction:
        "Open Broadcasts and explore the communication workspace.",
      href: "/dashboard/broadcast",
    },
    {
      id: "growth-templates",
      title: "Growth — Message Templates",
      description:
        "Message Templates provides reusable communication for common Khairo Diet Clinic workflows.",
      instruction:
        "Open Message Templates and see how reusable messages are organized.",
      href: "/dashboard/templates",
    },
    {
      id: "growth-social-media",
      title: "Growth — Social Media",
      description:
        "Social Media brings content planning, performance analysis, recommendations and approvals into one Growth workspace.",
      instruction:
        "Open Social Media and see how social performance becomes recommended next actions.",
      href: "/dashboard/social-media",
    },

    // ADMIN
    {
      id: "admin-reports",
      title: "Admin — Reports",
      description:
        "Reports helps authorized users understand performance across the business.",
      instruction:
        "Open Reports and review the available information.",
      href: "/dashboard/reports",
    },
    {
      id: "admin-audit",
      title: "Admin — Audit Trail",
      description:
        "Audit Trail provides visibility into important recorded activity in Khairo Diet Clinic.",
      instruction:
        "Open Audit Trail and see how activity is tracked.",
      href: "/dashboard/audit",
    },
    {
      id: "admin-staff",
      title: "Admin — Staff",
      description:
        "Staff is where authorized administrators manage Khairo Diet Clinic team members.",
      instruction:
        "Open Staff and explore the team-management workspace.",
      href: "/dashboard/staff",
    },
    {
      id: "admin-logins",
      title: "Admin — Logins",
      description:
        "Logins gives administrators visibility into the accounts used to access Khairo Diet Clinic.",
      instruction:
        "Open Logins and see how access accounts are organized.",
      href: "/dashboard/accounts",
    },
    {
      id: "admin-custom-fields",
      title: "Admin — Custom Fields",
      description:
        "Custom Fields lets Khairo Diet Clinic capture additional structured information where needed.",
      instruction:
        "Open Custom Fields and explore how additional fields are managed.",
      href: "/dashboard/custom-fields",
    },
    {
      id: "admin-forms",
      title: "Admin — Form Builder",
      description:
        "Form Builder is where reusable Khairo Diet Clinic forms are created and managed.",
      instruction:
        "Open Form Builder and see how forms are organized.",
      href: "/dashboard/forms",
    },
    {
      id: "admin-workflows",
      title: "Admin — Workflow Builder",
      description:
        "Workflow Builder helps administrators configure repeatable operational workflows.",
      instruction:
        "Open Workflow Builder and explore the workflow tools.",
      href: "/dashboard/workflows",
    },
    {
      id: "admin-website-content",
      title: "Admin — Website Content",
      description:
        "Website Content provides authorized control over editable website information.",
      instruction:
        "Open Website Content and see what can be managed.",
      href: "/dashboard/website-content",
    },
    {
      id: "admin-business-configuration",
      title: "Admin — Business Configuration",
      description:
        "Business Configuration contains settings that control how Khairo Diet Clinic operates.",
      instruction:
        "Open Business Configuration and explore the available settings.",
      href: "/dashboard/business-configuration",
    },
    {
      id: "admin-role-configuration",
      title: "Admin — Role Configuration",
      description:
        "Role Configuration controls what different team roles are allowed to access.",
      instruction:
        "Open Role Configuration and see how permissions are organized.",
      href: "/dashboard/role-configuration",
    },
    {
      id: "admin-documents-contracts",
      title: "Admin — Documents & Contracts",
      description:
        "Documents & Contracts manages shared operational documents and contract-related records.",
      instruction:
        "Open Documents & Contracts and explore the workspace.",
      href: "/dashboard/documents-contracts",
    },
    {
      id: "admin-projects-tasks",
      title: "Admin — Projects & Tasks",
      description:
        "Projects & Tasks helps the Khairo Diet Clinic team coordinate internal operational work.",
      instruction:
        "Open Projects & Tasks and see how internal work is organized.",
      href: "/dashboard/projects-tasks",
    },
  ],

  staff: [
    {
      id: "staff-dashboard",
      title: "Your work starts here",
      description:
        "The dashboard summarizes the operational work that needs attention.",
      instruction:
        "Open Dashboard and review your current workload.",
      href: "/dashboard",
    },
    {
      id: "staff-clients",
      title: "Client records",
      description:
        "Clients gives you the client information your role is authorized to use.",
      instruction:
        "Open Clients and explore the client list.",
      href: "/dashboard/clients",
    },
    {
      id: "staff-coaching",
      title: "Coaching workflow",
      description:
        "Coaching helps the team monitor client progress and follow-up.",
      instruction:
        "Open Coaching and see how active client work is organized.",
      href: "/dashboard/coaching",
    },
    {
      id: "staff-appointments",
      title: "Appointments",
      description:
        "Use Appointments to keep scheduled sessions organized.",
      instruction:
        "Open Appointments and explore the schedule.",
      href: "/dashboard/appointments",
    },
    {
      id: "staff-messages",
      title: "Messages",
      description:
        "Messages keeps permitted client communication in one place.",
      instruction:
        "Open Messages and see how conversations are organized.",
      href: "/dashboard/messages",
    },
    {
      id: "staff-reports",
      title: "Reports",
      description:
        "Reports shows the operational information available to your role.",
      instruction:
        "Open Reports and explore what you can see.",
      href: "/dashboard/reports",
    },
    {
      id: "staff-supplements",
      title: "Supplements",
      description:
        "Use Supplements for the inventory and supplement work available to your role.",
      instruction:
        "Open Supplements and explore the workspace.",
      href: "/dashboard/supplements",
    },
  ],

  coach: [
    {
      id: "coach-dashboard",
      title: "Your coaching dashboard",
      description:
        "Start here to see the clients and actions that need your attention.",
      instruction:
        "Open Dashboard and review your current coaching workload.",
      href: "/dashboard",
    },
    {
      id: "coach-clients",
      title: "Your clients",
      description:
        "Client records bring together the information you need to support each person.",
      instruction:
        "Open Clients and choose where you would normally begin reviewing a client.",
      href: "/dashboard/clients",
    },
    {
      id: "coach-coaching",
      title: "Coaching workspace",
      description:
        "The Coaching area helps you review progress and manage coaching follow-up.",
      instruction:
        "Open Coaching and explore the current client queue.",
      href: "/dashboard/coaching",
    },
    {
      id: "coach-appointments",
      title: "Your sessions",
      description:
        "Appointments keeps upcoming coaching and client sessions organized.",
      instruction:
        "Open Appointments and review the schedule.",
      href: "/dashboard/appointments",
    },
    {
      id: "coach-messages",
      title: "Stay connected to clients",
      description:
        "Messages is where permitted client conversations are managed.",
      instruction:
        "Open Messages and see how your conversations are organized.",
      href: "/dashboard/messages",
    },
    {
      id: "coach-requests",
      title: "Handle client requests",
      description:
        "Requests helps you respond to work entering the client-delivery process.",
      instruction:
        "Open Requests and see what requires attention.",
      href: "/dashboard/requests",
    },
    {
      id: "action-centre",
      title: "Action Centre",
      description:
        "Action Centre watches Khairo Diet Clinic for work that is overdue, stuck or requires attention.",
      instruction:
        "Open Action Centre to see what needs attention and the recommended next action.",
      href: "/dashboard/action-centre",
    },
    {
      id: "coach-reports",
      title: "Understand performance",
      description:
        "Reports helps you see the information available to your coaching role.",
      instruction:
        "Open Reports and explore the available performance information.",
      href: "/dashboard/reports",
    },
  ],

  doctor: [
    {
      id: "doctor-dashboard",
      title: "Your clinical starting point",
      description:
        "The dashboard gives you a focused view of the Khairo Diet Clinic work available to your role.",
      instruction:
        "Open Dashboard and see your current overview.",
      href: "/dashboard",
    },
    {
      id: "doctor-clients",
      title: "Your assigned clients",
      description:
        "My Clients is limited to the client information available to your doctor role.",
      instruction:
        "Open My Clients and see where assigned client records are accessed.",
      href: "/dashboard/clients",
    },
    {
      id: "doctor-appointments",
      title: "Clinical appointments",
      description:
        "Appointments shows the sessions available to you.",
      instruction:
        "Open Appointments and review the schedule.",
      href: "/dashboard/appointments",
    },
    {
      id: "doctor-messages",
      title: "Care communication",
      description:
        "Messages lets you participate in permitted client-care conversations.",
      instruction:
        "Open Messages and see how client communication is organized.",
      href: "/dashboard/messages",
    },
  ],

  sales: [
    {
      id: "sales-dashboard",
      title: "Your sales overview",
      description:
        "The dashboard gives you the Khairo Diet Clinic activity relevant to your role.",
      instruction:
        "Open Dashboard and review your current overview.",
      href: "/dashboard",
    },
    {
      id: "sales-crm",
      title: "Work the pipeline",
      description:
        "CRM is where leads, opportunities, follow-ups and pipeline movement are managed.",
      instruction:
        "Open CRM and explore the current pipeline.",
      href: "/dashboard/crm",
    },
    {
      id: "sales-requests",
      title: "New requests",
      description:
        "Requests shows incoming work that your role is permitted to handle.",
      instruction:
        "Open Requests and see what needs attention.",
      href: "/dashboard/requests",
    },
    {
      id: "action-centre",
      title: "Action Centre",
      description:
        "Action Centre watches Khairo Diet Clinic for work that is overdue, stuck or requires attention.",
      instruction:
        "Open Action Centre to see what needs attention and the recommended next action.",
      href: "/dashboard/action-centre",
    },
    {
      id: "sales-broadcast",
      title: "Broadcast communication",
      description:
        "Broadcasts helps authorized users communicate at scale.",
      instruction:
        "Open Broadcasts and explore the available communication tools.",
      href: "/dashboard/broadcast",
    },
  ],
};

function chooseStaffAudience(
  roles: string[]
): Exclude<Audience, "client"> {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("doctor")) return "doctor";
  if (roles.includes("coach")) return "coach";
  if (roles.includes("sales")) return "sales";
  return "staff";
}

function visibleHrefElement(
  href: string
): HTMLElement | null {
  const links =
    Array.from(
      document.querySelectorAll<HTMLElement>(
        "a[href]"
      )
    );

  for (const link of links) {
    if (
      link.getAttribute("href") !== href
    ) {
      continue;
    }

    const rect =
      link.getBoundingClientRect();

    const style =
      window.getComputedStyle(link);

    if (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    ) {
      return link;
    }
  }

  return null;
}

function matchesPath(
  pathname: string,
  href: string
) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/portal") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(
      href + "/"
    )
  );
}

export default function InteractiveOnboarding() {
  const pathname =
    usePathname() || "/";

  const router =
    useRouter();

  const isDashboard =
    pathname.startsWith(
      "/dashboard"
    );

  const isPortal =
    pathname.startsWith(
      "/portal"
    );

  const appEligible =
    isDashboard ||
    (
      isPortal &&
      !PUBLIC_PORTAL_PATHS.has(
        pathname
      )
    );

  const [
    identity,
    setIdentity,
  ] =
    useState<Identity | null>(
      null
    );

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    welcome,
    setWelcome,
  ] =
    useState(false);

  const [
    stepIndex,
    setStepIndex,
  ] =
    useState(0);

  const [
    completed,
    setCompleted,
  ] =
    useState<string[]>([]);

  const [
    spotlight,
    setSpotlight,
  ] =
    useState<Spotlight | null>(
      null
    );

  const initializedKey =
    useRef<string | null>(
      null
    );

  useEffect(() => {
    if (!appEligible) {
      setIdentity(null);
      setOpen(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        if (isDashboard) {
          const token =
            localStorage.getItem(
              "khairo_staff_token"
            );

          if (!token) {
            return;
          }

          const response =
            await api.get<{
              user: StaffProfile;
            }>(
              "/auth/me",
              {
                timeoutMs: 10000,
              }
            );

          if (cancelled) return;

          const user =
            response.user;

          setIdentity({
            kind: "staff",
            id: user._id,
            name: user.name,
            audience:
              chooseStaffAudience(
                user.roles || []
              ),
            user,
          });

          return;
        }

        if (isPortal) {
          const token =
            localStorage.getItem(
              "khairo_client_token"
            );

          if (!token) {
            return;
          }

          const response =
            await api.get<{
              client: ClientProfile;
            }>(
              "/client-auth/me",
              {
                isClientRoute: true,
                timeoutMs: 10000,
              }
            );

          if (cancelled) return;

          const client =
            response.client;

          setIdentity({
            kind: "client",
            id:
              client._id ||
              client.id ||
              client.fullName,
            name:
              client.fullName,
            audience: "client",
            client,
          });
        }
      } catch {
        // Existing auth contexts remain
        // authoritative for session handling.
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    appEligible,
    isDashboard,
    isPortal,
  ]);

  const steps =
    useMemo(() => {
      if (!identity) {
        return [];
      }

      if (
        identity.kind ===
        "client"
      ) {
        const stage =
          identity.client
            .portalAccess
            ?.stage;

        return stage ===
          "preview"
          ? CLIENT_PREVIEW
          : CLIENT_FULL;
      }

      return STAFF_TOURS[
        identity.audience
      ].filter((step) =>
        canAccessRoute(
          identity.user,
          step.href
        )
      );
    }, [identity]);

  const storageKey =
    identity
      ? `khairo-onboarding-v1:${identity.audience}:${identity.id}`
      : "";

  useEffect(() => {
    if (
      !identity ||
      !storageKey ||
      steps.length === 0
    ) {
      return;
    }

    if (
      initializedKey.current ===
      storageKey
    ) {
      return;
    }

    initializedKey.current =
      storageKey;

    const stored =
      localStorage.getItem(
        storageKey
      );

    if (!stored) {
      setCompleted([]);
      setStepIndex(0);
      setWelcome(true);
      setOpen(true);
      return;
    }

    try {
      const parsed =
        JSON.parse(
          stored
        ) as StoredTour;

      const restoredCompleted =
        Array.isArray(
          parsed.completed
        )
          ? parsed.completed
          : [];

      const restoredIndex =
        typeof parsed.stepIndex === "number"
          ? Math.min(
              Math.max(
                parsed.stepIndex,
                0
              ),
              Math.max(
                steps.length - 1,
                0
              )
            )
          : 0;

      setCompleted(
        restoredCompleted
      );

      setStepIndex(
        restoredIndex
      );

      if (
        parsed.status ===
        "in_progress"
      ) {
        setWelcome(false);
        setOpen(true);
      } else {
        setOpen(false);
        setWelcome(false);
      }
    } catch {
      localStorage.removeItem(
        storageKey
      );

      setCompleted([]);
      setStepIndex(0);
      setWelcome(true);
      setOpen(true);
    }
  }, [
    identity,
    storageKey,
    steps.length,
  ]);

  const currentStep =
    steps[stepIndex];

  useEffect(() => {
    if (
      !open ||
      welcome ||
      !currentStep
    ) {
      setSpotlight(null);
      return;
    }

    const update =
      () => {
        const element =
          visibleHrefElement(
            currentStep.href
          );

        if (!element) {
          setSpotlight(null);
          return;
        }

        const rect =
          element.getBoundingClientRect();

        setSpotlight({
          top:
            Math.max(
              4,
              rect.top - 6
            ),
          left:
            Math.max(
              4,
              rect.left - 6
            ),
          width:
            rect.width + 12,
          height:
            rect.height + 12,
        });
      };

    setSpotlight(null);

    const timer =
      window.setTimeout(
        update,
        350
      );

    window.addEventListener(
      "resize",
      update
    );

    return () => {
      window.clearTimeout(
        timer
      );

      window.removeEventListener(
        "resize",
        update
      );
    };
  }, [
    open,
    welcome,
    currentStep,
    pathname,
  ]);

  if (
    !appEligible ||
    !identity ||
    steps.length === 0
  ) {
    return null;
  }

  const save = (
    status: StoredTour["status"],
    nextCompleted: string[],
    nextStepIndex: number = stepIndex
  ) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        status,
        completed:
          nextCompleted,
        stepIndex:
          nextStepIndex,
      } satisfies StoredTour)
    );
  };

  const skip =
    () => {
      save(
        "skipped",
        completed
      );

      setOpen(false);
      setWelcome(false);
      setSpotlight(null);
    };

  const restart =
    () => {
      setCompleted([]);
      setStepIndex(0);
      setWelcome(true);
      setOpen(true);

      save(
        "in_progress",
        [],
        0
      );
    };

  const begin =
    () => {
      setWelcome(false);
      setStepIndex(0);

      save(
        "in_progress",
        completed,
        0
      );
    };

  const next =
    () => {
      if (!currentStep) {
        return;
      }

      const nextCompleted =
        Array.from(
          new Set([
            ...completed,
            currentStep.id,
          ])
        );

      setCompleted(
        nextCompleted
      );

      if (
        stepIndex >=
        steps.length - 1
      ) {
        save(
          "completed",
          nextCompleted
        );

        setOpen(false);
        setSpotlight(null);
        return;
      }

      const nextIndex =
        stepIndex + 1;

      save(
        "in_progress",
        nextCompleted,
        nextIndex
      );

      setStepIndex(
        nextIndex
      );
    };

  const onPrimary =
    () => {
      if (!currentStep) {
        return;
      }

      if (
        matchesPath(
          pathname,
          currentStep.href
        )
      ) {
        next();
        return;
      }

      router.push(
        currentStep.href
      );
    };

  const onBack =
    () => {
      const previousIndex =
        Math.max(
          0,
          stepIndex - 1
        );

      setStepIndex(
        previousIndex
      );

      save(
        "in_progress",
        completed,
        previousIndex
      );
    };

  const onTarget =
    currentStep
      ? matchesPath(
          pathname,
          currentStep.href
        )
      : false;

  const firstName =
    identity.name
      .trim()
      .split(/\s+/)[0] ||
    "there";

  const audienceLabel: Record<
    Audience,
    string
  > = {
    client: "Client",
    admin: "Admin",
    staff: "Staff",
    coach: "Coach",
    doctor: "Doctor",
    sales: "Sales",
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={restart}
          className="fixed bottom-20 right-4 z-[90] flex h-11 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-xs font-semibold text-[var(--theme-text)] shadow-lg transition hover:bg-[var(--theme-surface-hover)] md:bottom-5"
          aria-label="Open Khairo Diet Clinic guide"
        >
          <Compass
            size={15}
            className="text-[#0d9488]"
          />
          Guide
        </button>
      )}

      {open &&
        welcome && (
          <div className="fixed inset-0 z-[110] grid place-items-center bg-black/55 p-4 backdrop-blur-[3px]">
            <section className="w-full max-w-lg rounded-[28px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-[var(--theme-text)] shadow-2xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0d9488]/10 text-[#0d9488]">
                  <Sparkles
                    size={22}
                  />
                </div>

                <button
                  type="button"
                  onClick={skip}
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--theme-text-muted)] transition hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                  aria-label="Close tutorial"
                >
                  <X size={17} />
                </button>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">
                Khairo Diet Clinic interactive guide
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Welcome, {firstName}.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[var(--theme-text-secondary)]">
                There is a lot you can do in Khairo Diet Clinic, so we will not make you read a long manual. We will show you around the real app and let you try each section yourself.
              </p>

              <div className="mt-5 rounded-2xl border border-[var(--theme-border-soft)] bg-[var(--theme-surface-soft)] p-4">
                <p className="text-sm font-semibold">
                  Your {audienceLabel[identity.audience]} guide
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--theme-text-muted)]">
                  {steps.length} short interactive steps. The guide only shows areas your account can access.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={begin}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Play size={15} />
                  Start the tour
                </button>

                <button
                  type="button"
                  onClick={skip}
                  className="h-11 rounded-full border border-[var(--theme-border)] px-5 text-sm font-medium text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)]"
                >
                  Explore on my own
                </button>
              </div>

              <p className="mt-4 text-center text-[11px] text-[var(--theme-text-muted)]">
                You can restart this anytime using the Guide button.
              </p>
            </section>
          </div>
        )}

      {open &&
        !welcome &&
        currentStep && (
          <>
            {spotlight && (
              <div
                aria-hidden="true"
                className="pointer-events-none fixed z-[95] rounded-xl border-2 border-[#0d9488]"
                style={{
                  top:
                    spotlight.top,
                  left:
                    spotlight.left,
                  width:
                    spotlight.width,
                  height:
                    spotlight.height,
                  boxShadow:
                    "0 0 0 5px rgba(236,0,140,.12), 0 0 28px rgba(236,0,140,.28)",
                }}
              />
            )}

            <section className="fixed bottom-20 left-3 right-3 z-[100] ml-auto max-w-[410px] rounded-[24px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-[var(--theme-text)] shadow-2xl md:bottom-5 md:left-auto md:right-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d9488]">
                  Step {stepIndex + 1} of {steps.length}
                </p>

                <button
                  type="button"
                  onClick={skip}
                  className="grid h-8 w-8 place-items-center rounded-full text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text)]"
                  aria-label="Close guide"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--theme-surface-soft)]">
                <div
                  className="h-full rounded-full bg-[#0d9488] transition-all"
                  style={{
                    width:
                      `${
                        ((stepIndex + 1) /
                          steps.length) *
                        100
                      }%`,
                  }}
                />
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {currentStep.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--theme-text-secondary)]">
                {currentStep.description}
              </p>

              <div className="mt-4 rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/[0.06] p-3">
                <p className="text-xs font-semibold text-[#0d9488]">
                  Try it
                </p>

                <p className="mt-1 text-xs leading-5 text-[var(--theme-text-secondary)]">
                  {currentStep.instruction}
                </p>
              </div>

              {onTarget && (
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--theme-text-muted)]">
                  <CheckCircle2
                    size={14}
                    className="text-emerald-500"
                  />
                  You are in the right section. Explore it, then continue.
                </div>
              )}

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={
                    stepIndex === 0
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--theme-border)] text-[var(--theme-text-secondary)] transition hover:bg-[var(--theme-surface-hover)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous tutorial step"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <button
                  type="button"
                  onClick={onPrimary}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {onTarget
                    ? stepIndex ===
                      steps.length -
                        1
                      ? "Finish tutorial"
                      : "Done — next"
                    : "Try this section"}

                  <ArrowRight
                    size={15}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={restart}
                className="mt-3 flex w-full items-center justify-center gap-1.5 text-[11px] text-[var(--theme-text-muted)] transition hover:text-[var(--theme-text)]"
              >
                <RotateCcw
                  size={11}
                />
                Restart guide
              </button>
            </section>
          </>
        )}
    </>
  );
}
