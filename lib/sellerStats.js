import prisma from "@/lib/prisma";

const round2 = (n) => Math.round(n * 100) / 100;

async function computeWindowStats(storeId, since, until) {
  const [orders, ratings, totalProducts] = await Promise.all([
    prisma.order.findMany({
      where: { storeId, createdAt: { gte: since, lt: until } },
      include: { orderItems: { include: { product: true } } },
    }),
    prisma.rating.findMany({
      where: { product: { storeId }, createdAt: { gte: since, lt: until } },
    }),
    prisma.product.count({ where: { storeId } }),
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const ordersCount = orders.length;

  const revenueByProduct = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const key = item.productId;
      if (!revenueByProduct[key]) {
        revenueByProduct[key] = { name: item.product.name, revenue: 0, units: 0 };
      }
      revenueByProduct[key].revenue += item.price * item.quantity;
      revenueByProduct[key].units += item.quantity;
    });
  });

  const topProducts = Object.values(revenueByProduct)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({ ...p, revenue: round2(p.revenue) }));

  const avgRating = ratings.length
    ? round2(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length)
    : null;

  return {
    ordersCount,
    revenue: round2(revenue),
    avgOrderValue: ordersCount ? round2(revenue / ordersCount) : 0,
    totalProducts,
    topProducts,
    newRatingsCount: ratings.length,
    avgRating,
  };
}

// Returns this seller's current-week and prior-week stats so an AI summary
// can ground its "trend" call in an actual comparison instead of guessing.
export async function getSellerWeeklyStats(storeId) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    computeWindowStats(storeId, weekAgo, now),
    computeWindowStats(storeId, twoWeeksAgo, weekAgo),
  ]);

  return { windowDays: 7, current, previous };
}
