"use client";
import ConversationList from "@/components/messages/ConversationList";

export default function StoreMessagesPage() {
  return (
    <div className="w-full mb-20">
      <h1 className="text-2xl text-muted mb-6">
        Store <span className="text-white font-semibold">Messages</span>
      </h1>
      <ConversationList as="seller" basePath="/store/messages" />
    </div>
  );
}
