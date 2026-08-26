"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  CatalogueItem,
  CatalogueListResponse,
  CatalogueType,
} from "@/lib/products-services/catalogue";
import { CatalogueWorkspace } from "./CatalogueWorkspace";
import { ProductsServicesHeader } from "./ProductsServicesHeader";

type Props = {
  title: string;
  description: string;
  allowedTypes?: CatalogueType[];
};

export function FrameworkPage({
  title,
  description,
  allowedTypes,
}: Props) {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<CatalogueListResponse>("/catalogue", {
        params: {
          status: "all",
          visibility: "all",
          limit: 100,
        },
      });

      setItems(response.items || []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Could not load catalogue data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <ProductsServicesHeader
        title={title}
        description={description}
        badge="Connected"
      />

      <CatalogueWorkspace
        title={title}
        items={items}
        allowedTypes={allowedTypes}
        emptyLabel={`No ${title.toLowerCase()} match the current filters.`}
        loading={loading}
        error={error}
        onRefresh={load}
      />
    </main>
  );
}
