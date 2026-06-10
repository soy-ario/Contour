interface ReportData {
  period: string;
  client: string;
  metrics: {
    totalViews: number;
    totalReach: number;
    totalEngagement: number;
    totalFollowers: number;
    totalAdSpend: number;
  };
  platformStats: Record<
    string,
    { reach: number; engagement: number; posts: number }
  >;
  topContent: Array<{
    title: string;
    platform: string;
    reach: number;
    engagement: number;
    engagementRate: number;
  }>;
  topProducts: Array<{
    name: string;
    posts: number;
    reach: number;
  }>;
  contentCount: number;
}

export async function generateReportSummary(data: ReportData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  // If no valid API key, return a structured fallback summary
  if (!apiKey || apiKey.startsWith("dummy") || apiKey.startsWith("sk-dummy")) {
    return generateFallbackSummary(data);
  }

  try {
    const platformSummary = Object.entries(data.platformStats)
      .map(
        ([platform, stats]) =>
          `${platform}: ${stats.reach.toLocaleString()} reach, ${stats.engagement.toLocaleString()} engagement, ${stats.posts} posts`
      )
      .join("; ");

    const topContentSummary = data.topContent
      .slice(0, 3)
      .map((c) => `"${c.title}" (${c.platform}) — ${c.engagementRate.toFixed(2)}% ER`)
      .join(", ");

    const topProductSummary = data.topProducts
      .slice(0, 3)
      .map((p) => `${p.name} (${p.posts} posts, ${p.reach.toLocaleString()} reach)`)
      .join(", ");

    const prompt = `You are a professional digital marketing analyst. Write a concise executive summary (150–200 words) for a monthly marketing report.

Client: ${data.client}
Period: ${data.period}

Key Metrics:
- Total Views: ${data.metrics.totalViews.toLocaleString()}
- Total Reach: ${data.metrics.totalReach.toLocaleString()}
- Total Engagement: ${data.metrics.totalEngagement.toLocaleString()}
- Follower Growth: ${data.metrics.totalFollowers.toLocaleString()}
- Ad Spend: $${data.metrics.totalAdSpend.toLocaleString()}
- Content Published: ${data.contentCount}

Platform Highlights: ${platformSummary || "No platform data this period."}
Top Content: ${topContentSummary || "No content data this period."}
Top Products: ${topProductSummary || "No product data this period."}

Write a professional, data-driven executive summary. Highlight key wins, areas of growth, and any notable observations. Use a confident, professional tone.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      return generatedText.trim();
    }

    return generateFallbackSummary(data);
  } catch (error) {
    console.error("[generateReportSummary] Gemini API error:", error);
    return generateFallbackSummary(data);
  }
}

function generateFallbackSummary(data: ReportData): string {
  const topPlatform = Object.entries(data.platformStats).sort(
    (a, b) => b[1].reach - a[1].reach
  )[0];

  const engagementRate =
    data.metrics.totalReach > 0
      ? ((data.metrics.totalEngagement / data.metrics.totalReach) * 100).toFixed(1)
      : "0.0";

  return `During ${data.period}, ${data.client} published ${data.contentCount} pieces of content achieving a total reach of ${data.metrics.totalReach.toLocaleString()} and ${data.metrics.totalEngagement.toLocaleString()} total engagements, representing an overall engagement rate of ${engagementRate}%.${
    topPlatform
      ? ` ${topPlatform[0]} was the top-performing platform, contributing ${topPlatform[1].reach.toLocaleString()} in reach across ${topPlatform[1].posts} posts.`
      : ""
  }${
    data.topProducts.length > 0
      ? ` The top product this period was "${data.topProducts[0].name}", featured in ${data.topProducts[0].posts} content piece(s) with ${data.topProducts[0].reach.toLocaleString()} attributed reach.`
      : ""
  } Total follower growth stood at ${data.metrics.totalFollowers.toLocaleString()} and total ad spend was $${data.metrics.totalAdSpend.toLocaleString()}. The data indicates a consistent content cadence with opportunities to expand high-performing formats in the coming period.`;
}
