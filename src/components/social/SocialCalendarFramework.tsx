"use client";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type Post = {
  _id: string;
  provider: string;
  title?: string;
  caption: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
};

export default function SocialCalendarFramework({
  posts,
}: {
  posts: Post[];
}) {
  const scheduled =
    posts
      .filter(
        (post) =>
          post.status === "scheduled" ||
          Boolean(post.scheduledFor)
      )
      .sort((a, b) => {
        const left =
          new Date(
            a.scheduledFor || 0
          ).getTime();

        const right =
          new Date(
            b.scheduledFor || 0
          ).getTime();

        return left - right;
      });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
        <div className="flex items-center gap-2">
          <CalendarClock
            size={19}
            className="text-[#0d9488]"
          />

          <h2 className="font-semibold text-[var(--theme-text)]">
            Publishing calendar
          </h2>
        </div>

        <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">
          This calendar is the common
          scheduling layer for every
          connected social platform.
        </p>
      </section>

      {!scheduled.length ? (
        <section className="rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] p-8 text-center">
          <Clock3
            size={28}
            className="mx-auto text-[var(--theme-text-muted)]"
          />

          <h3 className="mt-3 font-semibold text-[var(--theme-text)]">
            No posts scheduled
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-secondary)]">
            Scheduled posts will appear
            here once the publishing
            scheduler is activated.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {scheduled.map((post) => (
            <section
              key={post._id}
              className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--theme-text)]">
                    {post.title ||
                      post.caption.slice(
                        0,
                        60
                      )}
                  </p>

                  <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                    {post.provider}
                  </p>
                </div>

                <CheckCircle2
                  size={17}
                  className="text-[#0d9488]"
                />
              </div>

              {post.scheduledFor && (
                <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">
                  {new Date(
                    post.scheduledFor
                  ).toLocaleString()}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
