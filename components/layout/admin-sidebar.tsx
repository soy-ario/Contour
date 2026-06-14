"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileVideo,
  BarChart3,
  Settings,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    username: string;
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Clients", href: "/admin/clients", icon: Users },
    { label: "Content", href: "/admin/content", icon: FileVideo },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="h-screen sticky top-0 bg-[#0A1023] bg-[radial-gradient(ellipse_at_top,rgba(197,241,53,0.03)_0%,transparent_60%)] text-white flex flex-col justify-between transition-[width] duration-300 ease-in-out z-30"
      style={{ width: expanded ? 280 : 64 }}
    >
      <div className="pt-5" style={{ paddingLeft: expanded ? 20 : 8, paddingRight: expanded ? 20 : 8, transition: 'padding 300ms ease-in-out' }}>
        {/* Branding */}
        <div className={cn("flex items-center min-h-[56px] mb-6", expanded ? "justify-between" : "justify-center")}>
          <Link href="/admin/dashboard" className="flex items-center" style={{ gap: expanded ? 12 : 0, transition: 'gap 300ms ease-in-out' }}>
            <div className="w-10 h-10 rounded-xl bg-[#C5F135] flex items-center justify-center shrink-0 shadow-lg shadow-[#C5F135]/20">
              <svg
                className="w-5 h-5 text-[#0A1023]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
            </div>
            <div
              className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out"
              style={{ maxWidth: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
            >
              <h1 className="text-2xl font-semibold text-white leading-none tracking-tight">
                Contour
              </h1>
              <p className="text-[8px] font-medium text-white/30 tracking-[0.2em] uppercase mt-0.5">
                Agency Operations & Analytics
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn("space-y-0.5", !expanded && "flex flex-col items-center")}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl font-medium text-sm transition-all duration-200 group",
                  expanded
                    ? "px-4 h-11"
                    : "justify-center w-9 h-9 rounded-full",
                  isActive
                    ? "bg-[#C5F135] text-[#111827] font-semibold"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
                style={{ gap: expanded ? 12 : 0, transition: 'all 200ms, gap 300ms ease-in-out' }}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-[#111827]" : "text-white/40 group-hover:text-white/70"
                  )}
                />
                <span
                  className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out"
                  style={{ maxWidth: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div
        className={cn("border-t border-white/10 space-y-0.5 py-3", !expanded && "flex flex-col items-center")}
        style={{ paddingLeft: expanded ? 12 : 0, paddingRight: expanded ? 12 : 0, transition: 'padding 300ms ease-in-out' }}
      >
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all group",
            expanded
              ? "px-4 h-10"
              : "justify-center w-9 h-9 rounded-full",
            pathname === "/admin/settings"
              ? "bg-[#C5F135] text-[#111827] font-semibold"
              : "text-white/50 hover:text-white hover:bg-white/5"
          )}
          style={{ gap: expanded ? 12 : 0, transition: 'all 200ms, gap 300ms ease-in-out' }}
        >
          <Settings
            className={cn(
              "w-4 h-4 shrink-0 transition-transform group-hover:rotate-45 duration-300",
              pathname === "/admin/settings" ? "text-[#111827]" : "text-white/40 group-hover:text-white/70"
            )}
          />
          <span
            className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out"
            style={{ maxWidth: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
          >
            Settings
          </span>
        </Link>

      </div>
    </aside>
  );
}
