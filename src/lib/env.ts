// ── Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ── Groq
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Composio
export const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || "";

// ── Resend
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "orbit@orbitpost.app";

// ── NewsAPI
export const NEWSAPI_KEY = process.env.NEWSAPI_KEY || "";

// ── Cron
export const CRON_SECRET = process.env.CRON_SECRET || "";

// ── App
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
