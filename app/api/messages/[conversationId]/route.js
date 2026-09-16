import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getConversationForUser } from "@/lib/conversationAuth";

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const result = await getConversationForUser(conversationId, userId);
    if (!result) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { conversation, role } = result;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Mark the other party's messages as read now that this viewer opened it.
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        product: conversation.product,
        store: conversation.store,
        buyer: conversation.buyer,
        viewerRole: role,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
