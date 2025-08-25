import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TopicSentiment } from '../types/sentiment';

interface TopicDetailDrawerProps {
  topic: TopicSentiment | null;
  onClose: () => void;
  historicalData?: Array<{ timestamp: string; sentiment: number; volume: number }>;
}

export const TopicDetailDrawer: React.FC<TopicDetailDrawerProps> = ({
  topic,
  onClose,
  historicalData = []
}) => {
  if (!topic) return null;

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.1) return 'text-green-600';
    if (sentiment < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentBgColor = (sentiment: number): string => {
    if (sentiment > 0.1) return 'bg-green-100';
    if (sentiment < -0.1) return 'bg-red-100';
    return 'bg-gray-100';
  };

  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment > 0.3) return 'Very Positive';
    if (sentiment > 0.1) return 'Positive';
    if (sentiment < -0.3) return 'Very Negative';
    if (sentiment < -0.1) return 'Negative';
    return 'Neutral';
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Prepare chart data
  const chartData = historicalData.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    sentiment: point.sentiment,
    volume: point.volume
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-white shadow-2xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 ${getSentimentBgColor(topic.sentiment)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{topic.label}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Sentiment overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getSentimentColor(topic.sentiment)}`}>
                  {(topic.sentiment > 0 ? '+' : '') + (topic.sentiment * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {getSentimentLabel(topic.sentiment)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {topic.volume}
                </div>
                <div className="text-sm text-gray-600">
                  Total Posts
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment breakdown */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Sentiment Breakdown
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-green-600">Positive</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(topic.positiveCount / topic.volume) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {topic.positiveCount}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Neutral</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full"
                      style={{ width: `${(topic.neutralCount / topic.volume) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {topic.neutralCount}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-red-600">Negative</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(topic.negativeCount / topic.volume) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {topic.negativeCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend chart */}
          {chartData.length > 1 && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingDown className="mr-2" size={20} />
                Sentiment Trend
              </h3>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[-1, 1]}
                      tick={{ fontSize: 10 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke={topic.sentiment > 0 ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top posts */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="mr-2" size={20} />
              Top Posts ({topic.topPosts.length})
            </h3>
            
            <div className="space-y-4">
              {topic.topPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        @{post.author}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(post.timestamp)}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getSentimentBgColor(post.sentiment)} ${getSentimentColor(post.sentiment)}`}>
                      {(post.sentiment > 0 ? '+' : '') + (post.sentiment * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-800 mb-2 line-clamp-3">
                    {post.text}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${post.source === 'twitter' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                      {post.source === 'twitter' ? 'Twitter' : 'Reddit'}
                    </span>
                    
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        View original
                      </a>
                    )}
                  </div>
                </div>
              ))}
              
              {topic.topPosts.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No posts available for this topic
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              Last updated: {formatTimestamp(topic.lastUpdated)}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 