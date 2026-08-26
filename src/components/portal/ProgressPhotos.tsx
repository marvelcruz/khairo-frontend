"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Camera,
  Trash2,
  Upload,
} from "lucide-react";

type Photo = {
  _id: string;
  uploadedAt: string;
  angle: string;
  note?: string;
};

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

function token() {
  return localStorage.getItem(
    "khairo_client_token"
  );
}

async function prepareImage(
  file: File
) {
  const bitmap =
    await createImageBitmap(file);

  const scale = Math.min(
    1,
    1600 /
      Math.max(
        bitmap.width,
        bitmap.height
      )
  );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    Math.round(
      bitmap.width * scale
    );

  canvas.height =
    Math.round(
      bitmap.height * scale
    );

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Could not prepare photo."
    );
  }

  context.drawImage(
    bitmap,
    0,
    0,
    canvas.width,
    canvas.height
  );

  bitmap.close();

  return new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(
                new Error(
                  "Could not prepare photo."
                )
              ),
        "image/jpeg",
        0.82
      );
    }
  );
}

export function ProgressPhotos() {
  const [photos, setPhotos] =
    useState<Photo[]>([]);

  const [urls, setUrls] =
    useState<
      Record<string, string>
    >({});

  const [file, setFile] =
    useState<File | null>(null);

  const [angle, setAngle] =
    useState("front");

  const [note, setNote] =
    useState("");

  const [consent, setConsent] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    compare,
    setCompare,
  ] = useState<string[]>([]);

  const [error, setError] =
    useState("");

  const clearUrls =
    useCallback(() => {
      setUrls((current) => {
        Object.values(
          current
        ).forEach(
          URL.revokeObjectURL
        );

        return {};
      });
    }, []);

  const load =
    useCallback(async () => {
      const auth = token();

      if (!auth) return;

      try {
        const response =
          await fetch(
            `${API}/client-portal/progress-photos`,
            {
              headers: {
                Authorization:
                  `Bearer ${auth}`,
              },
            }
          );

        const data =
          await response.json();

        const list: Photo[] =
          data.photos || [];

        setPhotos(list);

        clearUrls();

        const next: Record<
          string,
          string
        > = {};

        await Promise.all(
          list
            .slice(0, 12)
            .map(
              async (
                photo
              ) => {
                const image =
                  await fetch(
                    `${API}/client-portal/progress-photos/${photo._id}/image`,
                    {
                      headers: {
                        Authorization:
                          `Bearer ${auth}`,
                      },
                    }
                  );

                if (!image.ok) {
                  return;
                }

                const blob =
                  await image.blob();

                next[
                  photo._id
                ] =
                  URL.createObjectURL(
                    blob
                  );
              }
            )
        );

        setUrls(next);
      } catch {
      }
    }, [clearUrls]);

  useEffect(() => {
    void load();

    return () => {
      clearUrls();
    };
  }, [load, clearUrls]);

  const dueText =
    useMemo(() => {
      if (!photos.length) {
        return "Your first photo is due.";
      }

      const next =
        new Date(
          photos[0].uploadedAt
        );

      next.setDate(
        next.getDate() + 14
      );

      const days =
        Math.ceil(
          (next.getTime() -
            Date.now()) /
            86400000
        );

      return days <= 0
        ? "Your bi-weekly photo is due."
        : `Next photo due in ${days} day${
            days === 1
              ? ""
              : "s"
          }.`;
    }, [photos]);

  const submit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!file) return;

    if (!consent) {
      setError(
        "Please confirm the privacy acknowledgement."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const auth = token();

      if (!auth) {
        throw new Error(
          "Your session has expired."
        );
      }

      const blob =
        await prepareImage(file);

      const form =
        new FormData();

      form.append(
        "photo",
        blob,
        "progress-photo.jpg"
      );

      form.append(
        "angle",
        angle
      );

      form.append(
        "note",
        note
      );

      const response =
        await fetch(
          `${API}/client-portal/progress-photos`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${auth}`,
            },
            body: form,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not upload photo."
        );
      }

      setFile(null);
      setNote("");
      setConsent(false);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload photo."
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (
    id: string
  ) => {
    if (
      !window.confirm(
        "Delete this progress photo?"
      )
    ) {
      return;
    }

    const auth = token();

    await fetch(
      `${API}/client-portal/progress-photos/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization:
            `Bearer ${auth}`,
        },
      }
    );

    setCompare(
      (current) =>
        current.filter(
          (value) =>
            value !== id
        )
    );

    await load();
  };

  const toggleCompare = (
    id: string
  ) => {
    setCompare(
      (current) => {
        if (
          current.includes(id)
        ) {
          return current.filter(
            (value) =>
              value !== id
          );
        }

        if (
          current.length >= 2
        ) {
          return [
            current[1],
            id,
          ];
        }

        return [
          ...current,
          id,
        ];
      }
    );
  };

  const compared =
    compare
      .map((id) =>
        photos.find(
          (photo) =>
            photo._id === id
        )
      )
      .filter(
        Boolean
      ) as Photo[];

  return (
    <section
      id="progress-photos"
      className="scroll-mt-24 rounded-2xl border border-white/10 bg-[var(--theme-surface)] p-5 sm:p-6 lg:p-7"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-[#0d9488]">
            <Camera size={18} />

            <p className="text-xs font-semibold uppercase tracking-[0.14em]">
              Every 2 Weeks
            </p>
          </div>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Progress photos
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Use similar clothing, lighting and position each time to make your changes easier to see.
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#0d9488]/20 bg-[#0d9488]/10 px-3 py-2 text-xs font-semibold text-[#0d9488]">
          {dueText}
        </span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/8 bg-black/20 p-4"
        >
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/15 p-8 text-center transition hover:border-[#0d9488]/40">
            <Upload
              size={25}
              className="mx-auto text-[#0d9488]"
            />

            <p className="mt-3 text-sm font-semibold text-zinc-300">
              Choose a progress photo
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Camera or photo library
            </p>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) =>
                setFile(
                  e.target
                    .files?.[0] ||
                    null
                )
              }
            />
          </label>

          {file && (
            <p className="mt-2 truncate text-xs text-emerald-400">
              Selected:{" "}
              {file.name}
            </p>
          )}

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs text-zinc-500">
              Photo view
            </span>

            <select
              value={angle}
              onChange={(e) =>
                setAngle(
                  e.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 text-sm text-white"
            >
              <option value="front">
                Front
              </option>
              <option value="side">
                Side
              </option>
              <option value="back">
                Back
              </option>
              <option value="other">
                Other
              </option>
            </select>
          </label>

          <textarea
            rows={2}
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            placeholder="Optional note"
            className="mt-3 w-full rounded-xl border border-white/10 bg-[var(--theme-page)] px-3 py-3 text-sm text-white"
          />

          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-zinc-500">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) =>
                setConsent(
                  e.target.checked
                )
              }
              className="mt-0.5 accent-[#0d9488]"
            />

            This is a private progress photo stored in my KhairoDietClinic account.
          </label>

          {error && (
            <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            disabled={
              saving ||
              !file ||
              !consent
            }
            className="mt-4 h-11 w-full rounded-full bg-[#0d9488] text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving
              ? "Uploading..."
              : "Save photo"}
          </button>
        </form>

        <div>
          {compared.length ===
            2 && (
            <div className="mb-5">
              <p className="mb-3 font-semibold text-white">
                Compare progress
              </p>

              <div className="grid grid-cols-2 gap-3">
                {compared.map(
                  (photo) => (
                    <div
                      key={
                        photo._id
                      }
                      className="overflow-hidden rounded-2xl border border-[#0d9488]/20 bg-black"
                    >
                      <div
                        className="aspect-[3/4] bg-cover bg-center"
                        style={{
                          backgroundImage:
                            `url("${urls[photo._id]}")`,
                        }}
                      />

                      <div className="p-3 text-center">
                        <p className="text-xs font-medium capitalize text-zinc-300">
                          {
                            photo.angle
                          }{" "}
                          ·{" "}
                          {new Date(
                            photo.uploadedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-white">
              Photo timeline
            </p>

            {photos.length >=
              2 && (
              <p className="text-xs text-zinc-600">
                Select 2 to compare
              </p>
            )}
          </div>

          {!photos.length ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
              Your first progress photo will begin your visual timeline.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos
                .slice(0, 12)
                .map(
                  (photo) => (
                    <article
                      key={
                        photo._id
                      }
                      className={`overflow-hidden rounded-2xl border bg-black/20 ${
                        compare.includes(
                          photo._id
                        )
                          ? "border-[#0d9488]"
                          : "border-white/8"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleCompare(
                            photo._id
                          )
                        }
                        className="block w-full text-left"
                      >
                        <div
                          className="aspect-[3/4] bg-[var(--theme-page)] bg-cover bg-center"
                          style={{
                            backgroundImage:
                              urls[
                                photo
                                  ._id
                              ]
                                ? `url("${urls[photo._id]}")`
                                : undefined,
                          }}
                        />

                        <div className="p-3">
                          <p className="text-xs font-semibold capitalize text-zinc-300">
                            {
                              photo.angle
                            }{" "}
                            view
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-600">
                            {new Date(
                              photo.uploadedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void remove(
                            photo._id
                          )
                        }
                        className="mx-3 mb-3 inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-red-400"
                      >
                        <Trash2
                          size={12}
                        />
                        Delete
                      </button>
                    </article>
                  )
                )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
