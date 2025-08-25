import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { MacroSentimentAnalyzer } from './sentiment-analyzer.js';

// Import topics configuration (for Node.js, we'll read from a JSON version)
const TOPICS_CONFIG_PATH = './src/config/topics.json';
const OUTPUT_PATH = './public/data/sentiment.json';
const HISTORICAL_PATH = './public/data/historical.json';

class SentimentDataIngester {
  constructor() {
    this.analyzer = new MacroSentimentAnalyzer();
    this.twitterApiKey = process.env.TWITTER_API_KEY;
    this.twitterApiSecret = process.env.TWITTER_API_SECRET;
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    // Reddit doesn't require API key for public JSON endpoints
    this.redditBaseUrl = 'https://www.reddit.com';
  }

  // Load topics configuration including user-defined topics
  async loadTopics() {
    try {
      let topics = [];
      
      // Load default topics
      if (fs.existsSync(TOPICS_CONFIG_PATH)) {
        const topicsData = fs.readFileSync(TOPICS_CONFIG_PATH, 'utf8');
        topics = JSON.parse(topicsData);
      } else {
        console.log('No topics.json found, using default topics');
        topics = this.getDefaultTopics();
      }
      
      // Load user-defined topics from localStorage simulation (file-based)
      const userTopicsPath = './public/data/user-topics.json';
      if (fs.existsSync(userTopicsPath)) {
        const userTopicsData = fs.readFileSync(userTopicsPath, 'utf8');
        const userTopics = JSON.parse(userTopicsData);
        topics = [...topics, ...userTopics];
        console.log(`Added ${userTopics.length} user-defined topics`);
      }
      
      console.log(`Loaded ${topics.length} topics total (including any custom topics)`);
      return topics;
    } catch (error) {
      console.error('Error loading topics:', error);
      console.log('Falling back to default topics');
      return this.getDefaultTopics();
    }
  }

  // Default topics fallback
  getDefaultTopics() {
    return [
      {
        id: "inflation",
        label: "Inflation",
        keywords: ["inflation", "CPI", "PPI", "prices rising", "consumer prices", "cost of living"]
      },
      {
        id: "rates",
        label: "Interest Rates",
        keywords: ["FOMC", "interest rates", "Fed", "Federal Reserve", "Treasury yields", "rate hike", "rate cut"]
      },
      {
        id: "employment",
        label: "Employment",
        keywords: ["unemployment", "jobs report", "payrolls", "labor market", "jobless claims", "hiring"]
      },
      {
        id: "markets",
        label: "Financial Markets",
        keywords: ["stock market", "S&P 500", "Dow Jones", "NASDAQ", "market volatility", "bull market", "bear market"]
      },
      {
        id: "housing",
        label: "Housing Market",
        keywords: ["housing market", "home prices", "real estate", "mortgage rates", "housing starts", "rent"]
      }
    ];
  }

  // Fetch data from Twitter API v2
  async fetchTwitterData(keywords, maxResults = 100) {
    if (!this.twitterBearerToken) {
      console.log('Twitter API not configured, skipping Twitter data...');
      return [];
    }

    try {
      const query = keywords.join(' OR ');
      const url = 'https://api.twitter.com/2/tweets/search/recent';
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.twitterBearerToken}`
        },
        params: {
          query: query,
          max_results: maxResults,
          'tweet.fields': 'created_at,author_id,public_metrics',
          'user.fields': 'username',
          expansions: 'author_id'
        }
      });

      const tweets = response.data.data || [];
      const users = response.data.includes?.users || [];
      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
      }, {});

      return tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        author: userMap[tweet.author_id] || 'unknown',
        timestamp: tweet.created_at,
        source: 'twitter',
        url: `https://twitter.com/i/status/${tweet.id}`
      }));
    } catch (error) {
      console.error('Error fetching Twitter data:', error.message);
      return [];
    }
  }

  // Fetch data from Reddit (public JSON API)
  async fetchRedditData(keywords, maxResults = 100) {
    try {
      const subreddits = ['economics', 'investing', 'stocks', 'personalfinance', 'financialindependence'];
      const allPosts = [];

      for (const subreddit of subreddits) {
        try {
          const url = `${this.redditBaseUrl}/r/${subreddit}/hot.json?limit=25`;
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'MacroSentimentBot/1.0'
            }
          });

          const posts = response.data.data.children || [];
          
          // Filter posts that match keywords
          const relevantPosts = posts.filter(post => {
            const title = post.data.title.toLowerCase();
            const text = (post.data.selftext || '').toLowerCase();
            const content = `${title} ${text}`;
            
            return keywords.some(keyword => 
              content.includes(keyword.toLowerCase())
            );
          });

          // Convert to our format
          const formattedPosts = relevantPosts.map(post => ({
            id: post.data.id,
            text: `${post.data.title} ${post.data.selftext || ''}`.trim(),
            author: post.data.author,
            timestamp: new Date(post.data.created_utc * 1000).toISOString(),
            source: 'reddit',
            url: `https://reddit.com${post.data.permalink}`
          }));

          allPosts.push(...formattedPosts);
        } catch (error) {
          console.error(`Error fetching from r/${subreddit}:`, error.message);
        }
      }

      return allPosts.slice(0, maxResults);
    } catch (error) {
      console.error('Error fetching Reddit data:', error.message);
      return [];
    }
  }

  // Fetch and analyze data for a specific topic
  async processTopicSentiment(topic) {
    console.log(`Processing topic: ${topic.label}`);
    
    // Fetch data from multiple sources
    const [twitterPosts, redditPosts] = await Promise.all([
      this.fetchTwitterData(topic.keywords, 50),
      this.fetchRedditData(topic.keywords, 50)
    ]);

    const allPosts = [...twitterPosts, ...redditPosts];
    
    console.log(`Found ${allPosts.length} posts for ${topic.label} (Twitter: ${twitterPosts.length}, Reddit: ${redditPosts.length})`);

    // Analyze sentiment
    const sentimentResult = this.analyzer.analyzeTopicSentiment(
      allPosts,
      topic.id,
      topic.label
    );

    return sentimentResult;
  }

  // Main ingestion process
  async ingestSentimentData() {
    try {
      console.log('Starting sentiment data ingestion...');
      
      // Load topics
      const topics = await this.loadTopics();
      console.log(`Processing ${topics.length} topics`);

      // Process all topics in parallel
      const topicResults = await Promise.all(
        topics.map(topic => this.processTopicSentiment(topic))
      );

      // Calculate totals
      const totalPosts = topicResults.reduce((sum, topic) => sum + topic.volume, 0);
      
      // Determine data source
      let dataSource = 'mixed';
      if (totalPosts === 0) {
        dataSource = 'none';
      } else if (!this.twitterBearerToken) {
        dataSource = 'reddit';
      }

      // Create final data structure
      const sentimentData = {
        timestamp: new Date().toISOString(),
        topics: topicResults,
        totalPosts,
        updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 5,
        dataSource
      };

      // Ensure output directory exists
      const outputDir = path.dirname(OUTPUT_PATH);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save current data
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sentimentData, null, 2));
      console.log(`Sentiment data saved to ${OUTPUT_PATH}`);

      // Update historical data
      await this.updateHistoricalData(sentimentData);

      console.log('Sentiment data ingestion completed successfully');
      return sentimentData;
    } catch (error) {
      console.error('Error in sentiment data ingestion:', error);
      throw error;
    }
  }

  // Update historical data for trends
  async updateHistoricalData(currentData) {
    try {
      let historicalData = [];
      
      // Load existing historical data
      if (fs.existsSync(HISTORICAL_PATH)) {
        const existingData = fs.readFileSync(HISTORICAL_PATH, 'utf8');
        historicalData = JSON.parse(existingData);
      }

      // Add current data point
      const dataPoint = {
        timestamp: currentData.timestamp,
        topics: currentData.topics.map(topic => ({
          topicId: topic.topicId,
          sentiment: topic.sentiment,
          volume: topic.volume
        }))
      };

      historicalData.push(dataPoint);

      // Keep only last 24 hours of data (assuming 5-minute intervals = 288 data points)
      const maxDataPoints = 288;
      if (historicalData.length > maxDataPoints) {
        historicalData = historicalData.slice(-maxDataPoints);
      }

      // Save updated historical data
      fs.writeFileSync(HISTORICAL_PATH, JSON.stringify(historicalData, null, 2));
      console.log('Historical data updated');
    } catch (error) {
      console.error('Error updating historical data:', error);
    }
  }
}

// Run ingestion if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const ingester = new SentimentDataIngester();
  ingester.ingestSentimentData()
    .then(() => {
      console.log('Ingestion completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Ingestion failed:', error);
      process.exit(1);
    });
}

export default SentimentDataIngester; 