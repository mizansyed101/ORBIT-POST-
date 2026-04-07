import * as cheerio from "cheerio";

export interface ScrapedProduct {
  title: string;
  description: string;
  features: string[];
  url: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedProduct> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "OrbitPost/1.0 (Content Generation Bot)",
      },
    });

    if (!res.ok) {
      return {
        title: "",
        description: `Could not fetch URL: ${res.status}`,
        features: [],
        url,
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      $("h1").first().text().trim();

    // Extract description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $("p").first().text().trim().slice(0, 300);

    // Extract features from lists and headings
    const features: string[] = [];

    // Try to find feature lists
    $("ul li, ol li").each((_i, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 200 && features.length < 8) {
        features.push(text);
      }
    });

    // If no list items, try h2/h3 headings
    if (features.length === 0) {
      $("h2, h3").each((_i, el) => {
        const text = $(el).text().trim();
        if (text.length > 3 && text.length < 100 && features.length < 6) {
          features.push(text);
        }
      });
    }

    return { title, description, features, url };
  } catch (error) {
    return {
      title: "",
      description: `Failed to scrape URL: ${error instanceof Error ? error.message : "unknown error"}`,
      features: [],
      url,
    };
  }
}

export function formatProductInfo(product: ScrapedProduct): string {
  let info = `Product: ${product.title}\n`;
  info += `URL: ${product.url}\n`;
  info += `Description: ${product.description}\n`;
  if (product.features.length > 0) {
    info += `Key Features:\n${product.features.map((f) => `- ${f}`).join("\n")}`;
  }
  return info;
}
