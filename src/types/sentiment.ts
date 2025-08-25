export interface SentimentPost {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  sentiment: number; // -1 to 1
  source: 'twitter' | 'reddit';
  url?: string;
}

export interface TopicSentiment {
  topicId: string;
  label: string;
  sentiment: number; // -1 to 1 average
  volume: number; // number of posts
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topPosts: SentimentPost[];
  trend: number[]; // last 24 hours of sentiment scores
  lastUpdated: string;
}

export interface SentimentData {
  timestamp: string;
  topics: TopicSentiment[];
  totalPosts: number;
  updateInterval: number; // minutes
  dataSource: 'twitter' | 'reddit' | 'mixed';
}

export interface SentimentAnalysisResult {
  score: number; // -1 to 1
  compound: number;
  positive: number;
  negative: number;
  neutral: number;
} 