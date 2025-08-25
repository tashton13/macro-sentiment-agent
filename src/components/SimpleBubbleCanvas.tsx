import { useEffect, useState, useMemo } from 'react';
import { TopicSentiment } from '../types/sentiment';

interface SimpleBubbleCanvasProps {
  topics: TopicSentiment[];
  onBubbleClick: (topic: TopicSentiment) => void;
  selectedTopicId?: string;
}

interface BubblePosition {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export const SimpleBubbleCanvas: React.FC<SimpleBubbleCanvasProps> = ({
  topics,
  onBubbleClick,
  selectedTopicId
}) => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [bubblePositions, setBubblePositions] = useState<BubblePosition[]>([]);

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

  // Get sentiment color
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.5) return '#15803d'; // Dark green
    if (sentiment > 0.1) return '#22c55e'; // Green
    if (sentiment < -0.5) return '#991b1b'; // Dark red
    if (sentiment < -0.1) return '#ef4444'; // Red
    return '#e5e7eb'; // Neutral gray
  };

  // Calculate maximum volume for bubble sizing
  const maxVolume = useMemo(() => {
    return Math.max(...topics.map(t => t.volume), 1);
  }, [topics]);

  // Calculate bubble radius based on volume
  const calculateRadius = (volume: number): number => {
    const minRadius = 20;
    const maxRadius = 80;
    return Math.max(minRadius, Math.min(maxRadius, (volume / maxVolume) * maxRadius));
  };

  // Generate bubble positions using simple grid layout
  useEffect(() => {
    if (topics.length === 0) {
      setBubblePositions([]);
      return;
    }

    const newPositions: BubblePosition[] = topics.map((topic, index) => {
      const radius = calculateRadius(topic.volume);
      const color = getSentimentColor(topic.sentiment);
      
      // Simple spiral layout
      const angle = (index / topics.length) * Math.PI * 2 * 2;
      const distance = Math.min(canvasSize.width, canvasSize.height) * 0.25;
      const spiralRadius = distance * (0.5 + index * 0.1 / topics.length);
      
      const x = canvasSize.width / 2 + Math.cos(angle) * spiralRadius;
      const y = canvasSize.height / 2 + Math.sin(angle) * spiralRadius;

      return {
        id: topic.topicId,
        x: Math.max(radius, Math.min(canvasSize.width - radius, x)),
        y: Math.max(radius, Math.min(canvasSize.height - radius, y)),
        radius,
        color
      };
    });

    setBubblePositions(newPositions);
  }, [topics, canvasSize, maxVolume]);

  return (
    <div className="relative w-full h-full">
      {/* SVG Canvas */}
      <svg
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom right, #f8fafc, #ffffff)' }}
      >
        {/* Render bubbles */}
        {bubblePositions.map((bubble) => {
          const topic = topics.find(t => t.topicId === bubble.id);
          if (!topic) return null;

          const isSelected = selectedTopicId === topic.topicId;
          const scale = isSelected ? 1.1 : 1;

          return (
            <g key={bubble.id}>
              {/* Bubble circle */}
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.radius * scale}
                fill={bubble.color}
                fillOpacity={0.8}
                stroke={bubble.color}
                strokeWidth={2}
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => onBubbleClick(topic)}
              />
              
              {/* Text label */}
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={topic.sentiment > -0.1 && topic.sentiment < 0.1 ? '#374151' : '#ffffff'}
                fontSize={Math.max(8, bubble.radius / 4)}
                fontWeight="bold"
                className="pointer-events-none select-none"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {topic.label.length > 12 ? topic.label.substring(0, 12) + '...' : topic.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Sentiment Legend</h4>
        <div className="space-y-1 text-xs text-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#15803d' }}></div>
            <span>Very Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#22c55e' }}></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300 mr-2"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Negative</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#991b1b' }}></div>
            <span>Very Negative</span>
          </div>
          <div className="text-gray-500 mt-2 pt-1 border-t border-gray-200">
            Bubble size = post volume
          </div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
        <p className="text-xs text-green-600 font-medium">
          ⚡ SVG Rendering
        </p>
      </div>
    </div>
  );
};
