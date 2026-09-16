"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Loading from "@/components/Loading";
import ConversationList from "@/components/messages/ConversationList";

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto px-6 xl:px-0 py-10">
      <h1 className="text-2xl text-muted mb-6">
        My <span className="text-white font-semibold">Messages</span>
      </h1>
      <ConversationList as="buyer" basePath="/messages" />
    </div>
  );
}
