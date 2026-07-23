"use client";

import { cn } from '@/lib/utils';

interface DashboardMetrics {
  coverage: {
    value: string;
    subtitle: string;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
      period: string;
    };
  };
  passRate: {
    value: string;
    subtitle: string;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
      period: string;
    };
  };
  bugsOpen: {
    value: number;
    subtitle: string;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
      period: string;
    };
  };
  statusDistribution: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

interface DashboardData {
  metrics: DashboardMetrics;
  trendData: Array<{
    x: number;
    y: number;
    label?: string;
    value?: string | number;
    color?: string;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  }>;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: DashboardData = {
          metrics: {
            coverage: {
              value: '66%',
              subtitle: 'of tasks have test cases',
              trend: { value: 5.2, direction: 'up', period: 'last week' },
            },
            passRate: {
              value: '96%',
              subtitle: 'execution success rate',
              trend: { value: 2.1, direction: 'up', period: 'last week' },
            },
            bugsOpen: {
              value: 5,
              subtitle: 'open bugs by severity',
              trend: { value: 3, direction: 'down', period: 'last week' },
            },
          },
          trendData: [
            { x: 0, y: 400, label: 'Mon', value: '320' },
            { x: 1, y: 350, label: 'Tue', value: '280' },
            { x: 2, y: 380, label: 'Wed', value: '320' },
            { x: 3, y: 420, label: 'Thu', value: '360' },
            { x: 4, y: 380, label: 'Fri', value: '320' },
            { x: 5, y: 440, label: 'Sat', value: '380' },
            { x: 6, y: 400, label: 'Sun', value: '320' },
          ],
          statusBreakdown: [
            { status: 'To Do', count: 12, change: 2, trend: 'up' },
            { status: 'In Progress', count: 1, change: 0, trend: 'neutral' },
            { status: 'Done', count: 76, change: 5, trend: 'up' },
          ],
        };
        
        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
