import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { Mail, User, DollarSign, Calendar, Minus, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ClientStatus } from "@prisma/client";

interface ClientHeaderProps {
  client: {
    id: string;
    brandName: string;
    status: ClientStatus;
    logoUrl: string | null;
    healthScore: number | null;
    monthlyRetainer: number;
    contractStart: string | Date | null;
    contractEnd: string | Date | null;
    industry: string | null;
    contactName: string;
    contactEmail: string;
  };
}

export default function ClientHeader({ client }: ClientHeaderProps) {
  const initials = client.brandName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasContract = client.contractStart && client.contractEnd;

  return (
    <div className="bg-white border-b border-[#ECECF4]">
      <div className="mx-auto" style={{ maxWidth: 1440 }}>
        <div className="px-8 pt-6 pb-5">
          {/* Breadcrumbs */}
          <div className="text-xs font-medium text-gray-400 mb-4">
            <Link href="/admin/clients" className="hover:text-gray-600 transition-colors">Clients</Link>
            <ChevronRight className="w-3 h-3 inline mx-0.5 -mt-0.5" />
            <span>{client.brandName}</span>
          </div>

          {/* Main header row */}
          <div className="flex items-center justify-between">
            {/* Left: Avatar + Name + Status + Metadata */}
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="w-14 h-14 rounded-[16px] bg-[#EBF7C1] shrink-0">
                <AvatarFallback className="text-lg font-bold text-[#111827] bg-transparent">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {client.brandName}
                  </h1>
                  <div className="bg-[#ECFDF5] text-[#10B981] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#D1FAE5]">
                    {client.status === "ACTIVE" ? "Active" : client.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{client.contactEmail}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{client.contactName || client.industry}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Metric Capsules */}
            <div className="flex items-center gap-6 shrink-0">
              {/* Monthly Retainer */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-gray-900" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block leading-none">Monthly Retainer</span>
                  <span className="text-sm font-bold text-gray-900 leading-none mt-1 block">{formatCurrency(client.monthlyRetainer)}</span>
                </div>
              </div>

              {/* Contract Period */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block leading-none">Contract Period</span>
                  <span className="text-sm font-bold text-gray-900 leading-none mt-1 block whitespace-nowrap">
                    {hasContract ? "Active" : "No Active Contract"}
                  </span>
                </div>
              </div>

              {/* Health Status */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Minus className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase block leading-none">Health Status</span>
                  <span className="text-sm font-bold text-gray-900 leading-none mt-1 block">Portfolio Vitality</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
