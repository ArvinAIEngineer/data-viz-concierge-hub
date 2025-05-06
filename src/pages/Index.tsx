
import { ArrowUp, Users, PackageSearch, FileText, UserCircle, Package, Truck, BarChart } from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    meta: {
      onError: (err: Error) => {
        console.error('Error fetching dashboard stats:', err);
        toast({
          title: "Error loading dashboard data",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    }
  });

  if (error) {
    console.error("Dashboard data error:", error);
  }

  // Default card data when API data is not available
  const cardData = [
    {
      title: "Customer Master",
      source: "Supabase",
      count: isLoading ? "..." : analytics?.totalCustomers || 0,
      trend: isLoading ? "..." : `${analytics?.growthRate ? Math.round(analytics.growthRate) : 0}%`,
      trendDirection: analytics?.growthRate && analytics.growthRate > 0 ? "up" : "down" as "up" | "down",
      newCount: isLoading ? "..." : analytics?.newCustomers || 0,
      icon: <Users className="text-blue-500" />
    },
    {
      title: "Vendor Master",
      source: "SAP",
      count: "1,253",
      trend: "+3%",
      newCount: "42",
      icon: <PackageSearch className="text-blue-500" />
    },
    {
      title: "Material/Item Master",
      source: "SAP",
      count: "12,489",
      trend: "+3%",
      newCount: "320",
      icon: <Package className="text-blue-500" />
    },
    {
      title: "Equipment Master",
      source: "SAP",
      count: "854",
      trend: "+2%",
      newCount: "26",
      icon: <Package className="text-blue-500" />
    },
    {
      title: "Tax Code Master",
      source: "SAP",
      count: "124",
      trend: "+5%",
      newCount: "6",
      icon: <FileText className="text-blue-500" />
    },
    {
      title: "Employee Master",
      source: "DarwinBox",
      count: "2,879",
      trend: "+5%",
      newCount: "135",
      icon: <UserCircle className="text-blue-500" />
    },
    {
      title: "Role/Designation Master",
      source: "DarwinBox",
      count: "168",
      trend: "+8%",
      newCount: "12",
      icon: <UserCircle className="text-blue-500" />
    },
    {
      title: "Planning Manager",
      source: "TOS",
      count: "47",
      trend: "+12%",
      newCount: "5",
      icon: <BarChart className="text-blue-500" />
    },
    {
      title: "Cargo Master",
      source: "TOS",
      count: "1,495",
      trend: "+4%",
      newCount: "63",
      icon: <Truck className="text-blue-500" />
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Master Data Dashboard</h1>
        <p className="text-gray-500">Overview of key master data trends across systems</p>
      </div>
      
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {cardData.map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            source={card.source}
            count={card.count}
            trend={card.trend}
            trendDirection={card.trendDirection}
            newCount={card.newCount}
            icon={card.icon}
            isLoading={index === 0 ? isLoading : false}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
