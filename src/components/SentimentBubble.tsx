import { motion } from 'framer-motion';
import { TopicSentiment } from '../types/sentiment';

interface SentimentBubbleProps {
  data: TopicSentiment;
  onClick: () => void;
  isSelected: boolean;
  position: { x: number; y: number };
  maxVolume: number;
}

export const SentimentBubble: React.FC<SentimentBubbleProps> = ({
  data,
  onClick,
  isSelected,
  position,
  maxVolume
}) => {
  // Calculate bubble size based on volume (20px to 120px)
  const minSize = 20;
  const maxSize = 120;
  const size = Math.max(minSize, Math.min(maxSize, (data.volume / maxVolume) * maxSize));
  
  // Calculate sentiment color - green for good, red for bad, gray for neutral
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.5) {
      // Really good sentiment - dark green
      return 'rgba(21, 128, 61, 0.9)'; // Dark green
    } else if (sentiment > 0.1) {
      // Good sentiment - green
      const intensity = Math.min(sentiment * 2, 1);
      return `rgba(34, 197, 94, ${0.6 + intensity * 0.3})`; // Green with varying opacity
    } else if (sentiment < -0.5) {
      // Really bad sentiment - dark red
      return 'rgba(153, 27, 27, 0.9)'; // Dark red
    } else if (sentiment < -0.1) {
      // Bad sentiment - red
      const intensity = Math.min(Math.abs(sentiment) * 2, 1);
      return `rgba(239, 68, 68, ${0.6 + intensity * 0.3})`; // Red with varying opacity
    } else {
      // Neutral sentiment - white/gray
      return 'rgba(249, 250, 251, 0.9)'; // Almost white with slight gray
    }
  };

  const getBorderColor = (sentiment: number): string => {
    if (sentiment > 0.5) {
      return '#15803d'; // Dark green border for really positive
    } else if (sentiment > 0.1) {
      return '#22c55e'; // Green border for positive
    } else if (sentiment < -0.5) {
      return '#991b1b'; // Dark red border for really negative
    } else if (sentiment < -0.1) {
      return '#ef4444'; // Red border for negative
    } else {
      return '#d1d5db'; // Light gray border for neutral
    }
  };

  // Get sentiment label
  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment > 0.3) return 'Very Positive';
    if (sentiment > 0.1) return 'Positive';
    if (sentiment < -0.3) return 'Very Negative';
    if (sentiment < -0.1) return 'Negative';
    return 'Neutral';
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: position.x - size/2,  // Center the bubble on the position
        y: position.y - size/2   // Center the bubble on the position
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={`absolute cursor-pointer select-none ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        width: size,
        height: size,
        backgroundColor: getSentimentColor(data.sentiment),
        border: `2px solid ${getBorderColor(data.sentiment)}`,
        borderRadius: '50%',
        boxShadow: isSelected 
          ? `0 0 15px ${getBorderColor(data.sentiment)}` 
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
      onClick={onClick}
      transition={{
        type: "tween",
        ease: "easeOut",
        duration: 0.1,
        x: { type: "tween", ease: "linear", duration: 0 }, // No transition for position
        y: { type: "tween", ease: "linear", duration: 0 }, // No transition for position
        scale: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.3 }
      }}
    >
      {/* Pulse animation for active bubbles */}
      {Math.abs(data.sentiment) > 0.2 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: getBorderColor(data.sentiment),
            opacity: 0.3,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Bubble content */}
      <div className="flex flex-col items-center justify-center h-full text-center p-1">
        <div 
          className={`font-semibold leading-tight ${
            Math.abs(data.sentiment) > 0.1 ? 'text-white' : 'text-gray-800'
          }`}
          style={{ fontSize: Math.max(8, size / 8) }}
        >
          {data.label}
        </div>
        
        {size > 40 && (
          <>
            <div 
              className={`text-xs font-medium mt-1 ${
                Math.abs(data.sentiment) > 0.1 ? 'text-white text-opacity-90' : 'text-gray-600'
              }`}
              style={{ fontSize: Math.max(6, size / 12) }}
            >
              {data.volume} posts
            </div>
            
            {size > 60 && (
              <div 
                className={`text-xs font-bold mt-1 ${
                  Math.abs(data.sentiment) > 0.1 ? 'text-white text-opacity-80' : 'text-gray-600'
                }`}
                style={{ fontSize: Math.max(6, size / 14) }}
              >
                {getSentimentLabel(data.sentiment)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tooltip for smaller bubbles */}
      {size <= 40 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            {data.label}: {data.volume} posts ({getSentimentLabel(data.sentiment)})
          </div>
        </div>
      )}
    </motion.div>
  );
}; 