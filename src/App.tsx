import { useState } from 'react';
import { Settings, RefreshCw, AlertCircle, Activity, Clock } from 'lucide-react';
import { SentimentCanvas } from './components/SentimentCanvas';
import { TopicDetailDrawer } from './components/TopicDetailDrawer';
import { TopicManager } from './components/TopicManager';
import { useSentimentData } from './hooks/useSentimentData';
import { TopicSentiment } from './types/sentiment';

function App() {
  const [pollingInterval, setPollingInterval] = useState(60000); // 1 minute default
  const [selectedTopic, setSelectedTopic] = useState<TopicSentiment | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [topicsRefreshTrigger, setTopicsRefreshTrigger] = useState(0);

  const { data, loading, error, lastUpdated, refresh } = useSentimentData(pollingInterval, topicsRefreshTrigger);

  const handleBubbleClick = (topic: TopicSentiment) => {
    setSelectedTopic(topic);
  };

  const handleCloseDrawer = () => {
    setSelectedTopic(null);
  };

  const handleTopicsChange = () => {
    setTopicsRefreshTrigger(prev => prev + 1);
  };

  const getDataSourceInfo = () => {
    if (!data) return { color: 'text-gray-500', text: 'No Data' };
    
    switch (data.dataSource) {
      case 'twitter':
        return { color: 'text-blue-500', text: 'Twitter API' };
      case 'reddit':
        return { color: 'text-orange-500', text: 'Reddit API' };
      case 'mixed':
        return { color: 'text-green-500', text: 'Twitter + Reddit' };
      default:
        return { color: 'text-gray-500', text: 'Demo Data' };
    }
  };

  const dataSourceInfo = getDataSourceInfo();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">NASCENT</h1>
                <p className="text-sm text-gray-600">Macro Sentiment Analysis</p>
              </div>
            </div>

            {/* Status and Controls */}
            <div className="flex items-center space-x-4">
              {/* Data source indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  error ? 'bg-red-500' : loading ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className={dataSourceInfo.color}>{dataSourceInfo.text}</span>
              </div>

              {/* Last updated */}
              {lastUpdated && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Refresh button */}
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-blue-900">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                Close
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Polling interval */}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Update Interval
                </label>
                <select
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={300000}>5 minutes</option>
                  <option value={600000}>10 minutes</option>
                </select>
              </div>

              {/* Data info */}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Data Summary
                </label>
                <div className="text-sm text-blue-800">
                  {data ? (
                    <>
                      <div>{data.topics.length} topics tracked</div>
                      <div>{data.totalPosts} total posts analyzed</div>
                    </>
                  ) : (
                    <div>No data available</div>
                  )}
                </div>
              </div>

              {/* API Setup Info */}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  API Configuration
                </label>
                <div className="text-xs text-blue-700">
                  <div>Twitter API: {data?.dataSource?.includes('twitter') ? '✓ Active' : '✗ Not configured'}</div>
                  <div>Reddit API: {data?.dataSource?.includes('reddit') ? '✓ Active' : '✗ Not configured'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Use more screen real estate */}
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Use more real estate */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Sentiment Canvas - Takes up 4/5 of the width for more space */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-[700px]"> {/* Taller canvas */}
                <SentimentCanvas
                  topics={data?.topics || []}
                  onBubbleClick={handleBubbleClick}
                  selectedTopicId={selectedTopic?.topicId}
                />
              </div>
            </div>
          </div>

          {/* Topic Manager - Takes up 1/5 of the width */}
          <div className="xl:col-span-1">
            <div className="h-[700px]"> {/* Match canvas height */}
              <TopicManager onTopicsChange={handleTopicsChange} />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {data && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{data.topics.length}</div>
              <div className="text-sm text-gray-500">Topics Tracked</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{data.totalPosts}</div>
              <div className="text-sm text-gray-500">Total Posts</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {data.topics.filter(t => t.sentiment > 0.1).length}
              </div>
              <div className="text-sm text-gray-500">Positive Topics</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-red-600">
                {data.topics.filter(t => t.sentiment < -0.1).length}
              </div>
              <div className="text-sm text-gray-500">Negative Topics</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How to Use</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Click on any sentiment bubble to view detailed analysis and top posts</p>
            <p>• Bubble size represents post volume, color represents sentiment (green=positive, red=negative, white=neutral)</p>
            <p>• Data refreshes automatically based on your selected interval</p>
            <p>• Configure Twitter API credentials in GitHub secrets for live data</p>
          </div>
        </div>
      </main>

      {/* Topic Detail Drawer */}
      <TopicDetailDrawer
        topic={selectedTopic}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}

export default App; 