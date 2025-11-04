import React, { useState, useRef, useEffect } from 'react';
import { TextHighlight, analyzeText, AnalysisStats } from '../lib/realtimeTextAnalyzer';

interface HighlightedTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onStatsUpdate?: (stats: AnalysisStats) => void;
  darkMode?: boolean;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  placeholder?: string;
  minWords?: number;
  disabled?: boolean;
}

export function HighlightedTextArea({
  value,
  onChange,
  onStatsUpdate,
  darkMode = false,
  fontSize = 16,
  fontFamily = 'Inter',
  lineHeight = 1.6,
  placeholder = 'Start writing...',
  minWords = 50,
  disabled = false
}: HighlightedTextAreaProps) {
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [hoveredHighlight, setHoveredHighlight] = useState<TextHighlight | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout>();

  // Analyze text with debouncing
  useEffect(() => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
    }

    analysisTimerRef.current = setTimeout(() => {
      if (value) {
        const { highlights: newHighlights, stats } = analyzeText(value);
        setHighlights(newHighlights);
        if (onStatsUpdate) {
          onStatsUpdate(stats);
        }
      } else {
        setHighlights([]);
        if (onStatsUpdate) {
          onStatsUpdate({
            grammar: 0,
            weakWords: 0,
            passiveVoice: 0,
            excessiveAdjectives: 0,
            sentenceIssues: 0,
            spelling: 0
          });
        }
      }
    }, 500);

    return () => {
      if (analysisTimerRef.current) {
        clearTimeout(analysisTimerRef.current);
      }
    };
  }, [value, onStatsUpdate]);

  // Sync scroll between textarea and overlay
  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Handle mouse move for tooltips
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textareaRef.current) return;

    const rect = textareaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + textareaRef.current.scrollLeft;
    const y = e.clientY - rect.top + textareaRef.current.scrollTop;

    // Get character position
    const textArea = textareaRef.current;
    const { selectionStart } = textArea;

    // Find if cursor is over a highlight
    const hovered = highlights.find(h => {
      const mousePos = getCharacterPositionFromCoordinates(x, y);
      return mousePos >= h.start && mousePos <= h.end;
    });

    if (hovered) {
      setHoveredHighlight(hovered);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredHighlight(null);
    }
  };

  // Approximate character position from mouse coordinates
  const getCharacterPositionFromCoordinates = (x: number, y: number): number => {
    if (!textareaRef.current) return 0;

    // Simple approximation based on font metrics
    const charWidth = fontSize * 0.6;
    const lineHeightPx = fontSize * lineHeight;

    const line = Math.floor(y / lineHeightPx);
    const col = Math.floor(x / charWidth);

    const lines = value.split('\n');
    let position = 0;

    for (let i = 0; i < line && i < lines.length; i++) {
      position += lines[i].length + 1; // +1 for newline
    }

    position += Math.min(col, lines[line]?.length || 0);

    return position;
  };

  // Render highlighted text for overlay
  const renderHighlightedText = () => {
    if (!value) return null;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`} className="text-transparent">
            {value.substring(lastIndex, highlight.start)}
          </span>
        );
      }

      // Add highlighted text
      const highlightClass = `highlight-${highlight.type.replace(/-/g, '_')}`;
      elements.push(
        <span
          key={`highlight-${idx}`}
          className={`${highlightClass} highlight-base`}
          style={{
            backgroundColor: `${highlight.color}33`,
            borderBottom: `2px wavy ${highlight.color}`
          }}
          data-tooltip={highlight.message}
        >
          {value.substring(highlight.start, highlight.end)}
        </span>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      elements.push(
        <span key="text-end" className="text-transparent">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="relative w-full h-full">
      {/* Overlay with highlights */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          lineHeight: `${lineHeight}`,
          padding: '12px',
          color: 'transparent',
          zIndex: 1
        }}
        aria-hidden="true"
      >
        {renderHighlightedText()}
      </div>

      {/* Actual textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onMouseMove={handleMouseMove}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-full resize-none border-0 focus:outline-none focus:ring-0 relative ${
          darkMode ? 'bg-slate-900 text-gray-100' : 'bg-white text-gray-900'
        }`}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          lineHeight: `${lineHeight}`,
          padding: '12px',
          zIndex: 2,
          background: 'transparent',
          color: darkMode ? '#f3f4f6' : '#111827',
          caretColor: darkMode ? '#f3f4f6' : '#111827'
        }}
      />

      {/* Tooltip */}
      {hoveredHighlight && (
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 40}px`,
            pointerEvents: 'none'
          }}
        >
          <div className="flex items-start space-x-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: hoveredHighlight.color }}
            />
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider mb-1">
                {hoveredHighlight.type.replace(/-/g, ' ')}
              </div>
              <div>{hoveredHighlight.message}</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .highlight-base {
          position: relative;
          border-bottom-style: wavy;
        }

        textarea::placeholder {
          color: ${darkMode ? '#6b7280' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
}
