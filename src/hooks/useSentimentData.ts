import { useState, useEffect, useCallback } from 'react';
import { SentimentData } from '../types/sentiment';
import { getAllTopics } from '../config/topics';

interface UseSentimentDataResult {
  data: SentimentData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useSentimentData = (pollingInterval: number = 60000, refreshTrigger?: number): UseSentimentDataResult => {
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
  }, [fetchData, pollingInterval, refreshTrigger]);

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
  // Get all topics (default + user-defined) to create mock data for them
  const allTopics = getAllTopics();
  // Generate mock data for all topics (default + user-defined)
  const mockTopics = allTopics.map((topicConfig) => {
    // Generate some realistic mock sentiment data
    const sentiment = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
    const volume = Math.floor(Math.random() * 200) + 50; // 50-250 posts
    const positiveCount = Math.floor(volume * (sentiment > 0 ? 0.6 : 0.3));
    const negativeCount = Math.floor(volume * (sentiment < 0 ? 0.6 : 0.3));
    const neutralCount = volume - positiveCount - negativeCount;

    return {
      topicId: topicConfig.id,
      label: topicConfig.label,
      sentiment: Math.round(sentiment * 100) / 100,
      volume,
      positiveCount,
      negativeCount,
      neutralCount,
      topPosts: [
        {
          id: `mock_${topicConfig.id}_1`,
          text: `Sample post about ${topicConfig.label.toLowerCase()} showing ${sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral'} sentiment.`,
          author: "MockUser",
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
          sentiment: sentiment,
          source: Math.random() > 0.5 ? 'twitter' as const : 'reddit' as const,
          url: "https://example.com"
        }
      ],
      trend: [sentiment - 0.1, sentiment, sentiment + 0.05],
      lastUpdated: new Date().toISOString()
    };
  });

  return {
    timestamp: new Date().toISOString(),
    topics: mockTopics,
    totalPosts: mockTopics.reduce((sum, topic) => sum + topic.volume, 0),
    updateInterval: 5,
    dataSource: 'reddit'
  };
} 