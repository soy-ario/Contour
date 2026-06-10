"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Users,
  FileVideo,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: Users,
    },
    {
      label: "Content",
      href: "/admin/content",
      icon: FileVideo,
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
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
      className={cn(
        "h-screen sticky top-0 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col justify-between transition-all duration-300 z-30",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          {!sidebarCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
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
              <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Contour
              </span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              sidebarCollapsed && "mx-auto"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-md font-medium text-sm transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary-foreground font-semibold shadow-inner"
                    : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                  )}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
                
                {/* Collapsed Tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-14 invisible opacity-0 group-hover:visible group-hover:opacity-100 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md border border-border shadow-lg transition-all duration-200 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Settings */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group relative",
            pathname === "/admin/settings"
              ? "bg-sidebar-accent text-sidebar-primary-foreground font-semibold"
              : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Settings
            className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform group-hover:rotate-45 duration-300",
              pathname === "/admin/settings" ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
            )}
          />
          {!sidebarCollapsed && <span>Settings</span>}
          {sidebarCollapsed && (
            <div className="absolute left-14 invisible opacity-0 group-hover:visible group-hover:opacity-100 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md border border-border shadow-lg transition-all duration-200 whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </Link>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  "w-full flex items-center space-x-3 p-2 rounded-md hover:bg-sidebar-accent/50 text-left transition-all group",
                  sidebarCollapsed ? "justify-center" : "justify-between"
                )}
              />
            }
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <Avatar className="w-8 h-8 border border-sidebar-border bg-primary/10 text-primary">
                <AvatarFallback className="font-semibold text-xs">
                  {getInitials(user.name || "Admin")}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold truncate text-foreground">
                    {user.name || "Admin"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email || user.username}
                  </span>
                </div>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-popover text-popover-foreground">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem render={<Link href="/admin/settings" className="cursor-pointer" />}>
              <Settings className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-500 focus:text-red-400 focus:bg-red-950/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
