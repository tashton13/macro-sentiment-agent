import { useState, useEffect, useCallback } from 'react';
import { SentimentData } from '../types/sentiment';

interface UseSentimentDataResult {
  data: SentimentData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useSentimentData = (pollingInterval: number = 60000): UseSentimentDataResult => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Try to fetch from the data endpoint
      const response = await fetch('/data/sentiment.json', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        // If no data file exists, create mock data for demo
        if (response.status === 404) {
          // Using mock data for demo
          const mockData = createMockData();
          setData(mockData);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const sentimentData: SentimentData = await response.json();
      
      // Check if data has actually changed
      const newTimestamp = new Date(sentimentData.timestamp);
      if (!lastUpdated || newTimestamp.getTime() !== lastUpdated.getTime()) {
        setData(sentimentData);
        setLastUpdated(newTimestamp);
        
        // Data updated successfully
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, [lastUpdated]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollingInterval]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

// Create mock data for demo purposes when no real data is available
function createMockData(): SentimentData {
  const mockTopics = [
    {
      topicId: "inflation",
      label: "Inflation",
      sentiment: 0.2,
      volume: 127,
      positiveCount: 45,
      negativeCount: 32,
      neutralCount: 50,
      topPosts: [
        {
          id: "mock_1",
          text: "CPI numbers looking better than expected this month, showing signs of cooling inflation trends.",
          author: "EconAnalyst",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          sentiment: 0.6,
          source: 'twitter' as const,
          url: "https://twitter.com/example"
        },
        {
          id: "mock_2",
          text: "Still concerned about persistent price pressures in housing and services sectors.",
          author: "MarketWatcher",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          sentiment: -0.3,
          source: 'reddit' as const,
          url: "https://reddit.com/r/economics/example"
        }
      ],
      trend: [0.1, 0.15, 0.2],
      lastUpdated: new Date().toISOString()
    },
    {
      topicId: "rates",
      label: "Interest Rates",
      sentiment: -0.4,
      volume: 89,
      positiveCount: 20,
      negativeCount: 45,
      neutralCount: 24,
      topPosts: [
        {
          id: "mock_3",
          text: "Fed signals more aggressive rate hikes may be needed to combat persistent inflation.",
          author: "FedWatcher",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          sentiment: -0.7,
          source: 'twitter' as const,
          url: "https://twitter.com/example"
        }
      ],
      trend: [-0.2, -0.3, -0.4],
      lastUpdated: new Date().toISOString()
    },
    {
      topicId: "employment",
      label: "Employment",
      sentiment: 0.6,
      volume: 156,
      positiveCount: 89,
      negativeCount: 23,
      neutralCount: 44,
      topPosts: [
        {
          id: "mock_4",
          text: "Job growth continues to exceed expectations with unemployment at historic lows.",
          author: "JobsReport",
          timestamp: new Date(Date.now() - 5400000).toISOString(),
          sentiment: 0.8,
          source: 'reddit' as const,
          url: "https://reddit.com/r/jobs/example"
        }
      ],
      trend: [0.4, 0.5, 0.6],
      lastUpdated: new Date().toISOString()
    },
    {
      topicId: "markets",
      label: "Financial Markets",
      sentiment: 0.1,
      volume: 203,
      positiveCount: 67,
      negativeCount: 58,
      neutralCount: 78,
      topPosts: [
        {
          id: "mock_5",
          text: "Markets showing mixed signals as investors weigh economic data against policy uncertainty.",
          author: "MarketAnalyst",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          sentiment: 0.1,
          source: 'twitter' as const,
          url: "https://twitter.com/example"
        }
      ],
      trend: [0.0, 0.05, 0.1],
      lastUpdated: new Date().toISOString()
    }
  ];

  return {
    timestamp: new Date().toISOString(),
    topics: mockTopics,
    totalPosts: mockTopics.reduce((sum, topic) => sum + topic.volume, 0),
    updateInterval: 5,
    dataSource: 'reddit'
  };
} 