import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SentimentBubble } from './SentimentBubble';
import { TopicSentiment } from '../types/sentiment';

interface BubblePhysics {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
}



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
  const [bubblePhysics, setBubblePhysics] = useState<{ [key: string]: BubblePhysics }>({});
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

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

  // Initialize physics for new bubbles and update existing ones
  useEffect(() => {
    setBubblePhysics(prev => {
      const newPhysics = { ...prev };
      const currentIds = new Set(topics.map(t => t.topicId));
      
      // Remove physics for topics that no longer exist
      Object.keys(newPhysics).forEach(id => {
        if (!currentIds.has(id)) {
          delete newPhysics[id];
        }
      });

      // Add physics for new topics only
      topics.forEach(topic => {
        const minSize = 20;
        const maxSize = 120;
        const targetRadius = Math.max(minSize, Math.min(maxSize, (topic.volume / maxVolume) * maxSize)) / 2;
        
        if (!newPhysics[topic.topicId]) {
          // Initialize new bubble with random position
          const padding = targetRadius + 30;
          newPhysics[topic.topicId] = {
            id: topic.topicId,
            x: Math.random() * (canvasSize.width - 2 * padding) + padding,
            y: Math.random() * (canvasSize.height - 2 * padding) + padding,
            vx: 0, // Start completely still
            vy: 0,
            radius: targetRadius * 0.8, // Start near target size
            targetRadius: targetRadius
          };
        } else {
          // Only update target radius if it changed significantly
          const currentTarget = newPhysics[topic.topicId].targetRadius;
          if (Math.abs(currentTarget - targetRadius) > 2) {
            newPhysics[topic.topicId].targetRadius = targetRadius;
          }
        }
      });

      return newPhysics;
    });
  }, [topics, maxVolume, canvasSize]);

  // STATIC bubbles - no animation loop at all
  useEffect(() => {
    // Only run once every 5 seconds for minimal updates
    const slowUpdate = () => {
      setBubblePhysics(prev => {
        const updated = { ...prev };
        const bubbles = Object.values(updated);
        
        // Only very slow size changes - no position changes
        bubbles.forEach(bubble => {
          const radiusDiff = bubble.targetRadius - bubble.radius;
          if (Math.abs(radiusDiff) > 1) {
            bubble.radius += radiusDiff * 0.01; // Slow size changes only
          }
        });

        return updated;
      });
    };

    // Run much less frequently - every 5 seconds
    const interval = setInterval(slowUpdate, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [canvasSize]);

  // Create positions object for rendering
  const bubblePositions = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    Object.entries(bubblePhysics).forEach(([id, physics]) => {
      positions[id] = { x: physics.x, y: physics.y };
    });
    return positions;
  }, [bubblePhysics]);

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
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Sentiment Legend</h4>
        <div className="space-y-1 text-xs text-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgba(21, 128, 61, 0.9)' }}></div>
            <span>Very Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300 mr-2"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}></div>
            <span>Negative</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgba(153, 27, 27, 0.9)' }}></div>
            <span>Very Negative</span>
          </div>
          <div className="text-gray-500 mt-2 pt-1 border-t border-gray-200">
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