import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Unread messages in the user's *buyer* conversations only — matches what
// the Navbar's Messages link (/messages) actually shows. Seller-side unread
// counts are surfaced separately via the store dashboard's pending-count
// badge, so they're intentionally excluded here to avoid a badge that points
// to a page that doesn't show what it's counting.
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: { buyerId: userId },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
