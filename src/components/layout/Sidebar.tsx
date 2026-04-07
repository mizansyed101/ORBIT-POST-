"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Settings,
  ChevronLeft,
  ChevronRight,
  Orbit,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-obsidian-raised border-r border-obsidian-border",
        "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        collapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-obsidian-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center shrink-0">
            <Orbit size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-cream tracking-tight whitespace-nowrap animate-fade-in">
              Orbit<span className="text-indigo">Post</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "transition-all duration-200 group",
                isActive
                  ? "bg-indigo/10 text-indigo"
                  : "text-cream-muted hover:text-cream hover:bg-obsidian-hover"
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  "group-hover:scale-110"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-3 border-t border-obsidian-border">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg",
            "text-cream-faint hover:text-cream hover:bg-obsidian-hover",
            "transition-all duration-200"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
