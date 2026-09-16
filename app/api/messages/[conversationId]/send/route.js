import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getConversationForUser } from "@/lib/conversationAuth";

export async function POST(request, { params }) {
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

    const { conversation } = result;

    if (conversation.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This conversation isn't active yet" },
        { status: 400 }
      );
    }

    const { body: text } = await request.json();
    const body = text?.trim();
    if (!body) {
      return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({ data: { conversationId, senderId: userId, body } }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
