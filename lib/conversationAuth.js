import prisma from "@/lib/prisma";

// Loads a conversation and determines whether the requester is its buyer or
// its store's seller. Returns null if it doesn't exist or the requester
// isn't a participant, so route handlers can 404 either way (no leaking
// whether a conversation exists to a non-participant).
export async function getConversationForUser(conversationId, userId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      product: { select: { id: true, name: true, images: true } },
      store: { select: { id: true, name: true, logo: true, userId: true } },
      buyer: { select: { id: true, name: true, image: true } },
    },
  });

  if (!conversation) return null;

  if (conversation.buyerId === userId) {
    return { conversation, role: "buyer" };
  }
  if (conversation.store.userId === userId) {
    return { conversation, role: "seller" };
  }
  return null;
}
