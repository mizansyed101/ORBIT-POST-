"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { PlatformPreview } from "@/components/dashboard/PlatformPreview";
import { formatDate, formatTime, PLATFORM_LIMITS } from "@/lib/utils";
import {
  Check,
  Edit3,
  RefreshCw,
  Trash2,
  Clock,
  Calendar,
  ExternalLink,
  Settings,
} from "lucide-react";
import { postViaExtension, getExtensionId, setExtensionId } from "@/lib/twitter-extension";
import type { Post, Platform, PostStatus } from "@/lib/types";

interface PostDrawerProps {
  post: Post | null;
  onClose: () => void;
  onUpdate: (postId: string, updates: Partial<Post>) => Promise<void>;
  onRefresh: () => void;
}

export function PostDrawer({ post, onClose, onUpdate, onRefresh }: PostDrawerProps) {
  const [editContent, setEditContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [extId, setExtId] = useState(getExtensionId());
  const [showExtConfig, setShowExtConfig] = useState(false);

  const openEdit = () => {
    if (post) {
      setEditContent(post.content);
      setEditing(true);
    }
  };

  const handleApprove = async () => {
    if (!post) return;
    setLoading("approve");
    await onUpdate(post.id, { status: "approved" as PostStatus });
    setLoading(null);
  };

  const handleEditApprove = async () => {
    if (!post) return;
    setLoading("edit-approve");
    await onUpdate(post.id, { content: editContent, status: "approved" as PostStatus });
    setEditing(false);
    setLoading(null);
  };

  const handleDelete = async () => {
    if (!post) return;
    setLoading("delete");
    await onUpdate(post.id, { status: "skipped" as PostStatus });
    setLoading(null);
    onClose();
  };

  const handleRegenerate = async () => {
    if (!post) return;
    setLoading("regenerate");
    try {
      const res = await fetch(`/api/posts/${post.id}/regenerate`, { method: "POST" });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      // handle error with toast
    }
    setLoading(null);
  };

  const handlePostViaExtension = async () => {
    if (!post) return;
    setLoading("post-ext");
    const result = await postViaExtension(post.content);
    if (result.success) {
      // Mark as posted in our database
      await onUpdate(post.id, { status: "posted" as PostStatus });
    } else {
      alert(result.error || "Posting via extension failed.");
    }
    setLoading(null);
  };

  const handleSaveExtId = () => {
    setExtensionId(extId);
    setShowExtConfig(false);
  };

  useEffect(() => {
    setExtId(getExtensionId());

    // Listen for auto-discovery
    const handleSync = () => setExtId(getExtensionId());
    window.addEventListener("orbitpost_extension_synced", handleSync);
    return () => window.removeEventListener("orbitpost_extension_synced", handleSync);
  }, []);

  if (!post) return null;

  const limit = PLATFORM_LIMITS[post.platform] || 280;
  const isEditable = post.status === "generated" || post.status === "pending_review";

  return (
    <Drawer open={!!post} onClose={() => { setEditing(false); onClose(); }} title="Post Details">
      <div className="px-6 py-5 space-y-6">
        {/* Post meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-obsidian-hover border border-obsidian-border flex items-center justify-center">
              <PlatformIcon platform={post.platform as Platform} size={20} className="text-cream" />
            </div>
            <div>
              <p className="text-sm font-medium text-cream capitalize">{post.platform}</p>
              <div className="flex items-center gap-2 text-xs text-cream-faint">
                <Calendar size={10} />
                {formatDate(post.scheduled_at)}
                <Clock size={10} />
                {formatTime(post.scheduled_at)}
              </div>
            </div>
          </div>
          <Badge status={post.status} size="md" />
        </div>

        {/* Content editor / viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cream-muted uppercase tracking-wider">
              Content
            </span>
            {(editing ? editContent : post.content) && (
              <CharacterCounter
                value={editing ? editContent : post.content}
                platform={post.platform as Platform}
              />
            )}
          </div>

          {editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-obsidian border border-obsidian-border rounded-lg px-4 py-3 text-sm text-cream placeholder:text-cream-faint resize-none focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/30 min-h-[150px] font-mono"
              maxLength={limit + 50} // Allow slight overflow to show red counter
            />
          ) : (
            <div className="bg-obsidian border border-obsidian-border rounded-lg px-4 py-3 text-sm text-cream whitespace-pre-wrap min-h-[100px] font-mono">
              {post.content}
            </div>
          )}
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  onClick={handleEditApprove}
                  loading={loading === "edit-approve"}
                  size="sm"
                >
                  <Check size={14} />
                  Save & Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleApprove} loading={loading === "approve"} size="sm">
                  <Check size={14} />
                  Approve
                </Button>
                <Button variant="secondary" size="sm" onClick={openEdit}>
                  <Edit3 size={14} />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRegenerate}
                  loading={loading === "regenerate"}
                >
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={loading === "delete"}
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Extension Actions for Twitter */}
        {post.platform === "twitter" && (
          <div className="space-y-3 p-4 rounded-xl bg-indigo/5 border border-indigo/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo uppercase tracking-wider flex items-center gap-2">
                <ExternalLink size={12} />
                Browser Automation
              </span>
              <button 
                onClick={() => setShowExtConfig(!showExtConfig)}
                className="text-cream-faint hover:text-cream transition-colors"
                title="Configure Extension ID"
              >
                <Settings size={14} />
              </button>
            </div>

            {showExtConfig || !extId ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-cream-faint leading-normal">
                    1. Open <a href="chrome://extensions" target="_blank" className="text-indigo hover:underline">chrome://extensions</a>
                    <br />
                    2. Enable <strong>Developer Mode</strong>
                    <br />
                    3. Copy the ID for <strong>OrbitPost X-Automator</strong>
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={extId}
                      onChange={(e) => setExtId(e.target.value)}
                      placeholder="Paste ID here (e.g. mbpnm...)"
                      className="flex-1 bg-obsidian border border-obsidian-border rounded-lg px-3 py-1.5 text-xs text-cream focus:outline-none focus:border-indigo/50"
                    />
                    <Button size="sm" onClick={handleSaveExtId}>Save</Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full" 
                onClick={handlePostViaExtension}
                loading={loading === "post-ext"}
              >
                Post to X (via Extension)
              </Button>
            )}
          </div>
        )}

        {/* Platform preview */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-cream-muted uppercase tracking-wider">
            Preview
          </span>
          <PlatformPreview
            platform={post.platform as Platform}
            content={editing ? editContent : post.content}
            authorName="You"
          />
        </div>
      </div>
    </Drawer>
  );
}
