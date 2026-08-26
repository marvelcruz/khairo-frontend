import { FrameworkPage } from "@/components/products-services/FrameworkPage";

export default function AddOnsPage() {
  return (
    <FrameworkPage
      title="Add-ons"
      description="Manage optional extras that can later be attached to programs, packages, subscriptions or orders."
      allowedTypes={["add_on"]}
    />
  );
}
