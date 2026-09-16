import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const as = searchParams.get("as") === "seller" ? "seller" : "buyer";

    let where;
    if (as === "seller") {
      const storeId = await authSeller(userId);
      if (!storeId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where = { storeId };
    } else {
      where = { buyerId: userId };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, images: true } },
        store: { select: { id: true, name: true, logo: true } },
        buyer: { select: { id: true, name: true, image: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { senderId: { not: userId }, readAt: null } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = conversations.map((c) => ({
      id: c.id,
      status: c.status,
      updatedAt: c.updatedAt,
      product: c.product,
      store: c.store,
      buyer: c.buyer,
      lastMessage: c.messages[0] || null,
      unreadCount: c._count.messages,
    }));

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
