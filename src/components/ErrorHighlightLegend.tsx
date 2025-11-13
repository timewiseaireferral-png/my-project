import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ErrorHighlightLegendProps {
  darkMode?: boolean;
  compact?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const ErrorHighlightLegend: React.FC<ErrorHighlightLegendProps> = ({
  darkMode = false,
  compact = false,
  onClose,
  showCloseButton = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const legendItems = [
    {
      color: '#ef4444',
      label: 'Spelling Error',
      underlineStyle: 'wavy',
      icon: <AlertCircle className="w-4 h-4" />,
      example: 'freind',
      description: 'Misspelled words'
    },
    {
      color: '#3b82f6',
      label: 'Grammar & Mechanics',
      underlineStyle: 'wavy',
      icon: <CheckCircle2 className="w-4 h-4" />,
      example: 'runned',
      description: 'Grammar, punctuation, verb tense'
    },
    {
      color: '#f97316',
      label: 'Style & Clarity',
      underlineStyle: 'dotted',
      icon: <Info className="w-4 h-4" />,
      example: 'very good',
      description: 'Word choice suggestions'
    }
  ];

  if (compact && !isExpanded) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
          darkMode
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(true)}
      >
        <Info className="w-4 h-4 text-blue-500" />
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Error Highlight Key
        </span>
        <span className="text-xs text-gray-500">Click to expand</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border shadow-sm ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className={`font-semibold text-sm ${
            darkMode ? 'text-gray-200' : 'text-gray-900'
          }`}>
            What do the highlights mean?
          </h3>
        </div>
        {(showCloseButton || (compact && isExpanded)) && (
          <button
            onClick={() => {
              if (compact) {
                setIsExpanded(false);
              }
              if (onClose) {
                onClose();
              }
            }}
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Legend Items */}
      <div className="p-4 space-y-3">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="mt-0.5 flex-shrink-0"
              style={{ color: item.color }}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-medium text-sm ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  {item.label}
                </span>
                {/* Example highlight */}
                <span
                  className="px-2 py-0.5 text-xs font-mono rounded"
                  style={{
                    textDecoration: `underline ${item.underlineStyle}`,
                    textDecorationColor: item.color,
                    textDecorationThickness: '2px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {item.example}
                </span>
              </div>
              <p className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}

        {/* Help text */}
        <div className={`mt-4 pt-3 border-t text-xs ${
          darkMode
            ? 'border-gray-700 text-gray-400'
            : 'border-gray-200 text-gray-600'
        }`}>
          <p className="flex items-start gap-2">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Hover</strong> over highlighted text to see details. Click on an error in the <strong>Detail</strong> tab to jump to it in your writing.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorHighlightLegend;
