"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Megaphone, CheckSquare, Square, Copy, ExternalLink } from "lucide-react";
import { PageTicker } from "../../../components/PageTicker";
import { useAuth } from "@/context/AuthContext";

type BroadcastSegment = {
  key: string;
  name: string;
  count: number;
};

type BroadcastTag = {
  key: string;
  name: string;
  category?: string;
};

type WhatsAppConsentStatus = "unknown" | "opted_in" | "opted_out";

type WhatsAppMarketingConsent = {
  status: WhatsAppConsentStatus;
  updatedAt?: string | null;
  source?: string;
};

type BroadcastClient = {
  _id: string;
  fullName: string;
  phone?: string;
  crmContactId?: string | null;
  whatsappMarketingConsent?: WhatsAppMarketingConsent;
  whatsappConsentEligible?: boolean;
};

type BroadcastTemplate = {
  _id: string;
  name: string;
  body: string;
};

type WhatsAppApprovedTemplate = {
  id: string;
  name: string;
  language: string;
  category?: string;
  status?: string;
  bodyText?: string;
  bodyParameterCount?: number;
};

type ApprovedTemplatesResponse = {
  success: boolean;
  templates: WhatsAppApprovedTemplate[];
};

type BroadcastLog = {
  _id: string;
  createdAt: string;
  recipientCount: number;
  segment: string;
  message: string;
  sentBy?: {
    name?: string;
  };
};

type SegmentsResponse = {
  success: boolean;
  segments: BroadcastSegment[];
  tags?: BroadcastTag[];
};

type TemplatesResponse = {
  success: boolean;
  templates: BroadcastTemplate[];
};

type HistoryResponse = {
  success: boolean;
  logs: BroadcastLog[];
};

type ConsentSummary = {
  optedIn: number;
  optedOut: number;
  unknown: number;
  consentEligible: number;
};

type PreviewResponse = {
  success: boolean;
  clients: BroadcastClient[];
  consentSummary?: ConsentSummary;
};

type ConsentUpdateResponse = {
  success: boolean;
  whatsappMarketingConsent: WhatsAppMarketingConsent;
};

type BroadcastFilters = {
  includeTagsAny: string[];
  includeTagsAll: string[];
  excludeTags: string[];
};

const EMPTY_CONSENT_SUMMARY: ConsentSummary = {
  optedIn: 0,
  optedOut: 0,
  unknown: 0,
  consentEligible: 0,
};

function summarizeConsent(audience: BroadcastClient[]): ConsentSummary {
  return audience.reduce<ConsentSummary>((summary, client) => {
    const status = client.whatsappMarketingConsent?.status || "unknown";
    if (status === "opted_in") summary.optedIn += 1;
    else if (status === "opted_out") summary.optedOut += 1;
    else summary.unknown += 1;
    if (client.phone && status === "opted_in") summary.consentEligible += 1;
    return summary;
  }, { ...EMPTY_CONSENT_SUMMARY });
}

export default function BroadcastPage() {
  const { hasRole } = useAuth();
  const canManageConsent = hasRole("admin", "sales");

  const [segments, setSegments] = useState<BroadcastSegment[]>([]);
  const [tags, setTags] = useState<BroadcastTag[]>([]);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [clients, setClients] = useState<BroadcastClient[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [consentSummary, setConsentSummary] = useState<ConsentSummary>(EMPTY_CONSENT_SUMMARY);
  const [includeTagsAny, setIncludeTagsAny] = useState<string[]>([]);
  const [includeTagsAll, setIncludeTagsAll] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [message, setMessage] = useState("Hi {first}! 👋 ");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [history, setHistory] = useState<BroadcastLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [sendingApi, setSendingApi] = useState(false);
  const [approvedTemplates, setApprovedTemplates] = useState<WhatsAppApprovedTemplate[]>([]);
  const [selectedApprovedTemplateName, setSelectedApprovedTemplateName] = useState("");
  const [selectedApprovedTemplateLanguage, setSelectedApprovedTemplateLanguage] = useState("");
  const [bodyParameters, setBodyParameters] = useState<string[]>([""]);
  const [consentEditorId, setConsentEditorId] = useState<string | null>(null);
  const [consentStatus, setConsentStatus] = useState<WhatsAppConsentStatus>("unknown");
  const [consentSource, setConsentSource] = useState("");
  const [consentNote, setConsentNote] = useState("");
  const [consentSaving, setConsentSaving] = useState(false);

  const loadAll = (silent = false) => {
    if (!silent) setLoading(true);
    return Promise.all([
      api.get<SegmentsResponse>("/broadcast/segments").then((res) => {
        if (res.success) {
          setSegments(res.segments);
          setTags(res.tags || []);
        }
      }),
      api.get<TemplatesResponse>("/broadcast/templates").then((res) => { if (res.success) setTemplates(res.templates); }),
      api.get<HistoryResponse>("/broadcast/history").then((res) => { if (res.success) setHistory(res.logs); }),
    ]).finally(() => { if (!silent) setLoading(false); });
  };

  const loadApprovedTemplates = async () => {
    try {
      const res = await api.get<ApprovedTemplatesResponse>("/broadcast/whatsapp-templates");
      if (res.success) {
        setApprovedTemplates(res.templates);
        if (res.templates.length) {
          setSelectedApprovedTemplateName(res.templates[0].name);
          setSelectedApprovedTemplateLanguage(res.templates[0].language);
        }
      }
    } catch {
      // leave empty
    }
  };

  useEffect(() => {
    loadAll();
    loadApprovedTemplates();
    const t = setInterval(() => loadAll(true), 45000);
    const onVis = () => { if (document.visibilityState === "visible") loadAll(true); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const currentFilters = (): BroadcastFilters => ({
    includeTagsAny,
    includeTagsAll,
    excludeTags,
  });

  const loadPreview = async (seg: string, filters: BroadcastFilters = currentFilters()) => {
    setSelectedSegment(seg);
    setLoading(true);
    try {
      const params = new URLSearchParams({ segment: seg });
      if (filters.includeTagsAny.length) params.set("includeTagsAny", filters.includeTagsAny.join(","));
      if (filters.includeTagsAll.length) params.set("includeTagsAll", filters.includeTagsAll.join(","));
      if (filters.excludeTags.length) params.set("excludeTags", filters.excludeTags.join(","));

      const res = await api.get<PreviewResponse>(`/broadcast/preview?${params.toString()}`);
      if (res.success) {
        setClients(res.clients);
        setConsentSummary(res.consentSummary || EMPTY_CONSENT_SUMMARY);
        setSelectedClients(new Set(res.clients.map((c) => c._id)));
        setFiltersDirty(false);
      }
    } catch (err) {
      console.error(err);
      alert("Could not load this filtered audience.");
    }
    finally { setLoading(false); }
  };

  const clearTagFilters = async () => {
    const emptyFilters: BroadcastFilters = {
      includeTagsAny: [],
      includeTagsAll: [],
      excludeTags: [],
    };
    setIncludeTagsAny([]);
    setIncludeTagsAll([]);
    setExcludeTags([]);
    if (selectedSegment) await loadPreview(selectedSegment, emptyFilters);
    else setFiltersDirty(false);
  };

  const renderTagFilter = (
    label: string,
    values: string[],
    setValues: (values: string[]) => void,
    helper: string
  ) => (
    <div>
      <label className="text-xs font-medium text-[var(--theme-text)]">{label}</label>
      <select
        value=""
        onChange={(e) => {
          const key = e.target.value;
          if (!key || values.includes(key)) return;
          setValues([...values, key]);
          setFiltersDirty(true);
        }}
        className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
      >
        <option value="">Add CRM tag…</option>
        {tags.filter((tag) => !values.includes(tag.key)).map((tag) => (
          <option key={tag.key} value={tag.key}>
            {tag.name}{tag.category ? ` · ${tag.category}` : ""}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[11px] text-[var(--theme-text-secondary)]">{helper}</p>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((key) => {
            const tag = tags.find((item) => item.key === key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setValues(values.filter((value) => value !== key));
                  setFiltersDirty(true);
                }}
                className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2.5 py-1 text-xs text-white hover:border-[#0d9488]"
                title="Remove filter"
              >
                {tag?.name || key} ×
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const consentLabel = (client: BroadcastClient) => {
    const status = client.whatsappMarketingConsent?.status || "unknown";
    if (status === "opted_in") return "Opted in";
    if (status === "opted_out") return "Opted out";
    return "Unknown";
  };

  const consentBadgeClass = (client: BroadcastClient) => {
    const status = client.whatsappMarketingConsent?.status || "unknown";
    if (status === "opted_in") return "border-green-500/40 bg-green-500/10 text-green-300";
    if (status === "opted_out") return "border-red-500/40 bg-red-500/10 text-red-300";
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  };

  const consentTitle = (client: BroadcastClient) => {
    const consent = client.whatsappMarketingConsent;
    if (!consent || consent.status === "unknown") return "WhatsApp marketing consent has not been recorded.";
    const parts = [consentLabel(client)];
    if (consent.source) parts.push(`Source: ${consent.source}`);
    if (consent.updatedAt) parts.push(`Updated: ${new Date(consent.updatedAt).toLocaleDateString()}`);
    return parts.join(" · ");
  };

  const openConsentEditor = (client: BroadcastClient) => {
    if (!client.crmContactId) {
      alert("This recipient is not linked to a CRM contact, so consent cannot be recorded here.");
      return;
    }
    setConsentEditorId(client._id);
    setConsentStatus(client.whatsappMarketingConsent?.status || "unknown");
    setConsentSource(client.whatsappMarketingConsent?.source || "");
    setConsentNote("");
  };

  const closeConsentEditor = () => {
    if (consentSaving) return;
    setConsentEditorId(null);
    setConsentSource("");
    setConsentNote("");
  };

  const saveConsent = async () => {
    const client = clients.find((item) => item._id === consentEditorId);
    if (!client?.crmContactId) return;
    if (consentStatus !== "unknown" && !consentSource.trim()) {
      alert("Enter how the opt-in or opt-out was obtained.");
      return;
    }

    setConsentSaving(true);
    try {
      const res = await api.patch<ConsentUpdateResponse>(
        `/crm/contacts/${client.crmContactId}/whatsapp-marketing-consent`,
        {
          status: consentStatus,
          source: consentStatus === "unknown" ? "" : consentSource.trim(),
          note: consentStatus === "unknown" ? "" : consentNote.trim(),
        }
      );

      const nextClients = clients.map((item) => {
        if (item._id !== client._id) return item;
        const nextConsent = res.whatsappMarketingConsent || {
          status: consentStatus,
          source: consentStatus === "unknown" ? "" : consentSource.trim(),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...item,
          whatsappMarketingConsent: nextConsent,
          whatsappConsentEligible: Boolean(item.phone && nextConsent.status === "opted_in"),
        };
      });

      setClients(nextClients);
      setConsentSummary(summarizeConsent(nextClients));
      setConsentEditorId(null);
      setConsentSource("");
      setConsentNote("");
    } catch (err) {
      console.error(err);
      alert("Could not update WhatsApp marketing consent.");
    } finally {
      setConsentSaving(false);
    }
  };

  const toggleClient = (id: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedClients.size === clients.length) setSelectedClients(new Set());
    else setSelectedClients(new Set(clients.map((c) => c._id)));
  };

  const getWhatsAppLink = (client: BroadcastClient) => {
    const phone = (client.phone || "").replace(/\D/g, "");
    const first = (client.fullName || "").split(" ")[0];
    const text = encodeURIComponent(message.replace(/\{first\}/g, first));
    return `https://wa.me/${phone}?text=${text}`;
  };

  const saveTemplate = async () => {
    if (!templateName) { alert("Name required"); return; }
    setSavingTemplate(true);
    try {
      await api.post("/broadcast/templates", { name: templateName, body: message });
      setTemplateName("");
      const res = await api.get<TemplatesResponse>("/broadcast/templates");
      if (res.success) setTemplates(res.templates);
      alert("Template saved!");
    } catch { alert("Could not save"); }
    finally { setSavingTemplate(false); }
  };

  const logSent = async () => {
    const recipients = clients.filter((c) => selectedClients.has(c._id)).map((c) => ({ clientId: c._id, name: c.fullName, phone: c.phone }));
    await api.post("/broadcast/log", { segment: selectedSegment, message, recipients });
    const res = await api.get<HistoryResponse>("/broadcast/history");
    if (res.success) setHistory(res.logs);
  };

  const sendViaTemplateApi = async () => {
    if (filtersDirty) {
      alert("Apply your tag filters before sending.");
      return;
    }

    if (!selectedApprovedTemplateName || !selectedApprovedTemplateLanguage) {
      alert("Choose an approved WhatsApp template.");
      return;
    }

    if (!selectedApprovedTemplate) {
      alert("The selected WhatsApp template is not available.");
      return;
    }

    const expected = Number(selectedApprovedTemplate.bodyParameterCount || 0);
    const values = Array.from({ length: expected }).map(
      (_, index) => bodyParameters[index] || ""
    );

    if (values.some((value) => !value.trim())) {
      alert(
        `This template requires ${expected} body parameter${
          expected === 1 ? "" : "s"
        }.`
      );
      return;
    }

    if (
      !window.confirm(
        `Send approved WhatsApp template "${selectedApprovedTemplateName} (${selectedApprovedTemplateLanguage})" to ${selectedClients.size} consent-eligible recipients?`
      )
    ) {
      return;
    }

    setSendingApi(true);

    try {
      const recipients = clients
        .filter((client) => selectedClients.has(client._id))
        .map((client) => ({
          clientId: client._id,
          name: client.fullName,
          phone: client.phone,
        }));

      const res = await api.post<{ sent: number; failed: number }>(
        "/broadcast/send-wa-template",
        {
          templateName: selectedApprovedTemplateName,
          languageCode: selectedApprovedTemplateLanguage,
          segment: selectedSegment,
          bodyParameters: values,
          recipients,
        }
      );

      alert(`Sent: ${res.sent}, Failed: ${res.failed}`);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not send approved WhatsApp template."
      );
    } finally {
      setSendingApi(false);
    }
  };

  const copyNumbers = () => {
    const nums = clients
      .filter((c) => selectedClients.has(c._id))
      .map((c) => (c.phone || "").replace(/\D/g, ""))
      .filter(Boolean)
      .join(", ");
    navigator.clipboard.writeText(nums);
    alert("✅ Numbers copied! Paste them into your WhatsApp Broadcast list.");
  };

  const daysSince = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);

  const nameList = (list: string[]) =>
    list.length <= 3 ? list.join(", ") : list.slice(0, 3).join(", ") + " and " + (list.length - 3) + " more";

  const selectedApprovedTemplate = approvedTemplates.find(
    (template) => template.name === selectedApprovedTemplateName && template.language === selectedApprovedTemplateLanguage
  ) || null;

  const tickerItems = (() => {
    const items: string[] = [];

    if (segments.length > 0) {
      const segSummary = segments.map((s) => s.name + " (" + s.count + ")").join(", ");
      items.push("your audience right now: " + segSummary);

      const emptySegments = segments.filter((s) => s.count === 0);
      if (emptySegments.length > 0) {
        items.push(emptySegments.length + " segment" + (emptySegments.length === 1 ? "" : "s") + " empty: " + nameList(emptySegments.map((s) => s.name)));
      }

      const nonEmpty = segments.filter((s) => s.count > 0).sort((a, b) => a.count - b.count);
      if (nonEmpty.length > 0 && nonEmpty[0].count <= 5) {
        items.push("the " + nonEmpty[0].name + " segment (" + nonEmpty[0].count + " people) is your easiest win today — a personal WhatsApp usually converts them");
      }
    } else {
      items.push("your audience segments are loading…");
    }

    if (selectedSegment) {
      const seg = segments.find((s) => s.key === selectedSegment);
      const segName = seg ? seg.name : selectedSegment;
      const hasMessage = message && message.trim() && message.trim() !== "Hi {first}! 👋";
      const hasCustomMessage = hasMessage && message.length > 15;
      const tagFilterCount = includeTagsAny.length + includeTagsAll.length + excludeTags.length;

      items.push(
        "you are composing for " + segName + " — " + selectedClients.size + " recipient" +
        (selectedClients.size === 1 ? "" : "s") + " selected" +
        (tagFilterCount ? ", CRM tag filters active" : "") +
        (filtersDirty ? ", filters need applying" : "") +
        (hasCustomMessage ? ", message ready" : " — write something personal before sending")
      );

      if (clients.length > 0) {
        items.push(
          "WhatsApp consent in this audience: " + consentSummary.optedIn + " opted in, " +
          consentSummary.optedOut + " opted out, " + consentSummary.unknown + " unknown"
        );
      }

      if (clients.length > 0 && selectedClients.size < clients.length) {
        items.push(
          (clients.length - selectedClients.size) + " in this segment not selected — click the squares to include them"
        );
      } else if (clients.length > 0 && selectedClients.size === clients.length) {
        items.push("all " + clients.length + " in this segment selected — review consent labels before sending");
      }
    } else {
      items.push("pick a segment on the left to start composing");
    }

    if (templates.length > 0) {
      items.push("you have " + templates.length + " saved template" + (templates.length === 1 ? "" : "s") + " — tap one to reuse it");
    }

    if (history.length > 0) {
      const latest = history[0];
      const days = daysSince(latest.createdAt);
      items.push(
        "last broadcast went out " + (days === 0 ? "today" : days + " day" + (days === 1 ? "" : "s") + " ago") +
        " to " + latest.recipientCount + " people in " + latest.segment +
        (days >= 7 ? " — time for another touch" : "")
      );
    } else {
      items.push("no broadcasts sent yet — your first one is the hardest, then it becomes a habit");
    }

    return items;
  })();

  const hasTagFilters = includeTagsAny.length + includeTagsAll.length + excludeTags.length > 0;
  const consentEditorClient = clients.find((client) => client._id === consentEditorId) || null;

  return (
    <div>
      <PageTicker items={tickerItems} />

      <h1 className="text-2xl font-bold text-white mb-2 flex flex-wrap items-center gap-2">
        <Megaphone size={24} /> Broadcast Builder
      </h1>
      <p className="text-[var(--theme-text-secondary)] mb-8">Send targeted WhatsApp messages to smart segments.</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--theme-text)] uppercase tracking-wider">1. Choose Segment</h2>
          {segments.map((seg) => (
            <button
              key={seg.key}
              onClick={() => loadPreview(seg.key)}
              className={`w-full flex flex-wrap gap-3 items-center justify-between rounded-lg border p-4 text-left transition ${
                selectedSegment === seg.key
                  ? "border-[#0d9488] bg-[#0d9488]/10"
                  : "border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)]"
              }`}
            >
              <span className="font-medium text-white">{seg.name}</span>
              <span className="text-sm text-[var(--theme-text-secondary)]">{seg.count}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedSegment && (
            <>
              <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--theme-text)] uppercase tracking-wider">2. Refine Audience <span className="normal-case text-[var(--theme-text-secondary)]">(optional)</span></h2>
                    <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Narrow this segment using CRM tags. Changes affect recipients only after you apply them.</p>
                  </div>
                  {hasTagFilters && (
                    <button type="button" onClick={clearTagFilters} className="text-xs text-[var(--theme-text-secondary)] hover:text-white">Clear filters</button>
                  )}
                </div>

                {tags.length === 0 ? (
                  <p className="text-sm text-[var(--theme-text-secondary)]">No active CRM tags are available.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {renderTagFilter("Any of these tags", includeTagsAny, setIncludeTagsAny, "Match at least one selected tag.")}
                    {renderTagFilter("All of these tags", includeTagsAll, setIncludeTagsAll, "Must have every selected tag.")}
                    {renderTagFilter("Exclude these tags", excludeTags, setExcludeTags, "Remove anyone with a selected tag.")}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => loadPreview(selectedSegment)}
                    disabled={loading || !filtersDirty}
                    className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d6007e] disabled:opacity-50"
                  >
                    {loading ? "Applying…" : "Apply filters"}
                  </button>
                  {filtersDirty && <span className="text-xs text-amber-300">Apply filters before sending.</span>}
                  {!filtersDirty && hasTagFilters && <span className="text-xs text-[var(--theme-text-secondary)]">Filters applied to the recipient list below.</span>}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[var(--theme-text)] uppercase tracking-wider">
                    3. Verify Recipients ({selectedClients.size} selected)
                  </h2>
                  <button onClick={toggleAll} className="text-xs text-[#0d9488] hover:underline">
                    {selectedClients.size === clients.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {!loading && clients.length > 0 && (
                  <div className="mb-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-1 text-xs text-green-300">Opted in {consentSummary.optedIn}</span>
                      <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">Opted out {consentSummary.optedOut}</span>
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">Unknown {consentSummary.unknown}</span>
                      <span className="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] px-2.5 py-1 text-xs text-white">Consent-eligible {consentSummary.consentEligible}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--theme-text-secondary)]">Consent is recorded separately from preferred contact method. Sending is not yet automatically restricted by these labels.</p>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] p-3 space-y-1.5">
                  {loading ? (
                    <p className="text-[var(--theme-text-secondary)] text-sm p-2">Loading...</p>
                  ) : clients.length === 0 ? (
                    <p className="text-[var(--theme-text-secondary)] text-sm p-2">No clients match this audience.</p>
                  ) : (
                    clients.map((c) => (
                      <div
                        key={c._id}
                        className="w-full flex flex-wrap items-center gap-3 rounded p-2 hover:bg-[var(--theme-surface-hover)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleClient(c._id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          {selectedClients.has(c._id) ? (
                            <CheckSquare size={16} className="shrink-0 text-[#0d9488]" />
                          ) : (
                            <Square size={16} className="shrink-0 text-[var(--theme-text-secondary)]" />
                          )}
                          <span className="min-w-0 flex-1 text-sm text-white">{c.fullName}</span>
                          <span className="text-xs text-[var(--theme-text-secondary)]">{c.phone}</span>
                        </button>
                        {canManageConsent && c.crmContactId ? (
                          <button
                            type="button"
                            onClick={() => openConsentEditor(c)}
                            className={`rounded-full border px-2 py-0.5 text-[11px] hover:brightness-125 ${consentBadgeClass(c)}`}
                            title={`${consentTitle(c)} Click to update.`}
                          >
                            {consentLabel(c)}
                          </button>
                        ) : (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] ${consentBadgeClass(c)}`}
                            title={consentTitle(c)}
                          >
                            {consentLabel(c)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {canManageConsent && clients.length > 0 && (
                  <p className="mt-2 text-[11px] text-[var(--theme-text-secondary)]">Admin/Sales: click a consent label to record or update WhatsApp marketing permission.</p>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[var(--theme-text)] uppercase tracking-wider mb-3">4. Compose Message</h2>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#0d9488]"
                  placeholder="Hi {first}! Your cycle ends soon..."
                />
                <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Use <code className="bg-[var(--theme-surface-soft)] px-1 rounded">{"{first}"}</code> to insert their first name.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name (optional)" className="flex-1 rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]" />
                  <button onClick={saveTemplate} disabled={savingTemplate} className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--theme-surface-hover)] disabled:opacity-50">{savingTemplate ? "Saving..." : "Save as template"}</button>
                </div>
                {templates.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {templates.slice(0, 5).map((t) => (
                      <button key={t._id} onClick={() => setMessage(t.body)} className="rounded-full bg-[var(--theme-surface-soft)] px-3 py-1 text-xs text-white hover:bg-[var(--theme-surface-hover)]">{t.name}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4">
                <h2 className="text-sm font-semibold text-[var(--theme-text)] uppercase tracking-wider">Approved WhatsApp Template</h2>
                <p className="mt-1 text-xs text-[var(--theme-text-secondary)]">Business-initiated WhatsApp messages must use an approved Meta template.</p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-medium text-white">Template</span>
                    <select
                      value={selectedApprovedTemplateName}
                      onChange={(event) => {
                        const name = event.target.value;
                        setSelectedApprovedTemplateName(name);
                        const nextTemplate = approvedTemplates.find((item) => item.name === name);
                        if (nextTemplate) setSelectedApprovedTemplateLanguage(nextTemplate.language);
                      }}
                      className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
                      disabled={approvedTemplates.length === 0}
                    >
                      {approvedTemplates.length === 0 && <option value="">No approved templates</option>}
                      {approvedTemplates.map((template) => (
                        <option key={`${template.name}-${template.language}`} value={template.name}>
                          {template.name} · {template.language}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-white">Language</span>
                    <select
                      value={selectedApprovedTemplateLanguage}
                      onChange={(event) => setSelectedApprovedTemplateLanguage(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
                      disabled={approvedTemplates.length === 0}
                    >
                      <option value="">Select language</option>
                      {approvedTemplates
                        .filter((template) => template.name === selectedApprovedTemplateName)
                        .map((template) => (
                          <option key={template.language} value={template.language}>
                            {template.language}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                {selectedApprovedTemplate && Number(selectedApprovedTemplate.bodyParameterCount) > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-white">Body parameters</p>
                    {Array.from({ length: Number(selectedApprovedTemplate.bodyParameterCount) }).map((_, index) => (
                      <input
                        key={index}
                        value={bodyParameters[index] || ""}
                        onChange={(event) => {
                          const next = [...bodyParameters];
                          next[index] = event.target.value;
                          setBodyParameters(next);
                        }}
                        placeholder={`Parameter ${index + 1}`}
                        className="w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-between pt-2">
                <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-[var(--theme-text-secondary)] hover:text-white">{showHistory ? "Hide history" : "Show broadcast history"}</button>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={sendViaTemplateApi}
                  disabled={selectedClients.size === 0 || sendingApi || filtersDirty}
                  className="flex flex-wrap items-center gap-2 rounded-full bg-green-600 px-4 sm:px-6 py-3 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {sendingApi ? "Sending…" : "📱 Send Approved Template"}
                </button>
                <button
                  onClick={async () => { if (filtersDirty) return; await logSent(); copyNumbers(); }}
                  disabled={selectedClients.size === 0 || filtersDirty}
                  className="flex flex-wrap items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 sm:px-6 py-3 text-sm font-medium text-white hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
                >
                  <Copy size={16} /> Or copy numbers
                </button>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
                  {filtersDirty ? (
                    <span className="text-xs text-amber-300">Apply filters to enable individual sends.</span>
                  ) : (
                    <>
                      or send individually:
                      {clients.filter(c => selectedClients.has(c._id)).slice(0, 3).map(c => (
                        <a
                          key={c._id}
                          href={getWhatsAppLink(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-wrap items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
                        >
                          {c.fullName.split(" ")[0]} <ExternalLink size={12} />
                        </a>
                      ))}
                      {selectedClients.size > 3 && <span className="text-xs text-[var(--theme-text-secondary)]">+{selectedClients.size - 3} more</span>}
                    </>
                  )}
                </div>
              </div>

              {showHistory && history.length > 0 && (
                <div className="mt-6 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
                  <h3 className="text-sm font-medium text-white mb-3">Recent broadcasts</h3>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((h) => (
                      <div key={h._id} className="rounded-sm border border-[var(--theme-border)] bg-[var(--theme-input)] p-3">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                          <p className="text-sm text-white">{h.sentBy?.name || "Unknown"} sent to {h.recipientCount} in {h.segment}</p>
                          <p className="text-xs text-[var(--theme-text-secondary)]">{new Date(h.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="mt-1 text-xs text-[var(--theme-text-secondary)] line-clamp-2">{h.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {consentEditorClient && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeConsentEditor(); }}
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">WhatsApp marketing consent</h3>
                <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{consentEditorClient.fullName}</p>
              </div>
              <button type="button" onClick={closeConsentEditor} disabled={consentSaving} className="text-sm text-[var(--theme-text-secondary)] hover:text-white disabled:opacity-50">Close</button>
            </div>

            <p className="mt-4 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-3 text-xs leading-relaxed text-[var(--theme-text-secondary)]">
              Preferred contact method is not permission to market on WhatsApp. Record consent only when you have evidence of the person&apos;s opt-in or opt-out.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-white">Status</span>
                <select
                  value={consentStatus}
                  onChange={(event) => {
                    const status = event.target.value as WhatsAppConsentStatus;
                    setConsentStatus(status);
                    if (status === "unknown") {
                      setConsentSource("");
                      setConsentNote("");
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
                >
                  <option value="unknown">Unknown</option>
                  <option value="opted_in">Opted in</option>
                  <option value="opted_out">Opted out</option>
                </select>
              </label>

              {consentStatus !== "unknown" && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-white">Evidence source <span className="text-red-300">*</span></span>
                    <input
                      value={consentSource}
                      onChange={(event) => setConsentSource(event.target.value)}
                      maxLength={160}
                      placeholder="e.g. website checkbox, WhatsApp reply, signed form"
                      className="mt-1 w-full rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-white">Evidence note <span className="font-normal text-[var(--theme-text-secondary)]">(optional)</span></span>
                    <textarea
                      value={consentNote}
                      onChange={(event) => setConsentNote(event.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Useful context about what the person agreed to or how they opted out."
                      className="mt-1 w-full resize-none rounded-lg border border-[var(--theme-border)] bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#0d9488]"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeConsentEditor} disabled={consentSaving} className="rounded-full border border-[var(--theme-border)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--theme-surface-hover)] disabled:opacity-50">Cancel</button>
              <button
                type="button"
                onClick={saveConsent}
                disabled={consentSaving || (consentStatus !== "unknown" && !consentSource.trim())}
                className="rounded-full bg-[#0d9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d6007e] disabled:opacity-50"
              >
                {consentSaving ? "Saving…" : "Save consent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
