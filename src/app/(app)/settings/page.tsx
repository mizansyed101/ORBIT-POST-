"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn, PLATFORM_LABELS } from "@/lib/utils";
import { User, Key, Bell, CheckCircle, AlertCircle, Loader2, ExternalLink, XCircle } from "lucide-react";
import type { Platform, Profile } from "@/lib/types";

const PLATFORMS: Platform[] = ["twitter", "linkedin", "instagram", "facebook", "threads"];

type ConnectionStatus = "connected" | "disconnected" | "loading";

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tab, setTab] = useState<"profile" | "integrations" | "notifications">("profile");
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});

  // Profile fields
  const [name, setName] = useState("");
  const [notifApprovals, setNotifApprovals] = useState(true);
  const [notifStatus, setNotifStatus] = useState(true);
  const [notifTrends, setNotifTrends] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) {
          setProfile(data);
          setName(data.name || "");
          setNotifApprovals(data.notification_approvals ?? true);
          setNotifStatus(data.notification_status ?? true);
          setNotifTrends(data.notification_trends ?? false);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

  // Fetch real connection statuses when integrations tab is selected
  const fetchConnectionStatuses = useCallback(async () => {
    // Set all to loading
    const loadingState: Record<string, ConnectionStatus> = {};
    PLATFORMS.forEach((p) => (loadingState[p] = "loading"));
    setConnectionStatuses(loadingState);

    try {
      const res = await fetch("/api/connect/status");
      if (res.ok) {
        const data = await res.json();
        const newStatuses: Record<string, ConnectionStatus> = {};
        PLATFORMS.forEach((p) => {
          newStatuses[p] = data.statuses?.[p] ? "connected" : "disconnected";
        });
        setConnectionStatuses(newStatuses);
      } else {
        // On error, set all to disconnected
        const errorState: Record<string, ConnectionStatus> = {};
        PLATFORMS.forEach((p) => (errorState[p] = "disconnected"));
        setConnectionStatuses(errorState);
      }
    } catch {
      const errorState: Record<string, ConnectionStatus> = {};
      PLATFORMS.forEach((p) => (errorState[p] = "disconnected"));
      setConnectionStatuses(errorState);
    }
  }, []);

  useEffect(() => {
    if (tab === "integrations") {
      fetchConnectionStatuses();
    }
  }, [tab, fetchConnectionStatuses]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setLoading(true);
    setSaveSuccess(false);
    await supabase
      .from("profiles")
      .update({ name })
      .eq("id", profile.id);
    setSaveSuccess(true);
    setLoading(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUpdateNotification = async (column: string, value: boolean) => {
    if (!profile) return;
    
    // Optimistic update
    if (column === "notification_approvals") setNotifApprovals(value);
    if (column === "notification_status") setNotifStatus(value);
    if (column === "notification_trends") setNotifTrends(value);

    try {
      await supabase
        .from("profiles")
        .update({ [column]: value })
        .eq("id", profile.id);
    } catch (error) {
      console.error("Failed to update notification setting:", error);
      // Revert on error
      if (column === "notification_approvals") setNotifApprovals(!value);
      if (column === "notification_status") setNotifStatus(!value);
      if (column === "notification_trends") setNotifTrends(!value);
    }
  };

  const handleConnectPlatform = async (platform: Platform) => {
    console.log(`[Connect] Initiating ${platform} connection...`);
    // Open a blank window synchronously to bypass pop-up blockers
    const authWindow = window.open("", "_blank", "width=600,height=700,menubar=no,toolbar=no");
    
    setConnectionStatuses((prev) => ({ ...prev, [platform]: "loading" }));
    try {
      console.log(`[Connect] Calling /api/connect/${platform}...`);
      const res = await fetch(`/api/connect/${platform}`, { method: "POST" });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[Connect] API Error (${res.status}):`, errorText);
        throw new Error(`Failed to initiate ${platform} connection: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(`[Connect] Result:`, JSON.stringify(data, null, 2));

      if (data.already_connected) {
        console.log(`[Connect] Already connected to ${platform}. Closing window.`);
        setConnectionStatuses((prev) => ({ ...prev, [platform]: "connected" }));
        if (authWindow) authWindow.close();
        return;
      }

      if (data.redirectUrl) {
        console.log(`[Connect] Setting auth window location: ${data.redirectUrl}`);
        // Set the actual OAuth URL into the opened window
        if (authWindow) {
          authWindow.location.href = data.redirectUrl;
        } else {
          console.warn(`[Connect] authWindow was blocked or null, using local fallback.`);
          window.location.href = data.redirectUrl;
          return;
        }

        // Poll for connection completion
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/connect/${platform}`);
            const statusData = await statusRes.json();
            if (statusData.connected) {
              console.log(`[Connect] ${platform} connection established via poll.`);
              clearInterval(pollInterval);
              setConnectionStatuses((prev) => ({ ...prev, [platform]: "connected" }));
              if (authWindow && !authWindow.closed) authWindow.close();
            }
          } catch (err) {
            console.error(`[Connect] Poll error for ${platform}:`, err);
          }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => {
          console.log(`[Connect] Polling timeout for ${platform}.`);
          clearInterval(pollInterval);
          setConnectionStatuses((prev) => ({
            ...prev,
            [platform]: prev[platform] === "loading" ? "disconnected" : prev[platform],
          }));
        }, 120000);
      } else {
        console.error(`[Connect] No redirectUrl returned for ${platform}.`);
        if (authWindow) authWindow.close();
        setConnectionStatuses((prev) => ({ ...prev, [platform]: "disconnected" }));
      }
    } catch (err) {
      console.error(`[Connect] Exception for ${platform}:`, err);
      if (authWindow) authWindow.close();
      setConnectionStatuses((prev) => ({ ...prev, [platform]: "disconnected" }));
    }
  };

  const handleDisconnectPlatform = async (platform: Platform) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${PLATFORM_LABELS[platform]}? You will need to re-authorize it to post again.`
      )
    ) {
      return;
    }

    setConnectionStatuses((prev) => ({ ...prev, [platform]: "loading" }));
    try {
      const res = await fetch(`/api/connect/${platform}`, { method: "DELETE" });
      if (res.ok) {
        setConnectionStatuses((prev) => ({ ...prev, [platform]: "disconnected" }));
      } else {
        const data = await res.json();
        console.error("Failed to disconnect:", data.error);
        fetchConnectionStatuses(); // Refresh to get correct state
      }
    } catch (error) {
      console.error("Disconnection error:", error);
      fetchConnectionStatuses();
    }
  };

  const tabs = [
    { key: "profile" as const, label: "Profile", icon: User },
    { key: "integrations" as const, label: "Integrations", icon: Key },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-cream font-[family-name:var(--font-playfair)]">
          Settings
        </h1>
        <p className="text-sm text-cream-muted mt-1">
          Manage your account, integrations, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-obsidian-raised border border-obsidian-border rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
              tab === t.key
                ? "bg-indigo text-white"
                : "text-cream-muted hover:text-cream hover:bg-obsidian-hover"
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <Card>
          <CardContent className="space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              icon={<User size={14} />}
            />
            <Input
              label="Email"
              value={profile?.email || ""}
              disabled
              hint="Email cannot be changed"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile} loading={loading}>
                Save Changes
              </Button>
              {saveSuccess && (
                <span className="text-sm text-mint flex items-center gap-1 animate-fade-in">
                  <CheckCircle size={14} />
                  Saved!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations tab */}
      {tab === "integrations" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-cream-muted uppercase tracking-wider">
                Platform Connections
              </span>
              <button
                onClick={fetchConnectionStatuses}
                className="text-xs text-cream-faint hover:text-cream transition-colors"
              >
                Refresh status
              </button>
            </div>
            {PLATFORMS.map((p) => {
              const status = connectionStatuses[p] || "disconnected";
              return (
                <Card key={p}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={p} size={20} className="text-cream" />
                      <span className="text-sm font-medium text-cream">
                        {PLATFORM_LABELS[p]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {status === "connected" && (
                        <span className="flex items-center gap-1.5 text-xs text-mint">
                          <CheckCircle size={12} />
                          Connected
                        </span>
                      )}
                      {status === "disconnected" && (
                        <span className="flex items-center gap-1.5 text-xs text-cream-faint">
                          <AlertCircle size={12} />
                          Not connected
                        </span>
                      )}
                      {status === "loading" && (
                        <Loader2 size={14} className="text-cream-faint animate-spin" />
                      )}
                      <Button
                        size="sm"
                        variant={status === "connected" ? "ghost" : "secondary"}
                        onClick={() => handleConnectPlatform(p)}
                        disabled={status === "loading"}
                      >
                        {status === "loading" ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ExternalLink size={12} />
                        )}
                        {status === "connected" ? "Reconnect" : "Connect"}
                      </Button>
                      
                      {status === "connected" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-peach hover:text-peach-hover hover:bg-peach/10"
                          onClick={() => handleDisconnectPlatform(p)}
                          // status is "connected" here, so it's not "loading"
                        >
                          <XCircle size={12} />
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-cream-faint leading-relaxed">
                Connections are managed through Composio. When you click &quot;Connect&quot;, you&apos;ll be
                redirected to authorize OrbitPost to post on your behalf. Your credentials are stored
                securely by Composio and never touch our servers.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-cream">Post Approvals</p>
                <p className="text-xs text-cream-muted">Get notified when posts need your review</p>
              </div>
              <ToggleSwitch 
                checked={notifApprovals} 
                onCheckedChange={(val) => handleUpdateNotification("notification_approvals", val)} 
              />
            </div>
            <div className="border-t border-obsidian-border" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-cream">Publishing Status</p>
                <p className="text-xs text-cream-muted">Updates on post publish success or failure</p>
              </div>
              <ToggleSwitch 
                checked={notifStatus} 
                onCheckedChange={(val) => handleUpdateNotification("notification_status", val)} 
              />
            </div>
            <div className="border-t border-obsidian-border" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-cream">Trend Alerts</p>
                <p className="text-xs text-cream-muted">Breaking trends in your niche</p>
              </div>
              <ToggleSwitch 
                checked={notifTrends} 
                onCheckedChange={(val) => handleUpdateNotification("notification_trends", val)} 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ToggleSwitch({ 
  checked, 
  onCheckedChange, 
  defaultChecked = false 
}: { 
  checked?: boolean; 
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean; 
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  const toggle = () => {
    const newValue = !isChecked;
    if (checked === undefined) {
      setInternalChecked(newValue);
    }
    onCheckedChange?.(newValue);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex w-12 h-6 rounded-full p-1 transition-colors duration-200",
        isChecked ? "bg-indigo" : "bg-obsidian-border"
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
          isChecked ? "translate-x-6" : "translate-x-0"
        )}
      />
    </button>
  );
}
