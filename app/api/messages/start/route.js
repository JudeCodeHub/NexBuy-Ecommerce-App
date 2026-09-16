import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, message } = await request.json();
    const body = message?.trim();

    if (!productId || !body) {
      return NextResponse.json(
        { error: "Missing productId or message" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product || product.store.status !== "approved") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.store.userId === userId) {
      return NextResponse.json(
        { error: "You can't message your own store" },
        { status: 400 }
      );
    }

    const existing = await prisma.conversation.findUnique({
      where: {
        productId_buyerId_storeId: {
          productId,
          buyerId: userId,
          storeId: product.storeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Conversation already exists", conversationId: existing.id },
        { status: 409 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        productId,
        buyerId: userId,
        storeId: product.storeId,
        status: "PENDING",
        messages: {
          create: { senderId: userId, body },
        },
      },
      include: { messages: true },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
