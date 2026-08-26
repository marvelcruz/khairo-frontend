export type CatalogueType =
  | "product"
  | "service"
  | "program"
  | "membership"
  | "package"
  | "add_on";

export type BillingType = "one_time" | "recurring";
export type BillingInterval = "day" | "week" | "month" | "year" | "custom";

export type CatalogueItem = {
  _id: string;
  name: string;
  slug: string;
  type: CatalogueType;
  sku?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  currency: string;
  billing?: {
    type?: BillingType;
    interval?: BillingInterval | null;
    intervalCount?: number;
    cycleDays?: number | null;
  };
  durationWeeks?: number | null;
  inventory?: {
    trackInventory?: boolean;
    stock?: number;
    reorderThreshold?: number;
    costPerUnit?: number;
    unit?: string;
  };
  fulfillment?: { requiresFulfillment?: boolean };
  booking?: { requiresBooking?: boolean };
  isActive: boolean;
  isPublic: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CatalogueListResponse = {
  success: boolean;
  items: CatalogueItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  types?: CatalogueType[];
};

export type CatalogueItemResponse = {
  success: boolean;
  item: CatalogueItem;
};

export const CATALOGUE_TYPES: { value: CatalogueType; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "program", label: "Program" },
  { value: "membership", label: "Membership" },
  { value: "package", label: "Package" },
  { value: "add_on", label: "Add-on" },
];

export function billingLabel(item: CatalogueItem) {
  if (item.billing?.type !== "recurring") return "One-time";

  const count = Math.max(1, Number(item.billing?.intervalCount) || 1);
  const interval = item.billing?.interval || "month";

  if (interval === "custom" && item.billing?.cycleDays) {
    return `Every ${item.billing.cycleDays} days`;
  }

  return count === 1 ? `Every ${interval}` : `Every ${count} ${interval}s`;
}
