import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lightbulb, Sparkles, BookOpen, Target, AlertCircle, CheckCircle, X, Wand2, MessageSquare, Star } from 'lucide-react';
import { generateChatResponse } from '../lib/openai';

interface Suggestion {
  id: string;
  type: 'vocabulary' | 'grammar' | 'structure' | 'content' | 'style';
  original: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
  confidence: number;
  ageAppropriate: boolean;
}

interface EnhancedInlineSuggestionsProps {
  content: string;
  textType: string;
  onContentChange: (newContent: string) => void;
  isEnabled: boolean;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
}

export function EnhancedInlineSuggestions({
  content,
  textType,
  onContentChange,
  isEnabled,
  assistanceLevel
}: EnhancedInlineSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Age-appropriate vocabulary suggestions for 10-12 year olds
  const ageAppropriateVocabulary = {
    basic: {
      'said': ['whispered', 'exclaimed', 'muttered', 'declared', 'announced'],
      'good': ['excellent', 'wonderful', 'fantastic', 'remarkable', 'outstanding'],
      'bad': ['poor', 'disappointing', 'concerning', 'inadequate', 'troubling'],
      'big': ['enormous', 'massive', 'gigantic', 'tremendous', 'substantial'],
      'small': ['tiny', 'miniature', 'compact', 'petite', 'minute'],
      'happy': ['joyful', 'delighted', 'cheerful', 'elated', 'thrilled'],
      'sad': ['unhappy', 'gloomy', 'dejected', 'sorrowful', 'melancholy'],
      'nice': ['pleasant', 'delightful', 'charming', 'lovely', 'agreeable'],
      'walk': ['stroll', 'amble', 'stride', 'march', 'wander'],
      'run': ['dash', 'sprint', 'race', 'hurry', 'bolt'],
      'look': ['gaze', 'stare', 'observe', 'examine', 'peer'],
      'think': ['believe', 'consider', 'ponder', 'reflect', 'wonder']
    }
  };

  // Debounced content analysis
  const analyzeContent = useCallback(async (text: string) => {
    if (!isEnabled || text.length < 10 || text === lastAnalyzedContent) return;
    
    setIsAnalyzing(true);
    
    try {
      // Generate AI-powered suggestions
      const aiSuggestions = await generateAISuggestions(text, textType, assistanceLevel);
      
      // Combine with vocabulary suggestions
      const vocabSuggestions = generateVocabularySuggestions(text);
      
      // Merge and prioritize suggestions
      const allSuggestions = [...aiSuggestions, ...vocabSuggestions]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Limit to top 5 suggestions to avoid overwhelming
      
      setSuggestions(allSuggestions);
      setLastAnalyzedContent(text);
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isEnabled, textType, assistanceLevel, lastAnalyzedContent]);

  // Debounce content analysis
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      analyzeContent(content);
    }, 1500); // Wait 1.5 seconds after user stops typing
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, analyzeContent]);

  // Generate AI-powered suggestions
  const generateAISuggestions = async (text: string, textType: string, level: string): Promise<Suggestion[]> => {
    try {
      const prompt = `Analyze this ${textType} writing by a 10-12 year old preparing for NSW Selective School test. Provide 3-5 specific, actionable suggestions focusing on:

1. Content & Ideas: Originality, development, depth
2. Structure: Paragraphing, flow, narrative arc
3. Language: Sentence variety, vocabulary, figurative language
4. NSW Selective criteria: Creative ideas, fluent language, clear structure

Text: "${text}"

Assistance level: ${level}

Return suggestions in this format:
TYPE|ORIGINAL_TEXT|SUGGESTION|EXPLANATION|START_POS|END_POS|CONFIDENCE

Focus on age-appropriate, encouraging feedback that builds confidence while improving writing quality.`;

      const response = await generateChatResponse({
        userMessage: prompt,
        textType,
        currentContent: text,
        wordCount: text.split(/\s+/).length,
        context: 'Inline suggestion analysis for NSW Selective test preparation'
      });

      return parseAISuggestions(response, text);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  };

  // Parse AI response into suggestion objects
  const parseAISuggestions = (response: string, text: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const lines = response.split('\n').filter(line => line.includes('|'));
    
    lines.forEach((line, index) => {
      const parts = line.split('|');
      if (parts.length >= 6) {
        const [type, original, suggestion, explanation, startStr, endStr, confidenceStr] = parts;
        
        // Find the position of the original text in the content
        const start = text.toLowerCase().indexOf(original.toLowerCase());
        if (start !== -1) {
          suggestions.push({
            id: `ai-${index}`,
            type: type.toLowerCase() as any,
            original: original.trim(),
            suggestion: suggestion.trim(),
            explanation: explanation.trim(),
            position: { start, end: start + original.length },
            confidence: parseFloat(confidenceStr) || 0.8,
            ageAppropriate: true
          });
        }
      }
    });
    
    return suggestions;
  };

  // Generate vocabulary suggestions
  const generateVocabularySuggestions = (text: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (ageAppropriateVocabulary.basic[cleanWord]) {
        const alternatives = ageAppropriateVocabulary.basic[cleanWord];
        const start = text.toLowerCase().indexOf(cleanWord);
        
        if (start !== -1) {
          suggestions.push({
            id: `vocab-${index}`,
            type: 'vocabulary',
            original: cleanWord,
            suggestion: alternatives.join(', '),
            explanation: `Try using a more descriptive word instead of "${cleanWord}" to make your writing more engaging for selective school readers.`,
            position: { start, end: start + cleanWord.length },
            confidence: 0.7,
            ageAppropriate: true
          });
        }
      }
    });
    
    return suggestions.slice(0, 3); // Limit vocabulary suggestions
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion, event: React.MouseEvent) => {
    setActiveSuggestion(suggestion);
    
    // Calculate popup position
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
  };

  // Apply suggestion
  const applySuggestion = (suggestion: Suggestion, selectedText: string) => {
    const { start, end } = suggestion.position;
    const newContent = content.substring(0, start) + selectedText + content.substring(end);
    onContentChange(newContent);
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    setActiveSuggestion(null);
    setPopupPosition(null);
  };

  // Close popup
  const closePopup = () => {
    setActiveSuggestion(null);
    setPopupPosition(null);
  };

  // Render highlighted content with suggestions
  const renderHighlightedContent = () => {
    if (!content || suggestions.length === 0) {
      return content;
    }

    let highlightedContent = content;
    const sortedSuggestions = [...suggestions].sort((a, b) => b.position.start - a.position.start);
    
    sortedSuggestions.forEach((suggestion) => {
      const { start, end } = suggestion.position;
      const original = highlightedContent.substring(start, end);
      const highlighted = `<span class="inline-suggestion ${suggestion.type}" data-suggestion-id="${suggestion.id}">${original}</span>`;
      highlightedContent = highlightedContent.substring(0, start) + highlighted + highlightedContent.substring(end);
    });

    return highlightedContent;
  };

  return (
    <div className="relative">
      {/* Suggestion indicators */}
      {suggestions.length > 0 && (
        <div className="mb-2 flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-blue-600 font-medium">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} available
            </span>
          </div>
          {isAnalyzing && (
            <div className="flex items-center space-x-1 text-gray-500">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-xs">Analyzing...</span>
            </div>
          )}
        </div>
      )}

      {/* Inline suggestion highlights */}
      <div className="relative">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            className={`absolute z-10 px-2 py-1 text-xs rounded shadow-lg border-2 transition-all duration-200 hover:scale-105 ${
              suggestion.type === 'vocabulary' ? 'bg-blue-100 border-blue-300 text-blue-800' :
              suggestion.type === 'grammar' ? 'bg-red-100 border-red-300 text-red-800' :
              suggestion.type === 'structure' ? 'bg-green-100 border-green-300 text-green-800' :
              suggestion.type === 'content' ? 'bg-purple-100 border-purple-300 text-purple-800' :
              'bg-yellow-100 border-yellow-300 text-yellow-800'
            }`}
            style={{
              left: `${(suggestion.position.start / content.length) * 100}%`,
              top: '-30px'
            }}
            onClick={(e) => handleSuggestionClick(suggestion, e)}
            title={suggestion.explanation}
          >
            <div className="flex items-center space-x-1">
              {suggestion.type === 'vocabulary' && <BookOpen className="w-3 h-3" />}
              {suggestion.type === 'grammar' && <AlertCircle className="w-3 h-3" />}
              {suggestion.type === 'structure' && <Target className="w-3 h-3" />}
              {suggestion.type === 'content' && <Star className="w-3 h-3" />}
              {suggestion.type === 'style' && <Wand2 className="w-3 h-3" />}
              <span className="font-medium">{suggestion.type}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Suggestion popup */}
      {activeSuggestion && popupPosition && (
        <SuggestionPopup
          suggestion={activeSuggestion}
          position={popupPosition}
          onApply={applySuggestion}
          onClose={closePopup}
        />
      )}

      <style jsx>{`
        .inline-suggestion {
          background-color: rgba(59, 130, 246, 0.1);
          border-bottom: 2px dotted #3b82f6;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .inline-suggestion:hover {
          background-color: rgba(59, 130, 246, 0.2);
        }
        .inline-suggestion.vocabulary {
          border-bottom-color: #3b82f6;
        }
        .inline-suggestion.grammar {
          border-bottom-color: #ef4444;
        }
        .inline-suggestion.structure {
          border-bottom-color: #10b981;
        }
        .inline-suggestion.content {
          border-bottom-color: #8b5cf6;
        }
        .inline-suggestion.style {
          border-bottom-color: #f59e0b;
        }
      `}</style>
    </div>
  );
}

// Suggestion popup component
interface SuggestionPopupProps {
  suggestion: Suggestion;
  position: { x: number; y: number };
  onApply: (suggestion: Suggestion, selectedText: string) => void;
  onClose: () => void;
}

function SuggestionPopup({ suggestion, position, onApply, onClose }: SuggestionPopupProps) {
  const [selectedOption, setSelectedOption] = useState('');
  
  useEffect(() => {
    const options = suggestion.suggestion.split(',').map(s => s.trim());
    setSelectedOption(options[0] || suggestion.suggestion);
  }, [suggestion]);

  const suggestionOptions = suggestion.suggestion.includes(',') 
    ? suggestion.suggestion.split(',').map(s => s.trim())
    : [suggestion.suggestion];

  const getIcon = () => {
    switch (suggestion.type) {
      case 'vocabulary': return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'grammar': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'structure': return <Target className="w-4 h-4 text-green-600" />;
      case 'content': return <Star className="w-4 h-4 text-purple-600" />;
      case 'style': return <Wand2 className="w-4 h-4 text-yellow-600" />;
      default: return <Lightbulb className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (suggestion.type) {
      case 'vocabulary': return 'blue';
      case 'grammar': return 'red';
      case 'structure': return 'green';
      case 'content': return 'purple';
      case 'style': return 'yellow';
      default: return 'gray';
    }
  };

  const color = getTypeColor();

  return (
    <div
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className={`p-3 bg-${color}-50 border-b border-${color}-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <h3 className={`font-semibold text-${color}-800 capitalize`}>
              {suggestion.type} Suggestion
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:bg-${color}-100 rounded`}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Original:</p>
          <p className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded">
            "{suggestion.original}"
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Suggestion:</p>
          {suggestionOptions.length > 1 ? (
            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              {suggestionOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded">
              {suggestion.suggestion}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">Why this helps:</p>
          <p className="text-xs text-gray-700 leading-relaxed">
            {suggestion.explanation}
          </p>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => onApply(suggestion, selectedOption)}
            className={`flex-1 py-2 px-3 bg-${color}-600 text-white rounded hover:bg-${color}-700 text-sm font-medium transition-colors`}
          >
            Apply Change
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}