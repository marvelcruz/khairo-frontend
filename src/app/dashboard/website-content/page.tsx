"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";

type ContentType =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "link"
  | "boolean"
  | "json";

interface WebsiteContent {
  _id: string;
  pageKey: string;
  sectionKey: string;
  label: string;
  type: ContentType;
  draftValue: unknown;
  publishedValue: unknown;
  status: "draft" | "published";
  order: number;
  group?: string;
  description?: string;
}

interface WebsiteMedia {
  _id: string;
  name: string;
  url: string;
  alt?: string;
  category?: string;
}

interface ContentResponse {
  content?: WebsiteContent[];
}

interface MediaResponse {
  media?: WebsiteMedia[];
}

const PAGES = [
  { key: "home", label: "Homepage" },
  { key: "about", label: "About" },
  { key: "program", label: "Program" },
  { key: "pricing", label: "Pricing" },
  { key: "results", label: "Results" },
  { key: "science", label: "Science" },
  { key: "contact", label: "Contact" },
  { key: "global", label: "Global Content" },
  { key: "navigation", label: "Navigation" },
  { key: "seo", label: "SEO" },
];

const GROUP_INFO: Record<
  string,
  { title: string; help: string }
> = {
  Hero: {
    title: "Top of Homepage",
    help: "The first large section visitors see when they arrive on the website.",
  },
  Method: {
    title: "The Khairo Diet Clinic Method",
    help: "The four reasons the Khairo Diet Clinic program is different.",
  },
  "How It Works": {
    title: "How It Works",
    help: "The four steps explaining how someone starts and progresses through Khairo Diet Clinic.",
  },
  Results: {
    title: "Results & Transformations",
    help: "Client results, transformation images, quotes and the results disclaimer.",
  },
  Testimonials: {
    title: "What Clients Say",
    help: "Client testimonials, names, program information, ratings and photos.",
  },
  Coach: {
    title: "Meet Your Coach",
    help: "Coach photo, name, title, biography and credentials.",
  },
  Pricing: {
    title: "Pricing Section",
    help: "The wording around your program prices. Actual program prices remain controlled from Pricing.",
  },
  FAQ: {
    title: "Frequently Asked Questions",
    help: "Questions and answers displayed near the bottom of the homepage.",
  },
  "Final CTA": {
    title: "Bottom Call to Action",
    help: "The final message and buttons visitors see before the footer.",
  },
};

const FRIENDLY_LABELS: Record<string, string> = {
  "hero-eyebrow": "Small text above the main headline",
  "hero-heading-line1": "Main headline — line 1",
  "hero-heading-line2": "Main headline — line 2",
  "hero-heading-emphasis": "Word highlighted in pink",
  "hero-heading-line3": "Main headline — line 3",
  "hero-heading-line4": "Main headline — line 4",
  "hero-subheading": "Paragraph below the main headline",
  "hero-primary-label": "Main button text",
  "hero-primary-link": "Where the main button goes",
  "hero-secondary-label": "Second button text",
  "hero-secondary-link": "Where the second button goes",
  "hero-trust-1": "Trust message 1",
  "hero-trust-2": "Trust message 2",
  "hero-trust-3": "Trust message 3",
  "hero-image": "Main homepage image",
  "hero-image-alt": "Image description for accessibility",
  "hero-stat": "Number shown over the main image",
  "hero-stat-label": "Description below that number",

  "method-eyebrow": "Small heading above this section",
  "method-title": "Section headline",
  "method-subtitle": "Section introduction",

  "how-eyebrow": "Small heading above this section",
  "how-title": "Section headline",
  "how-subtitle": "Section introduction",

  "results-eyebrow": "Small heading above this section",
  "results-title": "Section headline",
  "results-subtitle": "Section introduction",
  "results-button-label": "Results button text",
  "results-disclaimer": "Results disclaimer",

  "testimonials-eyebrow": "Small heading above this section",
  "testimonials-title": "Section headline",

  "coach-image": "Coach photo",
  "coach-image-alt": "Coach photo description for accessibility",
  "coach-eyebrow": "Small heading above the coach section",
  "coach-name": "Coach name",
  "coach-role": "Coach professional title",
  "coach-bio-1": "Coach biography — paragraph 1",
  "coach-bio-2": "Coach biography — paragraph 2",
  "coach-credential-1": "Credential 1",
  "coach-credential-2": "Credential 2",
  "coach-credential-3": "Credential 3",

  "pricing-eyebrow": "Small heading above pricing",
  "pricing-title": "Pricing headline",
  "pricing-subtitle": "Pricing introduction",
  "pricing-core-description": "Core program description",
  "pricing-core-cta": "Core program button text",
  "pricing-plus-description": "Plus program description",
  "pricing-plus-cta": "Plus program button text",
  "pricing-vip-description": "VIP program description",
  "pricing-vip-cta": "VIP program button text",
  "pricing-help-prefix": "Pricing help message",
  "pricing-help-link": "WhatsApp help link text",
  "pricing-help-suffix": "Text after WhatsApp help link",

  "faq-eyebrow": "Small heading above FAQs",
  "faq-title": "FAQ headline",
  "faq-subtitle": "FAQ introduction",

  "cta-eyebrow": "Small text above final message",
  "cta-title-line1": "Final headline — line 1",
  "cta-title-line2": "Final headline — line 2",
  "cta-body": "Final message",
  "cta-primary-label": "Main button text",
  "cta-primary-link": "Where the main button goes",
  "cta-whatsapp-label": "WhatsApp button text",
};

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function friendlyLabel(item: WebsiteContent) {
  if (FRIENDLY_LABELS[item.sectionKey]) {
    return FRIENDLY_LABELS[item.sectionKey];
  }

  let label = item.label || item.sectionKey;

  label = label
    .replace(/^Hero /i, "")
    .replace(/^Method /i, "")
    .replace(/^CTA /i, "")
    .replace(/\bimage alt\b/gi, "image description")
    .replace(/\bbody\b/gi, "text")
    .replace(/\bq\b$/i, "question")
    .replace(/\ba\b$/i, "answer");

  return label;
}

function fieldHelp(item: WebsiteContent) {
  if (item.sectionKey.endsWith("-image-alt")) {
    return "A short description used by screen readers. Most visitors will not see this.";
  }

  if (item.type === "link") {
    return "This controls where visitors go when they click the related button or link.";
  }

  if (item.type === "image") {
    return "This controls the picture shown on the website.";
  }

  if (item.sectionKey.includes("rating")) {
    return "Enter a rating from 1 to 5.";
  }

  return item.description || "";
}

export default function WebsiteContentPage() {
  const [tab, setTab] = useState<"pages" | "media">("pages");
  const [items, setItems] = useState<WebsiteContent[]>([]);
  const [media, setMedia] = useState<WebsiteMedia[]>([]);
  const [pageKey, setPageKey] = useState("home");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);

  const [mediaName, setMediaName] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");

  const loadContent = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      if (pageKey === "home") {
        await api.post("/website-content/seed-defaults").catch(() => {});
      }

      const res = await api.get<ContentResponse>(
        `/website-content?pageKey=${encodeURIComponent(pageKey)}`
      );

      setItems(
        [...(res.content || [])].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        )
      );
      setDirtyIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  const loadMedia = useCallback(async () => {
    try {
      const res = await api.get<MediaResponse>("/website-content/media");
      setMedia(res.media || []);
    } catch {
      setMedia([]);
    }
  }, []);

  useEffect(() => {
    void loadContent();
    void loadMedia();
  }, [loadContent, loadMedia]);

  const updateDraft = (id: string, value: unknown) => {
    setItems((current) =>
      current.map((item) =>
        item._id === id ? { ...item, draftValue: value } : item
      )
    );

    setDirtyIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    setMessage("");
  };

  const saveChanges = useCallback(async () => {
    const changed = items.filter((item) => dirtyIds.has(item._id));

    if (!changed.length) {
      setMessage("Everything is already saved.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const saved = await Promise.all(
        changed.map(async (item) => {
          const res = await api.patch<{ content: WebsiteContent }>(
            `/website-content/${item._id}`,
            {
              label: item.label,
              type: item.type,
              draftValue: item.draftValue,
              order: item.order,
              group: item.group || "",
              description: item.description || "",
            }
          );

          return res.content || item;
        })
      );

      const byId = new Map(saved.map((item) => [item._id, item]));

      setItems((current) =>
        current.map((item) => byId.get(item._id) || item)
      );

      setDirtyIds(new Set());
      setMessage("Changes saved privately. They are not live yet.");
    } finally {
      setSaving(false);
    }
  }, [items, dirtyIds]);

  const publishPage = async () => {
    if (
      !window.confirm(
        `Publish all saved changes to the ${
          PAGES.find((page) => page.key === pageKey)?.label || "website"
        } now?`
      )
    ) {
      return;
    }

    setPublishing(true);
    setMessage("");

    try {
      if (dirtyIds.size) {
        await saveChanges();
      }

      await api.post(
        `/website-content/publish/page/${encodeURIComponent(pageKey)}`
      );

      await loadContent();
      setPreviewVersion((value) => value + 1);
      setMessage("Published successfully. Visitors can now see these changes.");
    } finally {
      setPublishing(false);
    }
  };

  const createMedia = async () => {
    if (!mediaName.trim() || !mediaUrl.trim()) {
      setMessage("Please enter an image name and image URL.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await api.post("/website-content/media", {
        name: mediaName.trim(),
        url: mediaUrl.trim(),
        alt: mediaAlt.trim(),
        category: "website",
      });

      setMediaName("");
      setMediaUrl("");
      setMediaAlt("");
      await loadMedia();
      setMessage("Image added to the Media Library.");
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = async (asset: WebsiteMedia) => {
    if (!window.confirm(`Remove "${asset.name}" from the Media Library?`)) {
      return;
    }

    await api.del(`/website-content/media/${asset._id}`);
    await loadMedia();
    setMessage("Image removed from the Media Library.");
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) => {
      return [
        friendlyLabel(item),
        GROUP_INFO[item.group || ""]?.title,
        asString(item.draftValue),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [items, search]);

  const groups = useMemo(() => {
    const map = new Map<string, WebsiteContent[]>();

    for (const item of filteredItems) {
      const key = item.group || "Other";

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    return Array.from(map.entries())
      .map(([key, groupItems]) => ({
        key,
        items: groupItems.sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        ),
      }))
      .sort((a, b) => {
        const aOrder = a.items[0]?.order || 0;
        const bOrder = b.items[0]?.order || 0;
        return aOrder - bOrder;
      });
  }, [filteredItems]);

  const currentPageLabel =
    PAGES.find((page) => page.key === pageKey)?.label || pageKey;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mb-6 flex flex-col gap-4 border-b border-[var(--theme-border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 font-ui text-xs font-semibold uppercase tracking-[0.18em] text-magenta">
            Website Editor
          </p>
          <h1 className="font-display text-3xl text-pure-white sm:text-4xl">
            Edit Your Website
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist/75">
            Change the words, buttons and images visitors see. You do not need
            to know any website code.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("pages")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              tab === "pages"
                ? "bg-magenta text-white"
                : "border border-[var(--theme-border)] text-mist hover:bg-[var(--theme-surface-hover)]"
            }`}
          >
            Website Pages
          </button>

          <button
            type="button"
            onClick={() => setTab("media")}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              tab === "media"
                ? "bg-magenta text-white"
                : "border border-[var(--theme-border)] text-mist hover:bg-[var(--theme-surface-hover)]"
            }`}
          >
            Images
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-mint-signal/20 bg-mint-signal/10 px-4 py-3 text-sm text-mint-signal">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {tab === "pages" ? (
        <>
          <div className="mb-5 rounded-2xl border border-[var(--theme-border)] bg-charcoal/70 p-4">
            <div className="grid gap-3 lg:grid-cols-[220px_minmax(240px,1fr)_auto]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mist/60">
                  Page to edit
                </span>
                <select
                  value={pageKey}
                  onChange={(event) => {
                    setPageKey(event.target.value);
                    setSearch("");
                  }}
                  className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-ink-black px-3 text-sm text-pure-white outline-none focus:border-magenta"
                >
                  {PAGES.map((page) => (
                    <option key={page.key} value={page.key}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-mist/60">
                  Find something
                </span>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-mist/50"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Try: coach, main image, FAQ..."
                    className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-ink-black pl-9 pr-3 text-sm text-pure-white outline-none placeholder:text-mist/35 focus:border-magenta"
                  />
                </div>
              </label>

              <div className="flex flex-wrap items-end gap-2">
                <button
                  type="button"
                  onClick={() => void saveChanges()}
                  disabled={saving || !dirtyIds.size}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] px-4 text-sm font-semibold text-pure-white transition hover:bg-[var(--theme-surface-hover)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Save size={16} />
                  {saving
                    ? "Saving..."
                    : dirtyIds.size
                    ? `Save Changes (${dirtyIds.size})`
                    : "Changes Saved"}
                </button>

                <button
                  type="button"
                  onClick={() => void publishPage()}
                  disabled={publishing || loading || !items.length}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-magenta px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {publishing
                    ? "Publishing..."
                    : `Publish ${currentPageLabel}`}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--theme-border)] pt-3">
              <p className="text-xs text-mist/55">
                <strong className="text-pure-white/80">Save Changes</strong>{" "}
                keeps your edits private.{" "}
                <strong className="text-pure-white/80">Publish</strong> makes
                them visible to website visitors.
              </p>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-magenta hover:underline"
              >
                View live website
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
            <section className="min-w-0">
              {loading ? (
                <div className="rounded-2xl border border-[var(--theme-border)] bg-charcoal/50 p-10 text-center text-sm text-mist">
                  Loading {currentPageLabel}...
                </div>
              ) : !items.length ? (
                <div className="rounded-2xl border border-[var(--theme-border)] bg-charcoal/50 p-8">
                  <h2 className="font-display text-2xl text-pure-white">
                    {currentPageLabel} is not connected yet
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist/70">
                    The Homepage is ready for editing. We will connect this
                    page using the same simple editor next.
                  </p>
                </div>
              ) : !groups.length ? (
                <div className="rounded-2xl border border-[var(--theme-border)] bg-charcoal/50 p-8 text-sm text-mist">
                  No matching website content was found.
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => {
                    const info = GROUP_INFO[group.key] || {
                      title: group.key,
                      help: "Content displayed in this part of the website.",
                    };

                    const groupDrafts = group.items.filter(
                      (item) =>
                        !sameValue(item.draftValue, item.publishedValue)
                    ).length;

                    return (
                      <details
                        key={group.key}
                        className="group overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-charcoal/55"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-display text-xl text-pure-white sm:text-2xl">
                                {info.title}
                              </h2>

                              {groupDrafts > 0 && (
                                <span className="rounded-full bg-gold-trust/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-trust">
                                  {groupDrafts} draft
                                  {groupDrafts === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-mist/60">
                              {info.help}
                            </p>
                          </div>

                          <ChevronDown
                            size={20}
                            className="shrink-0 text-mist transition-transform group-open:rotate-180"
                          />
                        </summary>

                        <div className="space-y-4 border-t border-[var(--theme-border)] p-4 sm:p-6">
                          {group.items.map((item) => {
                            const dirty = dirtyIds.has(item._id);
                            const draft = !sameValue(
                              item.draftValue,
                              item.publishedValue
                            );
                            const help = fieldHelp(item);
                            const label = friendlyLabel(item);
                            const value = asString(item.draftValue);

                            return (
                              <div
                                key={item._id}
                                className="rounded-2xl border border-[var(--theme-border)] bg-ink-black/55 p-4 sm:p-5"
                              >
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <label
                                      htmlFor={`field-${item._id}`}
                                      className="font-ui text-sm font-semibold text-pure-white"
                                    >
                                      {label}
                                    </label>

                                    {help && (
                                      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mist/50">
                                        {help}
                                      </p>
                                    )}
                                  </div>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                      dirty
                                        ? "bg-gold-trust/15 text-gold-trust"
                                        : draft
                                        ? "bg-magenta/12 text-magenta"
                                        : "bg-mint-signal/12 text-mint-signal"
                                    }`}
                                  >
                                    {dirty
                                      ? "Unsaved"
                                      : draft
                                      ? "Draft"
                                      : "Live"}
                                  </span>
                                </div>

                                {item.type === "image" && value && (
                                  <div className="mb-4 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-page)]">
                                    <div
                                      role="img"
                                      aria-label={label}
                                      className="h-44 w-full bg-contain bg-center bg-no-repeat sm:h-56"
                                      style={{
                                        backgroundImage: `url("${value}")`,
                                      }}
                                    />
                                  </div>
                                )}

                                {item.type === "boolean" ? (
                                  <label className="inline-flex items-center gap-3 text-sm text-pure-white">
                                    <input
                                      id={`field-${item._id}`}
                                      type="checkbox"
                                      checked={Boolean(item.draftValue)}
                                      onChange={(event) =>
                                        updateDraft(
                                          item._id,
                                          event.target.checked
                                        )
                                      }
                                      className="h-5 w-5 accent-magenta"
                                    />
                                    Show this on the website
                                  </label>
                                ) : item.type === "textarea" ||
                                  item.type === "richtext" ||
                                  item.type === "json" ? (
                                  <textarea
                                    id={`field-${item._id}`}
                                    value={value}
                                    rows={
                                      item.type === "json" ? 7 : 4
                                    }
                                    onChange={(event) =>
                                      updateDraft(
                                        item._id,
                                        event.target.value
                                      )
                                    }
                                    className="w-full resize-y rounded-xl border border-[var(--theme-border)] bg-charcoal px-4 py-3 text-sm leading-relaxed text-pure-white outline-none focus:border-magenta"
                                  />
                                ) : (
                                  <input
                                    id={`field-${item._id}`}
                                    value={value}
                                    onChange={(event) =>
                                      updateDraft(
                                        item._id,
                                        event.target.value
                                      )
                                    }
                                    className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-charcoal px-4 text-sm text-pure-white outline-none focus:border-magenta"
                                  />
                                )}

                                {item.type === "image" &&
                                  media.length > 0 && (
                                    <div className="mt-3">
                                      <label className="mb-1.5 block text-xs font-semibold text-mist/60">
                                        Or choose an image already in your
                                        library
                                      </label>
                                      <select
                                        value=""
                                        onChange={(event) => {
                                          if (event.target.value) {
                                            updateDraft(
                                              item._id,
                                              event.target.value
                                            );
                                          }
                                        }}
                                        className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-charcoal px-3 text-xs text-pure-white outline-none focus:border-magenta"
                                      >
                                        <option value="">
                                          Choose an image...
                                        </option>
                                        {media.map((asset) => (
                                          <option
                                            key={asset._id}
                                            value={asset.url}
                                          >
                                            {asset.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                <details className="mt-3">
                                  <summary className="cursor-pointer text-[11px] font-medium text-mist/35 hover:text-mist">
                                    Advanced details
                                  </summary>
                                  <div className="mt-2 rounded-lg bg-[var(--theme-input)] px-3 py-2 text-[11px] leading-relaxed text-mist/40">
                                    Content key: {item.sectionKey}
                                    <br />
                                    Field type: {item.type}
                                  </div>
                                </details>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="hidden xl:block">
              <div className="sticky top-5 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-charcoal">
                <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-pure-white">
                      Published Website Preview
                    </p>
                    <p className="text-[11px] text-mist/50">
                      Shows what visitors currently see
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewVersion((value) => value + 1)
                    }
                    className="grid h-9 w-9 place-items-center rounded-full border border-[var(--theme-border)] text-mist transition hover:bg-[var(--theme-surface-hover)] hover:text-pure-white"
                    aria-label="Refresh website preview"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>

                <div className="bg-white">
                  <iframe
                    key={previewVersion}
                    src={`/?cmsPreview=${previewVersion}`}
                    title="Published Khairo Diet Clinic website preview"
                    className="h-[720px] w-full border-0"
                  />
                </div>

                <div className="border-t border-[var(--theme-border)] px-4 py-3">
                  <p className="text-[11px] leading-relaxed text-mist/50">
                    Your saved drafts will appear here after you press{" "}
                    <strong className="text-pure-white/70">
                      Publish {currentPageLabel}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <section>
          <div className="mb-5 rounded-2xl border border-[var(--theme-border)] bg-charcoal/65 p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-magenta/10 text-magenta">
                <ImageIcon size={20} />
              </div>
              <div>
                <h2 className="font-display text-2xl text-pure-white">
                  Image Library
                </h2>
                <p className="mt-1 text-sm text-mist/65">
                  Store website images here so they can be selected while
                  editing a page.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gold-trust/20 bg-gold-trust/8 p-4 text-xs leading-relaxed text-gold-trust">
              For now, images are added using an image URL. Direct drag-and-drop
              uploads from your computer will be the next media upgrade.
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-mist/60">
                  Image name
                </span>
                <input
                  value={mediaName}
                  onChange={(event) =>
                    setMediaName(event.target.value)
                  }
                  placeholder="Example: Homepage coach"
                  className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-ink-black px-3 text-sm text-pure-white outline-none focus:border-magenta"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-mist/60">
                  Image URL
                </span>
                <input
                  value={mediaUrl}
                  onChange={(event) =>
                    setMediaUrl(event.target.value)
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-ink-black px-3 text-sm text-pure-white outline-none focus:border-magenta"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-mist/60">
                  Image description
                </span>
                <input
                  value={mediaAlt}
                  onChange={(event) =>
                    setMediaAlt(event.target.value)
                  }
                  placeholder="Describe what is in the image"
                  className="h-11 w-full rounded-xl border border-[var(--theme-border)] bg-ink-black px-3 text-sm text-pure-white outline-none focus:border-magenta"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void createMedia()}
              disabled={saving}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-magenta px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <ImageIcon size={16} />
              Add Image
            </button>
          </div>

          {media.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {media.map((asset) => (
                <article
                  key={asset._id}
                  className="overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-charcoal/60"
                >
                  <div
                    role="img"
                    aria-label={asset.alt || asset.name}
                    className="h-48 bg-[var(--theme-page)] bg-contain bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url("${asset.url}")`,
                    }}
                  />

                  <div className="p-4">
                    <p className="truncate text-sm font-semibold text-pure-white">
                      {asset.name}
                    </p>

                    {asset.alt && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist/55">
                        {asset.alt}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void removeMedia(asset)}
                      className="mt-3 text-xs font-semibold text-red-400 hover:underline"
                    >
                      Remove from library
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-10 text-center text-sm text-mist/60">
              No images have been added to the Media Library yet.
            </div>
          )}
        </section>
      )}
    </main>
  );
}
