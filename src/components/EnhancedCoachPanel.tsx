import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Lightbulb, BookOpen, Zap, CheckCircle, Wrench, Send } from 'lucide-react';
import { analyzeText } from '../lib/textAnalyzer';
import { analyzeContext } from '../lib/contextualAwareness';
import { enhancedIntelligentResponseGenerator, EnhancedCoachingContext } from '../lib/enhancedIntelligentResponseGenerator';

// Assuming these components exist in your project structure based on our previous analysis
import { GrammarCorrectionPanel } from './GrammarCorrectionPanel';
import { SentenceStructurePanel } from './SentenceStructurePanel';
import { WritingIssuesPanel } from './WritingIssuesPanel';
import { VocabularyEnhancementPanel } from './VocabularyEnhancementPanel';
import { RubricPanel } from './RubricPanel';


interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  priority?: 'high' | 'medium' | 'low';
}

interface EnhancedCoachPanelProps { // Renamed from EnhancedTabbedCoachPanelProps
  analysis?: any;
  onApplyFix?: (fix: string) => void;
  content: string;
  textType?: 'narrative' | 'persuasive' | 'expository' | 'descriptive' | 'creative';
  timeElapsed?: number;
  // Fix: Panel-Steps - Add currentWordCount prop
  currentWordCount: number;
}

export function EnhancedCoachPanel({ // Renamed from EnhancedTabbedCoachPanel
  analysis,
  onApplyFix,
  content,
  textType = 'narrative',
  timeElapsed = 0,
  currentWordCount, // Destructure currentWordCount directly
  ...props // Keep other props if needed, but currentWordCount is now separate
}: EnhancedCoachPanelProps) { // Renamed from EnhancedTabbedCoachPanelProps
  const [activeTab, setActiveTab] = useState('coach');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [dynamicExamples, setDynamicExamples] = useState<string[]>([]); // Fix: Panel-Examples - State for dynamic examples
  
  // CRIT-03 Fix: Implement useDebounce hook for real-time feedback
  const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  };


  
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

    // CRIT-03 Fix: Implement real-time feedback logic
  const debouncedContentChange = useDebounce(content, 1500); // Debounce content changes by 1.5s

  useEffect(() => {
    const contentWordCount = debouncedContentChange.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (contentWordCount > 50) { // Only trigger if content is substantial
      handleRealTimeFeedback();
      handleDynamicExamples(debouncedContentChange); // Fix: Panel-Examples - Trigger dynamic example generation
    }
  }, [debouncedContentChange]);

  const handleRealTimeFeedback = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const textAnalysis = analyzeText(content);
      const contextualState = analyzeContext(content, textAnalysis);

      const coachingContext: EnhancedCoachingContext = {
        textType: currentTextType,
        currentContent: content,
        analysis: textAnalysis,
        contextualState,
        timeElapsed,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length
      };

      const response = await enhancedIntelligentResponseGenerator.generateRealTimeTip(
        coachingContext
      );

      if (response && response.message) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `🤖 Real-Time Tip: ${response.message}`,
          isUser: false,
          timestamp: new Date(),
          priority: response.priority || 'low'
        };

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.text === aiMessage.text) {
            return prev;
          }
          return [...prev, aiMessage];
        });
      }

    } catch (error) {
      console.error('Error generating real-time feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix: Panel-Examples - Logic to generate dynamic examples
  const handleDynamicExamples = async (currentContent: string) => {
    if (currentContent.trim().length < 50) {
      setDynamicExamples([]);
      return;
    }

    try {
      // Placeholder for actual API call to generate examples
      // In a real scenario, this would call an LLM endpoint
      const mockExamples = [
        `Try a stronger verb: Replace "walked" with "trudged" or "sauntered" in your last sentence.`,
        `Consider a simile for your description: "The old house stood like a forgotten sentinel."`,
        `Improve your opening: Instead of "It was a dark and stormy night," try a more active start.`,
        `Add sensory detail: What does the air smell like in your current scene?`,
        `Vary your sentence structure: Start a sentence with a dependent clause.`,
      ];
      setDynamicExamples(mockExamples.slice(0, 3 + Math.floor(Math.random() * 3))); // 3-5 examples
    } catch (error) {
      console.error('Error generating dynamic examples:', error);
      setDynamicExamples([]);
    }
  };



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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const TabButton = ({ tabId, icon: Icon, label }: { tabId: string, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center justify-center flex-1 p-3 text-sm font-medium transition-colors duration-200 ${
        activeTab === tabId
          ? 'text-purple-600 border-b-2 border-purple-600 dark:text-purple-400 dark:border-purple-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </button>
  );

  const CoachMessage = ({ message }: { message: ChatMessage }) => {
    const baseClasses = "p-3 rounded-lg max-w-[80%] break-words";
    const userClasses = "bg-blue-500 text-white self-end rounded-br-none";
    const aiClasses = "bg-gray-100 text-gray-800 self-start rounded-tl-none dark:bg-slate-700 dark:text-gray-200";
    const priorityClasses = message.priority === 'high' ? 'border-l-4 border-red-500' :
                            message.priority === 'medium' ? 'border-l-4 border-yellow-500' : '';

    return (
      <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`${baseClasses} ${message.isUser ? userClasses : aiClasses} ${priorityClasses}`}>
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          <span className={`block text-xs mt-1 ${message.isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <TabButton tabId="coach" icon={MessageCircle} label="AI Coach" />
        <TabButton tabId="grammar" icon={CheckCircle} label="Grammar" />
        <TabButton tabId="vocab" icon={BookOpen} label="Vocabulary" />
        <TabButton tabId="rubric" icon={Target} label="Rubric" />
        <TabButton tabId="tools" icon={Wrench} label="Tools" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'coach' && (
          <div className="flex flex-col h-full">
            {/* Dynamic Examples/Tips */}
            {dynamicExamples.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800 mb-4">
                <h4 className="flex items-center text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                  <Lightbulb className="w-4 h-4 mr-2" /> Dynamic Writing Tips
                </h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
                  {dynamicExamples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3" ref={messagesEndRef}>
              {messages.map(msg => (
                <CoachMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-800 self-start rounded-tl-none dark:bg-slate-700 dark:text-gray-200">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      <span className="text-sm">Coach is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your coach a question..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 dark:disabled:bg-purple-800"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grammar' && (
          <GrammarCorrectionPanel
            content={content}
            analysis={analysis}
            onApplyFix={onApplyFix}
            currentWordCount={currentWordCount}
          />
        )}

        {activeTab === 'vocab' && (
          <VocabularyEnhancementPanel
            content={content}
            analysis={analysis}
            onApplyFix={onApplyFix}
            currentWordCount={currentWordCount}
          />
        )}

        {activeTab === 'rubric' && (
          <RubricPanel
            content={content}
            analysis={analysis}
            currentWordCount={currentWordCount}
          />
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            <SentenceStructurePanel
              content={content}
              analysis={analysis}
              currentWordCount={currentWordCount}
            />
            <WritingIssuesPanel
              content={content}
              analysis={analysis}
              currentWordCount={currentWordCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// export default EnhancedTabbedCoachPanel; // Commented out for renaming
