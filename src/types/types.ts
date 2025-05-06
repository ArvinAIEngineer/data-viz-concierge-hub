
export interface Customer {
  id: number;
  name: string;
  phone_number: string;
  email_address: string;
  company: string;
  gst_number: string;
  pan_number: string;
  address: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export interface DataCard {
  title: string;
  source: string;
  count: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  newCount?: string | number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  growthRate: number;
  companyCounts: Record<string, number>;
  monthlyGrowth: {
    month: string;
    count: number;
  }[];
}
