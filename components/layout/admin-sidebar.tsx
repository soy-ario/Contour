"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Users,
  FileVideo,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    username: string;
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Clients", href: "/admin/clients", icon: Users },
    { label: "Content", href: "/admin/content", icon: FileVideo },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all group w-full text-left",
            expanded
              ? "px-4 h-10"
              : "justify-center w-9 h-9 rounded-full",
            "text-white/50 hover:text-white hover:bg-white/5"
          )}
          style={{ gap: expanded ? 12 : 0, transition: 'all 200ms, gap 300ms ease-in-out' }}
        >
          <LogOut className="w-4 h-4 shrink-0 text-white/40 group-hover:text-white/70 transition-transform group-hover:-translate-x-0.5 duration-200" />
          <span
            className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out"
            style={{ maxWidth: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
          >
            Sign Out
          </span>
        </button>

        {/* User Profile */}
        <div className={cn("border-t border-white/10", expanded ? "pt-2 mt-2" : "pt-3 mt-0 flex justify-center")}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={cn(
                    "flex items-center rounded-xl hover:bg-white/5 text-left transition-all group",
                    expanded
                      ? "p-2.5 w-full"
                      : "justify-center w-9 h-9 rounded-full"
                  )}
                  style={{ gap: expanded ? 10 : 0, transition: 'gap 300ms ease-in-out' }}
                />
              }
            >
              <div className="flex items-center overflow-hidden" style={{ gap: expanded ? 10 : 0, transition: 'gap 300ms ease-in-out' }}>
                <Avatar className="w-8 h-8 shrink-0 border border-white/10 bg-[#C5F135]/20 text-[#C5F135]">
                  <AvatarFallback className="font-semibold text-[10px]">
                    {getInitials(user.name || "Admin")}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxWidth: expanded ? 200 : 0, opacity: expanded ? 1 : 0 }}
                >
                  <span className="text-sm font-semibold truncate text-white whitespace-nowrap">
                    {user.name || "Admin"}
                  </span>
                  <span className="text-[11px] text-white/40 truncate whitespace-nowrap">
                    {user.email || user.username}
                  </span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 border-border bg-popover text-popover-foreground rounded-xl shadow-dropdown">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground leading-none truncate mt-0.5">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem render={<Link href="/admin/settings" className="cursor-pointer" />}>
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
