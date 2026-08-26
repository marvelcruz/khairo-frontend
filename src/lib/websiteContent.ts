const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type PublicWebsiteContent = Record<string, unknown>;

export async function getPublicWebsiteContent(
  pageKey: string
): Promise<PublicWebsiteContent> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/public/website/content/${encodeURIComponent(pageKey)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return {};

    const data = await response.json();
    return data?.values || {};
  } catch {
    return {};
  }
}
