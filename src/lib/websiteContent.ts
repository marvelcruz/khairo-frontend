import { api } from "./api";

export type PublicWebsiteContent = Record<string, unknown>;

type WebsiteContentResponse = {
  values?: PublicWebsiteContent;
};

export async function getPublicWebsiteContent(
  pageKey: string
): Promise<PublicWebsiteContent> {
  try {
    const data = await api.get<WebsiteContentResponse>(
      `/public/website/content/${encodeURIComponent(pageKey)}`,
      {
        suppressGlobalError: true,
        suppressAuthExpired: true,
      }
    );

    return data?.values || {};
  } catch {
    // Marketing pages have built-in static fallbacks, so CMS outages are safe
    // to degrade silently instead of interrupting visitors with an error toast.
    return {};
  }
}
