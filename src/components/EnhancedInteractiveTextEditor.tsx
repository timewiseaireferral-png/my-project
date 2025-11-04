import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle, Lightbulb, BookOpen } from 'lucide-react';

interface EnhancedInteractiveTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAnalyze?: (text: string) => void;
  suggestions?: string[];
  grammarErrors?: Array<{
    text: string;
    suggestion: string;
    position: number;
  }>;
}

export const EnhancedInteractiveTextEditor: React.FC<EnhancedInteractiveTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  onAnalyze,
  suggestions = [],
  grammarErrors = []
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (onAnalyze && newValue.length > 10) {
      onAnalyze(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Words: {wordCount}
            </span>
            {grammarErrors.length > 0 && (
              <div className="flex items-center space-x-1 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{grammarErrors.length} issues</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {suggestions.length > 0 && (
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Suggestions</span>
              </button>
            )}
            <BookOpen className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-64 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          spellCheck={true}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="border-t border-gray-200 bg-blue-50 p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-1" />
              Writing Suggestions
            </h4>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-blue-700 flex items-start">
                  <Check className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {grammarErrors.length > 0 && (
          <div className="border-t border-gray-200 bg-orange-50 p-4">
            <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Grammar & Spelling
            </h4>
            <ul className="space-y-1">
              {grammarErrors.slice(0, 3).map((error, index) => (
                <li key={index} className="text-sm text-orange-700">
                  <span className="font-medium">"{error.text}"</span> → {error.suggestion}
                </li>
              ))}
              {grammarErrors.length > 3 && (
                <li className="text-sm text-orange-600">
                  +{grammarErrors.length - 3} more issues
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};