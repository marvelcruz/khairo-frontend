import { ProductsServicesNav } from "./ProductsServicesNav";

type Props = {
  title: string;
  description: string;
  badge?: string;
};

export function ProductsServicesHeader({
  title,
  description,
  badge = "Framework mode",
}: Props) {
  const connected = badge === "Connected";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Products & Services
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-text-secondary)] sm:text-base">
            {description}
          </p>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
          connected
            ? "border-emerald-500/25 bg-emerald-600/10 text-emerald-300"
            : "border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-secondary)]"
        }`}>
          {badge}
        </span>
      </div>

      <ProductsServicesNav />
    </div>
  );
}
