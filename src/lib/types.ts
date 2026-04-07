// ── Platform Types ──
export type Platform = "twitter" | "linkedin" | "instagram" | "facebook" | "threads";

// ── Campaign Types ──
export type CampaignType = "trend" | "product";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  type: CampaignType;
  input_text: string | null;
  url: string | null;
  platforms: Platform[];
  active: boolean;
  created_at: string;
  schedule?: Schedule;
  posts?: Post[];
}

// ── Schedule Types ──
export interface Schedule {
  id: string;
  campaign_id: string;
  times_per_day: number;
  time_slots: string[];
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

// ── Post Types ──
export type PostStatus =
  | "generated"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "posted"
  | "failed"
  | "skipped";

export interface Post {
  id: string;
  campaign_id: string;
  user_id: string;
  platform: Platform;
  content: string;
  hashtags: string[] | null;
  status: PostStatus;
  scheduled_at: string;
  posted_at: string | null;
  error_msg: string | null;
  created_at: string;
  campaign?: Campaign;
}

// ── Connected Account Types ──
export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  composio_account_id: string;
  account_name: string | null;
  connected_at: string;
}

// ── Notification Types ──
export type NotificationType =
  | "post_ready"
  | "post_published"
  | "post_skipped"
  | "post_failed"
  | "account_connected"
  | "campaign_created";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  metadata: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

// ── User Profile ──
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  notification_approvals: boolean;
  notification_status: boolean;
  notification_trends: boolean;
  created_at: string;
}

// ── API Response Types ──
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ── Campaign Creation Form ──
export interface CampaignFormData {
  name: string;
  type: CampaignType;
  input_text: string;
  url: string;
  platforms: Platform[];
  times_per_day: number;
  time_slots: string[];
  start_date: string;
  end_date: string;
}

// ── Generation Types ──
export interface TrendContext {
  headlines: string[];
  topics: string[];
  source: string;
  fetchedAt: string;
}

export interface GeneratedPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  characterCount: number;
  limit: number;
}
