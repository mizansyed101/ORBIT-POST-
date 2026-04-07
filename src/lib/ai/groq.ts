import { GROQ_API_KEY, GROQ_MODEL } from "@/lib/env";
import { PLATFORM_LIMITS } from "@/lib/utils";
import type { Platform, GeneratedPost } from "@/lib/types";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Lightweight rate limiter
let lastCallTime = 0;
const MIN_INTERVAL_MS = 2100; // ~28 RPM to stay under 30 RPM limit

async function rateLimitedCall(messages: GroqMessage[]): Promise<string> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastCallTime = Date.now();

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 1.05, // Increased for higher variety
      frequency_penalty: 0.6, // Penalize repeating words
      presence_penalty: 0.6, // Penalize repeating topics
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export type PostArchetype =
  | "viral_hook"
  | "actionable_tip"
  | "thought_leader"
  | "community_question"
  | "benefit_lead"
  | "the_skeptic"
  | "practical_how_to"
  | "future_vision"
  | "hidden_gem"
  | "myth_buster"
  | "quick_win"
  | "personal_story";

const ARCHETYPE_PROMPTS: Record<PostArchetype, string> = {
  viral_hook: "Start with a high-impact 'Stop Scrolling' hook. Be bold and provocative.",
  actionable_tip: "Provide a specific, bite-sized actionable tip with immediate value.",
  thought_leader: "Adopt a visionary, slightly contrarian, professional tone. Focus on future implications.",
  community_question: "End with a thought-provoking, specific question addressed to the community.",
  benefit_lead: "Focus entirely on one transformative benefit with sensory language.",
  the_skeptic: "Challenge a common assumption or 'best practice'. Be critical but constructive.",
  practical_how_to: "Write a mini-tutorial or 3-step process. Very structured and clear.",
  future_vision: "Paint a vivid picture of how things will change in 5 years due to this trend/product.",
  hidden_gem: "Highlight an obscure but extremely powerful detail that most people miss.",
  myth_buster: "Identify one common misconception and debunk it with logic/data.",
  quick_win: "Focus on the smallest possible step someone can take right now to see results.",
  personal_story: "Frame the insight within a short, relatable anecdote or human experience.",
};

export async function generateTrendPost(
  platform: Platform,
  niche: string,
  trendContext: string,
  archetype: PostArchetype = "viral_hook",
  angle?: string
): Promise<GeneratedPost> {
  const limit = PLATFORM_LIMITS[platform] || 280;
  const hashtagInstruction = ["instagram", "threads", "twitter"].includes(platform)
    ? "Include 3-5 high-performing relevant hashtags at the end."
    : "Do NOT include hashtags.";

  const styleHint = ARCHETYPE_PROMPTS[archetype];
  const entropyToken = Math.random().toString(36).substring(7);

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: `You are a world-class social media strategist. Generate ONE exceptionally unique ${platform} post. 
      STRICT character limit: ${limit} characters. ${hashtagInstruction} 
      STYLE: ${styleHint}
      ${angle ? `SPECIFIC PERSPECTIVE: ${angle}` : ""}
      CRITICAL: Avoid robotic AI cliches ("Unlock potential", "Revolutionize", "In today's world"). Use sharp, human-like observations.
      Return ONLY the post text. No intro or outro.`,
    },
    {
      role: "user",
      content: `Context: ${trendContext}\n\nNiche: ${niche}\n\nSeed: ${entropyToken}\n\nWrite an authentic, high-impact post that feels totally different from any other post on this topic.`,
    },
  ];

  const content = await rateLimitedCall(messages);
  const trimmed = content.slice(0, limit);
  const hashtagMatch = trimmed.match(/#\w+/g);

  return {
    platform,
    content: trimmed,
    hashtags: hashtagMatch || [],
    characterCount: trimmed.length,
    limit,
  };
}

export async function generateProductPost(
  platform: Platform,
  productInfo: string,
  archetype: PostArchetype = "benefit_lead",
  angle?: string
): Promise<GeneratedPost> {
  const limit = PLATFORM_LIMITS[platform] || 280;
  const hashtagInstruction = ["instagram", "threads", "twitter"].includes(platform)
    ? "Include 3-5 high-performing relevant hashtags at the end."
    : "Do NOT include hashtags.";

  const styleHint = ARCHETYPE_PROMPTS[archetype];
  const entropyToken = Math.random().toString(36).substring(7);

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: `You are an elite marketing copywriter. Generate ONE high-conversion ${platform} post. 
      STRICT character limit: ${limit} characters. ${hashtagInstruction}
      STYLE: ${styleHint}
      ${angle ? `SPECIFIC PERSPECTIVE: ${angle}` : ""}
      CRITICAL: Avoid buzzwords ("Ultimate", "Game-changer", "Unlock"). Use punchy, active verbs.
      Return ONLY the post text. No intro or outro.`,
    },
    {
      role: "user",
      content: `Product: ${productInfo}\n\nSeed: ${entropyToken}\n\nWrite a 100% unique, human-sounding post that addresses a deep pain point or a specific "Aha!" moment.`,
    },
  ];

  const content = await rateLimitedCall(messages);
  const trimmed = content.slice(0, limit);
  const hashtagMatch = trimmed.match(/#\w+/g);

  return {
    platform,
    content: trimmed,
    hashtags: hashtagMatch || [],
    characterCount: trimmed.length,
    limit,
  };
}
