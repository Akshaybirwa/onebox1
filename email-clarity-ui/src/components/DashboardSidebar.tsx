import { cn } from "@/lib/utils";
import { Inbox, ThumbsUp, ThumbsDown, Calendar, Clock, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchStats, EmailStats } from "@/api/emails";
import { useQuery } from "@tanstack/react-query";

interface DashboardSidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  accountId?: string;
}

const categoryConfig = [
  { id: "inbox", label: "Inbox", icon: Inbox, statKey: "total" as keyof EmailStats },
  { id: "interested", label: "Interested", icon: ThumbsUp, statKey: "interested" as keyof EmailStats },
  { id: "not-interested", label: "Not Interested", icon: ThumbsDown, statKey: "notInterested" as keyof EmailStats },
  { id: "meetings", label: "Meetings", icon: Calendar, statKey: "meetings" as keyof EmailStats },
  { id: "out-of-office", label: "Out of Office", icon: Clock, statKey: "outOfOffice" as keyof EmailStats },
  { id: "spam", label: "Spam", icon: Trash2, statKey: "spam" as keyof EmailStats },
];

export function DashboardSidebar({ activeCategory, onCategoryChange, accountId }: DashboardSidebarProps) {
  // Fetch stats to get real counts
  const { data: stats, isLoading } = useQuery({
    queryKey: ["emailStats", accountId],
    queryFn: () => fetchStats(accountId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const categories = categoryConfig.map(cat => ({
    ...cat,
    count: stats ? (stats[cat.statKey] || 0) : 0,
  }));
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Email Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Lead Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{category.label}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center",
                isActive ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {isLoading ? "..." : category.count}
              </span>
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full justify-start gap-3">
          <Search className="h-5 w-5" />
          Advanced Search
        </Button>
      </div>
    </aside>
  );
}
