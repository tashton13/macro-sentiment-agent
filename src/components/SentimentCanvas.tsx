import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SentimentBubble } from './SentimentBubble';
import { TopicSentiment } from '../types/sentiment';

interface SentimentCanvasProps {
  topics: TopicSentiment[];
  onBubbleClick: (topic: TopicSentiment) => void;
  selectedTopicId?: string;
}

export const SentimentCanvas: React.FC<SentimentCanvasProps> = ({
  topics,
  onBubbleClick,
  selectedTopicId
}) => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('sentiment-canvas');
      if (container) {
        setCanvasSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate maximum volume for bubble sizing
  const maxVolume = useMemo(() => {
    return Math.max(...topics.map(t => t.volume), 1);
  }, [topics]);

  // Generate stable bubble positions using grid-based layout with smart spacing
  const bubblePositions = useMemo(() => {
    if (topics.length === 0) return {};

    const positions: { [key: string]: { x: number; y: number } } = {};
    const bubbleSizes: { [key: string]: number } = {};
    
    // Calculate bubble sizes first
    topics.forEach(topic => {
      const minSize = 40;
      const maxSize = 140;
      const size = Math.max(minSize, Math.min(maxSize, (topic.volume / maxVolume) * maxSize));
      bubbleSizes[topic.topicId] = size;
    });

    // Sort topics by size for better arrangement
    const sortedTopics = [...topics].sort((a, b) => bubbleSizes[b.topicId] - bubbleSizes[a.topicId]);

    // Calculate grid dimensions based on canvas size and number of topics
    const cols = Math.ceil(Math.sqrt(topics.length));
    const rows = Math.ceil(topics.length / cols);
    
    const padding = 30;
    const cellWidth = (canvasSize.width - padding * 2) / cols;
    const cellHeight = (canvasSize.height - padding * 2) / rows;

    sortedTopics.forEach((topic, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const size = bubbleSizes[topic.topicId];
      
      // Base position in grid
      const baseX = padding + col * cellWidth + cellWidth / 2;
      const baseY = padding + row * cellHeight + cellHeight / 2;
      
      // Add deterministic positioning based on topic ID for consistency
      const seedX = parseInt(topic.topicId.slice(-2), 36) / 1000;
      const seedY = parseInt(topic.topicId.slice(-4, -2), 36) / 1000;
      const jitterX = (seedX - 0.5) * cellWidth * 0.15;
      const jitterY = (seedY - 0.5) * cellHeight * 0.15;
      
      // Ensure bubbles stay within bounds
      const margin = size / 2 + 10;
      const x = Math.max(margin, Math.min(canvasSize.width - margin, baseX + jitterX));
      const y = Math.max(margin, Math.min(canvasSize.height - margin, baseY + jitterY));
      
      positions[topic.topicId] = { x, y };
    });

    return positions;
  }, [topics, canvasSize, maxVolume]);

  return (
    <div 
      id="sentiment-canvas"
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200"
      style={{ minHeight: '500px' }}
    >
      {/* Subtle texture pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0,0,0,0.8) 0.5px, transparent 0.5px),
            radial-gradient(circle at 75% 75%, rgba(0,0,0,0.4) 0.5px, transparent 0.5px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Sentiment bubbles */}
      <AnimatePresence mode="wait">
        {topics.map(topic => (
          <SentimentBubble
            key={topic.topicId}
            data={topic}
            onClick={() => onBubbleClick(topic)}
            isSelected={selectedTopicId === topic.topicId}
            position={bubblePositions[topic.topicId] || { x: 0, y: 0 }}
            maxVolume={maxVolume}
          />
        ))}
      </AnimatePresence>

      {/* Loading state */}
      {topics.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading sentiment data...</p>
          </motion.div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1 text-xs text-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-800 mr-2"></div>
            <span>Positive sentiment</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
            <span>Negative sentiment</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300 mr-2"></div>
            <span>Neutral sentiment</span>
          </div>
          <div className="text-gray-500 mt-1">
            Bubble size = post volume
          </div>
        </div>
      </div>

      {/* Last updated indicator */}
      {topics.length > 0 && topics[0].lastUpdated && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            Last updated: {new Date(topics[0].lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}; 