import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";
import { askGemini } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brand, title, description, category, currentPrice, currency } =
      await request.json();

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Missing product details" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert e-commerce copywriter and pricing analyst for a multi-vendor marketplace called NexBuy.

A seller has entered a product listing. Improve it while staying accurate to what they entered — do not invent features, materials, or specs they didn't mention.

Return ONLY valid JSON in this exact shape, no markdown, no extra text:
{
  "title": string,              // punchy, SEO-friendly, under 70 characters, includes brand if provided
  "description": string,        // 2-4 sentences, benefit-focused, natural tone, no emojis, no fluff words like "amazing" or "premium quality" unless justified by input
  "tags": string[],             // 4-6 lowercase, single or two-word search-relevant keywords
  "suggestedPriceRange": {
    "min": number,
    "max": number
  },
  "priceReasoning": string      // one short sentence explaining the suggested range
}

Seller input:
Brand: ${brand || "N/A"}
Product name: ${title}
Description: ${description}
Category: ${category}
Current price: ${currentPrice || 0}
Currency: ${currency || "USD"}

Rules:
- If brand is empty, omit it from the title naturally rather than leaving a placeholder.
- If current price is missing or 0, base suggestedPriceRange purely on category norms and note that in priceReasoning.
- Keep the description honest — do not exaggerate quality claims beyond what's stated.
- Tags should reflect what a buyer would actually search for, not generic marketing words.
`;

    const result = await askGemini({ prompt });

    // Gemini doesn't always respect the length/count limits stated in the
    // prompt, so enforce the contract server-side before it reaches the UI.
    if (typeof result.title === "string" && result.title.length > 70) {
      result.title = result.title.slice(0, 70).trim();
    }
    if (Array.isArray(result.tags)) {
      result.tags = result.tags.slice(0, 6);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error improving listing:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
