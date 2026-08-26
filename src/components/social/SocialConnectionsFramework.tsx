"use client";

import ConnectionsHub from "@/components/connections/ConnectionsHub";

export default function SocialConnectionsFramework() {
  return (
    <ConnectionsHub
      providers={[
        "instagram",
        "facebook",
        "whatsapp",
        "linkedin",
        "tiktok",
        "google_business",
      ]}
      title="Marketing connections"
      description="Connect the accounts your business already uses. Sign in with the provider, choose the account, and you’re done."
    />
  );
}
