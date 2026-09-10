export type HomepageVideoConfig = {
  bgVideoUrl: string;
  desktop: string;
  tablet: string;
  mobile: string;
  poster: string;
};

export type HomepageGoal = {
  label: string;
  description: string;
  href: string;
};

export type HomepageCategory = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
};

export const homepageConfig = {
  brandName: "Khairo",
  tagline: "Medically supervised weight management for women.",
  logoSrc: null,
  theme: {
    background: "#07110e",
    surface: "#0d1b16",
    surfaceSoft: "#13251e",
    text: "#f8f5ee",
    muted: "#bac3bd",
    accent: "#d4b06a",
    accentText: "#1b160d",
  },
  nav: [
    { label: "Services", href: "#services" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  portals: { client: "/portal/login", staff: "/login" },
  primaryCta: { label: "Get Started", href: "/pricing#apply" },
  hero: {
    eyebrow: "PERSONALISED CARE",
    headline: "A clearer path to sustainable weight loss.",
    description: "Medically supervised weight management for women.",
    secondaryLabel: "Explore Services",
    secondaryHref: "#services",
    video: {
      bgVideoUrl: "",
      desktop: "",
      tablet: "",
      mobile: "",
      poster: "",
    } as HomepageVideoConfig,
  },
  discovery: {
    eyebrow: "FIND YOUR PATH",
    title: "What are you working toward?",
    description: "Choose the goal that feels closest to where you are now. You can change it at any time.",
    goals: [
    {
        "label": "Sustainable weight loss",
        "description": "Start with the programme pathway and see how structured support can fit your goals.",
        "href": "/program"
    },
    {
        "label": "Nutrition & accountability",
        "description": "Explore the programme structure and the support designed to keep progress consistent.",
        "href": "/program#how-it-works"
    },
    {
        "label": "Medical guidance",
        "description": "Begin with an application so the team can assess the right level of support for you.",
        "href": "/pricing#apply"
    },
    {
        "label": "Maintain progress",
        "description": "Review the long-term support options and choose the next step that matches your stage.",
        "href": "/pricing"
    }
] as HomepageGoal[],
  },
  categories: [
    { eyebrow: "01", title: "Guided Programmes", description: "Start with a structured pathway designed to make the next step clear.", href: "/program" },
    { eyebrow: "02", title: "Nutrition & Lifestyle", description: "Build practical habits around food, movement, routine and long-term consistency.", href: "/program#how-it-works" },
    { eyebrow: "03", title: "Clinical Support", description: "Use consultation and assessment to understand the level of support that fits your needs.", href: "/pricing#apply" },
    { eyebrow: "04", title: "Progress & Maintenance", description: "Stay supported after the first milestone with a pathway designed for continued progress.", href: "/pricing" },
  ] as HomepageCategory[],
  footer: { description: "Medically supervised weight management for women.", email: "", phone: "", location: "" },
} as const;
