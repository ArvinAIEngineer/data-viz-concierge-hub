
import { ArrowUp } from "lucide-react";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  source: string;
  count: string;
  trend: string;
  newCount: string;
  icon: ReactNode;
}

const DashboardCard = ({ title, source, count, trend, newCount, icon }: DashboardCardProps) => {
  return (
    <div className="data-card">
      <div className="data-card-header">
        <h3 className="data-card-title">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="data-card-source">{source}</span>
          <span className="text-gray-400">{icon}</span>
        </div>
      </div>
      <div>
        <div className="data-card-number">{count}</div>
        <div className="data-card-stats">
          <div className="data-card-trend positive">
            <ArrowUp size={14} />
            <span>{trend}</span>
          </div>
          <div className="data-card-total">Total</div>
        </div>
      </div>
      <div className="mt-4 data-card-new">
        {newCount} new last month
      </div>
    </div>
  );
};

export default DashboardCard;
