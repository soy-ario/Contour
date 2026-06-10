"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  FileVideo,
  ShoppingBag,
  FileText,
  Settings,
} from "lucide-react";

interface ClientTabsProps {
  clientId: string;
}

export default function ClientTabs({ clientId }: ClientTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview",
      href: `/admin/clients/${clientId}/overview`,
      icon: LayoutDashboard,
    },
    {
      label: "Analytics",
      href: `/admin/clients/${clientId}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Content",
      href: `/admin/clients/${clientId}/content`,
      icon: FileVideo,
    },
    {
      label: "Products",
      href: `/admin/clients/${clientId}/products`,
      icon: ShoppingBag,
    },
    {
      label: "Reports",
      href: `/admin/clients/${clientId}/reports`,
      icon: FileText,
    },
    {
      label: "Settings",
      href: `/admin/clients/${clientId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="bg-zinc-950/10 border-b border-border/60 px-8">
      <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto scrollbar-none py-1.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                isActive
                  ? "bg-zinc-900 text-primary border border-border/40 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-zinc-900/40"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
