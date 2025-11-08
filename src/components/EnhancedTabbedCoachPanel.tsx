import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Lightbulb, BookOpen, Zap, CheckCircle, Wrench, Send } from 'lucide-react';
import { analyzeText } from '../lib/textAnalyzer';
import { analyzeContext } from '../lib/contextualAwareness';
import { enhancedIntelligentResponseGenerator, EnhancedCoachingContext } from '../lib/enhancedIntelligentResponseGenerator';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  priority?: 'high' | 'medium' | 'low';
}

interface EnhancedTabbedCoachPanelProps {
  analysis?: any;
  onApplyFix?: (fix: string) => void;
  content: string;
  textType?: 'narrative' | 'persuasive' | 'expository' | 'descriptive' | 'creative';
  timeElapsed?: number;
}

export function FixedEnhancedTabbedCoachPanel({
  analysis,
  onApplyFix,
  content,
  textType = 'narrative',
  timeElapsed = 0
}: EnhancedTabbedCoachPanelProps) {
  const [activeTab, setActiveTab] = useState('coach');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTextType, setCurrentTextType] = useState(textType);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update text type when prop changes
  useEffect(() => {
    if (textType !== currentTextType) {
      setCurrentTextType(textType);
      enhancedIntelligentResponseGenerator.setTextType(textType);

      // Add a system message about the genre change
      const genreChangeMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `🔄 Switched to ${textType} writing mode. I'm now ready to help you with ${textType}-specific guidance!`,
        isUser: false,
        timestamp: new Date(),
        priority: 'medium'
      };
      setMessages(prev => [...prev, genreChangeMessage]);
    }
  }, [textType, currentTextType]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        text: `🌟 Welcome to your NSW Selective School Writing Coach! I'm here to help you write amazing ${textType} pieces that will impress the markers. I'll give you real-time feedback as you write, track your progress, and help you manage your time. Just start typing and I'll guide you every step of the way!`,
        isUser: false,
        timestamp: new Date(),
        priority: 'low'
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Analyze current content
      const textAnalysis = analyzeText(content);
      const contextualState = analyzeContext(content, textAnalysis);

      // Create enhanced coaching context
      const coachingContext: EnhancedCoachingContext = {
        textType: currentTextType,
        currentContent: content,
        analysis: textAnalysis,
        contextualState,
        timeElapsed,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length
      };

      // Generate response using enhanced generator
      const response = await enhancedIntelligentResponseGenerator.generateResponse(
        inputMessage,
        coachingContext
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        priority: response.priority
      };

      setMessages(prev => [...prev, aiMessage]);

      // Add additional tips if available
      if (response.genreSpecificTips && response.genreSpecificTips.length > 0) {
        const tipsMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: `💡 Quick Tips:\n• ${response.genreSpecificTips.join('\n• ')}`,
          isUser: false,
          timestamp: new Date(),
          priority: 'low'
        };
        setMessages(prev => [...prev, tipsMessage]);
      }

      // Add structure guidance if available
      if (response.structureGuidance) {
        const structureMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          text: `📚 Next Steps:\n${response.structureGuidance}`,
          isUser: false,
          timestamp: new Date(),
          priority: response.priority
        };
        setMessages(prev => [...prev, structureMessage]);
      }

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now, but keep writing! You're doing great.",
        isUser: false,
        timestamp: new Date(),
        priority: 'low'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const tabs = [
    { id: 'coach', label: 'Coach', icon: MessageCircle },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'structure', label: 'Structure', icon: BookOpen },
    { id: 'language', label: 'Language', icon: Zap },
    { id: 'grammar', label: 'Grammar', icon: CheckCircle },
    { id: 'toolkit', label: 'Toolkit', icon: Wrench }
  ];

  const getMessagePriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-50';
      case 'medium': return 'border-l-blue-400 bg-blue-50';
      default: return 'border-l-gray-300 bg-gray-50';
    }
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const progress = Math.min((wordCount / 400) * 100, 100);
  const completionPercentage = Math.floor(progress);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 overflow-hidden">
      {/* Fixed Header - This ensures the header is always visible */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        {/* Top section with title and timer */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Coach</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}/40:00
            </div>
          </div>

          {/* Progress section */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress to 400 words</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {wordCount > 350 ? 'Ahead • Excellent pace!' : 'On track • Good pace!'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <tab.icon className="w-5 h-5 mb-1" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coach' && (
          <div className="h-full flex flex-col">
            {/* Chat header */}
            <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-b dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">NSW Writing Coach</h4>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-blue-600 dark:text-blue-400">0 tips given</span>
                <span className="text-green-600 dark:text-green-400">{completionPercentage}% complete</span>
              </div>
            </div>

            {/* Messages - This is the scrollable area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : `border-l-4 ${getMessagePriorityColor(message.priority)} text-gray-800 dark:text-gray-200 dark:bg-slate-700`
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {message.priority && !message.isUser && (
                        <span className="ml-2 font-medium">{message.priority}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about writing, or just keep typing..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💡 Try asking: "How can I improve this sentence?" or "What should I write next?"
                <span className="float-right">
                  Time: {Math.floor((40 * 60 - timeElapsed) / 60)}:{((40 * 60 - timeElapsed) % 60).toString().padStart(2, '0')} left • Words: {wordCount}/400
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content */}
        {activeTab !== 'coach' && (
          <div className="p-4 h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🚧</div>
              <p className="dark:text-gray-300">This tab is under development</p>
              <p className="text-sm mt-1 dark:text-gray-400">Focus on the Coach tab for now!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}