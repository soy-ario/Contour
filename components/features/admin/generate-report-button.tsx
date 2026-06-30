"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { generateReportAction } from "@/lib/actions/report.actions";
import { toast } from "sonner";

interface GenerateReportButtonProps {
  clientId: string;
}

export default function GenerateReportButton({ clientId }: GenerateReportButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const now = new Date();
    // Generate report for the previous month by default
    let month = now.getMonth();
    let year = now.getFullYear();
    if (month === 0) {
      month = 12;
      year -= 1;
    }

    try {
      const result = await generateReportAction({
        clientId,
        month,
        year,
        includeAiSummary: true,
      });

      if (result.success) {
        toast.success(`Report for ${month}/${year} generated successfully!`);
      } else {
        toast.error(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("[generateReport]", error);
      toast.error("An error occurred during report generation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="h-11 px-5 bg-[#F2485A] rounded-[14px] text-white font-semibold flex items-center gap-2 hover:brightness-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      {loading ? "Generating..." : "Generate Report"}
    </button>
  );
}
