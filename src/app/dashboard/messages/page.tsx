"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../../../lib/api";

type ClientRef = {
  _id: string;
  fullName: string;
};

type CareMessage = {
  _id: string;
  client: ClientRef | null;
  senderType: "client" | "staff";
  senderName?: string;
  body: string;
  readByStaff?: boolean;
  createdAt: string;
};

type Conversation = {
  client: ClientRef;
  messages: CareMessage[];
  latestAt: number;
  unread: number;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<CareMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.get<{ messages?: CareMessage[] }>(
        "/client-experience-admin/messages"
      );
      setMessages(res.messages || []);
    } catch {
      setError("Could not load client messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const conversations = useMemo(() => {
    const map = new Map<string, Conversation>();

    for (const message of messages) {
      if (!message.client?._id) continue;

      const id = message.client._id;
      const existing = map.get(id);

      if (!existing) {
        map.set(id, {
          client: message.client,
          messages: [message],
          latestAt: new Date(message.createdAt).getTime(),
          unread:
            message.senderType === "client" && !message.readByStaff ? 1 : 0,
        });
      } else {
        existing.messages.push(message);
        existing.latestAt = Math.max(
          existing.latestAt,
          new Date(message.createdAt).getTime()
        );

        if (message.senderType === "client" && !message.readByStaff) {
          existing.unread += 1;
        }
      }
    }

    return [...map.values()]
      .map((item) => ({
        ...item,
        messages: [...item.messages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        ),
      }))
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [messages]);

  useEffect(() => {
    if (!selectedId && conversations.length) {
      setSelectedId(conversations[0].client._id);
    }
  }, [conversations, selectedId]);

  const selected =
    conversations.find((item) => item.client._id === selectedId) || null;

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();

    if (!selected || !reply.trim()) return;

    setSending(true);
    setError("");

    try {
      await api.post(
        `/client-experience-admin/messages/${selected.client._id}/reply`,
        {
          body: reply.trim(),
          category: "general",
        }
      );

      setReply("");
      await load();
    } catch {
      setError("Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-medium text-white">Messages</h1>
      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">
        Secure conversations with clients in your care.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="border-b border-[var(--theme-border)] px-4 py-3">
            <p className="text-sm font-medium text-white">
              Client conversations
            </p>
          </div>

          {loading ? (
            <p className="p-4 text-sm text-[var(--theme-text-secondary)]">Loading…</p>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare
                size={26}
                className="mx-auto text-[var(--theme-text-muted)]"
              />
              <p className="mt-3 text-sm text-[var(--theme-text-secondary)]">
                No client messages yet.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const latest =
                conversation.messages[conversation.messages.length - 1];

              return (
                <button
                  key={conversation.client._id}
                  onClick={() => setSelectedId(conversation.client._id)}
                  className={`w-full border-b border-[var(--theme-border)] px-4 py-3 text-left ${
                    selectedId === conversation.client._id
                      ? "bg-[var(--theme-surface-soft)]"
                      : "hover:bg-[var(--theme-surface-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-white">
                      {conversation.client.fullName}
                    </p>

                    {conversation.unread > 0 && (
                      <span className="rounded-full bg-[#0d9488] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs text-[var(--theme-text-secondary)]">
                    {latest?.body}
                  </p>
                </button>
              );
            })
          )}
        </section>

        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          {!selected ? (
            <div className="grid flex-1 place-items-center">
              <p className="text-sm text-[var(--theme-text-secondary)]">
                Select a conversation.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-[var(--theme-border)] px-5 py-4">
                <p className="font-medium text-white">
                  {selected.client.fullName}
                </p>
                <p className="text-xs text-[var(--theme-text-secondary)]">
                  Care-team conversation
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {selected.messages.map((message) => {
                  const clientMessage = message.senderType === "client";

                  return (
                    <div
                      key={message._id}
                      className={`flex ${
                        clientMessage ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 ${
                          clientMessage
                            ? "bg-[var(--theme-surface-soft)]"
                            : "bg-[#0d9488]/15"
                        }`}
                      >
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                          {clientMessage
                            ? selected.client.fullName
                            : message.senderName || "Khairo Diet Clinic Team"}
                          {" · "}
                          {new Date(message.createdAt).toLocaleString()}
                        </p>

                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[var(--theme-text)]">
                          {message.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={sendReply}
                className="border-t border-[var(--theme-border)] p-4"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={2}
                    maxLength={3000}
                    placeholder={`Message ${selected.client.fullName}…`}
                    className="flex-1 resize-none rounded-lg border border-[var(--theme-border)] bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0d9488]"
                  />

                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0d9488] text-white disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
