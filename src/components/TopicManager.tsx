import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { TopicConfig, getUserTopics, saveUserTopics } from '../config/topics';

interface TopicManagerProps {
  onTopicsChange: () => void;
}

export const TopicManager: React.FC<TopicManagerProps> = ({ onTopicsChange }) => {
  const [userTopics, setUserTopics] = useState<TopicConfig[]>(getUserTopics());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState<Partial<TopicConfig>>({
    label: '',
    keywords: [],
    description: ''
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
      color: getAutoColor(), // Auto-assigned color
      description: newTopic.description || ''
    };

    const updatedTopics = [...userTopics, topic];
    setUserTopics(updatedTopics);
    saveUserTopics(updatedTopics);
    onTopicsChange();

    // Reset form
    setNewTopic({
      label: '',
      keywords: [],
      description: ''
    });
    setIsAddingNew(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    const updatedTopics = userTopics.filter(t => t.id !== topicId);
    setUserTopics(updatedTopics);
    saveUserTopics(updatedTopics);
    onTopicsChange();
  };

  const handleEditTopic = (topicId: string, updatedTopic: Partial<TopicConfig>) => {
    const updatedTopics = userTopics.map(t => 
      t.id === topicId ? { ...t, ...updatedTopic } : t
    );
    setUserTopics(updatedTopics);
    saveUserTopics(updatedTopics);
    onTopicsChange();
    setEditingId(null);
  };

  const handleKeywordsChange = (value: string, isEditing?: boolean) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    if (isEditing) {
      // Handle editing existing topic
      const topic = userTopics.find(t => t.id === editingId);
      if (topic) {
        handleEditTopic(editingId!, { keywords });
      }
    } else {
      setNewTopic({ ...newTopic, keywords });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Topic Manager</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Topic</span>
        </button>
      </div>

      {/* Add new topic form */}
      {isAddingNew && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Topic</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Macro Topic Label
              </label>
              <input
                type="text"
                value={newTopic.label}
                onChange={(e) => setNewTopic({ ...newTopic, label: e.target.value })}
                placeholder="e.g., Tariff Policy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Use proper macro topic format (e.g., "Tariff Policy")</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={newTopic.keywords?.join(', ') || ''}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                placeholder="e.g., tariff"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Keywords for sentiment analysis - single word example: "tariff"</p>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Bubble color will be automatically assigned based on real-time market sentiment for this topic.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                placeholder="Brief description of this topic"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddTopic}
                disabled={!newTopic.label || !newTopic.keywords?.length}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Save Topic</span>
              </button>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setNewTopic({ label: '', keywords: [], description: '' });
                }}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User topics list */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Custom Topics</h3>
        
        {userTopics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No custom topics yet.</p>
            <p className="text-sm mt-1">Click "Add Topic" to create your first custom topic.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userTopics.map(topic => (
              <div key={topic.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {editingId === topic.id ? (
                  <EditTopicForm 
                    topic={topic}
                    onSave={(updatedTopic) => handleEditTopic(topic.id, updatedTopic)}
                    onCancel={() => setEditingId(null)}
                    onKeywordsChange={(value) => handleKeywordsChange(value, true)}
                  />
                ) : (
                  <TopicDisplay 
                    topic={topic}
                    onEdit={() => setEditingId(topic.id)}
                    onDelete={() => handleDeleteTopic(topic.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Tips:</strong></p>
          <p>• Use specific macro topic format (e.g., "Tariff Policy")</p>
          <p>• Keywords should be single words (e.g., "tariff")</p>
          <p>• Keywords are case-insensitive and matched in social media posts</p>
          <p>• Bubble colors automatically reflect real-time market sentiment</p>
          <p>• Topics appear as bubbles with size based on discussion volume</p>
        </div>
      </div>
    </div>
  );
};

interface TopicDisplayProps {
  topic: TopicConfig;
  onEdit: () => void;
  onDelete: () => void;
}

const TopicDisplay: React.FC<TopicDisplayProps> = ({ topic, onEdit, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-3">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: topic.color }}
        />
        <h4 className="font-medium text-gray-900">{topic.label}</h4>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onEdit}
          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
          title="Edit topic"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
          title="Delete topic"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div className="text-sm text-gray-600 mb-2">
      <strong>Keywords:</strong> {topic.keywords.join(', ')}
    </div>
    
    {topic.description && (
      <div className="text-sm text-gray-500">
        {topic.description}
      </div>
    )}
  </div>
);

interface EditTopicFormProps {
  topic: TopicConfig;
  onSave: (updatedTopic: Partial<TopicConfig>) => void;
  onCancel: () => void;
  onKeywordsChange: (value: string) => void;
}

const EditTopicForm: React.FC<EditTopicFormProps> = ({ 
  topic, 
  onSave, 
  onCancel,
  onKeywordsChange 
}) => {
  const [editedTopic, setEditedTopic] = useState<TopicConfig>(topic);

  const handleSave = () => {
    onSave(editedTopic);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Macro Topic Label
        </label>
        <input
          type="text"
          value={editedTopic.label}
          onChange={(e) => setEditedTopic({ ...editedTopic, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords (comma-separated)
        </label>
        <input
          type="text"
          value={editedTopic.keywords.join(', ')}
          onChange={(e) => {
            const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
            setEditedTopic({ ...editedTopic, keywords });
            onKeywordsChange(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Keywords for sentiment analysis - single word example: "tariff"</p>
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Bubble color automatically reflects market sentiment.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={editedTopic.description}
          onChange={(e) => setEditedTopic({ ...editedTopic, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};
