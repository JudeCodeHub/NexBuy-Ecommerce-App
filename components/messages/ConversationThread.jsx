"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  CheckCheckIcon,
  CheckIcon,
  ClockIcon,
  SendIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/messages/StatusBadge";

const formatTime = (date) =>
  new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// Lets the Navbar unread badge and the seller sidebar's pending-count badge
// refresh immediately instead of waiting for their own polling interval.
const notifyMessagesUpdated = () => window.dispatchEvent(new Event("messages-updated"));

export default function ConversationThread({ conversationId, basePath }) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [data, setData] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const bottomRef = useRef(null);
  const hasMarkedReadRef = useRef(false);

  const fetchThread = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(data);
      // Opening the thread marks the other party's messages read server-side;
      // reflect that in the badges right away instead of waiting on their polls.
      if (!hasMarkedReadRef.current) {
        hasMarkedReadRef.current = true;
        notifyMessagesUpdated();
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  useEffect(() => {
    fetchThread();
    const interval = setInterval(fetchThread, 4000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const token = await getToken();
      await axios.post(
        `/api/messages/${conversationId}/send`,
        { body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDraft("");
      fetchThread();
      notifyMessagesUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (action) => {
    setResponding(true);
    try {
      const token = await getToken();
      await axios.post(
        `/api/messages/${conversationId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchThread();
      notifyMessagesUpdated();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setResponding(false);
    }
  };

  if (!data) return <Loading fullScreen={false} />;

  const { conversation, messages } = data;
  const counterpart = conversation.viewerRole === "buyer" ? conversation.store : conversation.buyer;
  const counterpartImage =
    conversation.viewerRole === "buyer" ? conversation.store.logo : conversation.buyer.image;

  const lastMineIndex = [...messages].map((m) => m.senderId).lastIndexOf(user?.id);

  return (
    <div className="flex flex-col h-[75vh] bg-panel border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
        <Link
          href={basePath}
          className="size-9 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        <div className="size-10 shrink-0 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
          {counterpartImage ? (
            <Image
              src={counterpartImage}
              alt={counterpart.name}
              width={40}
              height={40}
              className="size-full object-cover"
            />
          ) : (
            <UserIcon size={18} className="text-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-100 truncate">{counterpart.name}</p>
          <Link
            href={`/product/${conversation.product.id}`}
            className="text-xs text-muted hover:text-accent truncate block transition-colors"
          >
            Re: {conversation.product.name}
          </Link>
        </div>
        <StatusBadge status={conversation.status} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  mine
                    ? "bg-accent text-slate-900 rounded-br-md"
                    : "bg-white/5 text-slate-100 rounded-bl-md"
                }`}
              >
                {m.body}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <p className="text-[11px] text-slate-500">{formatTime(m.createdAt)}</p>
                {mine && i === lastMineIndex && (
                  m.readAt ? (
                    <CheckCheckIcon size={12} className="text-accent" />
                  ) : (
                    <CheckIcon size={12} className="text-slate-500" />
                  )
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Footer: composer / pending actions / declined notice */}
      <div className="shrink-0 border-t border-white/10 p-4">
        {conversation.status === "ACTIVE" && (
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 max-h-32 resize-none bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 py-2.5 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="size-10 shrink-0 flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 transition-colors"
            >
              <SendIcon size={17} />
            </button>
          </form>
        )}

        {conversation.status === "PENDING" && conversation.viewerRole === "seller" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Accept this request to start replying.</p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleRespond("decline")}
                disabled={responding}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 text-sm font-medium transition-colors"
              >
                <XIcon size={15} /> Decline
              </button>
              <button
                onClick={() => handleRespond("accept")}
                disabled={responding}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-slate-900 text-sm font-bold transition-colors"
              >
                <CheckIcon size={15} /> Accept
              </button>
            </div>
          </div>
        )}

        {conversation.status === "PENDING" && conversation.viewerRole === "buyer" && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <ClockIcon size={15} /> Waiting for the seller to respond...
          </p>
        )}

        {conversation.status === "DECLINED" && (
          <p className="flex items-center gap-2 text-sm text-red-400">
            <XIcon size={15} /> This request was declined.
          </p>
        )}
      </div>
    </div>
  );
}
