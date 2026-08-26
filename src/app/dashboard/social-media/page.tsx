"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  FileText,
  Lightbulb,
  Link2,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Target,
} from "lucide-react";

import { api } from "@/lib/api";

import SocialConnectionsFramework from "@/components/social/SocialConnectionsFramework";
import SocialCalendarFramework from "@/components/social/SocialCalendarFramework";

type Provider =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "google_business"
  | "other";

type Metrics = {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  leads: number;
  conversions: number;
};

type Account = {
  _id: string;
  provider: Provider;
  displayName: string;
  handle?: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
};

type Post = {
  _id: string;
  provider: Provider;
  title?: string;
  caption: string;
  format: string;
  topic?: string;
  status: string;
  externalUrl?: string;
  mediaUrl?: string;
  metrics: Metrics;
};

type Recommendation = {
  id: string;
  priority: string;
  title: string;
  why: string;
  action: string;
};

type Group = {
  key: string;
  posts: number;
  reach: number;
  impressions: number;
  engagements: number;
  clicks: number;
  leads: number;
  conversions: number;
  engagementRate: number;
};

type Data = {
  success: boolean;
  integrations: Record<
    string,
    {
      label: string;
      configured: boolean;
    }
  >;
  accounts: Account[];
  posts: Post[];
  summary: {
    publishedPosts: number;
    impressions: number;
    reach: number;
    engagements: number;
    clicks: number;
    leads: number;
    conversions: number;
    engagementRate: number;
    clickRate: number;
    leadRate: number;
    conversionRate: number;
  };
  recommendations:
    Recommendation[];
  performance: {
    byProvider: Group[];
    byFormat: Group[];
    byTopic: Group[];
  };
};

const tabs = [
  "Overview",
  "Content",
  "Calendar",
  "Performance",
  "Recommendations",
  "Approval Queue",
  "Connections",
  "Accounts",
] as const;

type Tab = typeof tabs[number];

const providers = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["linkedin", "LinkedIn"],
  ["tiktok", "TikTok"],
  [
    "google_business",
    "Google Business",
  ],
] as const;

const box =
  "rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]";

const soft =
  "rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)]";

const input =
  "h-10 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-[var(--theme-text)] outline-none focus:border-[#0d9488]";

const button =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-4 text-sm font-semibold text-white disabled:opacity-40";

const percent = (
  value: number
) =>
  `${(value * 100).toFixed(1)}%`;

const providerName = (
  value: string
) =>
  providers.find(
    ([key]) => key === value
  )?.[1] || value;

export default function SocialMediaPage() {
  const [tab, setTab] =
    useState<Tab>("Overview");
  const [data, setData] =
    useState<Data | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState("");

  const [draft, setDraft] =
    useState({
      provider:
        "instagram" as Provider,
      title: "",
      caption: "",
      format: "image",
      topic: "",
      imageUrl: "",
    });

  const [account, setAccount] =
    useState({
      provider:
        "instagram" as Provider,
      displayName: "",
      handle: "",
    });

  const [metricPost, setMetricPost] =
    useState("");

  const [metrics, setMetrics] =
    useState({
      impressions: "0",
      reach: "0",
      likes: "0",
      comments: "0",
      shares: "0",
      saves: "0",
      clicks: "0",
      leads: "0",
      conversions: "0",
    });

  const load = useCallback(
    async () => {
      try {
        setError("");

        const response =
          await api.get<Data>(
            "/social",
            { timeoutMs: 15000 }
          );

        setData(response);

        setMetricPost(
          (current) =>
            current ||
            response.posts[0]
              ?._id ||
            ""
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Social Media."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const queue = useMemo(
    () =>
      data?.posts.filter(
        (p) =>
          p.status !== "published"
      ) || [],
    [data]
  );

  const instagramConnected =
    useMemo(
      () =>
        data?.accounts.some(
          (account) =>
            account.provider ===
              "instagram" &&
            account.status ===
              "connected"
        ) ?? false,
      [data]
    );

  async function saveDraft() {
    if (!draft.caption.trim())
      return;

    setBusy(true);

    try {
      await api.post(
        "/social/posts",
        draft
      );

      setDraft({
        provider: "instagram",
        title: "",
        caption: "",
        format: "image",
        topic: "",
        imageUrl: "",
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save draft."
      );
    } finally {
      setBusy(false);
    }
  }

  async function publishInstagram() {
    if (
      draft.provider !== "instagram" ||
      draft.format !== "image" ||
      !draft.caption.trim() ||
      !draft.imageUrl.trim()
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.post(
        "/social/instagram/publish",
        {
          title:
            draft.title.trim(),
          caption:
            draft.caption.trim(),
          topic:
            draft.topic.trim(),
          imageUrl:
            draft.imageUrl.trim(),
        }
      );

      setDraft({
        provider: "instagram",
        title: "",
        caption: "",
        format: "image",
        topic: "",
        imageUrl: "",
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish to Instagram."
      );
    } finally {
      setBusy(false);
    }
  }

  async function addAccount() {
    if (!account.displayName.trim())
      return;

    setBusy(true);

    try {
      await api.post(
        "/social/accounts",
        account
      );

      setAccount({
        provider: "instagram",
        displayName: "",
        handle: "",
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add account."
      );
    } finally {
      setBusy(false);
    }
  }

  async function status(
    id: string,
    value: string
  ) {
    setBusy(true);

    try {
      await api.patch(
        `/social/posts/${id}/status`,
        { status: value }
      );

      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveMetrics() {
    if (!metricPost) return;

    setBusy(true);

    try {
      const values =
        Object.fromEntries(
          Object.entries(metrics).map(
            ([key, value]) => [
              key,
              Math.max(
                0,
                Number(value) || 0
              ),
            ]
          )
        );

      await api.patch(
        `/social/posts/${metricPost}/metrics`,
        { metrics: values }
      );

      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-[var(--theme-text-secondary)]">
        Loading Social Intelligence...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              size={22}
              className="text-[#0d9488]"
            />
            <h1 className="text-2xl font-bold text-[var(--theme-text)]">
              Social Media
            </h1>
          </div>

          <p className="mt-2 max-w-3xl text-sm text-[var(--theme-text-secondary)]">
            Plan content, measure
            performance and turn social
            behaviour into recommended
            next actions.
          </p>
        </div>

        <button
          className={button}
          onClick={() => void load()}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-300">
          <CircleAlert size={18} />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={
              tab === item
                ? "rounded-full bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-[var(--theme-border)] px-4 py-2 text-sm text-[var(--theme-text-secondary)]"
            }
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Published",
                data?.summary
                  .publishedPosts || 0,
                FileText,
              ],
              [
                "Reach",
                (
                  data?.summary.reach || 0
                ).toLocaleString(),
                Activity,
              ],
              [
                "Engagement",
                percent(
                  data?.summary
                    .engagementRate || 0
                ),
                BarChart3,
              ],
              [
                "Conversions",
                data?.summary
                  .conversions || 0,
                Target,
              ],
            ].map(
              ([label, value, Icon]) => {
                const MetricIcon =
                  Icon as typeof Activity;

                return (
                  <div
                    key={String(label)}
                    className={`${box} p-4`}
                  >
                    <MetricIcon
                      size={18}
                      className="text-[#0d9488]"
                    />
                    <p className="mt-3 text-xs uppercase text-[var(--theme-text-muted)]">
                      {String(label)}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[var(--theme-text)]">
                      {String(value)}
                    </p>
                  </div>
                );
              }
            )}
          </div>

          <section className={`${box} p-5`}>
            <div className="flex items-center gap-2">
              <Lightbulb
                size={18}
                className="text-[#0d9488]"
              />
              <h2 className="font-semibold text-[var(--theme-text)]">
                What should we do next?
              </h2>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {data?.recommendations.map(
                (r) => (
                  <div
                    key={r.id}
                    className={`${soft} p-4`}
                  >
                    <p className="font-semibold text-[var(--theme-text)]">
                      {r.title}
                    </p>
                    <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
                      {r.why}
                    </p>
                    <p className="mt-3 text-sm font-medium text-[var(--theme-text)]">
                      Next: {r.action}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "Content" && (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className={`${box} p-5`}>
            <h2 className="font-semibold text-[var(--theme-text)]">
              Create content
            </h2>

            <div className="mt-4 space-y-3">
              <select
                className={input}
                value={draft.provider}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    provider:
                      e.target
                        .value as Provider,
                  }))
                }
              >
                {providers.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>

              <select
                className={input}
                value={draft.format}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    format:
                      e.target.value,
                  }))
                }
              >
                {[
                  "image",
                  "carousel",
                  "video",
                  "reel",
                  "story",
                  "text",
                  "link",
                ].map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ))}
              </select>

              <input
                className={input}
                placeholder="Topic"
                value={draft.topic}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    topic:
                      e.target.value,
                  }))
                }
              />

              <input
                className={input}
                placeholder="Internal title"
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    title:
                      e.target.value,
                  }))
                }
              />

              <textarea
                className="min-h-40 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 text-sm text-[var(--theme-text)]"
                placeholder="Post copy..."
                value={draft.caption}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    caption:
                      e.target.value,
                  }))
                }
              />

              {draft.provider ===
                "instagram" &&
                draft.format ===
                  "image" && (
                  <div className="space-y-2">
                    <input
                      className={input}
                      type="url"
                      placeholder="Public image URL"
                      value={
                        draft.imageUrl
                      }
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          imageUrl:
                            e.target
                              .value,
                        }))
                      }
                    />

                    <p className="text-xs text-[var(--theme-text-muted)]">
                      Required for direct
                      Instagram publishing.
                      Instagram must be able
                      to access the image
                      from this URL.
                    </p>
                  </div>
                )}

              <button
                className={`${button} w-full`}
                disabled={
                  busy ||
                  !draft.caption.trim()
                }
                onClick={() =>
                  void saveDraft()
                }
              >
                <Plus size={15} />
                Save draft
              </button>

              {draft.provider ===
                "instagram" && (
                <>
                  <button
                    className={`${button} w-full`}
                    disabled={
                      busy ||
                      !instagramConnected ||
                      draft.format !==
                        "image" ||
                      !draft.caption.trim() ||
                      !draft.imageUrl.trim()
                    }
                    onClick={() =>
                      void publishInstagram()
                    }
                  >
                    <Send size={15} />
                    {busy
                      ? "Publishing..."
                      : "Publish to Instagram"}
                  </button>

                  <p
                    className={`text-xs ${
                      instagramConnected
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {instagramConnected
                      ? "Instagram connected: @be_comingmarvel"
                      : "Instagram is not currently connected."}
                  </p>
                </>
              )}
            </div>
          </section>

          <section className={`${box} p-5`}>
            <h2 className="font-semibold text-[var(--theme-text)]">
              Content library
            </h2>

            <div className="mt-4 space-y-3">
              {!data?.posts.length && (
                <p className="text-sm text-[var(--theme-text-muted)]">
                  No content yet.
                </p>
              )}

              {data?.posts.map((post) => (
                <div
                  key={post._id}
                  className={`${soft} p-4`}
                >
                  <p className="font-semibold text-[var(--theme-text)]">
                    {post.title ||
                      post.topic ||
                      "Untitled"}
                  </p>

                  <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                    {providerName(
                      post.provider
                    )}{" "}
                    · {post.format} ·{" "}
                    {post.status}
                  </p>

                  <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">
                    {post.caption}
                  </p>

                  {post.externalUrl && (
                    <a
                      href={
                        post.externalUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#0d9488] hover:underline"
                    >
                      <Link2
                        size={14}
                      />
                      View on Instagram
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "Calendar" && (
        <SocialCalendarFramework
          posts={data?.posts || []}
        />
      )}

      {tab === "Performance" && (
        <div className="space-y-6">
          <section className={`${box} p-5`}>
            <h2 className="font-semibold text-[var(--theme-text)]">
              Performance by channel
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[650px] w-full text-sm">
                <thead className="text-left text-xs uppercase text-[var(--theme-text-muted)]">
                  <tr>
                    <th className="pb-3">
                      Channel
                    </th>
                    <th>Posts</th>
                    <th>Reach</th>
                    <th>Engagement</th>
                    <th>Clicks</th>
                    <th>Leads</th>
                    <th>Conversions</th>
                  </tr>
                </thead>

                <tbody>
                  {data?.performance
                    .byProvider.map((g) => (
                      <tr
                        key={g.key}
                        className="border-t border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
                      >
                        <td className="py-3 font-medium text-[var(--theme-text)]">
                          {providerName(
                            g.key
                          )}
                        </td>
                        <td>{g.posts}</td>
                        <td>{g.reach}</td>
                        <td>
                          {percent(
                            g.engagementRate
                          )}
                        </td>
                        <td>{g.clicks}</td>
                        <td>{g.leads}</td>
                        <td>
                          {g.conversions}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${box} p-5`}>
            <h2 className="font-semibold text-[var(--theme-text)]">
              Add performance data
            </h2>

            <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
              Until direct social sync is
              connected, enter performance figures from a
              published post here. The
              recommendation engine will
              analyse them immediately.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className={`${input} sm:col-span-2`}
                value={metricPost}
                onChange={(e) =>
                  setMetricPost(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select content
                </option>

                {data?.posts.map((p) => (
                  <option
                    key={p._id}
                    value={p._id}
                  >
                    {providerName(
                      p.provider
                    )}{" "}
                    —{" "}
                    {p.title ||
                      p.topic ||
                      p.caption.slice(
                        0,
                        30
                      )}
                  </option>
                ))}
              </select>

              {Object.entries(
                metrics
              ).map(([key, value]) => (
                <input
                  key={key}
                  type="number"
                  min="0"
                  className={input}
                  placeholder={key}
                  value={value}
                  onChange={(e) =>
                    setMetrics((m) => ({
                      ...m,
                      [key]:
                        e.target.value,
                    }))
                  }
                />
              ))}
            </div>

            <button
              className={`${button} mt-4`}
              disabled={
                busy || !metricPost
              }
              onClick={() =>
                void saveMetrics()
              }
            >
              <BarChart3 size={15} />
              Save & analyse
            </button>
          </section>
        </div>
      )}

      {tab === "Recommendations" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data?.recommendations.map(
            (r) => (
              <section
                key={r.id}
                className={`${box} p-5`}
              >
                <Lightbulb
                  size={18}
                  className="text-[#0d9488]"
                />

                <h3 className="mt-3 font-semibold text-[var(--theme-text)]">
                  {r.title}
                </h3>

                <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
                  {r.why}
                </p>

                <div className={`${soft} mt-4 p-3`}>
                  <p className="text-xs font-semibold uppercase text-[var(--theme-text-muted)]">
                    Recommended action
                  </p>

                  <p className="mt-1 text-sm font-medium text-[var(--theme-text)]">
                    {r.action}
                  </p>
                </div>
              </section>
            )
          )}
        </div>
      )}

      {tab === "Approval Queue" && (
        <section className={`${box} p-5`}>
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={18}
              className="text-[#0d9488]"
            />

            <h2 className="font-semibold text-[var(--theme-text)]">
              Human approval queue
            </h2>
          </div>

          <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
            Public social content remains
            under human control before
            publication.
          </p>

          <div className="mt-4 space-y-3">
            {!queue.length && (
              <p className="text-sm text-[var(--theme-text-muted)]">
                Nothing waiting for approval.
              </p>
            )}

            {queue.map((post) => (
              <div
                key={post._id}
                className={`${soft} p-4`}
              >
                <p className="font-semibold text-[var(--theme-text)]">
                  {post.title ||
                    post.topic ||
                    providerName(
                      post.provider
                    )}
                </p>

                <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
                  {post.caption}
                </p>

                <div className="mt-4">
                  {post.status ===
                    "draft" && (
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() =>
                        void status(
                          post._id,
                          "approved"
                        )
                      }
                    >
                      <CheckCircle2
                        size={15}
                      />
                      Approve
                    </button>
                  )}

                  {post.status ===
                    "approved" && (
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() =>
                        void status(
                          post._id,
                          "scheduled"
                        )
                      }
                    >
                      <Send size={15} />
                      Mark scheduled
                    </button>
                  )}

                  {post.status ===
                    "scheduled" && (
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() =>
                        void status(
                          post._id,
                          "published"
                        )
                      }
                    >
                      <Send size={15} />
                      Mark published
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "Connections" && (
        <SocialConnectionsFramework />
      )}

      {tab === "Accounts" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className={`${box} p-5`}>
            <div className="flex items-center gap-2">
              <Link2
                size={18}
                className="text-[#0d9488]"
              />

              <h2 className="font-semibold text-[var(--theme-text)]">
                Platform connections
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {Object.entries(
                data?.integrations || {}
              ).map(([key, item]) => (
                <div
                  key={key}
                  className={`${soft} p-4`}
                >
                  <p className="font-medium text-[var(--theme-text)]">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                    {item.configured
                      ? "Developer credentials ready"
                      : "Developer credentials required"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${box} p-5`}>
            <div className="flex items-center gap-2">
              <Settings2
                size={18}
                className="text-[#0d9488]"
              />

              <h2 className="font-semibold text-[var(--theme-text)]">
                Register account
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              <select
                className={input}
                value={account.provider}
                onChange={(e) =>
                  setAccount((a) => ({
                    ...a,
                    provider:
                      e.target
                        .value as Provider,
                  }))
                }
              >
                {providers.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>

              <input
                className={input}
                placeholder="Account name"
                value={
                  account.displayName
                }
                onChange={(e) =>
                  setAccount((a) => ({
                    ...a,
                    displayName:
                      e.target.value,
                  }))
                }
              />

              <input
                className={input}
                placeholder="@handle"
                value={account.handle}
                onChange={(e) =>
                  setAccount((a) => ({
                    ...a,
                    handle:
                      e.target.value,
                  }))
                }
              />

              <button
                className={`${button} w-full`}
                disabled={
                  busy ||
                  !account.displayName.trim()
                }
                onClick={() =>
                  void addAccount()
                }
              >
                <Plus size={15} />
                Add account
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {data?.accounts.map(
                (a) => (
                  <div
                    key={a._id}
                    className={`${soft} p-3`}
                  >
                    <p className="font-medium text-[var(--theme-text)]">
                      {a.displayName}
                    </p>

                    <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                      {providerName(
                        a.provider
                      )}
                      {a.handle
                        ? ` · ${a.handle}`
                        : ""}
                      {` · ${a.status}`}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
