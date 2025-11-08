import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Bot,
  User,
  Send,
  Lightbulb,
  Star,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  WritingBuddyService,
  SupportLevel,
  WritingBuddyPreferences,
} from '../lib/writingBuddyService';
import { buildTieredPrompt } from '../lib/tieredPrompts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  supportLevel?: SupportLevel;
  feedbackId?: string;
}

interface TieredFeedbackChatProps {
  textType?: string;
  currentContent?: string;
  wordCount?: number;
  onFeedbackReceived?: (feedback: string) => void;
  className?: string;
}

export const TieredFeedbackChat: React.FC<TieredFeedbackChatProps> = ({
  textType = 'narrative',
  currentContent = '',
  wordCount = 0,
  onFeedbackReceived,
  className = '',
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<WritingBuddyPreferences | null>(
    null
  );
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
      addWelcomeMessage();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const prefs = await WritingBuddyService.getUserPreferences(user.id);
      setPreferences(prefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessages: Record<SupportLevel, string> = {
      'High Support':
        "Hi there! 👋 I'm your Writing Mate! I'm here to help you write an amazing story. Ask me anything, and I'll guide you step by step! 🌟",
      'Medium Support':
        "Hello! 😊 I'm your AI Writing Mate. I'm here to help you improve your writing with suggestions and examples. What would you like to work on?",
      'Low Support':
        "Welcome! I'm your writing coach. Feel free to ask about any aspect of your writing, and I'll provide thoughtful guidance to help you refine your work.",
    };

    const level = preferences?.support_level || 'Medium Support';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessages[level],
        timestamp: new Date(),
        supportLevel: level,
      },
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || !user || !preferences) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stage =
        wordCount < 50
          ? 'just starting'
          : wordCount < 150
          ? 'developing ideas'
          : 'refining and expanding';

      const response = await fetch('/.netlify/functions/chat-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: input.trim(),
          textType,
          currentContent,
          wordCount,
          supportLevel: preferences.support_level,
          stage,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        supportLevel: preferences.support_level,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (user) {
        const feedbackId = await WritingBuddyService.recordFeedbackSession({
          userId: user.id,
          supportLevel: preferences.support_level,
          feedbackType: 'chat',
          studentText: input.trim(),
          feedbackText: data.response,
          textType,
          sessionId,
        });

        if (feedbackId) {
          assistantMessage.feedbackId = feedbackId;
        }
      }

      if (onFeedbackReceived) {
        onFeedbackReceived(data.response);
      }
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          "I'm having trouble right now, but I'm here to help! Can you try asking your question again? 😊",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRateFeedback = async (
    feedbackId: string,
    isHelpful: boolean
  ) => {
    if (!user) return;

    try {
      await WritingBuddyService.rateFeedback(
        feedbackId,
        isHelpful ? 5 : 1,
        isHelpful
      );
    } catch (err) {
      console.error('Error rating feedback:', err);
    }
  };

  const getSupportLevelIcon = (level?: SupportLevel) => {
    switch (level) {
      case 'High Support':
        return <GraduationCap className="w-4 h-4" />;
      case 'Medium Support':
        return <TrendingUp className="w-4 h-4" />;
      case 'Low Support':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getSupportLevelColor = (level?: SupportLevel) => {
    switch (level) {
      case 'High Support':
        return 'bg-green-50 border-green-200';
      case 'Medium Support':
        return 'bg-blue-50 border-blue-200';
      case 'Low Support':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="text-center py-8">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            Please sign in to chat with your Writing Mate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Writing Mate</h3>
        </div>
        {preferences && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSupportLevelColor(
              preferences.support_level
            )}`}
          >
            {getSupportLevelIcon(preferences.support_level)}
            <span className="ml-1">{preferences.support_level}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Start writing and ask me anything! I'm here to help.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-lg px-4 py-2'
                  : `${getSupportLevelColor(
                      message.supportLevel
                    )} border rounded-lg px-4 py-3`
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center mb-2">
                  {getSupportLevelIcon(message.supportLevel)}
                  <span className="ml-2 text-xs font-medium text-gray-600">
                    Writing Mate
                  </span>
                </div>
              )}

              <p
                className={`text-sm leading-relaxed ${
                  message.role === 'user' ? 'text-white' : 'text-gray-800'
                }`}
              >
                {message.content}
              </p>

              {message.role === 'assistant' && message.feedbackId && (
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-600">Was this helpful?</span>
                  <button
                    onClick={() =>
                      handleRateFeedback(message.feedbackId!, true)
                    }
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                    title="Yes, helpful"
                  >
                    <ThumbsUp className="w-3 h-3 text-green-600" />
                  </button>
                  <button
                    onClick={() =>
                      handleRateFeedback(message.feedbackId!, false)
                    }
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="rounded-full bg-blue-400 h-2 w-2"></div>
                  <div className="rounded-full bg-blue-400 h-2 w-2"></div>
                  <div className="rounded-full bg-blue-400 h-2 w-2"></div>
                </div>
                <span className="text-xs text-gray-600">
                  Writing Mate is thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your writing..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {wordCount > 0
            ? `Current word count: ${wordCount} words`
            : 'Start writing to get feedback!'}
        </p>
      </div>
    </div>
  );
};
