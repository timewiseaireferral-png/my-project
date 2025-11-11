import React, { useState, useRef, useCallback } from 'react';
import { InlineErrorHighlighter } from './InlineErrorHighlighter';
import { ErrorSidebarSync } from './ErrorSidebarSync';
import { TextError } from '../lib/realtimeErrorDetection';

interface RealtimeErrorWritingEditorProps {
  initialText?: string;
  darkMode?: boolean;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export const RealtimeErrorWritingEditor: React.FC<RealtimeErrorWritingEditorProps> = ({
  initialText = '',
  darkMode = false,
  onTextChange,
  placeholder = 'Start writing...',
  className = ''
}) => {
  const [text, setText] = useState(initialText);
  const [errors, setErrors] = useState<TextError[]>([]);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [highlightedErrorId, setHighlightedErrorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mechanics' | 'style'>('mechanics');
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightContainerRef = useRef<HTMLDivElement>(null);

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  // Handle errors detected
  const handleErrorsDetected = useCallback((detectedErrors: TextError[]) => {
    const filteredErrors = detectedErrors.filter(
      error => !dismissedErrors.has(error.id)
    );
    setErrors(filteredErrors);
  }, [dismissedErrors]);

  // Handle error click from highlighter
  const handleErrorClickFromEditor = (error: TextError) => {
    setHighlightedErrorId(error.id);

    // Switch to appropriate tab
    if (error.category === 'spelling' || error.category === 'grammar') {
      setActiveTab('mechanics');
    } else {
      setActiveTab('style');
    }

    // Clear highlight after animation
    setTimeout(() => {
      setHighlightedErrorId(null);
    }, 2000);
  };

  // Handle error click from sidebar
  const handleErrorClickFromSidebar = (error: TextError) => {
    setHighlightedErrorId(error.id);

    // Scroll to error in editor
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(error.startIndex, error.endIndex);

      // Calculate scroll position
      const lineHeight = 24;
      const lines = text.substring(0, error.startIndex).split('\n').length;
      const scrollPosition = (lines - 1) * lineHeight;
      textarea.scrollTop = Math.max(0, scrollPosition - textarea.clientHeight / 2);
    }

    // Clear highlight after animation
    setTimeout(() => {
      setHighlightedErrorId(null);
    }, 2000);
  };

  // Handle error dismissal
  const handleDismissError = (errorId: string) => {
    setDismissedErrors(prev => new Set([...prev, errorId]));
    setErrors(prev => prev.filter(e => e.id !== errorId));
  };

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightContainerRef.current) {
      highlightContainerRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightContainerRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const visibleErrors = errors.filter(e => !dismissedErrors.has(e.id));

  return (
    <div className={`realtime-error-editor flex gap-4 ${className}`}>
      {/* Main Editor Area */}
      <div className="flex-1 relative">
        <div
          className={`editor-container relative rounded-lg border-2 ${
            isFocused
              ? darkMode
                ? 'border-blue-500'
                : 'border-blue-400'
              : darkMode
              ? 'border-gray-700'
              : 'border-gray-300'
          } ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden transition-colors`}
          style={{ minHeight: '500px' }}
        >
          {/* Highlight Layer (Behind) */}
          <div
            ref={highlightContainerRef}
            className="highlight-layer absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              padding: '16px',
              fontFamily: 'inherit',
              fontSize: '16px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'transparent',
              zIndex: 1
            }}
          >
            <InlineErrorHighlighter
              text={text}
              onErrorsDetected={handleErrorsDetected}
              onErrorClick={handleErrorClickFromEditor}
              highlightedErrorId={highlightedErrorId}
              darkMode={darkMode}
            />
          </div>

          {/* Textarea (On Top) */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onScroll={handleScroll}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`editor-textarea relative w-full h-full resize-none outline-none ${
              darkMode
                ? 'bg-transparent text-gray-100 placeholder-gray-500'
                : 'bg-transparent text-gray-900 placeholder-gray-400'
            }`}
            style={{
              padding: '16px',
              fontFamily: 'inherit',
              fontSize: '16px',
              lineHeight: '1.8',
              minHeight: '500px',
              zIndex: 2,
              caretColor: darkMode ? '#60a5fa' : '#3b82f6'
            }}
          />

          {/* Error Count Badge */}
          {visibleErrors.length > 0 && (
            <div
              className={`absolute bottom-4 right-4 px-3 py-2 rounded-lg shadow-lg ${
                darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
              } border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
              style={{ zIndex: 3 }}
            >
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-1">
                  {errors.some(e => e.category === 'spelling' || e.category === 'grammar') && (
                    <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold">
                      {errors.filter(e => e.category === 'spelling' || e.category === 'grammar').length} mechanics
                    </span>
                  )}
                  {errors.some(e => e.category === 'style') && (
                    <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                      {errors.filter(e => e.category === 'style').length} style
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className={`mt-3 flex items-center gap-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-red-500" style={{ borderBottom: '2px wavy red' }}></div>
            <span>Spelling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-blue-500" style={{ borderBottom: '2px wavy blue' }}></div>
            <span>Grammar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-0.5 bg-orange-500" style={{ borderBottom: '2px dotted orange' }}></div>
            <span>Style</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 flex-shrink-0">
        <div
          className={`sticky top-4 rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          } p-4 shadow-lg`}
        >
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Writing Assistant
          </h3>
          <ErrorSidebarSync
            errors={visibleErrors}
            onErrorClick={handleErrorClickFromSidebar}
            onDismissError={handleDismissError}
            highlightedErrorId={highlightedErrorId}
            darkMode={darkMode}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      <style>{`
        .realtime-error-editor {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .editor-textarea {
          background: transparent !important;
        }

        .editor-textarea::placeholder {
          opacity: 0.5;
        }

        /* Custom scrollbar for textarea */
        .editor-textarea::-webkit-scrollbar {
          width: 10px;
        }

        .editor-textarea::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f3f4f6'};
        }

        .editor-textarea::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4b5563' : '#d1d5db'};
          border-radius: 5px;
        }

        .editor-textarea::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6b7280' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
};
