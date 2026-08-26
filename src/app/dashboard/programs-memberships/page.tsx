import { FrameworkPage } from "@/components/products-services/FrameworkPage";

export default function ProgramsMembershipsPage() {
  return (
    <FrameworkPage
      title="Programs & Memberships"
      description="Manage named programs and recurring membership offerings without treating Core, Plus or VIP as permanent identities."
      allowedTypes={["program", "membership"]}
    />
  );
}
