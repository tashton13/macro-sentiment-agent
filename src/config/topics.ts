export interface TopicConfig {
  id: string;
  label: string;
  keywords: string[];
  color?: string;
  description?: string;
}

export const defaultTopics: TopicConfig[] = [
  {
    id: "inflation",
    label: "Inflation",
    keywords: ["inflation", "CPI", "PPI", "prices rising", "consumer prices", "cost of living"],
    color: "#ef4444",
    description: "Consumer price trends and inflation indicators"
  },
  {
    id: "rates",
    label: "Interest Rates",
    keywords: ["FOMC", "interest rates", "Fed", "Federal Reserve", "Treasury yields", "rate hike", "rate cut"],
    color: "#3b82f6",
    description: "Federal Reserve policy and interest rate movements"
  },
  {
    id: "employment",
    label: "Employment",
    keywords: ["unemployment", "jobs report", "payrolls", "labor market", "jobless claims", "hiring"],
    color: "#22c55e",
    description: "Labor market conditions and employment statistics"
  },
  {
    id: "housing",
    label: "Housing Market",
    keywords: ["housing market", "home prices", "real estate", "mortgage rates", "housing starts", "rent"],
    color: "#f59e0b",
    description: "Real estate trends and housing market indicators"
  },
  {
    id: "gdp",
    label: "Economic Growth",
    keywords: ["GDP", "economic growth", "recession", "expansion", "economic data", "growth rate"],
    color: "#8b5cf6",
    description: "Overall economic performance and growth metrics"
  },
  {
    id: "markets",
    label: "Financial Markets",
    keywords: ["stock market", "S&P 500", "Dow Jones", "NASDAQ", "market volatility", "bull market", "bear market"],
    color: "#06b6d4",
    description: "Stock market performance and financial market sentiment"
  },
  {
    id: "energy",
    label: "Energy",
    keywords: ["oil prices", "gas prices", "energy costs", "crude oil", "WTI", "Brent", "energy inflation"],
    color: "#dc2626",
    description: "Energy sector trends and commodity prices"
  },
  {
    id: "trade",
    label: "Trade & Supply Chain",
    keywords: ["trade war", "tariffs", "supply chain", "imports", "exports", "trade deficit", "global trade"],
    color: "#059669",
    description: "International trade and supply chain disruptions"
  }
];

// Storage key for user-defined topics
export const USER_TOPICS_STORAGE_KEY = 'macro-sentiment-user-topics';

// Get all topics (default + user-defined)
export function getAllTopics(): TopicConfig[] {
  try {
    const userTopicsJson = localStorage.getItem(USER_TOPICS_STORAGE_KEY);
    const userTopics: TopicConfig[] = userTopicsJson ? JSON.parse(userTopicsJson) as TopicConfig[] : [];
    return [...defaultTopics, ...userTopics];
  } catch (error) {
    console.error('Error loading user topics:', error);
    return defaultTopics;
  }
}

// Save user-defined topics
export function saveUserTopics(topics: TopicConfig[]): void {
  try {
    localStorage.setItem(USER_TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch (error) {
    console.error('Error saving user topics:', error);
  }
}

// Get only user-defined topics
export function getUserTopics(): TopicConfig[] {
  try {
    const userTopicsJson = localStorage.getItem(USER_TOPICS_STORAGE_KEY);
    return userTopicsJson ? JSON.parse(userTopicsJson) as TopicConfig[] : [];
  } catch (error) {
    console.error('Error loading user topics:', error);
    return [];
  }
} 