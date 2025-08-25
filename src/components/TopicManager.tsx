import { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { TopicConfig, getUserTopics, saveUserTopics } from '../config/topics';

interface TopicManagerProps {
  onTopicsChange: () => void;
}

export const TopicManager: React.FC<TopicManagerProps> = ({ onTopicsChange }) => {
  const [userTopics, setUserTopics] = useState<TopicConfig[]>(getUserTopics());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);
  const [newTopic, setNewTopic] = useState<Partial<TopicConfig>>({
    label: '',
    keywords: []
  });

  // Auto-assign colors based on sentiment (will be determined when data is available)
  const getAutoColor = (): string => {
    // Default color for new topics (neutral blue)
    return '#6b7280'; // Gray color for new topics
  };

  const handleAddTopic = () => {
    if (!newTopic.label || !newTopic.keywords?.length) return;

    const topic: TopicConfig = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: newTopic.label,
      keywords: newTopic.keywords,
      color: getAutoColor() // Auto-assigned color
    };

    const updatedTopics = [...userTopics, topic];
    setUserTopics(updatedTopics);
    saveUserTopics(updatedTopics);
    onTopicsChange();

    // Reset form
    setNewTopic({
      label: '',
      keywords: []
    });
    setIsAddingNew(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = userTopics.filter(t => t.id !== topicId);
    setUserTopics(updatedTopics);
    saveUserTopics(updatedTopics);
    onTopicsChange();
  };



  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setNewTopic({ ...newTopic, keywords });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Topic Manager</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-3 h-3" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Add new topic form */}
      {isAddingNew && (
        <div className="bg-gray-50 rounded-md p-3 mb-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Topic</h3>
          
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={newTopic.label}
                onChange={(e) => setNewTopic({ ...newTopic, label: e.target.value })}
                placeholder="Tariff Policy"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Macro topic format</p>
            </div>

            <div>
              <input
                type="text"
                value={newTopic.keywords?.join(', ') || ''}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                placeholder="tariff"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Keywords (comma-separated)</p>
            </div>

            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
              <strong>Note:</strong> Color auto-assigned by market sentiment
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleAddTopic}
                disabled={!newTopic.label || !newTopic.keywords?.length}
                className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Topic
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewTopic({ label: '', keywords: [] });
                }}
                className="flex-1 bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User topics section */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Custom Topics ({userTopics.length})</h3>
          {userTopics.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowDeleteDropdown(!showDeleteDropdown)}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showDeleteDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[150px]">
                  {userTopics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        handleDeleteTopic(topic.id);
                        setShowDeleteDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Delete "{topic.label}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {userTopics.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No custom topics yet.</p>
            <p className="text-xs mt-1">Add your first topic above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userTopics.map(topic => (
              <div key={topic.id} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: topic.color }}
                      />
                      <h4 className="font-medium text-gray-900 text-sm truncate">{topic.label}</h4>
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Keywords:</strong> {topic.keywords.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Tips:</strong></p>
          <p>• Use macro format: "Tariff Policy"</p>
          <p>• Keywords: single words like "tariff"</p>
          <p>• Colors auto-reflect market sentiment</p>
          <p>• Size = discussion volume</p>
        </div>
      </div>
    </div>
  );
};


