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

  useEffect(() => {
    analyzeText(text);
  }, [text, analyzeText]);

  const handleErrorHover = (e: React.MouseEvent<HTMLSpanElement>, error: TextError) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      error,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleErrorLeave = () => {
    setTooltip({ visible: false, error: null, x: 0, y: 0 });
  };

  const handleErrorClickInternal = (error: TextError) => {
    handleErrorLeave();
    if (onErrorClick) {
      onErrorClick(error);
    }
  };

  const renderHighlightedText = () => {
    if (errors.length === 0) {
      return <span>{text}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

    sortedErrors.forEach((error, index) => {
      if (error.startIndex > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, error.startIndex)}
          </span>
        );
      }

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
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(59, 130, 246, 0.15)'
              : 'transparent',
            transition: 'background-color 0.3s ease',
            padding: '2px 0',
            animation: isHighlighted ? 'pulse-highlight 1s ease-in-out 2' : 'none'
          }}
          onMouseEnter={(e) => handleErrorHover(e, error)}
          onMouseLeave={handleErrorLeave}
          onClick={() => handleErrorClickInternal(error)}
        >
          {text.substring(error.startIndex, error.endIndex)}
        </span>
      );

      lastIndex = error.endIndex;
    });

    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <>{segments}</>;
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`inline-error-highlighter ${className}`}
        style={{
          lineHeight: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {renderHighlightedText()}
      </div>

      {tooltip.visible && tooltip.error && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs ${
            darkMode
              ? 'bg-gray-900 text-gray-100 border border-gray-700'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            pointerEvents: 'none'
          }}
        >
          <div className="font-semibold mb-1">{tooltip.error.category.toUpperCase()}</div>
          <div className="text-xs">{tooltip.error.message}</div>
          {tooltip.error.suggestion && (
            <div className="mt-2 text-xs">
              <span className="font-medium">Suggestion:</span> {tooltip.error.suggestion}
            </div>
          )}
          <div
            className={`absolute w-2 h-2 rotate-45 bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 ${
              darkMode ? 'bg-gray-900 border-r border-b border-gray-700' : 'bg-white border-r border-b border-gray-200'
            }`}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse-highlight {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }

        .error-spelling {
          text-decoration-color: #ef4444 !important;
        }

        .error-grammar {
          text-decoration-color: #3b82f6 !important;
        }

        .error-style {
          text-decoration-color: #f97316 !important;
        }

        .highlighted-pulse {
          animation: pulse-highlight 1s ease-in-out 2;
        }
      `}</style>
    </>
  );
};
