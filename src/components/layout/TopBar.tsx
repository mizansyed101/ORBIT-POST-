"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelative } from "@/lib/utils";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import type { Notification, Profile } from "@/lib/types";

export function TopBar() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };

    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter((n: Notification) => !n.read).length);
        }
      }
    };

    fetchProfile();
    fetchNotifications();
  }, [supabase]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <header className="h-14 flex items-center justify-end gap-3 px-6 border-b border-obsidian-border bg-obsidian-raised/50 backdrop-blur-sm shrink-0">
      {/* Notification bell */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
          className="relative p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-obsidian-hover transition-all"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-12 w-80 bg-obsidian-raised border border-obsidian-border rounded-xl shadow-2xl shadow-black/40 z-50 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border">
              <span className="text-sm font-semibold text-cream">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo hover:text-indigo-hover transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-cream-faint">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-obsidian-border/50 hover:bg-obsidian-hover transition-colors",
                      !n.read && "bg-indigo/5"
                    )}
                  >
                    <p className="text-sm text-cream">{n.message}</p>
                    <p className="text-xs text-cream-faint mt-1">{formatRelative(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div ref={userMenuRef} className="relative">
        <button
          onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-obsidian-hover transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-indigo/20 flex items-center justify-center text-indigo text-xs font-bold">
            {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <ChevronDown size={14} className="text-cream-faint" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 top-12 w-52 bg-obsidian-raised border border-obsidian-border rounded-xl shadow-2xl shadow-black/40 z-50 animate-scale-in overflow-hidden">
            <div className="px-4 py-3 border-b border-obsidian-border">
              <p className="text-sm font-medium text-cream truncate">{profile?.name || "User"}</p>
              <p className="text-xs text-cream-faint truncate">{profile?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { router.push("/settings"); setShowUserMenu(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-cream-muted hover:text-cream hover:bg-obsidian-hover transition-colors"
              >
                <User size={14} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error/80 hover:text-error hover:bg-obsidian-hover transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
