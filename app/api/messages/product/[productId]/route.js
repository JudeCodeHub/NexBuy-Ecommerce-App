import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Tells the product page's "Message Seller" button what state to show:
// no conversation yet, or an existing one (and its status) to link to.
export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { storeId: true, store: { select: { userId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const isOwnStore = product.store.userId === userId;

    const conversation = isOwnStore
      ? null
      : await prisma.conversation.findUnique({
          where: {
            productId_buyerId_storeId: {
              productId,
              buyerId: userId,
              storeId: product.storeId,
            },
          },
          select: { id: true, status: true },
        });

    return NextResponse.json({ isOwnStore, conversation });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
