import React, { useEffect, useRef } from 'react';
import { AlertCircle, Lightbulb, BookOpen, X } from 'lucide-react';
import { TextError, groupErrorsByCategory } from '../lib/realtimeErrorDetection';

interface ErrorSidebarSyncProps {
  errors: TextError[];
  onErrorClick: (error: TextError) => void;
  onDismissError: (errorId: string) => void;
  highlightedErrorId?: string | null;
  darkMode?: boolean;
  activeTab?: 'mechanics' | 'style';
  onTabChange?: (tab: 'mechanics' | 'style') => void;
}

export const ErrorSidebarSync: React.FC<ErrorSidebarSyncProps> = ({
  errors,
  onErrorClick,
  onDismissError,
  highlightedErrorId,
  darkMode = false,
  activeTab = 'mechanics',
  onTabChange
}) => {
  const errorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const groupedErrors = groupErrorsByCategory(errors);

  // Scroll to highlighted error when it changes
  useEffect(() => {
    if (highlightedErrorId && errorRefs.current[highlightedErrorId]) {
      const element = errorRefs.current[highlightedErrorId];
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [highlightedErrorId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spelling':
        return <AlertCircle className="w-5 h-5" />;
      case 'grammar':
        return <BookOpen className="w-5 h-5" />;
      case 'style':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spelling':
        return 'red';
      case 'grammar':
        return 'blue';
      case 'style':
        return 'orange';
      default:
        return 'gray';
    }
  };

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

  const renderErrorCard = (error: TextError) => {
    const color = getCategoryColor(error.category);
    const isHighlighted = highlightedErrorId === error.id;

    const colorClasses = {
      red: {
        bg: darkMode ? 'bg-red-900/20' : 'bg-red-50',
        border: darkMode ? 'border-red-800' : 'border-red-200',
        text: darkMode ? 'text-red-400' : 'text-red-600',
        hover: darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'
      },
      blue: {
        bg: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
        border: darkMode ? 'border-blue-800' : 'border-blue-200',
        text: darkMode ? 'text-blue-400' : 'text-blue-600',
        hover: darkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100'
      },
      orange: {
        bg: darkMode ? 'bg-orange-900/20' : 'bg-orange-50',
        border: darkMode ? 'border-orange-800' : 'border-orange-200',
        text: darkMode ? 'text-orange-400' : 'text-orange-600',
        hover: darkMode ? 'hover:bg-orange-900/30' : 'hover:bg-orange-100'
      },
      gray: {
        bg: darkMode ? 'bg-gray-900/20' : 'bg-gray-50',
        border: darkMode ? 'border-gray-800' : 'border-gray-200',
        text: darkMode ? 'text-gray-400' : 'text-gray-600',
        hover: darkMode ? 'hover:bg-gray-900/30' : 'hover:bg-gray-100'
      }
    };

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

    return (
      <div
        key={error.id}
        ref={(el) => errorRefs.current[error.id] = el}
        className={`border-2 rounded-lg p-4 mb-3 cursor-pointer transition-all duration-300 ${colors.bg} ${colors.border} ${colors.hover} ${
          isHighlighted ? 'error-card-pulse ring-2 ring-blue-500' : ''
        }`}
        onClick={() => onErrorClick(error)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={colors.text}>
              {getCategoryIcon(error.category)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${colors.text} uppercase`}>
                  {getCategoryLabel(error.category)}
                </span>
              </div>
              <div className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {error.message}
              </div>
              <div className={`text-xs font-mono p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${colors.border}`}>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Found: </span>
                <span className={`font-semibold ${colors.text}`}>"{error.text}"</span>
              </div>
              {error.suggestion && (
                <div className={`text-xs mt-2 p-2 rounded ${darkMode ? 'bg-green-900/20' : 'bg-green-50'} border ${darkMode ? 'border-green-800' : 'border-green-200'}`}>
                  <span className={darkMode ? 'text-green-400' : 'text-green-600'}>
                    <strong>Suggestion:</strong> {error.suggestion}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismissError(error.id);
            }}
            className={`p-1 rounded ${colors.hover} ${colors.text} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const mechanicsErrors = [...groupedErrors.spelling, ...groupedErrors.grammar];
  const styleErrors = groupedErrors.style;

  return (
    <div className={`error-sidebar ${darkMode ? 'dark' : ''}`}>
      {/* Tabs */}
      <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-4`}>
        <button
          onClick={() => onTabChange?.('mechanics')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'mechanics'
              ? darkMode
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'border-b-2 border-blue-600 text-blue-600'
              : darkMode
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Mechanics</span>
            {mechanicsErrors.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                {mechanicsErrors.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => onTabChange?.('style')}
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === 'style'
              ? darkMode
                ? 'border-b-2 border-orange-500 text-orange-400'
                : 'border-b-2 border-orange-600 text-orange-600'
              : darkMode
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span>Style & Flow</span>
            {styleErrors.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                darkMode ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                {styleErrors.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="error-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {activeTab === 'mechanics' && (
          <div>
            {mechanicsErrors.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No spelling or grammar issues detected!</p>
                <p className="text-xs mt-1">Great job!</p>
              </div>
            ) : (
              mechanicsErrors.map(error => renderErrorCard(error))
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div>
            {styleErrors.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No style suggestions at the moment!</p>
                <p className="text-xs mt-1">Your writing flows well!</p>
              </div>
            ) : (
              styleErrors.map(error => renderErrorCard(error))
            )}
          </div>
        )}
      </div>

      <style>{`
        .error-card-pulse {
          animation: card-pulse 1s ease-in-out;
        }

        @keyframes card-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .error-sidebar .error-list::-webkit-scrollbar {
          width: 8px;
        }

        .error-sidebar .error-list::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f3f4f6'};
          border-radius: 4px;
        }

        .error-sidebar .error-list::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4b5563' : '#d1d5db'};
          border-radius: 4px;
        }

        .error-sidebar .error-list::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6b7280' : '#9ca3af'};
        }
      `}</style>
    </div>
  );
};
