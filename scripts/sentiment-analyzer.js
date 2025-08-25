import { SentimentAnalyzer, PorterStemmer } from 'natural';
import vader from 'vader-sentiment';

// Enhanced sentiment analyzer that combines rule-based and keyword approaches
export class MacroSentimentAnalyzer {
  constructor() {
    this.analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
    
    // Macro-economic specific sentiment words
    this.positiveKeywords = [
      'growth', 'expansion', 'recovery', 'improvement', 'optimistic', 'bullish',
      'gains', 'rise', 'increase', 'strong', 'robust', 'healthy', 'stable',
      'progress', 'boom', 'surge', 'rally', 'upward', 'positive', 'confidence'
    ];
    
    this.negativeKeywords = [
      'recession', 'decline', 'crash', 'collapse', 'crisis', 'downturn',
      'bearish', 'fall', 'drop', 'weak', 'unstable', 'volatile', 'concern',
      'worry', 'fear', 'panic', 'slump', 'plunge', 'negative', 'uncertainty'
    ];
  }

  // Analyze sentiment of a single text
  analyzeSentiment(text) {
    try {
      // Use VADER for primary analysis
      const vaderResult = vader.SentimentIntensityAnalyzer.polarity_scores(text);
      
      // Apply macro-economic context weighting
      const macroWeight = this.getMacroContextWeight(text.toLowerCase());
      
      // Combine VADER compound score with macro context
      let finalScore = vaderResult.compound;
      
      // Apply macro weighting (boost economic relevance)
      if (Math.abs(macroWeight) > 0.1) {
        finalScore = (finalScore * 0.7) + (macroWeight * 0.3);
      }
      
      // Ensure score stays within bounds
      finalScore = Math.max(-1, Math.min(1, finalScore));
      
      return {
        score: finalScore,
        compound: vaderResult.compound,
        positive: vaderResult.pos,
        negative: vaderResult.neg,
        neutral: vaderResult.neu
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        score: 0,
        compound: 0,
        positive: 0,
        negative: 0,
        neutral: 1
      };
    }
  }

  // Get macro-economic context weight for text
  getMacroContextWeight(text) {
    let weight = 0;
    let totalMatches = 0;

    // Count positive keywords
    this.positiveKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        weight += 0.2;
        totalMatches++;
      }
    });

    // Count negative keywords
    this.negativeKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        weight -= 0.2;
        totalMatches++;
      }
    });

    // Normalize by number of matches to prevent overwhelming
    if (totalMatches > 0) {
      weight = weight / Math.min(totalMatches, 3); // Cap at 3 matches for normalization
    }

    return Math.max(-1, Math.min(1, weight));
  }

  // Analyze array of posts and return aggregated results
  analyzeTopicSentiment(posts, topicId, label) {
    if (!posts || posts.length === 0) {
      return {
        topicId,
        label,
        sentiment: 0,
        volume: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        topPosts: [],
        trend: [0],
        lastUpdated: new Date().toISOString()
      };
    }

    const results = posts.map(post => {
      const sentiment = this.analyzeSentiment(post.text);
      return {
        ...post,
        sentiment: sentiment.score
      };
    });

    // Sort by sentiment and time to get top posts
    const sortedPosts = [...results].sort((a, b) => {
      return Math.abs(b.sentiment) - Math.abs(a.sentiment);
    });

    // Calculate aggregates
    const totalSentiment = results.reduce((sum, post) => sum + post.sentiment, 0);
    const averageSentiment = totalSentiment / results.length;

    const positiveCount = results.filter(p => p.sentiment > 0.1).length;
    const negativeCount = results.filter(p => p.sentiment < -0.1).length;
    const neutralCount = results.length - positiveCount - negativeCount;

    return {
      topicId,
      label,
      sentiment: Math.round(averageSentiment * 1000) / 1000, // Round to 3 decimal places
      volume: results.length,
      positiveCount,
      negativeCount,
      neutralCount,
      topPosts: sortedPosts.slice(0, 5), // Top 5 most extreme posts
      trend: [averageSentiment], // Will be extended with historical data
      lastUpdated: new Date().toISOString()
    };
  }
}

export default MacroSentimentAnalyzer; 