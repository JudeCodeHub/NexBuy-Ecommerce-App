"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { MessageCircleIcon, UserIcon } from "lucide-react";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/messages/StatusBadge";

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function ConversationList({ as, basePath }) {
  const { getToken } = useAuth();
  const [conversations, setConversations] = useState(null);

  const fetchConversations = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/messages?as=${as}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(data.conversations);
    } catch (error) {
      // Non-critical refresh; keep whatever was last shown.
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    window.addEventListener("messages-updated", fetchConversations);
    return () => {
      clearInterval(interval);
      window.removeEventListener("messages-updated", fetchConversations);
    };
  }, [as]);

  if (conversations === null) return <Loading fullScreen={false} />;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="size-14 rounded-2xl bg-panel border border-white/10 flex items-center justify-center">
          <MessageCircleIcon size={24} className="text-muted" />
        </div>
        <h2 className="text-xl text-muted font-medium">No conversations yet</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((c) => {
        const counterpart = as === "buyer" ? c.store : c.buyer;
        const counterpartImage = as === "buyer" ? c.store.logo : c.buyer.image;
        return (
          <Link
            key={c.id}
            href={`${basePath}/${c.id}`}
            className="flex items-center gap-4 bg-panel border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-colors"
          >
            <div className="size-12 shrink-0 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {counterpartImage ? (
                <Image
                  src={counterpartImage}
                  alt={counterpart.name}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-100 truncate">{counterpart.name}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-muted truncate mt-0.5">Re: {c.product.name}</p>
              {c.lastMessage && (
                <p className="text-sm text-slate-400 truncate mt-1">{c.lastMessage.body}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <p className="text-xs text-slate-500">{timeAgo(c.updatedAt)}</p>
              {c.unreadCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-slate-900 text-[11px] font-bold flex items-center justify-center">
                  {c.unreadCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
