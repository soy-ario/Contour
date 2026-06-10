import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/shared/status-badge";
import HealthScoreRing from "@/components/shared/health-score-ring";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, DollarSign, Briefcase } from "lucide-react";
import { ClientStatus } from "@prisma/client";

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
  };
}

export default function ClientHeader({ client }: ClientHeaderProps) {
  const initials = client.brandName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const start = client.contractStart;
  const end = client.contractEnd;

  return (
    <div className="bg-zinc-950/20 border-b border-border/80 px-8 py-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Side: Brand Logo, Name, Industry, Status */}
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16 border-2 border-border/80 bg-zinc-900 text-zinc-100 text-lg font-bold shadow-md">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent leading-none">
                {client.brandName}
              </h1>
              <StatusBadge status={client.status} size="md" />
            </div>
            {client.industry && (
              <div className="flex items-center text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 mr-1" />
                {client.industry}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Financial, Contract, Health Ring */}
        <div className="flex flex-wrap items-center gap-6 md:gap-8">
          {/* Monthly Retainer */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-border/40 flex items-center justify-center text-primary shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Monthly Retainer
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(client.monthlyRetainer)}
              </span>
            </div>
          </div>

          {/* Contract Period */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-border/40 flex items-center justify-center text-zinc-400 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Contract Period
              </span>
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                {start ? (
                  <>
                    {formatDate(start, "MMM yyyy")}
                    {end && ` - ${formatDate(end, "MMM yyyy")}`}
                  </>
                ) : (
                  "No Active Contract"
                )}
              </span>
            </div>
          </div>

          {/* Health Score Ring */}
          <div className="flex items-center space-x-3 border-l border-border/60 pl-6 shrink-0">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Health Status
              </span>
              <span className="text-xs font-bold text-foreground/90 mt-0.5">
                Portfolio Vitality
              </span>
            </div>
            <HealthScoreRing score={client.healthScore} size={56} strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
