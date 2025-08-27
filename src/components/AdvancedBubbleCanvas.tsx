import { useEffect, useRef, useState, useCallback } from 'react';
import { TopicSentiment } from '../types/sentiment';

interface AdvancedBubbleCanvasProps {
  topics: TopicSentiment[];
  onBubbleClick: (topic: TopicSentiment) => void;
  selectedTopicId?: string;
}

interface Bubble {
  id: string;
  topic: TopicSentiment;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  color: string;
  targetColor: string;
  currentSentiment: number;
  targetSentiment: number;
  currentVolume: number;
  targetVolume: number;
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  mass: number;
  lastUpdateTime: number;
  index: number; // For organic movement calculations
}

interface Vector2D {
  x: number;
  y: number;
}

export const AdvancedBubbleCanvas: React.FC<AdvancedBubbleCanvasProps> = ({
  topics,
  onBubbleClick,
  selectedTopicId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const bubblesRef = useRef<Map<string, Bubble>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const mousePosition = useRef<Vector2D>({ x: 0, y: 0 });

  // Physics constants - Much calmer and gentler with smoothing
  const PHYSICS_CONFIG = {
    damping: 0.98, // Higher damping for slower movement
    collisionDamping: 0.3, // Much softer collisions
    centeringForce: 0.00005, // Very weak centering force
    separationForce: 0.02, // Much gentler separation
    randomForce: 0.0001, // Small random movement
    minRadius: 15,
    maxRadius: 80,
    boundaryPadding: 30,
    dragStrength: 0.8,
    maxVelocity: 0.8, // Much slower maximum speed
    repulsionDistance: 1.2, // Smaller repulsion area
    targetFPS: 60,
    driftStrength: 0.00005, // Gentle drift movement
    // Smoothing parameters
    sentimentSmoothingSpeed: 0.005, // Much slower sentiment changes (slower = smoother)
    volumeSmoothingSpeed: 0.02, // Slower volume changes
    colorSmoothingSpeed: 0.03, // Faster color transitions to see changes
    radiusSmoothingSpeed: 0.03, // Slower radius changes
  };

  // CryptoBubbles-inspired color calculation with vibrant colors
  const getSentimentColor = useCallback((sentiment: number): string => {
    // Clamp sentiment between -1 and 1
    const clampedSentiment = Math.max(-1, Math.min(1, sentiment));
    
    if (clampedSentiment > 0.1) {
      // Positive sentiment - vibrant greens like CryptoBubbles
      const intensity = Math.min(clampedSentiment / 0.8, 1); // Scale 0.1-1 to 0-1
      if (intensity > 0.7) {
        // Very positive - bright green
        return `rgb(${Math.round(34 * (1 - intensity) + 16 * intensity)}, ${Math.round(197 * (1 - intensity) + 185 * intensity)}, ${Math.round(94 * (1 - intensity) + 76 * intensity)})`;
      } else {
        // Moderately positive - medium green
        return `rgb(${Math.round(74 + (34 - 74) * intensity)}, ${Math.round(222 + (197 - 222) * intensity)}, ${Math.round(128 + (94 - 128) * intensity)})`;
      }
    } else if (clampedSentiment < -0.1) {
      // Negative sentiment - vibrant reds like CryptoBubbles
      const intensity = Math.min(Math.abs(clampedSentiment) / 0.8, 1); // Scale 0.1-1 to 0-1
      if (intensity > 0.7) {
        // Very negative - deep red
        return `rgb(${Math.round(239 * (1 - intensity) + 153 * intensity)}, ${Math.round(68 * (1 - intensity) + 27 * intensity)}, ${Math.round(68 * (1 - intensity) + 27 * intensity)})`;
      } else {
        // Moderately negative - medium red
        return `rgb(${Math.round(248 + (239 - 248) * intensity)}, ${Math.round(113 + (68 - 113) * intensity)}, ${Math.round(113 + (68 - 113) * intensity)})`;
      }
    } else {
      // Neutral sentiment - light gray/white like CryptoBubbles neutral
      return 'rgb(156, 163, 175)'; // Gray-400
    }
  }, []);

  // Calculate bubble radius based on volume
  const calculateRadius = useCallback((volume: number, maxVolume: number): number => {
    const normalized = Math.sqrt(volume / maxVolume); // Square root for better visual scaling
    return PHYSICS_CONFIG.minRadius + (PHYSICS_CONFIG.maxRadius - PHYSICS_CONFIG.minRadius) * normalized;
  }, []);

  // Update canvas dimensions
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  // Initialize bubbles from topics
  const initializeBubbles = useCallback(() => {
    const maxVolume = Math.max(...topics.map(t => t.volume), 1);
    const bubbles = new Map<string, Bubble>();
    
    topics.forEach((topic, index) => {
      const existingBubble = bubblesRef.current.get(topic.topicId);
      const radius = calculateRadius(topic.volume, maxVolume);
      
      // Use existing position if bubble already exists, otherwise use random organic placement
      let x, y;
      if (existingBubble) {
        x = existingBubble.x;
        y = existingBubble.y;
      } else {
        // Random organic placement - no patterns
        const margin = radius + PHYSICS_CONFIG.boundaryPadding;
        x = margin + Math.random() * (dimensions.width - 2 * margin);
        y = margin + Math.random() * (dimensions.height - 2 * margin);
        
        // Add slight bias toward center for larger bubbles (higher volume topics)
        const centerBias = Math.min(radius / PHYSICS_CONFIG.maxRadius, 0.3);
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        x = x + (centerX - x) * centerBias * 0.3;
        y = y + (centerY - y) * centerBias * 0.3;
      }

      const targetColor = getSentimentColor(topic.sentiment);
      
      const bubble: Bubble = {
        id: topic.topicId,
        topic,
        x,
        y,
        vx: existingBubble?.vx || 0,
        vy: existingBubble?.vy || 0,
        radius: existingBubble?.radius || radius,
        targetRadius: radius,
        color: targetColor, // Always start with the correct color
        targetColor: targetColor,
        currentSentiment: topic.sentiment, // Start with actual sentiment
        targetSentiment: topic.sentiment,
        currentVolume: topic.volume, // Start with actual volume
        targetVolume: topic.volume,
        isDragging: existingBubble?.isDragging || false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        mass: radius * radius, // Mass proportional to area
        lastUpdateTime: Date.now(),
        index: existingBubble?.index || index, // Preserve index for consistent organic movement
      };

      bubbles.set(topic.topicId, bubble);
    });

    bubblesRef.current = bubbles;
  }, [topics, dimensions, calculateRadius, getSentimentColor]);

  // Vector math utilities
  const distance = (a: Vector2D, b: Vector2D): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const normalize = (v: Vector2D): Vector2D => {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y);
    return mag > 0 ? { x: v.x / mag, y: v.y / mag } : { x: 0, y: 0 };
  };

  // Smooth interpolation utilities
  const lerp = (current: number, target: number, speed: number): number => {
    return current + (target - current) * speed;
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };



  const parseRgbColor = (color: string): { r: number; g: number; b: number } => {
    if (color.startsWith('rgb(')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
    }
    return hexToRgb(color);
  };

  const blendColors = (color1: string, color2: string, factor: number): string => {
    const rgb1 = parseRgbColor(color1);
    const rgb2 = parseRgbColor(color2);
    
    const r = lerp(rgb1.r, rgb2.r, factor);
    const g = lerp(rgb1.g, rgb2.g, factor);
    const b = lerp(rgb1.b, rgb2.b, factor);
    
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  // Physics simulation - Much gentler and more organic
  const updatePhysics = useCallback((deltaTime: number) => {
    const bubbles = Array.from(bubblesRef.current.values());
    const time = Date.now() * 0.001; // Time for organic movement

    // Update each bubble
    bubbles.forEach((bubble) => {
      if (bubble.isDragging) {
        // Handle dragged bubbles
        bubble.x = mousePosition.current.x - bubble.dragOffsetX;
        bubble.y = mousePosition.current.y - bubble.dragOffsetY;
        bubble.vx *= 0.95; // Gentle velocity reduction when dragging
        bubble.vy *= 0.95;
      } else {
        // Apply very gentle forces
        let forceX = 0;
        let forceY = 0;

        // Gentle organic drift - like bubbles floating in water
        const driftOffsetX = Math.sin(time * 0.3 + bubble.index * 0.7) * PHYSICS_CONFIG.driftStrength;
        const driftOffsetY = Math.cos(time * 0.2 + bubble.index * 1.1) * PHYSICS_CONFIG.driftStrength;
        forceX += driftOffsetX;
        forceY += driftOffsetY;

        // Very weak centering tendency (only for bubbles far from center)
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const centerDistance = distance(bubble, { x: centerX, y: centerY });
        const maxDistance = Math.min(dimensions.width, dimensions.height) * 0.4;
        
        if (centerDistance > maxDistance) {
          const centerForce = (centerDistance - maxDistance) * PHYSICS_CONFIG.centeringForce;
          const centerDirection = normalize({ x: centerX - bubble.x, y: centerY - bubble.y });
          forceX += centerDirection.x * centerForce;
          forceY += centerDirection.y * centerForce;
        }

        // Gentle separation from other bubbles (no hard collisions)
        bubbles.forEach(other => {
          if (other.id === bubble.id) return;

          const dist = distance(bubble, other);
          const safeDistance = (bubble.radius + other.radius) * PHYSICS_CONFIG.repulsionDistance;

          if (dist < safeDistance && dist > 0) {
            // Very gentle separation
            const separationStrength = Math.pow((safeDistance - dist) / safeDistance, 2);
            const direction = normalize({ x: bubble.x - other.x, y: bubble.y - other.y });
            const force = separationStrength * PHYSICS_CONFIG.separationForce;
            
            forceX += direction.x * force;
            forceY += direction.y * force;

            // If actually overlapping, gently push apart
            if (dist < bubble.radius + other.radius) {
              const overlap = (bubble.radius + other.radius - dist) * 0.5;
              const pushX = direction.x * overlap * 0.02; // Very gentle push
              const pushY = direction.y * overlap * 0.02;
              
              bubble.x += pushX;
              bubble.y += pushY;
              other.x -= pushX;
              other.y -= pushY;
            }
          }
        });

        // Add tiny random movements for organic feel
        forceX += (Math.random() - 0.5) * PHYSICS_CONFIG.randomForce;
        forceY += (Math.random() - 0.5) * PHYSICS_CONFIG.randomForce;

        // Apply forces to velocity (much gentler)
        bubble.vx += forceX * deltaTime * 0.1;
        bubble.vy += forceY * deltaTime * 0.1;

        // Strong damping for slow, floating movement
        bubble.vx *= PHYSICS_CONFIG.damping;
        bubble.vy *= PHYSICS_CONFIG.damping;

        // Limit maximum velocity to keep things calm
        const speed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
        if (speed > PHYSICS_CONFIG.maxVelocity) {
          bubble.vx = (bubble.vx / speed) * PHYSICS_CONFIG.maxVelocity;
          bubble.vy = (bubble.vy / speed) * PHYSICS_CONFIG.maxVelocity;
        }

        // Update position with slower movement
        bubble.x += bubble.vx * deltaTime * 0.3; // Slower position updates
        bubble.y += bubble.vy * deltaTime * 0.3;
      }

      // Gentle boundary constraints - like invisible soft walls
      const minX = bubble.radius + PHYSICS_CONFIG.boundaryPadding;
      const maxX = dimensions.width - bubble.radius - PHYSICS_CONFIG.boundaryPadding;
      const minY = bubble.radius + PHYSICS_CONFIG.boundaryPadding;
      const maxY = dimensions.height - bubble.radius - PHYSICS_CONFIG.boundaryPadding;

      // Soft boundary repulsion instead of hard collisions
      if (bubble.x < minX) {
        const pushForce = (minX - bubble.x) * 0.001;
        bubble.vx += pushForce;
        bubble.x = Math.max(bubble.x, minX - 5); // Allow slight overshoot
      } else if (bubble.x > maxX) {
        const pushForce = (maxX - bubble.x) * 0.001;
        bubble.vx += pushForce;
        bubble.x = Math.min(bubble.x, maxX + 5); // Allow slight overshoot
      }

      if (bubble.y < minY) {
        const pushForce = (minY - bubble.y) * 0.001;
        bubble.vy += pushForce;
        bubble.y = Math.max(bubble.y, minY - 5); // Allow slight overshoot
      } else if (bubble.y > maxY) {
        const pushForce = (maxY - bubble.y) * 0.001;
        bubble.vy += pushForce;
        bubble.y = Math.min(bubble.y, maxY + 5); // Allow slight overshoot
      }

      // Smooth transitions for all bubble properties
      
      // Only update sentiment if there's a meaningful difference
      const sentimentDiff = Math.abs(bubble.targetSentiment - bubble.currentSentiment);
      if (sentimentDiff > 0.001) {
        bubble.currentSentiment = lerp(bubble.currentSentiment, bubble.targetSentiment, PHYSICS_CONFIG.sentimentSmoothingSpeed);
      }
      
      // Smooth volume transition  
      const volumeDiff = Math.abs(bubble.targetVolume - bubble.currentVolume);
      if (volumeDiff > 0.1) {
        bubble.currentVolume = lerp(bubble.currentVolume, bubble.targetVolume, PHYSICS_CONFIG.volumeSmoothingSpeed);
      }
      
      // Update target color based on current sentiment (not target sentiment)
      const newTargetColor = getSentimentColor(bubble.currentSentiment);
      
      // Only update color if it's actually different and meaningful
      if (bubble.targetColor !== newTargetColor) {
        bubble.targetColor = newTargetColor;
      }
      
      // Very gradual color transition
      if (bubble.color !== bubble.targetColor) {
        const currentRgb = parseRgbColor(bubble.color);
        const targetRgb = parseRgbColor(bubble.targetColor);
        const colorDistance = Math.abs(currentRgb.r - targetRgb.r) + Math.abs(currentRgb.g - targetRgb.g) + Math.abs(currentRgb.b - targetRgb.b);
        
        // Only blend if there's a significant color difference
        if (colorDistance > 3) {
          bubble.color = blendColors(bubble.color, bubble.targetColor, PHYSICS_CONFIG.colorSmoothingSpeed);
        }
      }
      
      // Smooth radius animation based on smoothed volume
      const maxVolume = Math.max(...Array.from(bubblesRef.current.values()).map(b => b.currentVolume), 1);
      bubble.targetRadius = calculateRadius(bubble.currentVolume, maxVolume);
      
      const radiusDiff = bubble.targetRadius - bubble.radius;
      if (Math.abs(radiusDiff) > 0.1) {
        bubble.radius = lerp(bubble.radius, bubble.targetRadius, PHYSICS_CONFIG.radiusSmoothingSpeed);
        bubble.mass = bubble.radius * bubble.radius; // Update mass
      }
    });
  }, [dimensions]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Render bubbles
    bubblesRef.current.forEach(bubble => {
      const isSelected = selectedTopicId === bubble.id;
      const scale = isSelected ? 1.1 : 1;
      const alpha = bubble.isDragging ? 0.8 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Draw shadow for selected bubble
      if (isSelected) {
        ctx.shadowColor = bubble.color;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Draw bubble
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = bubble.color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = bubble.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text with better contrast based on smoothed sentiment
      const fontSize = Math.max(8, bubble.radius / 3);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = bubble.currentSentiment > -0.1 && bubble.currentSentiment < 0.1 ? '#374151' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const maxWidth = bubble.radius * 1.6;
      const text = bubble.topic.label.length > 15 ? bubble.topic.label.substring(0, 15) + '...' : bubble.topic.label;
      ctx.fillText(text, bubble.x, bubble.y, maxWidth);

      ctx.restore();
    });
  }, [dimensions, selectedTopicId, getSentimentColor, calculateRadius]);

  // Animation loop
  const animate = useCallback(() => {
    const deltaTime = Math.min(1000 / PHYSICS_CONFIG.targetFPS, 16.67); // Cap at 60fps

    updatePhysics(deltaTime);
    render();

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updatePhysics, render]);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    mousePosition.current = { x: mouseX, y: mouseY };

    // Find clicked bubble
    for (const bubble of bubblesRef.current.values()) {
      const dist = distance({ x: mouseX, y: mouseY }, bubble);
      if (dist <= bubble.radius) {
        setIsMouseDown(true);
        setDraggedBubble(bubble.id);
        bubble.isDragging = true;
        bubble.dragOffsetX = mouseX - bubble.x;
        bubble.dragOffsetY = mouseY - bubble.y;
        
        // Bring to front by updating z-index (re-add to map)
        bubblesRef.current.delete(bubble.id);
        bubblesRef.current.set(bubble.id, bubble);
        
        event.preventDefault();
        return;
      }
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mousePosition.current = { 
      x: event.clientX - rect.left, 
      y: event.clientY - rect.top 
    };

    // Update cursor style
    if (draggedBubble) {
      canvas.style.cursor = 'grabbing';
    } else {
      // Check if hovering over a bubble
      let hovering = false;
      for (const bubble of bubblesRef.current.values()) {
        const dist = distance(mousePosition.current, bubble);
        if (dist <= bubble.radius) {
          hovering = true;
          break;
        }
      }
      canvas.style.cursor = hovering ? 'grab' : 'default';
    }
  }, [draggedBubble]);

  const handleMouseUp = useCallback(() => {
    if (draggedBubble) {
      const bubble = bubblesRef.current.get(draggedBubble);
      if (bubble) {
        bubble.isDragging = false;
        // Add some momentum based on drag
        bubble.vx *= PHYSICS_CONFIG.dragStrength;
        bubble.vy *= PHYSICS_CONFIG.dragStrength;
      }
      setDraggedBubble(null);
    }
    setIsMouseDown(false);
  }, [draggedBubble]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMouseDown) return; // Ignore clicks that are part of drag

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find clicked bubble
    for (const bubble of bubblesRef.current.values()) {
      const dist = distance({ x: mouseX, y: mouseY }, bubble);
      if (dist <= bubble.radius) {
        onBubbleClick(bubble.topic);
        return;
      }
    }
  }, [isMouseDown, onBubbleClick]);

  // Effects
  useEffect(() => {
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateDimensions]);

  useEffect(() => {
    initializeBubbles();
  }, [initializeBubbles]);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [animate, dimensions]);

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleMouseUp]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Sentiment Legend</h4>
        <div className="space-y-1 text-xs text-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgb(16, 185, 76)' }}></div>
            <span>Very Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
            <span>Positive</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgb(156, 163, 175)' }}></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
            <span>Negative</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'rgb(153, 27, 27)' }}></div>
            <span>Very Negative</span>
          </div>
          <div className="text-gray-500 mt-2 pt-1 border-t border-gray-200">
            Bubble size = post volume<br/>
            Drag bubbles to move them
          </div>
        </div>
      </div>

      {/* Performance indicator */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
        <p className="text-xs text-green-600 font-medium">
          ⚡ Advanced Physics Engine
        </p>
        <p className="text-xs text-gray-500">
          {topics.length} bubbles • 60fps
        </p>
      </div>
    </div>
  );
};
