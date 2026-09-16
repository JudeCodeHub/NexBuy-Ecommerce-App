import prisma from "@/lib/prisma";

const round2 = (n) => Math.round(n * 100) / 100;

async function computeWindowStats(since, until) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since, lt: until } },
    include: { orderItems: { include: { product: true } }, store: true },
  });

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const ordersCount = orders.length;

  const revenueBySeller = {};
  const revenueByCategory = {};

  orders.forEach((order) => {
    const sellerKey = order.storeId;
    if (!revenueBySeller[sellerKey]) {
      revenueBySeller[sellerKey] = { name: order.store?.name || "Unknown", revenue: 0, orders: 0 };
    }
    revenueBySeller[sellerKey].revenue += order.total;
    revenueBySeller[sellerKey].orders += 1;

    order.orderItems.forEach((item) => {
      const category = item.product?.category || "Uncategorized";
      revenueByCategory[category] = (revenueByCategory[category] || 0) + item.price * item.quantity;
    });
  });

  const topSellers = Object.values(revenueBySeller)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((s) => ({ ...s, revenue: round2(s.revenue) }));

  const categoryBreakdown = Object.entries(revenueByCategory)
    .map(([category, rev]) => ({ category, revenue: round2(rev) }))
    .sort((a, b) => b.revenue - a.revenue);

  const worstPerformingCategory =
    categoryBreakdown.length > 0
      ? categoryBreakdown[categoryBreakdown.length - 1].category
      : null;

  return { ordersCount, revenue: round2(revenue), topSellers, categoryBreakdown, worstPerformingCategory };
}

// Returns current-week and prior-week platform stats so an AI digest can
// ground its "trend" call in an actual comparison instead of guessing.
export async function getPlatformWeeklyStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [current, previous, totalStores] = await Promise.all([
    computeWindowStats(weekAgo, now),
    computeWindowStats(twoWeeksAgo, weekAgo),
    prisma.store.count({ where: { status: "approved" } }),
  ]);

  return { windowDays: 7, totalStores, current, previous };
}
