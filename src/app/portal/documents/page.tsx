"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  FileText,
} from "lucide-react";
import { api } from "../../../lib/api";

type SharedItem = {
  _id: string;
  kind:
    | "document"
    | "form";
  title: string;
  url?: string;
  status: string;
  createdAt: string;
};

type Receipt = {
  _id: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  paidAt?: string;
  createdAt: string;
};

type Summary = {
  program: string;
  startDate: string;
  cycleWeeks: number;
  status: string;
};

export default function DocumentsPage() {
  const [
    items,
    setItems,
  ] = useState<SharedItem[]>(
    []
  );

  const [
    receipts,
    setReceipts,
  ] = useState<Receipt[]>([]);

  const [
    summary,
    setSummary,
  ] = useState<Summary | null>(
    null
  );

  useEffect(() => {
    void (async () => {
      try {
        const response =
          await api.get<{
            items:
              SharedItem[];
            receipts:
              Receipt[];
            programSummary:
              Summary;
          }>(
            "/client-experience/documents",
            true
          );

        setItems(
          response.items || []
        );

        setReceipts(
          response.receipts ||
            []
        );

        setSummary(
          response.programSummary
        );
      } catch {
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0d9488]">
          Documents & Forms
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-white">
          Your KhairoDietClinic records
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Program details, documents, forms and payment receipts are kept together here.
        </p>
      </header>

      {summary && (
        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">
            Program summary
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-600">
                Program
              </p>

              <p className="mt-1 font-semibold capitalize text-white">
                {
                  summary.program
                }
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Start date
              </p>

              <p className="mt-1 font-semibold text-white">
                {new Date(
                  summary.startDate
                ).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Length
              </p>

              <p className="mt-1 font-semibold text-white">
                {
                  summary.cycleWeeks
                }{" "}
                weeks
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <FileText
            size={17}
            className="text-[#0d9488]"
          />

          <h2 className="font-semibold text-white">
            Shared documents & forms
          </h2>
        </div>

        {!items.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6">
            <p className="text-sm text-zinc-500">
              No documents or forms have been shared with you yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {items.map(
              (item) => (
                <div
                  key={
                    item._id
                  }
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {
                        item.title
                      }
                    </p>

                    <p className="mt-1 text-xs capitalize text-zinc-600">
                      {
                        item.kind
                      }{" "}
                      ·{" "}
                      {
                        item.status
                      }
                    </p>
                  </div>

                  {item.url && (
                    <a
                      href={
                        item.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0d9488]"
                    >
                      Open
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </section>

      {receipts.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6">
          <h2 className="font-semibold text-white">
            Receipt records
          </h2>

          <div className="mt-4 space-y-2">
            {receipts.map(
              (receipt) => (
                <div
                  key={
                    receipt._id
                  }
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-300">
                      {
                        receipt.receiptNumber
                      }
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(
                        receipt.paidAt ||
                          receipt.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="font-semibold text-white">
                    {
                      receipt.currency
                    }{" "}
                    {Number(
                      receipt.amount
                    ).toLocaleString()}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
