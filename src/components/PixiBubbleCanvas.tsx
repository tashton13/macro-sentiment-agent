import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import * as d3 from 'd3-force';
import { TopicSentiment } from '../types/sentiment';

interface PixiBubbleCanvasProps {
  topics: TopicSentiment[];
  onBubbleClick: (topic: TopicSentiment) => void;
  selectedTopicId?: string;
}

interface BubbleSprite {
  sprite: PIXI.Graphics;
  data: TopicSentiment;
  targetRadius: number;
  currentRadius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const PixiBubbleCanvas: React.FC<PixiBubbleCanvasProps> = ({
  topics,
  onBubbleClick,
  selectedTopicId
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const bubblesRef = useRef<BubbleSprite[]>([]);
  const simulationRef = useRef<d3.Simulation<BubbleSprite, undefined> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PixiJS application with WebGL
    const app = new PIXI.Application({
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: 0xf8fafc,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    appRef.current = app;
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);

    // Handle resize
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;
        
        if (newWidth !== dimensions.width || newHeight !== dimensions.height) {
          setDimensions({ width: newWidth, height: newHeight });
          app.renderer.resize(newWidth, newHeight);
        }
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
      app.destroy(true);
    };
  }, []);

  // Update dimensions when container size changes
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.resize(dimensions.width, dimensions.height);
    }
  }, [dimensions]);

  // Get sentiment color
  const getSentimentColor = (sentiment: number): number => {
    if (sentiment > 0.5) return 0x15803d; // Dark green
    if (sentiment > 0.1) return 0x22c55e; // Green
    if (sentiment < -0.5) return 0x991b1b; // Dark red
    if (sentiment < -0.1) return 0xef4444; // Red
    return 0xe5e7eb; // Neutral gray
  };

  // Calculate bubble radius based on volume
  const calculateRadius = (volume: number, maxVolume: number): number => {
    const minRadius = 15;
    const maxRadius = 60;
    return Math.max(minRadius, Math.min(maxRadius, (volume / maxVolume) * maxRadius));
  };

  // Create or update bubbles
  useEffect(() => {
    if (!appRef.current || topics.length === 0) return;

    const app = appRef.current;
    const maxVolume = Math.max(...topics.map(t => t.volume), 1);

    // Clear existing bubbles
    bubblesRef.current.forEach(bubble => {
      app.stage.removeChild(bubble.sprite);
    });

    // Create new bubbles
    const newBubbles: BubbleSprite[] = topics.map((topic, index) => {
      const radius = calculateRadius(topic.volume, maxVolume);
      const color = getSentimentColor(topic.sentiment);

      // Create graphics object for bubble
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color, 0.8);
      graphics.drawCircle(0, 0, radius);
      graphics.endFill();

      // Add border
      graphics.lineStyle(2, color, 1);
      graphics.drawCircle(0, 0, radius);

      // Add text label
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: Math.max(8, radius / 3),
        fill: topic.sentiment > -0.1 && topic.sentiment < 0.1 ? 0x374151 : 0xffffff,
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: radius * 1.8,
      });

      const text = new PIXI.Text(topic.label, style);
      text.anchor.set(0.5);
      graphics.addChild(text);

      // Make interactive
      graphics.interactive = true;
      graphics.cursor = 'pointer';
      graphics.on('pointerdown', () => onBubbleClick(topic));

      // Add hover effects
      graphics.on('pointerover', () => {
        graphics.scale.set(1.1);
      });
      graphics.on('pointerout', () => {
        graphics.scale.set(1);
      });

      // Position randomly but spread out
      const angle = (index / topics.length) * Math.PI * 2;
      const distance = Math.min(dimensions.width, dimensions.height) * 0.2;
      const x = dimensions.width / 2 + Math.cos(angle) * distance;
      const y = dimensions.height / 2 + Math.sin(angle) * distance;

      graphics.x = x;
      graphics.y = y;

      app.stage.addChild(graphics);

      return {
        sprite: graphics,
        data: topic,
        targetRadius: radius,
        currentRadius: radius,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
      };
    });

    bubblesRef.current = newBubbles;

    // Create physics simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3.forceSimulation(newBubbles)
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1))
      .force('collide', d3.forceCollide<BubbleSprite>((d: BubbleSprite) => d.targetRadius + 5).iterations(2))
      .force('charge', d3.forceManyBody<BubbleSprite>().strength(-10))
      .alphaDecay(0.01)
      .velocityDecay(0.8);

    simulationRef.current = simulation;

    // Animation loop
    const ticker = () => {
      newBubbles.forEach(bubble => {
        // Smooth radius animation
        const radiusDiff = bubble.targetRadius - bubble.currentRadius;
        if (Math.abs(radiusDiff) > 0.1) {
          bubble.currentRadius += radiusDiff * 0.1;
          
          // Update graphics
          bubble.sprite.clear();
          const color = getSentimentColor(bubble.data.sentiment);
          bubble.sprite.beginFill(color, 0.8);
          bubble.sprite.drawCircle(0, 0, bubble.currentRadius);
          bubble.sprite.endFill();
          bubble.sprite.lineStyle(2, color, 1);
          bubble.sprite.drawCircle(0, 0, bubble.currentRadius);
        }

        // Update position from physics
        bubble.sprite.x = bubble.x;
        bubble.sprite.y = bubble.y;

        // Highlight selected bubble with scale instead of filters
        if (selectedTopicId === bubble.data.topicId) {
          bubble.sprite.scale.set(1.2);
          bubble.sprite.alpha = 1;
        } else {
          bubble.sprite.scale.set(1);
          bubble.sprite.alpha = 0.9;
        }
      });
    };

    app.ticker.add(ticker);

    return () => {
      app.ticker.remove(ticker);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [topics, selectedTopicId, dimensions, onBubbleClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={canvasRef} className="w-full h-full" />
      
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
          ⚡ WebGL Accelerated
        </p>
      </div>
    </div>
  );
};
