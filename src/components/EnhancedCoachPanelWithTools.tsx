/**
 * Enhanced Coach Panel with Writing Tools
 *
 * This component wraps the existing EnhancedCoachPanel and adds:
 * 1. Writing type-specific tools (Story Mountain, Persuasive Flow, Sensory Explorer)
 * 2. Enhanced AI feedback using dynamic content
 * 3. Literary techniques, dialogue examples, and emotion vocabulary
 *
 * The layout remains unchanged - we add a new "Tools" tab alongside Coach and NSW Criteria
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, BarChart3, Lightbulb, Wrench, Star, TrendingUp, Award } from 'lucide-react';
import { StoryMountainTool } from './writing-tools/StoryMountainTool';
import { PersuasiveFlowTool } from './writing-tools/PersuasiveFlowTool';
import { SensoryExplorerTool } from './writing-tools/SensoryExplorerTool';
import { generateEnhancedFeedback, type EnhancedFeedback, type FeedbackSuggestion } from '../lib/enhancedAIFeedback';

interface EnhancedCoachPanelWithToolsProps {
  content: string;
  textType: string;
  timerSeconds: number;
  onInsertText?: (text: string) => void;
}

type ViewMode = 'coach' | 'nsw' | 'tools';

interface CoachMessage {
  type: 'user' | 'response';
  content: any;
  timestamp: Date;
  enhancedFeedback?: EnhancedFeedback;
}

export function EnhancedCoachPanelWithTools({
  content,
  textType,
  timerSeconds,
  onInsertText
}: EnhancedCoachPanelWithToolsProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('coach');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [lastContentLength, setLastContentLength] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate feedback when content changes significantly
  useEffect(() => {
    const contentDiff = Math.abs(wordCount - lastContentLength);

    // Only trigger feedback if significant content added (every 25 words)
    if (contentDiff >= 25 && content.trim()) {
      setLastContentLength(wordCount);

      const enhancedFeedback = generateEnhancedFeedback(content, textType, wordCount);

      setMessages(prev => [...prev, {
        type: 'response',
        content: {
          encouragement: getEncouragement(wordCount),
          overall: enhancedFeedback.overall
        },
        timestamp: new Date(),
        enhancedFeedback
      }]);
    }
  }, [wordCount]);

  const getEncouragement = (count: number): string => {
    if (count < 50) return "Great start! Keep going! 🌟";
    if (count < 150) return "Excellent progress! 📝";
    if (count < 300) return "You're doing amazing! 🎯";
    return "Fantastic work! 🏆";
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, {
        type: 'user',
        content: inputValue,
        timestamp: new Date()
      }]);

      // Generate contextual response
      setTimeout(() => {
        const enhancedFeedback = generateEnhancedFeedback(content, textType, wordCount);

        setMessages(prev => [...prev, {
          type: 'response',
          content: {
            encouragement: "Great question! 🤔",
            overall: "I'm here to help! " + enhancedFeedback.overall
          },
          timestamp: new Date(),
          enhancedFeedback
        }]);
      }, 500);

      setInputValue('');
    }
  };

  const renderSuggestion = (suggestion: FeedbackSuggestion, index: number) => {
    const typeColors = {
      literary_technique: 'from-purple-400 to-pink-500',
      dialogue: 'from-blue-400 to-cyan-500',
      emotion_vocabulary: 'from-green-400 to-teal-500',
      sentence_starter: 'from-yellow-400 to-orange-500',
      structure: 'from-red-400 to-rose-500'
    };

    const typeIcons = {
      literary_technique: '✨',
      dialogue: '💬',
      emotion_vocabulary: '❤️',
      sentence_starter: '📝',
      structure: '🏗️'
    };

    return (
      <div
        key={index}
        className={`bg-gradient-to-r ${typeColors[suggestion.type]} text-white p-3 rounded-lg mb-2`}
      >
        <div className="flex items-start gap-2 mb-1">
          <span className="text-lg">{typeIcons[suggestion.type]}</span>
          <div className="flex-1">
            <div className="font-bold text-sm mb-1">{suggestion.title}</div>
            <div className="text-xs opacity-90 mb-2">{suggestion.description}</div>

            {suggestion.examples.length > 0 && (
              <div className="space-y-1 mb-2">
                <div className="text-xs font-semibold">Examples:</div>
                {suggestion.examples.map((example, exIndex) => (
                  <div
                    key={exIndex}
                    className="text-xs bg-white/20 backdrop-blur-sm p-2 rounded cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() => onInsertText && onInsertText(example + ' ')}
                  >
                    {example}
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs bg-white/10 p-2 rounded">
              <strong>💡 Try this:</strong> {suggestion.actionable}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEnhancedFeedback = (enhancedFeedback: EnhancedFeedback) => {
    return (
      <div className="mt-2 space-y-2">
        {/* Strengths */}
        {enhancedFeedback.strengths.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2 rounded">
            <div className="font-semibold text-xs text-green-800 dark:text-green-300 mb-1 flex items-center gap-1">
              <span>✅</span> Strengths
            </div>
            <ul className="space-y-0.5">
              {enhancedFeedback.strengths.map((strength, index) => (
                <li key={index} className="text-xs text-green-700 dark:text-green-400">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {enhancedFeedback.suggestions.length > 0 && (
          <div>
            <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">
              💡 Suggestions to enhance your writing:
            </div>
            {enhancedFeedback.suggestions.map((suggestion, index) =>
              renderSuggestion(suggestion, index)
            )}
          </div>
        )}

        {/* Areas to Improve */}
        {enhancedFeedback.areasToImprove.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2 rounded">
            <div className="font-semibold text-xs text-yellow-800 dark:text-yellow-300 mb-1 flex items-center gap-1">
              <span>🎯</span> Areas to Focus On
            </div>
            <ul className="space-y-0.5">
              {enhancedFeedback.areasToImprove.map((area, index) => (
                <li key={index} className="text-xs text-yellow-700 dark:text-yellow-400">
                  • {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {enhancedFeedback.nextSteps.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 rounded">
            <div className="font-semibold text-xs text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
              <span>🚀</span> Next Steps
            </div>
            <ul className="space-y-0.5">
              {enhancedFeedback.nextSteps.map((step, index) => (
                <li key={index} className="text-xs text-blue-700 dark:text-blue-400">
                  {index + 1}. {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderWritingTools = () => {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Tool selection based on writing type */}
          {textType === 'narrative' && (
            <StoryMountainTool onInsertText={onInsertText} />
          )}

          {textType === 'persuasive' && (
            <PersuasiveFlowTool onInsertText={onInsertText} />
          )}

          {(textType === 'descriptive' || textType === 'narrative') && (
            <SensoryExplorerTool onInsertText={onInsertText} />
          )}

          {/* If no specific tool, show general guidance */}
          {!['narrative', 'persuasive', 'descriptive'].includes(textType) && (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                Writing Tools
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a writing type to access specialized tools!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header with Three Tabs */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Writing Buddy</h2>
          <div className="text-sm opacity-90">
            {wordCount} words
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-1">
          <button
            onClick={() => setCurrentView('coach')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentView === 'coach'
                ? 'bg-white text-blue-600'
                : 'bg-blue-500/50 text-white hover:bg-blue-400'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>AI Coach</span>
          </button>

          <button
            onClick={() => setCurrentView('tools')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentView === 'tools'
                ? 'bg-white text-purple-600'
                : 'bg-purple-500/50 text-white hover:bg-purple-400'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>Tools</span>
          </button>

          <button
            onClick={() => setCurrentView('nsw')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentView === 'nsw'
                ? 'bg-white text-green-600'
                : 'bg-green-500/50 text-white hover:bg-green-400'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Progress</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'coach' && (
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Start writing to get personalized feedback!</p>
                  <p className="text-xs mt-2">I'll analyze your work and give you helpful tips.</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`${message.type === 'user' ? 'ml-6' : 'mr-6'}`}>
                  {message.type === 'user' ? (
                    <div className="bg-blue-500 text-white p-2 rounded-lg rounded-br-none text-sm">
                      {message.content}
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🤖</span>
                        </div>
                        <span className="font-semibold text-sm text-gray-800 dark:text-white">
                          {message.content.encouragement}
                        </span>
                      </div>

                      {message.content.overall && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {message.content.overall}
                        </div>
                      )}

                      {message.enhancedFeedback && renderEnhancedFeedback(message.enhancedFeedback)}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'tools' && renderWritingTools()}

        {currentView === 'nsw' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Progress tracking coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
