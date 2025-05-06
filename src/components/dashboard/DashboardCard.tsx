
import { ArrowUp, ArrowDown } from "lucide-react";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  source: string;
  count: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  newCount?: string | number;
  icon: ReactNode;
  isLoading?: boolean;
}

const DashboardCard = ({ 
  title, 
  source, 
  count, 
  trend, 
  trendDirection = "up", 
  newCount, 
  icon, 
  isLoading = false 
}: DashboardCardProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="data-card overflow-hidden">
      <CardHeader className="data-card-header pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="data-card-title text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="data-card-source text-xs text-gray-500">{source}</span>
            <span className="text-gray-400">{icon}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold data-card-number">{count}</div>
            {trend && (
              <div className="data-card-stats flex items-center gap-4 mt-1">
                <div className={`data-card-trend flex items-center gap-1 ${
                  trendDirection === "up" ? "text-green-500" : 
                  trendDirection === "down" ? "text-red-500" : "text-gray-500"
                }`}>
                  {trendDirection === "up" && <ArrowUp size={14} />}
                  {trendDirection === "down" && <ArrowDown size={14} />}
                  <span className="text-xs">{trend}</span>
                </div>
                <div className="data-card-total text-xs text-gray-500">vs. previous period</div>
              </div>
            )}
            {newCount !== undefined && (
              <div className="mt-4 text-xs text-gray-500 data-card-new">
                {newCount} new last month
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
