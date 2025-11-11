import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TextError, analyzeTextForErrors, getErrorStyle, debounce } from '../lib/realtimeErrorDetection';

interface InlineErrorHighlighterProps {
  text: string;
  onErrorsDetected?: (errors: TextError[]) => void;
  onErrorClick?: (error: TextError) => void;
  highlightedErrorId?: string | null;
  className?: string;
  darkMode?: boolean;
}

interface TooltipState {
  visible: boolean;
  error: TextError | null;
  x: number;
  y: number;
}

export const InlineErrorHighlighter: React.FC<InlineErrorHighlighterProps> = ({
  text,
  onErrorsDetected,
  onErrorClick,
  highlightedErrorId,
  className = '',
  darkMode = false
}) => {
  const [errors, setErrors] = useState<TextError[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    error: null,
    x: 0,
    y: 0
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Debounced error analysis
  const analyzeText = useCallback(
    debounce((textContent: string) => {
      const detectedErrors = analyzeTextForErrors(textContent);
      setErrors(detectedErrors);
      if (onErrorsDetected) {
        onErrorsDetected(detectedErrors);
      }
    }, 500),
    [onErrorsDetected]
  );

  // Analyze text when it changes
  useEffect(() => {
    analyzeText(text);
  }, [text, analyzeText]);

  // Render text with highlighted errors
  const renderHighlightedText = () => {
    if (errors.length === 0) {
      return <span>{text}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

    sortedErrors.forEach((error, index) => {
      // Add text before error
      if (error.startIndex > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, error.startIndex)}
          </span>
        );
      }

      // Add highlighted error
      const style = getErrorStyle(error.category);
      const isHighlighted = highlightedErrorId === error.id;

      segments.push(
        <span
          key={`error-${error.id}`}
          className={`error-highlight ${style.className} ${isHighlighted ? 'highlighted-pulse' : ''}`}
          data-error-id={error.id}
          data-category={error.category}
          style={{
            textDecoration: `underline ${style.underlineStyle}`,
            textDecorationColor: style.color,
            textDecorationThickness: '2px',
            cursor: 'pointer',
            position: 'relative',
            backgroundColor: isHighlighted
              ? darkMode
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(59, 130, 246, 0.1)'
              : 'transparent',
            transition: 'background-color 0.3s ease',
            padding: '2px 0'
          }}
          onMouseEnter={(e) => handleErrorHover(e, error)}
          onMouseLeave={handleErrorLeave}
          onClick={() => handleErrorClick(error)}
        >
          {text.substring(error.startIndex, error.endIndex)}
        </span>
      );

      lastIndex = error.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  const handleErrorHover = (e: React.MouseEvent, error: TextError) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      error,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleErrorLeave = () => {
    setTooltip({
      visible: false,
      error: null,
      x: 0,
      y: 0
    });
  };

  const handleErrorClick = (error: TextError) => {
    if (onErrorClick) {
      onErrorClick(error);
    }
  };

  // Get icon for error category
  const getErrorIcon = (category: string) => {
    switch (category) {
      case 'spelling':
        return '✗';
      case 'grammar':
        return '⚠';
      case 'style':
        return '💡';
      default:
        return '•';
    }
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'spelling':
        return 'Spelling Error';
      case 'grammar':
        return 'Grammar Issue';
      case 'style':
        return 'Style Suggestion';
      default:
        return 'Issue';
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`inline-error-highlighter ${className}`}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.8',
          padding: '16px',
          minHeight: '200px'
        }}
      >
        {renderHighlightedText()}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.error && (
        <div
          ref={tooltipRef}
          className={`error-tooltip ${darkMode ? 'dark' : ''}`}
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div
            className="tooltip-content"
            style={{
              backgroundColor: darkMode ? '#1f2937' : 'white',
              color: darkMode ? '#f3f4f6' : '#1f2937',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              maxWidth: '300px',
              border: `2px solid ${getErrorStyle(tooltip.error.category).color}`,
              fontSize: '14px'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{getErrorIcon(tooltip.error.category)}</span>
              <span>{getCategoryLabel(tooltip.error.category)}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>{tooltip.error.message}</div>
            {tooltip.error.suggestion && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px 8px',
                  backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <strong>Suggestion:</strong> {tooltip.error.suggestion}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${getErrorStyle(tooltip.error.category).color}`
            }}
          />
        </div>
      )}

      <style>{`
        .error-highlight {
          transition: all 0.2s ease;
        }

        .error-highlight:hover {
          filter: brightness(1.1);
        }

        .highlighted-pulse {
          animation: pulse-highlight 1s ease-in-out;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(59, 130, 246, 0.3);
          }
        }

        .error-tooltip {
          animation: tooltip-fade-in 0.2s ease;
        }

        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, calc(-100% - 5px));
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }
      `}</style>
    </>
  );
};
