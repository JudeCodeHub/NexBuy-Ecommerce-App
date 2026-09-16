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

    const { conversation, role } = result;

    if (role !== "seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (conversation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been responded to" },
        { status: 400 }
      );
    }

    const { action } = await request.json();
    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: action === "accept" ? "ACTIVE" : "DECLINED" },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("Error responding to conversation:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
