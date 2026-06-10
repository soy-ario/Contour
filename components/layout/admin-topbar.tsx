"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Bell, Search, LogOut, Settings, User } from "lucide-react";
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

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminTopbarProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  notificationCount?: number;
  user: {
    name: string;
    email: string;
    username: string;
  };
}

export default function AdminTopbar({
  title,
  breadcrumbs = [],
  notificationCount = 3,
  user,
}: AdminTopbarProps) {
  const router = useRouter();

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
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Title & Breadcrumbs */}
      <div className="flex flex-col">
        {breadcrumbs.length > 0 ? (
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium mb-0.5">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={idx} className="flex items-center space-x-1.5">
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors duration-200"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-muted-foreground/90 font-semibold" : ""}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <span className="text-muted-foreground/45">/</span>}
                </div>
              );
            })}
          </div>
        ) : null}
        {title && (
          <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Placeholder Search */}
        <div className="relative w-48 md:w-64 max-w-sm hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
          <input
            type="search"
            placeholder="Search dashboard..."
            className="w-full bg-secondary text-foreground text-xs rounded-md border border-input pl-9 pr-4 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-transparent transition-all"
            disabled
          />
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/80 hover:bg-secondary hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white animate-pulse">
                {notificationCount}
              </span>
            )}
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
            <Avatar className="w-8 h-8 border border-border bg-primary/10 text-primary">
              <AvatarFallback className="font-semibold text-xs">
                {getInitials(user.name || "Admin")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-border bg-popover text-popover-foreground">
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
