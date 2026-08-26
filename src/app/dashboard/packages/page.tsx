import { FrameworkPage } from "@/components/products-services/FrameworkPage";

export default function PackagesPage() {
  return (
    <FrameworkPage
      title="Packages"
      description="Design bundles that combine products, services or programs into one offer."
      allowedTypes={["package"]}
    />
  );
}
