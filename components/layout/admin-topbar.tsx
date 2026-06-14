"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Bell, LogOut, Settings, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminTopbarProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  user: {
    name: string;
    email: string;
    username: string;
  };
}

export default function AdminTopbar({
  title,
  breadcrumbs = [],
  user,
}: AdminTopbarProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const showBreadcrumbs = breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].label !== title;

  return (
    <header className="h-16 border-b border-[#ECECF4] bg-white sticky top-0 z-20 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {showBreadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="hover:text-[#111827] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-[#111827] font-semibold" : "text-[#6B7280]"}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <span className="text-[#6B7280]/50">/</span>}
                </div>
              );
            })}
          </div>
        )}
        {title && (
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger
              render={
                <button className="relative text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F4FA] rounded-full w-9 h-9 flex items-center justify-center transition-colors" />
              }
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#C5F135] rounded-full flex items-center justify-center text-[7px] font-extrabold text-[#111827]">
                3
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 border-[#ECECF4] bg-white text-[#111827] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-0 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECECF4]">
                <span className="text-sm font-semibold text-[#111827]">Notifications</span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#F4F4FA] flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-4 h-4 text-[#6B7280]" />
                </div>
                <p className="text-sm font-medium text-[#111827]">No new notifications</p>
                <p className="text-xs text-[#6B7280] mt-0.5">You're all caught up!</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl hover:bg-[#F4F4FA] transition-colors" />
            }
          >
            <Avatar className="w-7 h-7 bg-[#C5F135] text-[#111827]">
              <AvatarFallback className="text-[10px] font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-[#111827] hidden sm:block">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 border-[#ECECF4] bg-white text-[#111827] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-[#111827] leading-none">{user.name}</p>
                  <p className="text-xs text-[#6B7280] leading-none truncate mt-0.5">{user.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#ECECF4]" />
            <DropdownMenuItem render={<Link href="/admin/settings?section=account" className="cursor-pointer" />}>
              <Settings className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#ECECF4]" />
            <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 focus:text-rose-400 focus:bg-rose-50 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
