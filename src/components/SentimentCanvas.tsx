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
    const newPhysics = { ...bubblePhysics };
    const currentIds = new Set(topics.map(t => t.topicId));
    
    // Remove physics for topics that no longer exist
    Object.keys(newPhysics).forEach(id => {
      if (!currentIds.has(id)) {
        delete newPhysics[id];
      }
    });

    // Add physics for new topics
    topics.forEach(topic => {
      const minSize = 20;
      const maxSize = 120;
      const targetRadius = Math.max(minSize, Math.min(maxSize, (topic.volume / maxVolume) * maxSize)) / 2;
      
      if (!newPhysics[topic.topicId]) {
        // Initialize new bubble with random position
        const padding = targetRadius + 20;
        newPhysics[topic.topicId] = {
          id: topic.topicId,
          x: Math.random() * (canvasSize.width - 2 * padding) + padding,
          y: Math.random() * (canvasSize.height - 2 * padding) + padding,
          vx: (Math.random() - 0.5) * 0.05, // VERY small initial velocity
          vy: (Math.random() - 0.5) * 0.05,
          radius: targetRadius * 0.3, // Start bigger (less dramatic growth)
          targetRadius: targetRadius
        };
      } else {
        // Update target radius for existing bubbles
        newPhysics[topic.topicId].targetRadius = targetRadius;
      }
    });

    setBubblePhysics(newPhysics);
  }, [topics, maxVolume, canvasSize]);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastUpdateRef.current) / 1000, 1/30); // Cap at 30 FPS
      lastUpdateRef.current = now;

      setBubblePhysics(prev => {
        const updated = { ...prev };
        const bubbles = Object.values(updated);
        
        // Apply physics to each bubble
        bubbles.forEach(bubble => {
          // Very smooth radius animation
          const radiusDiff = bubble.targetRadius - bubble.radius;
          bubble.radius += radiusDiff * 0.008; // Even slower size changes
          
          // VERY gentle floating motion (like CryptoBubbles - much calmer)
          const time = now * 0.0005; // Much slower time
          bubble.vx += Math.sin(time + bubble.id.charCodeAt(0)) * 0.0003; // Much smaller forces
          bubble.vy += Math.cos(time + bubble.id.charCodeAt(1)) * 0.0003;
          
          // Tiny random drift
          bubble.vx += (Math.random() - 0.5) * 0.0008;
          bubble.vy += (Math.random() - 0.5) * 0.0008;
          
          // Strong drag to keep movement calm
          bubble.vx *= 0.98;
          bubble.vy *= 0.98;
          
          // Cap maximum velocity to keep bubbles super calm
          const maxVelocity = 0.5;
          const currentSpeed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
          if (currentSpeed > maxVelocity) {
            bubble.vx = (bubble.vx / currentSpeed) * maxVelocity;
            bubble.vy = (bubble.vy / currentSpeed) * maxVelocity;
          }
          
          // Collision detection and repulsion
          bubbles.forEach(other => {
            if (bubble.id !== other.id) {
              const dx = other.x - bubble.x;
              const dy = other.y - bubble.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = bubble.radius + other.radius + 10;
              
              if (distance > 0 && distance < minDistance) {
                // VERY gentle repulsion (much calmer)
                const force = (minDistance - distance) * 0.0001; // 10x smaller force
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                bubble.vx -= fx;
                bubble.vy -= fy;
              }
            }
          });
          
          // VERY gentle boundary repulsion
          const wallForce = 0.0005; // Much gentler walls
          const margin = bubble.radius + 30;
          
          if (bubble.x < margin) {
            bubble.vx += wallForce * (margin - bubble.x);
          }
          if (bubble.x > canvasSize.width - margin) {
            bubble.vx -= wallForce * (bubble.x - (canvasSize.width - margin));
          }
          if (bubble.y < margin) {
            bubble.vy += wallForce * (margin - bubble.y);
          }
          if (bubble.y > canvasSize.height - margin) {
            bubble.vy -= wallForce * (bubble.y - (canvasSize.height - margin));
          }
          
          // Update position (much slower movement)
          bubble.x += bubble.vx * deltaTime * 20; // Much slower movement
          bubble.y += bubble.vy * deltaTime * 20;
          
          // Clamp position to bounds
          bubble.x = Math.max(bubble.radius, Math.min(canvasSize.width - bubble.radius, bubble.x));
          bubble.y = Math.max(bubble.radius, Math.min(canvasSize.height - bubble.radius, bubble.y));
        });

        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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