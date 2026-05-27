export interface UserData {
  month: string;
  newUsers: number;
  totalUsers: number;
  is_weekend: boolean;
}

export interface SalesData {
  category: string;
  amount: number;
  percentage: number;
  is_weekend: boolean;
}

export interface VisitData {
  date: string;
  visits: number;
  is_weekend: boolean;
}

export interface MetricsSummary {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalVisits: number;
  conversionRate: number;
  weekendUsers: number;
  weekendSales: number;
  weekendVisits: number;
  weekendActiveUsers: number;
  weekendConversionRate: number;
  weekdayUsers: number;
  weekdaySales: number;
  weekdayVisits: number;
  weekdayActiveUsers: number;
  weekdayConversionRate: number;
}
