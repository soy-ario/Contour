"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { Bell, LogOut, FileVideo, LayoutDashboard, ShoppingBag, MessageSquare } from "lucide-react";
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

interface ClientTopbarProps {
  user: {
    name: string;
    email: string;
    username: string;
  };
}

export default function ClientTopbar({ user }: ClientTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: "Dashboard",
      href: "/client/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Content",
      href: "/client/content",
      icon: FileVideo,
    },
    {
      label: "Products",
      href: "/client/products",
      icon: ShoppingBag,
    },
    {
      label: "Requests",
      href: "/client/requests",
      icon: MessageSquare,
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
    <header className="h-16 border-b border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-8">
        <Link href="/client/dashboard" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-sidebar-bg"
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
          <span className="text-lg font-bold text-white tracking-tight">
            Contour
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5"
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5 rounded-full"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
            <Avatar className="w-8 h-8 border border-sidebar-border bg-primary/10 text-primary">
              <AvatarFallback className="font-semibold text-xs">
                {getInitials(user.name || "Client")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-popover text-popover-foreground rounded-xl shadow-dropdown">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                <p className="text-xs text-text-secondary leading-none truncate mt-0.5">{user.email}</p>
              </div>
            </DropdownMenuLabel>
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
    </header>
  );
}
