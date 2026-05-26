export interface UserData {
  month: string;
  newUsers: number;
  totalUsers: number;
}

export interface SalesData {
  category: string;
  amount: number;
  percentage: number;
}

export interface VisitData {
  date: string;
  visits: number;
}

export interface MetricsSummary {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalVisits: number;
  conversionRate: number;
}
