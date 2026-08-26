"use client";

import {
  useEffect,
  useState,
} from "react";
import { api } from "../../../lib/api";

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  program: string;
  referralCode?: string;
  referredBy?: string;
};

type Preferences = {
  emailReminders: boolean;
  smsReminders: boolean;
  portalReminders: boolean;
  weeklyCheckInReminder: boolean;
  progressPhotoReminder: boolean;
  appointmentReminder: boolean;
};

export default function SettingsPage() {
  const [
    profile,
    setProfile,
  ] = useState<Profile | null>(
    null
  );

  const [
    preferences,
    setPreferences,
  ] = useState<Preferences | null>(
    null
  );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    void api
      .get<{
        profile:
          Profile;
        preferences:
          Preferences;
      }>(
        "/client-experience/profile",
        true
      )
      .then((response) => {
        setProfile(
          response.profile
        );

        setPreferences(
          response.preferences
        );
      })
      .catch(() => {});
  }, []);

  if (
    !profile ||
    !preferences
  ) {
    return (
      <p className="text-sm text-zinc-500">
        Loading settings...
      </p>
    );
  }

  const save = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const response =
        await api.patch<{
          profile:
            Profile;
          preferences:
            Preferences;
        }>(
          "/client-experience/profile",
          {
            fullName:
              profile.fullName,
            phone:
              profile.phone,
            preferences,
          },
          true
        );

      setProfile(
        response.profile
      );

      setPreferences(
        response.preferences
      );

      setMessage(
        "Your settings have been saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggle = (
    key:
      keyof Preferences
  ) => {
    setPreferences({
      ...preferences,
      [key]:
        !preferences[key],
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Profile & Reminders
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-white">
          Your account
        </h1>
      </header>

      <form
        onSubmit={save}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="font-semibold text-white">
            Contact details
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-xs text-zinc-500">
                Name
              </span>

              <input
                value={
                  profile.fullName
                }
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    fullName:
                      e.target
                        .value,
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3.5 text-sm text-white"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs text-zinc-500">
                Phone
              </span>

              <input
                value={
                  profile.phone
                }
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    phone:
                      e.target
                        .value,
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3.5 text-sm text-white"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs text-zinc-500">
                Email
              </span>

              <input
                disabled
                value={
                  profile.email
                }
                className="h-11 w-full rounded-xl border border-white/8 bg-black/20 px-3.5 text-sm text-zinc-500"
              />

              <p className="mt-1 text-[11px] text-zinc-600">
                Contact Khairo Diet Clinic if you need to change your login email.
              </p>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="font-semibold text-white">
            Referral program
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Share your Khairo Diet Clinic referral code with friends.
          </p>

          <div className="mt-4 rounded-xl border border-[#0d9488]/20 bg-[#0d9488]/5 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[#0d9488]">
              Your referral code
            </p>
            <p className="mt-2 text-lg font-semibold tracking-wide text-white">
              {profile.referralCode || "Coming soon"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Share this link:
            </p>
            <p className="mt-1 break-all rounded-lg bg-black/30 px-3 py-2 text-sm text-zinc-300">
              {`https://khairo-frontend-kappa.vercel.app/portal/register?referralCode=${encodeURIComponent(profile.referralCode || "")}`}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="font-semibold text-white">
            Reminders
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose which reminders are useful to you.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              [
                "weeklyCheckInReminder",
                "Weekly check-in",
              ],
              [
                "progressPhotoReminder",
                "Bi-weekly progress photos",
              ],
              [
                "appointmentReminder",
                "Appointments",
              ],
              [
                "portalReminders",
                "Portal reminders",
              ],
              [
                "emailReminders",
                "Email reminders",
              ],
              [
                "smsReminders",
                "SMS reminders",
              ],
            ].map(
              ([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-zinc-300"
                >
                  <span>
                    {label}
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      preferences[
                        key as keyof Preferences
                      ]
                    }
                    onChange={() =>
                      toggle(
                        key as keyof Preferences
                      )
                    }
                    className="h-4 w-4 accent-[#0d9488]"
                  />
                </label>
              )
            )}
          </div>
        </section>

        {message && (
          <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {message}
          </p>
        )}

        <button
          disabled={saving}
          className="h-11 rounded-full bg-[#0d9488] px-6 text-sm font-semibold text-white"
        >
          {saving
            ? "Saving..."
            : "Save my settings"}
        </button>
      </form>
    </div>
  );
}
