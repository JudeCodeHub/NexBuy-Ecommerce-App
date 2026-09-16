"use client";
import { useParams } from "next/navigation";
import ConversationThread from "@/components/messages/ConversationThread";

export default function StoreMessageThreadPage() {
  const { conversationId } = useParams();

  return (
    <div className="w-full mb-20 max-w-3xl">
      <ConversationThread conversationId={conversationId} basePath="/store/messages" />
    </div>
  );
}
