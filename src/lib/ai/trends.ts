import { NEWSAPI_KEY } from "@/lib/env";

interface TrendResult {
  headlines: string[];
  source: string;
}

/**
 * Fetch headlines from NewsAPI for a given keyword
 */
export async function fetchNewsAPITrends(keyword: string): Promise<TrendResult> {
  if (!NEWSAPI_KEY) {
    return { headlines: [], source: "newsapi" };
  }

  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(keyword)}&from=${twelveHoursAgo}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWSAPI_KEY}`,
      { next: { revalidate: 1800 } } // Cache for 30 min
    );

    if (!res.ok) return { headlines: [], source: "newsapi" };

    const data = await res.json();
    const headlines = (data.articles || [])
      .slice(0, 5)
      .map((a: { title: string; description?: string }) =>
        `${a.title}${a.description ? ` — ${a.description}` : ""}`
      );

    return { headlines, source: "newsapi" };
  } catch {
    return { headlines: [], source: "newsapi" };
  }
}

/**
 * Fetch answers from DuckDuckGo Instant Answer API
 */
export async function fetchDDGTrends(keyword: string): Promise<TrendResult> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(keyword)}&format=json&no_html=1`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return { headlines: [], source: "duckduckgo" };

    const data = await res.json();
    const headlines: string[] = [];

    if (data.Abstract) headlines.push(data.Abstract);
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 3).forEach((t: { Text?: string }) => {
        if (t.Text) headlines.push(t.Text);
      });
    }

    return { headlines, source: "duckduckgo" };
  } catch {
    return { headlines: [], source: "duckduckgo" };
  }
}

/**
 * Aggregate trend context from all sources
 */
export async function getTrendContext(keyword: string): Promise<string> {
  const [newsapi, ddg] = await Promise.all([
    fetchNewsAPITrends(keyword),
    fetchDDGTrends(keyword),
  ]);

  const allHeadlines = [...newsapi.headlines, ...ddg.headlines].filter(Boolean);

  if (allHeadlines.length === 0) {
    return `No recent trending data found for "${keyword}". Generate content based on general knowledge about this topic.`;
  }

  return allHeadlines
    .map((h, i) => `${i + 1}. ${h}`)
    .join("\n");
}
