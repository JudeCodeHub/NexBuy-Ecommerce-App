"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Loading from "@/components/Loading";
import ConversationThread from "@/components/messages/ConversationThread";

export default function MessageThreadPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { conversationId } = useParams();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto px-6 xl:px-0 py-10">
      <ConversationThread conversationId={conversationId} basePath="/messages" />
    </div>
  );
}
