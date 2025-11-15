import { Card, CardContent } from "@/components/ui/card";
import { Mail, ThumbsUp, ThumbsDown, Calendar, Clock } from "lucide-react";
import { fetchStats } from "@/api/emails";
import { useQuery } from "@tanstack/react-query";

interface StatsCardsProps {
  accountId?: string;
}

export function StatsCards({ accountId }: StatsCardsProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["emailStats", accountId],
    queryFn: () => fetchStats(accountId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const statsConfig = [
    {
      label: "Total Emails",
      value: stats?.total ?? 0,
      subtitle: "Last 30 days",
      icon: Mail,
      color: "text-primary",
    },
    {
      label: "Interested Leads",
      value: stats?.interested ?? 0,
      subtitle: "Positive responses",
      icon: ThumbsUp,
      color: "text-success",
    },
    {
      label: "Not Interested",
      value: stats?.notInterested ?? 0,
      subtitle: "Declined offers",
      icon: ThumbsDown,
      color: "text-destructive",
    },
    {
      label: "Meetings",
      value: stats?.meetings ?? 0,
      subtitle: "Scheduled calls",
      icon: Calendar,
      color: "text-info",
    },
    {
      label: "Out of Office",
      value: stats?.outOfOffice ?? 0,
      subtitle: "Auto-replies",
      icon: Clock,
      color: "text-warning",
    },
  ];

  if (error) {
    return (
      <div className="text-destructive text-sm p-4 bg-destructive/10 rounded mb-6">
        Error loading statistics: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "..." : stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
