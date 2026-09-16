import { inngest } from "./client";
import prisma from "@/lib/prisma";
import { askGemini } from "@/lib/gemini";
import { getSellerWeeklyStats } from "@/lib/sellerStats";
import { getPlatformWeeklyStats } from "@/lib/platformStats";

export const insightPrompt = (subject, stats) => `
You are a marketplace analyst. Given this ${subject}'s stats for the current week and the prior week, return ONLY valid JSON, no markdown, no extra text:
{
  "summary": string,
  "trend": "up" | "down" | "flat",
  "actions": string[]
}

Rules:
- Base "trend" on comparing current.revenue against previous.revenue (and ordersCount as a secondary signal). Use "flat" if the change is small (roughly within 5%).
- "summary" is 2-3 plain-English sentences about the week, referencing real numbers from the stats.
- "actions" is 1-3 short, specific suggested actions grounded in the stats (e.g. a specific low-performing area), not generic advice.
- If both weeks have zero activity, say so plainly rather than inventing a trend.

Stats (JSON): ${JSON.stringify(stats)}
`;

export const generateWeeklyInsights = inngest.createFunction(
  { id: "weekly-store-health" },
  { cron: "0 6 * * 1" }, // every Monday 6am
  async ({ step }) => {
    const sellers = await step.run("get-sellers", () =>
      prisma.store.findMany({ where: { status: "approved" } })
    );

    for (const seller of sellers) {
      await step.run(`insight-${seller.id}`, async () => {
        const stats = await getSellerWeeklyStats(seller.id);
        const insight = await askGemini({ prompt: insightPrompt("seller store", stats) });

        await prisma.aiInsight.create({
          data: { sellerId: seller.id, type: "store_health", content: insight },
        });
      });
    }

    await step.run("platform-digest", async () => {
      const platformStats = await getPlatformWeeklyStats();
      const digest = await askGemini({ prompt: insightPrompt("e-commerce platform", platformStats) });

      await prisma.aiInsight.create({
        data: { sellerId: null, type: "platform_digest", content: digest },
      });
    });
  }
);
