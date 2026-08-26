import { FrameworkPage } from "@/components/products-services/FrameworkPage";

export default function ServicesPage() {
  return (
    <FrameworkPage
      title="Services"
      description="Manage consultations, coaching, appointments and other service-based offerings."
      allowedTypes={["service"]}
    />
  );
}
