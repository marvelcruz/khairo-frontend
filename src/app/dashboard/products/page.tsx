import { FrameworkPage } from "@/components/products-services/FrameworkPage";

export default function ProductsPage() {
  return (
    <FrameworkPage
      title="Products"
      description="Manage physical products that can later connect to stock, orders and fulfilment."
      allowedTypes={["product"]}
    />
  );
}
