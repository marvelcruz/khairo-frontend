"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

export default function HelpPage() {
  const [
    category,
    setCategory,
  ] = useState("help");

  const [body, setBody] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const submit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSending(true);
    setSent(false);

    try {
      await api.post(
        "/client-experience/messages",
        {
          category,
          body,
        },
        true
      );

      setBody("");
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Help
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-white">
          How can we help?
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Tell us what you need. Your request will also appear in Messages so you have a record of it.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6"
      >
        <label>
          <span className="mb-1.5 block text-xs text-zinc-500">
            What do you need help with?
          </span>

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-sm text-white"
          >
            <option value="help">
              General help
            </option>
            <option value="plan">
              My plan
            </option>
            <option value="appointment">
              Appointment
            </option>
            <option value="billing">
              Payment or billing
            </option>
            <option value="technical">
              Portal problem
            </option>
          </select>
        </label>

        <textarea
          required
          rows={6}
          value={body}
          onChange={(e) =>
            setBody(
              e.target.value
            )
          }
          placeholder="Describe what you need help with..."
          className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-[var(--theme-page)] px-4 py-3 text-sm text-white"
        />

        {sent && (
          <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-400">
            Your message has been sent to KhairoDietClinic.
          </div>
        )}

        <button
          disabled={
            sending ||
            !body.trim()
          }
          className="mt-4 h-11 rounded-full bg-[#0d9488] px-6 text-sm font-semibold text-white disabled:opacity-40"
        >
          {sending
            ? "Sending..."
            : "Send to KhairoDietClinic"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        Already have a conversation?{" "}
        <Link
          href="/portal/messages"
          className="font-medium text-[#0d9488]"
        >
          Open Messages
        </Link>
      </p>
    </div>
  );
}
