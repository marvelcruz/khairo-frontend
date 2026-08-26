"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageSquare,
  Palette,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import { api } from "@/lib/api";

type Section =
  | "profile"
  | "regional"
  | "branding"
  | "communication"
  | "operations"
  | "growth";

type BusinessSettings = {
  profile: {
    displayName: string;
    legalName: string;
    email: string;
    phone: string;
    website: string;
    address: string;
  };
  regional: {
    country: string;
    timeZone: string;
    currency: string;
    dateFormat: string;
    taxLabel: string;
    defaultTaxRate: number;
  };
  branding: {
    primaryColor: string;
    publicName: string;
  };
  communication: {
    senderName: string;
    replyToEmail: string;
    whatsappNumber: string;
    supportPhone: string;
    emailNotifications: boolean;
    administrativeAlerts: boolean;
    clientCommunicationReminders: boolean;
  };
  operations: {
    defaultAppointmentDuration: number;
    defaultClientStatus: string;
    allowStaffNotifications: boolean;
    showClientContactByDefault: boolean;
  };
  growth: {
    promoCodesEnabled: boolean;
    promoDefaultDiscountType: "percentage" | "fixed";
    promoDefaultDiscountValue: number;
    promoDefaultExpiryDays: number;
    promoDefaultMaxUses: number;
    abandonedPaymentRecoveryEnabled: boolean;
    abandonedRecoveryDelayHours: number;
    abandonedRecoveryEmailEnabled: boolean;
    referralProgramEnabled: boolean;
    referralRewardType: "percentage" | "fixed";
    referralRewardValue: number;
    winBackEnabled: boolean;
    winBackThresholdDays: number;
    winBackOfferType: "percentage" | "fixed";
    winBackOfferValue: number;
    winBackMessage: string;
    oneClickRenewalEnabled: boolean;
    giftCardsEnabled: boolean;
    upsellsEnabled: boolean;
  };
};

type BusinessSettingsResponse = {
  success: boolean;
  settings: BusinessSettings;
  persisted?: boolean;
};

const DEFAULTS: BusinessSettings = {
  profile: {
    displayName: "KhairoDietClinic",
    legalName: "",
    email: "",
    phone: "",
    website: "https://khairo.com",
    address: "",
  },
  regional: {
    country: "NG",
    timeZone: "Africa/Lagos",
    currency: "NGN",
    dateFormat: "DD/MM/YYYY",
    taxLabel: "",
    defaultTaxRate: 0,
  },
  branding: {
    primaryColor: "#EC008C",
    publicName: "KhairoDietClinic",
  },
  communication: {
    senderName: "KhairoDietClinic",
    replyToEmail: "",
    whatsappNumber: "",
    supportPhone: "",
    emailNotifications: true,
    administrativeAlerts: true,
    clientCommunicationReminders: true,
  },
  operations: {
    defaultAppointmentDuration: 60,
    defaultClientStatus: "active",
    allowStaffNotifications: true,
    showClientContactByDefault: true,
  },
  growth: {
    promoCodesEnabled: false,
    promoDefaultDiscountType: "percentage",
    promoDefaultDiscountValue: 10,
    promoDefaultExpiryDays: 30,
    promoDefaultMaxUses: 0,
    abandonedPaymentRecoveryEnabled: false,
    abandonedRecoveryDelayHours: 24,
    abandonedRecoveryEmailEnabled: true,
    referralProgramEnabled: false,
    referralRewardType: "percentage",
    referralRewardValue: 10,
    winBackEnabled: false,
    winBackThresholdDays: 30,
    winBackOfferType: "percentage",
    winBackOfferValue: 15,
    winBackMessage: "We miss you! Here is a special offer to rejoin KhairoDietClinic.",
    oneClickRenewalEnabled: false,
    giftCardsEnabled: false,
    upsellsEnabled: false,
  },
};

const sections = [
  {
    key: "profile",
    label: "Business Profile",
    icon: Building2,
  },
  {
    key: "regional",
    label: "Regional & Financial",
    icon: MapPin,
  },
  {
    key: "branding",
    label: "Branding",
    icon: Palette,
  },
  {
    key: "communication",
    label: "Communication",
    icon: MessageSquare,
  },
  {
    key: "operations",
    label: "Operational Defaults",
    icon: SlidersHorizontal,
  },
  {
    key: "growth",
    label: "Growth Features",
    icon: SlidersHorizontal,
  },
] as const;

const inputClass =
  "h-11 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)] focus:border-[#0d9488]/60";

const labelClass =
  "mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]";

function mergeSettings(
  value?: Partial<BusinessSettings>
): BusinessSettings {
  return {
    profile: {
      ...DEFAULTS.profile,
      ...(value?.profile || {}),
    },
    regional: {
      ...DEFAULTS.regional,
      ...(value?.regional || {}),
    },
    branding: {
      ...DEFAULTS.branding,
      ...(value?.branding || {}),
    },
    communication: {
      ...DEFAULTS.communication,
      ...(value?.communication || {}),
    },
    operations: {
      ...DEFAULTS.operations,
      ...(value?.operations || {}),
    },
    growth: {
      ...DEFAULTS.growth,
      ...(value?.growth || {}),
    },
  };
}

export default function BusinessConfigurationPage() {
  const [section, setSection] =
    useState<Section>("profile");

  const [settings, setSettings] =
    useState<BusinessSettings>(DEFAULTS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response =
        await api.get<BusinessSettingsResponse>(
          "/settings/business"
        );

      setSettings(
        mergeSettings(response.settings)
      );

      setPersisted(Boolean(response.persisted));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load business configuration."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await api.put<BusinessSettingsResponse>(
          "/settings/business",
          settings
        );

      setSettings(
        mergeSettings(response.settings)
      );

      setPersisted(true);
      setMessage("Business configuration saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save business configuration."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (
    patch: Partial<BusinessSettings["profile"]>
  ) => {
    setSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...patch,
      },
    }));
  };

  const updateRegional = (
    patch: Partial<BusinessSettings["regional"]>
  ) => {
    setSettings((current) => ({
      ...current,
      regional: {
        ...current.regional,
        ...patch,
      },
    }));
  };

  const updateBranding = (
    patch: Partial<BusinessSettings["branding"]>
  ) => {
    setSettings((current) => ({
      ...current,
      branding: {
        ...current.branding,
        ...patch,
      },
    }));
  };

  const updateCommunication = (
    patch: Partial<
      BusinessSettings["communication"]
    >
  ) => {
    setSettings((current) => ({
      ...current,
      communication: {
        ...current.communication,
        ...patch,
      },
    }));
  };

  const updateOperations = (
    patch: Partial<BusinessSettings["operations"]>
  ) => {
    setSettings((current) => ({
      ...current,
      operations: {
        ...current.operations,
        ...patch,
      },
    }));
  };

  const updateGrowth = (
    patch: Partial<BusinessSettings["growth"]>
  ) => {
    setSettings((current) => ({
      ...current,
      growth: {
        ...current.growth,
        ...patch,
      },
    }));
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">
              Administration
            </p>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-600/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <CheckCircle2 size={11} />
              Connected
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Business Configuration
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-text-secondary)]">
            Manage KhairoDietClinic business identity,
            regional defaults, branding,
            communication preferences and
            organisation-wide operational defaults.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || saving}
          className="inline-flex min-h-10 self-start items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-white disabled:opacity-40"
        >
          <RefreshCw
            size={13}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-amber-100/80">
        These values are now saved in the KhairoDietClinic
        Business Settings record. Existing modules that
        still use their own established currency,
        timezone, branding, email or appointment defaults
        will continue doing so until each consumer is
        deliberately migrated. Saving here does not
        silently rewrite those workflows.
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] text-sm text-[var(--theme-text-muted)]">
          <Loader2
            size={16}
            className="animate-spin"
          />
          Loading business configuration…
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav className="h-fit min-w-0 max-w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-2">
            <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto lg:block">
              {sections.map((item) => {
                const Icon = item.icon;
                const active =
                  section === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setSection(item.key)
                    }
                    className={`flex min-h-11 min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition lg:mb-1 lg:w-full ${
                      active
                        ? "bg-[var(--theme-surface-soft)] text-white"
                        : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={
                        active
                          ? "text-[#0d9488]"
                          : "text-[var(--theme-text-muted)]"
                      }
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4 sm:p-6">
            {section === "profile" && (
              <div>
                <SectionHeader
                  title="Business Profile"
                  description="The persisted identity and contact details for the business."
                />

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Business display name">
                    <input
                      className={inputClass}
                      value={
                        settings.profile
                          .displayName
                      }
                      onChange={(event) =>
                        updateProfile({
                          displayName:
                            event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Legal business name">
                    <input
                      className={inputClass}
                      value={
                        settings.profile.legalName
                      }
                      onChange={(event) =>
                        updateProfile({
                          legalName:
                            event.target.value,
                        })
                      }
                      placeholder="Registered legal name"
                    />
                  </Field>

                  <Field label="Business email">
                    <input
                      type="email"
                      className={inputClass}
                      value={settings.profile.email}
                      onChange={(event) =>
                        updateProfile({
                          email:
                            event.target.value,
                        })
                      }
                      placeholder="hello@khairo.com"
                    />
                  </Field>

                  <Field label="Business phone">
                    <input
                      className={inputClass}
                      value={settings.profile.phone}
                      onChange={(event) =>
                        updateProfile({
                          phone:
                            event.target.value,
                        })
                      }
                      placeholder="+234..."
                    />
                  </Field>

                  <Field label="Website">
                    <input
                      className={inputClass}
                      value={
                        settings.profile.website
                      }
                      onChange={(event) =>
                        updateProfile({
                          website:
                            event.target.value,
                        })
                      }
                      placeholder="https://khairo.com"
                    />
                  </Field>

                  <Field label="Business address">
                    <input
                      className={inputClass}
                      value={
                        settings.profile.address
                      }
                      onChange={(event) =>
                        updateProfile({
                          address:
                            event.target.value,
                        })
                      }
                      placeholder="Street address"
                    />
                  </Field>
                </div>
              </div>
            )}

            {section === "regional" && (
              <div>
                <SectionHeader
                  title="Regional & Financial"
                  description="Saved business defaults for dates, time zones and monetary presentation."
                />

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Country">
                    <select
                      className={inputClass}
                      value={
                        settings.regional.country
                      }
                      onChange={(event) =>
                        updateRegional({
                          country:
                            event.target.value,
                        })
                      }
                    >
                      <option value="NG">
                        Nigeria
                      </option>
                      <option value="CA">
                        Canada
                      </option>
                      <option value="US">
                        United States
                      </option>
                      <option value="GB">
                        United Kingdom
                      </option>
                    </select>
                  </Field>

                  <Field label="Time zone">
                    <select
                      className={inputClass}
                      value={
                        settings.regional
                          .timeZone
                      }
                      onChange={(event) =>
                        updateRegional({
                          timeZone:
                            event.target.value,
                        })
                      }
                    >
                      <option value="Africa/Lagos">
                        Africa/Lagos
                      </option>
                      <option value="America/Edmonton">
                        America/Edmonton
                      </option>
                      <option value="America/Toronto">
                        America/Toronto
                      </option>
                      <option value="Europe/London">
                        Europe/London
                      </option>
                    </select>
                  </Field>

                  <Field label="Default currency">
                    <select
                      className={inputClass}
                      value={
                        settings.regional.currency
                      }
                      onChange={(event) =>
                        updateRegional({
                          currency:
                            event.target.value,
                        })
                      }
                    >
                      <option value="NGN">
                        NGN — Nigerian Naira
                      </option>
                      <option value="CAD">
                        CAD — Canadian Dollar
                      </option>
                      <option value="USD">
                        USD — US Dollar
                      </option>
                      <option value="GBP">
                        GBP — British Pound
                      </option>
                    </select>
                  </Field>

                  <Field label="Date format">
                    <select
                      className={inputClass}
                      value={
                        settings.regional
                          .dateFormat
                      }
                      onChange={(event) =>
                        updateRegional({
                          dateFormat:
                            event.target.value,
                        })
                      }
                    >
                      <option value="DD/MM/YYYY">
                        DD/MM/YYYY
                      </option>
                      <option value="MM/DD/YYYY">
                        MM/DD/YYYY
                      </option>
                      <option value="YYYY-MM-DD">
                        YYYY-MM-DD
                      </option>
                    </select>
                  </Field>

                  <Field label="Tax label">
                    <input
                      className={inputClass}
                      value={
                        settings.regional.taxLabel
                      }
                      onChange={(event) =>
                        updateRegional({
                          taxLabel:
                            event.target.value,
                        })
                      }
                      placeholder="VAT / GST / Tax"
                    />
                  </Field>

                  <Field label="Default tax rate (%)">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={inputClass}
                      value={
                        settings.regional
                          .defaultTaxRate
                      }
                      onChange={(event) =>
                        updateRegional({
                          defaultTaxRate:
                            Number(
                              event.target.value
                            ) || 0,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            )}

            {section === "branding" && (
              <div>
                <SectionHeader
                  title="Branding"
                  description="Persist the business identity that future connected consumers can use."
                />

                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-input)] p-6">
                    <p className="text-sm font-medium text-white">
                      Business logo
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--theme-text-muted)]">
                      Logo upload remains staged
                      until a file-storage authority
                      is connected.
                    </p>

                    <div
                      className="mt-4 grid h-20 w-20 place-items-center rounded-2xl text-2xl font-bold text-white"
                      style={{
                        backgroundColor:
                          settings.branding
                            .primaryColor,
                      }}
                    >
                      {(
                        settings.branding
                          .publicName ||
                        settings.profile
                          .displayName ||
                        "F"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Primary colour">
                      <div className="flex h-11 items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3">
                        <span
                          className="h-5 w-5 shrink-0 rounded-full border border-[var(--theme-border)]"
                          style={{
                            backgroundColor:
                              settings.branding
                                .primaryColor,
                          }}
                        />

                        <input
                          value={
                            settings.branding
                              .primaryColor
                          }
                          onChange={(event) =>
                            updateBranding({
                              primaryColor:
                                event.target.value,
                            })
                          }
                          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                          placeholder="#EC008C"
                        />
                      </div>
                    </Field>

                    <Field label="Public business name">
                      <input
                        className={inputClass}
                        value={
                          settings.branding
                            .publicName
                        }
                        onChange={(event) =>
                          updateBranding({
                            publicName:
                              event.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {section === "communication" && (
              <div>
                <SectionHeader
                  title="Communication"
                  description="Persist communication defaults for future connected email, alert and messaging consumers."
                />

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Default sender name">
                    <input
                      className={inputClass}
                      value={
                        settings.communication
                          .senderName
                      }
                      onChange={(event) =>
                        updateCommunication({
                          senderName:
                            event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Reply-to email">
                    <input
                      type="email"
                      className={inputClass}
                      value={
                        settings.communication
                          .replyToEmail
                      }
                      onChange={(event) =>
                        updateCommunication({
                          replyToEmail:
                            event.target.value,
                        })
                      }
                      placeholder="support@khairo.com"
                    />
                  </Field>

                  <Field label="WhatsApp business number">
                    <input
                      className={inputClass}
                      value={
                        settings.communication
                          .whatsappNumber
                      }
                      onChange={(event) =>
                        updateCommunication({
                          whatsappNumber:
                            event.target.value,
                        })
                      }
                      placeholder="+234..."
                    />
                  </Field>

                  <Field label="Support phone">
                    <input
                      className={inputClass}
                      value={
                        settings.communication
                          .supportPhone
                      }
                      onChange={(event) =>
                        updateCommunication({
                          supportPhone:
                            event.target.value,
                        })
                      }
                      placeholder="+234..."
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-2">
                  <Toggle
                    label="Email notifications"
                    checked={
                      settings.communication
                        .emailNotifications
                    }
                    onChange={(checked) =>
                      updateCommunication({
                        emailNotifications:
                          checked,
                      })
                    }
                  />

                  <Toggle
                    label="Administrative alerts"
                    checked={
                      settings.communication
                        .administrativeAlerts
                    }
                    onChange={(checked) =>
                      updateCommunication({
                        administrativeAlerts:
                          checked,
                      })
                    }
                  />

                  <Toggle
                    label="Client communication reminders"
                    checked={
                      settings.communication
                        .clientCommunicationReminders
                    }
                    onChange={(checked) =>
                      updateCommunication({
                        clientCommunicationReminders:
                          checked,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {section === "operations" && (
              <div>
                <SectionHeader
                  title="Operational Defaults"
                  description="Persist valid organisation-wide defaults without silently changing existing operational workflows."
                />

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Default appointment duration">
                    <select
                      className={inputClass}
                      value={
                        settings.operations
                          .defaultAppointmentDuration
                      }
                      onChange={(event) =>
                        updateOperations({
                          defaultAppointmentDuration:
                            Number(
                              event.target.value
                            ),
                        })
                      }
                    >
                      <option value="30">
                        30 minutes
                      </option>
                      <option value="45">
                        45 minutes
                      </option>
                      <option value="60">
                        60 minutes
                      </option>
                      <option value="90">
                        90 minutes
                      </option>
                    </select>
                  </Field>

                  <Field label="Default client status">
                    <select
                      className={inputClass}
                      value={
                        settings.operations
                          .defaultClientStatus
                      }
                      onChange={(event) =>
                        updateOperations({
                          defaultClientStatus:
                            event.target.value,
                        })
                      }
                    >
                      <option value="active">
                        Active
                      </option>
                      <option value="paused">
                        Paused
                      </option>
                      <option value="completed">
                        Completed
                      </option>
                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>
                  </Field>
                </div>

                <div className="mt-6 space-y-2">
                  <Toggle
                    label="Allow staff notifications"
                    checked={
                      settings.operations
                        .allowStaffNotifications
                    }
                    onChange={(checked) =>
                      updateOperations({
                        allowStaffNotifications:
                          checked,
                      })
                    }
                  />

                  <Toggle
                    label="Show client contact information by default"
                    checked={
                      settings.operations
                        .showClientContactByDefault
                    }
                    onChange={(checked) =>
                      updateOperations({
                        showClientContactByDefault:
                          checked,
                      })
                    }
                  />
                </div>

                <div className="mt-6 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-3 text-xs leading-5 text-[var(--theme-text-muted)]">
                  Appointment duration and Client
                  status are currently stored as
                  configuration only. Existing Session
                  and Client creation logic retains its
                  current behavior until those consumers
                  are migrated and tested separately.
                </div>
              </div>
            )}

            {section === "growth" && (
              <div>
                <SectionHeader
                  title="Growth Features"
                  description="Control revenue-generating features that can be turned on or off and edited without code."
                />
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
                  <strong className="text-white">Quick guide:</strong>
                  Use the toggles below to turn each feature ON or OFF.
                  When a feature is ON, its related automation and client-facing options become active.
                  You can edit the values under each toggle to control how the feature works.
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Default discount type">
                    <select
                      className={inputClass}
                      value={settings.growth.promoDefaultDiscountType}
                      onChange={(event) =>
                        updateGrowth({
                          promoDefaultDiscountType:
                            event.target.value as "percentage" | "fixed",
                        })
                      }
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </Field>

                  <Field label="Default discount value">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={inputClass}
                      value={settings.growth.promoDefaultDiscountValue}
                      onChange={(event) =>
                        updateGrowth({
                          promoDefaultDiscountValue:
                            Number(event.target.value) || 0,
                        })
                      }
                    />
                  </Field>

                  <Field label="Default expiry days">
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={settings.growth.promoDefaultExpiryDays}
                      onChange={(event) =>
                        updateGrowth({
                          promoDefaultExpiryDays:
                            Number(event.target.value) || 0,
                        })
                      }
                    />
                  </Field>

                  <Field label="Default max uses (0 = unlimited)">
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={settings.growth.promoDefaultMaxUses}
                      onChange={(event) =>
                        updateGrowth({
                          promoDefaultMaxUses:
                            Number(event.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-2">
                  <Toggle
                    label="Enable promo codes"
                    checked={settings.growth.promoCodesEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        promoCodesEnabled: checked,
                      })
                    }
                  />
                  <Toggle
                    label="Enable abandoned payment recovery"
                    checked={settings.growth.abandonedPaymentRecoveryEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        abandonedPaymentRecoveryEnabled: checked,
                      })
                    }
                  />
                  <Toggle
                    label="Send recovery email"
                    checked={settings.growth.abandonedRecoveryEmailEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        abandonedRecoveryEmailEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Recovery delay (hours)">
                    <input
                      type="number"
                      min="1"
                      max="168"
                      className={inputClass}
                      value={settings.growth.abandonedRecoveryDelayHours}
                      onChange={(event) =>
                        updateGrowth({
                          abandonedRecoveryDelayHours:
                            Number(event.target.value) || 24,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-2">
                  <Toggle
                    label="Enable referral program"
                    checked={settings.growth.referralProgramEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        referralProgramEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Referral reward type">
                    <select
                      className={inputClass}
                      value={settings.growth.referralRewardType}
                      onChange={(event) =>
                        updateGrowth({
                          referralRewardType:
                            event.target.value as "percentage" | "fixed",
                        })
                      }
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </Field>

                  <Field label="Referral reward value">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={settings.growth.referralRewardValue}
                      onChange={(event) =>
                        updateGrowth({
                          referralRewardValue:
                            Number(event.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-2">
                  <Toggle
                    label="Enable win-back offers"
                    checked={settings.growth.winBackEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        winBackEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Win-back threshold (days)">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className={inputClass}
                      value={settings.growth.winBackThresholdDays}
                      onChange={(event) =>
                        updateGrowth({
                          winBackThresholdDays:
                            Number(event.target.value) || 30,
                        })
                      }
                    />
                  </Field>

                  <Field label="Win-back offer type">
                    <select
                      className={inputClass}
                      value={settings.growth.winBackOfferType}
                      onChange={(event) =>
                        updateGrowth({
                          winBackOfferType:
                            event.target.value as "percentage" | "fixed",
                        })
                      }
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </Field>

                  <Field label="Win-back offer value">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={settings.growth.winBackOfferValue}
                      onChange={(event) =>
                        updateGrowth({
                          winBackOfferValue:
                            Number(event.target.value) || 0,
                        })
                      }
                    />
                  </Field>

                  <Field label="Win-back message">
                    <textarea
                      rows={3}
                      maxLength={1000}
                      className={`${inputClass} h-auto resize-y`}
                      value={settings.growth.winBackMessage}
                      onChange={(event) =>
                        updateGrowth({
                          winBackMessage:
                            event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-6 space-y-2">
                  <Toggle
                    label="Enable one-click renewal"
                    checked={settings.growth.oneClickRenewalEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        oneClickRenewalEnabled: checked,
                      })
                    }
                  />
                  <Toggle
                    label="Enable gift cards"
                    checked={settings.growth.giftCardsEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        giftCardsEnabled: checked,
                      })
                    }
                  />
                  <Toggle
                    label="Enable upsells and add-ons"
                    checked={settings.growth.upsellsEnabled}
                    onChange={(checked) =>
                      updateGrowth({
                        upsellsEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-[var(--theme-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--theme-text-muted)]">
                {persisted
                  ? "Saved in the Business Settings database record."
                  : "Using defaults until the first save."}
              </p>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-[#0d9488] px-5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={14} />
                )}

                {saving
                  ? "Saving…"
                  : "Save changes"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[var(--theme-border)] pb-5">
      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-[var(--theme-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className={labelClass}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-4 py-3 text-left"
    >
      <span className="text-sm text-[var(--theme-text-secondary)]">
        {label}
      </span>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#0d9488]/80"
            : "bg-[var(--theme-surface-soft)]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
