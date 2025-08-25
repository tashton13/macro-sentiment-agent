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

  // Smooth bubble physics with collision detection
  const bubblePositions = useMemo(() => {
    if (topics.length === 0) return {};

    const positions: { [key: string]: { x: number; y: number } } = {};
    const bubbleSizes: { [key: string]: number } = {};
    
    // Calculate bubble sizes first
    topics.forEach(topic => {
      const minSize = 20;
      const maxSize = 120;
      const size = Math.max(minSize, Math.min(maxSize, (topic.volume / maxVolume) * maxSize));
      bubbleSizes[topic.topicId] = size;
    });

    // Initialize positions - try to place bubbles without overlapping
    const placedBubbles: Array<{ x: number; y: number; radius: number; id: string }> = [];
    const padding = 20;

    topics.forEach((topic) => {
      const radius = bubbleSizes[topic.topicId] / 2;
      let x, y;
      let attempts = 0;
      let validPosition = false;

      // Try to find a non-overlapping position
      while (!validPosition && attempts < 100) {
        x = Math.random() * (canvasSize.width - 2 * (radius + padding)) + radius + padding;
        y = Math.random() * (canvasSize.height - 2 * (radius + padding)) + radius + padding;

        validPosition = true;
        
        // Check for overlaps with existing bubbles
        for (const placed of placedBubbles) {
          const distance = Math.sqrt((x - placed.x) ** 2 + (y - placed.y) ** 2);
          const minDistance = radius + placed.radius + 15; // 15px minimum gap
          
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
        
        attempts++;
      }

      // If we couldn't find a good position, use a fallback grid position
      if (!validPosition) {
        const gridCols = Math.ceil(Math.sqrt(topics.length));
        const index = placedBubbles.length;
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        
        x = (canvasSize.width / gridCols) * (col + 0.5);
        y = (canvasSize.height / Math.ceil(topics.length / gridCols)) * (row + 0.5);
        
        // Ensure within bounds
        x = Math.max(radius + padding, Math.min(canvasSize.width - radius - padding, x));
        y = Math.max(radius + padding, Math.min(canvasSize.height - radius - padding, y));
      }

      placedBubbles.push({ x: x!, y: y!, radius, id: topic.topicId });
      positions[topic.topicId] = { x: x!, y: y! };
    });

    // Apply force-based layout for smooth positioning
    const iterations = 50;
    for (let iter = 0; iter < iterations; iter++) {
      const forces: { [key: string]: { fx: number; fy: number } } = {};
      
      // Initialize forces
      placedBubbles.forEach(bubble => {
        forces[bubble.id] = { fx: 0, fy: 0 };
      });

      // Calculate repulsion forces between bubbles
      for (let i = 0; i < placedBubbles.length; i++) {
        for (let j = i + 1; j < placedBubbles.length; j++) {
          const bubble1 = placedBubbles[i];
          const bubble2 = placedBubbles[j];
          
          const dx = bubble2.x - bubble1.x;
          const dy = bubble2.y - bubble1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = bubble1.radius + bubble2.radius + 20;
          
          if (distance < minDistance && distance > 0) {
            const force = (minDistance - distance) * 0.05;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            forces[bubble1.id].fx -= fx;
            forces[bubble1.id].fy -= fy;
            forces[bubble2.id].fx += fx;
            forces[bubble2.id].fy += fy;
          }
        }
      }

      // Apply forces and update positions
      placedBubbles.forEach(bubble => {
        const force = forces[bubble.id];
        bubble.x += force.fx;
        bubble.y += force.fy;
        
        // Keep within bounds
        bubble.x = Math.max(bubble.radius + padding, Math.min(canvasSize.width - bubble.radius - padding, bubble.x));
        bubble.y = Math.max(bubble.radius + padding, Math.min(canvasSize.height - bubble.radius - padding, bubble.y));
        
        positions[bubble.id] = { x: bubble.x, y: bubble.y };
      });
    }

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