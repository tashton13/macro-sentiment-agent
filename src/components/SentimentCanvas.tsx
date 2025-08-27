import { AdvancedBubbleCanvas } from './AdvancedBubbleCanvas';
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
  return (
    <div 
      id="sentiment-canvas"
      className="relative w-full h-full overflow-hidden rounded-lg border border-gray-200"
      style={{ minHeight: '500px' }}
    >
      {/* Advanced Physics-Based Canvas */}
      <AdvancedBubbleCanvas
        topics={topics}
        onBubbleClick={onBubbleClick}
        selectedTopicId={selectedTopicId}
      />

      {/* Loading state */}
      {topics.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading sentiment data...</p>
          </div>
        </div>
      )}

      {/* Last updated indicator */}
      {topics.length > 0 && topics[0].lastUpdated && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            Last updated: {new Date(topics[0].lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};