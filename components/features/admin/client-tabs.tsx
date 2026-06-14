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
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

interface ClientTabsProps {
  clientId: string;
}

export default function ClientTabs({ clientId }: ClientTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: `/admin/clients/${clientId}/overview`, icon: LayoutDashboard },
    { label: "Analytics", href: `/admin/clients/${clientId}/analytics`, icon: BarChart3 },
    { label: "Content", href: `/admin/clients/${clientId}/content`, icon: FileVideo },
    { label: "Products", href: `/admin/clients/${clientId}/products`, icon: ShoppingBag },
    { label: "Reports", href: `/admin/clients/${clientId}/reports`, icon: FileText },
    { label: "Settings", href: `/admin/clients/${clientId}/settings`, icon: Settings },
  ];

  return (
    <div className="bg-white border-b border-[#ECECF4]">
      <div style={{ maxWidth: 1440 }} className="mx-auto">
        <div className="flex items-center justify-between px-8">
          {/* Left: Tabs */}
          <div className="flex">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                    isActive
                      ? "text-gray-900 border-b-2 border-[#C5F135] pb-[10px]"
                      : "text-gray-500 hover:text-gray-900 pb-3 border-b-2 border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-gray-900" : "text-gray-500")} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="bg-[#090D16] text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-900 transition-colors">
              Client Actions
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
