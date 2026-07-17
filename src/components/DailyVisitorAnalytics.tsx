import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { fetchTodayVisitorStats } from "@/lib/visitorAnalytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DailyVisitorAnalyticsProps {
  className?: string;
}

export default function DailyVisitorAnalytics({
  className,
}: DailyVisitorAnalyticsProps) {
  const visitorStats = useQuery({
    queryKey: ["daily-visitor-stats", "today"],
    queryFn: fetchTodayVisitorStats,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const values = [
    ["Total Visitors", visitorStats.data?.totalUniqueVisitors ?? "..."],
    ["Logged-In Visitors", visitorStats.data?.loggedInUniqueVisitors ?? "..."],
    [
      "Returning Logged-In Visitors",
      visitorStats.data?.returningLoggedInVisitors ?? "...",
    ],
    ["Estimated Visitors", visitorStats.data?.estimatedUniqueVisitors ?? "..."],
    ["Difference", visitorStats.data?.difference ?? "..."],
    [
      "Error Percentage",
      visitorStats.data ? `${visitorStats.data.errorPercentage}%` : "...",
    ],
  ];

  return (
    <section className={cn("border-y border-white/10 bg-black/30 py-6", className)}>
      <div className="flex flex-col gap-3 px-6 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-primary">Daily Visitor Counter</p>
          <h2 className="mt-1 text-2xl font-black uppercase text-white">Website Audience</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-white/50">
            {visitorStats.data?.date || "Loading today's analytics"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => visitorStats.refetch()}
            disabled={visitorStats.isFetching}
            title="Refresh visitor statistics"
            aria-label="Refresh visitor statistics"
          >
            <RefreshCw
              className={cn("h-4 w-4", visitorStats.isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {visitorStats.isError ? (
        <p className="border-t border-white/10 px-6 pt-6 text-sm text-destructive">
          Visitor analytics is unavailable. The website remains available.
        </p>
      ) : (
        <div className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-3">
          {values.map(([label, value], index) => (
            <div
              key={label}
              className={cn(
                "min-h-28 border-white/10 px-6 py-5 lg:border-l lg:[&:nth-child(3n+1)]:border-l-0",
                index % 2 === 1 && "border-l",
              )}
            >
              <p className="text-xs font-bold uppercase text-white/40">{label}</p>
              <p className="mt-3 text-3xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
