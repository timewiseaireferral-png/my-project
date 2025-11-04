import React, { useEffect, useRef } from 'react';
import { MessageCircle, Bot, User, Clock, CheckCircle, Lightbulb, Star } from 'lucide-react';

interface FeedbackMessage {
  id: string;
  paragraph: string;
  feedback: string;
  timestamp: Date;
  type: 'praise' | 'suggestion' | 'improvement';
  paragraphNumber: number;
}

// Alternative interface for compatibility with CoachProvider
interface FeedbackMsg {
  id: string;
  paragraph: string;
  feedback: string;
  ts: number;
}

interface FeedbackChatProps {
  feedbackMessages?: FeedbackMessage[];
  messages?: FeedbackMsg[];
  isLoading?: boolean;
  className?: string;
}

export function FeedbackChat({ 
  feedbackMessages, 
  messages,
  isLoading = false, 
  className = "" 
}: FeedbackChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Normalize messages from either prop
  const normalizedMessages: FeedbackMessage[] = React.useMemo(() => {
    if (feedbackMessages) {
      return feedbackMessages;
    }
    
    if (messages) {
      return messages.map((msg, index) => ({
        id: msg.id,
        paragraph: msg.paragraph || '',
        feedback: msg.feedback || '',
        timestamp: new Date(msg.ts),
        type: 'suggestion' as const,
        paragraphNumber: index + 1
      }));
    }
    
    return [];
  }, [feedbackMessages, messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [normalizedMessages]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'praise':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'improvement':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMessageBorderColor = (type: string) => {
    switch (type) {
      case 'praise':
        return 'border-l-green-400';
      case 'suggestion':
        return 'border-l-blue-400';
      case 'improvement':
        return 'border-l-purple-400';
      default:
        return 'border-l-gray-400';
    }
  };

  return (
    <div className={`feedback-chat-container h-full flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <Bot className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Writing Mate Chat</h3>
        <div className="flex-1"></div>
        {isLoading && (
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {normalizedMessages.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Start writing and I'll give you helpful feedback on each paragraph! ✨
            </p>
          </div>
        ) : (
          normalizedMessages.map((message) => (
            <div key={message.id} className="space-y-2">
              {/* User's paragraph context */}
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="bg-white rounded-lg p-3 shadow-sm border max-w-full">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      Paragraph {message.paragraphNumber}
                    </span>
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 italic">
                    "{(message.paragraph && message.paragraph.length > 100) 
                      ? message.paragraph.substring(0, 100) + '...' 
                      : (message.paragraph || 'No content')}"
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="flex items-start space-x-2">
                <Bot className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${getMessageBorderColor(message.type)} max-w-full`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getMessageIcon(message.type)}
                    <span className="text-xs font-medium text-gray-600 capitalize">
                      {message.type === 'praise' ? 'Great job!' : 
                       message.type === 'suggestion' ? 'Suggestion' : 'Improvement tip'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {message.feedback || 'No feedback available'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <Bot className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
            <div className="bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="rounded-full bg-blue-300 h-2 w-2"></div>
                  <div className="rounded-full bg-blue-300 h-2 w-2"></div>
                  <div className="rounded-full bg-blue-300 h-2 w-2"></div>
                </div>
                <span className="text-xs text-gray-500">Writing Mate is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Footer */}
      <div className="p-2 bg-white border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Keep writing to get more helpful feedback!
        </p>
      </div>
    </div>
  );
}

// Export both interfaces for compatibility
export type { FeedbackMessage, FeedbackMsg };