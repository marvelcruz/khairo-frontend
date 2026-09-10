import type { Metadata } from "next";
import { StandardHomepage } from "@/components/home/standard-homepage";
import { homepageConfig } from "@/config/homepage";

export const metadata: Metadata = {
  title: `${homepageConfig.brandName} — ${homepageConfig.tagline}`,
  description: homepageConfig.tagline,
};

export default function HomePage() {
  return <StandardHomepage />;
}
