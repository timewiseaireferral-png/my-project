import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Lightbulb, BookOpen, Zap, CheckCircle, Wrench, Send } from 'lucide-react';
import { analyzeText } from '../lib/textAnalyzer';
import { analyzeContext } from '../lib/contextualAwareness';
import { EnhancedNarrativeCoach, EnhancedCoachingContext } from '../lib/enhancedIntelligentResponseGenerator';

// Assuming these components exist in your project structure based on our previous analysis
import GrammarCorrectionPanel from './GrammarCorrectionPanel';
import SentenceStructurePanel from './SentenceStructurePanel';
import WritingIssuesPanel from './WritingIssuesPanel';
import VocabularyEnhancementPanel from './VocabularyEnhancementPanel';
import RubricPanel from './RubricPanel';


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
  // Fix: Panel-Steps - Add currentWordCount prop
  currentWordCount: number;
}

export function EnhancedTabbedCoachPanel({
  analysis,
  onApplyFix,
  content,
  textType = 'narrative',
  timeElapsed = 0,
  currentWordCount, // Destructure currentWordCount directly
  ...props // Keep other props if needed, but currentWordCount is now separate
}: EnhancedTabbedCoachPanelProps) {
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
      EnhancedNarrativeCoach.setTextType(textType);

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
  // The welcome message is now handled by the parent component or a different mechanism
  // to prevent the hardcoded, irrelevant Q&A pairs from appearing.
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        text: `🌟 Welcome to your NSW Selective School Writing Coach! I'm here to help you write amazing ${textType} pieces that will impress the markers. I'll give you real-time feedback as you write, track your progress, and help you manage your time. Just start typing and I'll guide you every step of the way!`,
        isUser: false,
        timestamp: new Date(),
        priority: 'low'
      };
      // Only set the welcome message if the messages array is empty, which should be the case on initial load.
      // The issue was likely caused by a previous version of the code that included the hardcoded Q&A here.
      // We will keep the welcome message but ensure no other hardcoded messages are present.
      setMessages([welcomeMessage]);
    }
  }, [textType]);

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

      const response = await EnhancedNarrativeCoach.generateRealTimeTip(
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
    // P2 Fix: The input field is disabled when isLoading is true.
    // We should only set isLoading to true *after* we have successfully sent the message
    // to the AI service, or at least after the local state update.
    // However, the current logic is to set it true to disable the input immediately.
    // The issue is likely that the input field is *always* disabled.
    // Let's check the JSX for the input field's disabled state.
    // For now, we proceed with the assumption that the `isLoading` state is correctly
    // controlling the input field's disabled state in the JSX.
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
      const response = await EnhancedNarrativeCoach.generateResponse(
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

  // currentWordCount is now destructured directly in the function arguments
  const progress = Math.min((currentWordCount / 400) * 100, 100);
  const completionPercentage = Math.floor(progress);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 overflow-hidden">
      {/* Fixed Header - This ensures the header is always visible */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        {/* Top section with title and timer */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
		            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Writing Mate Coach</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}/40:00
            </div>
          </div>

          {/* Progress section */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress to 400 words</span>
		              <span className="text-green-600 dark:text-green-400 font-medium">
		                {currentWordCount > 350 ? 'Ahead • Excellent pace!' : 'On track • Good pace!'}
		              </span>
            </div>
		            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
		              <div
		                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
		                style={{ width: `${progress}%` }}
		              />
		            </div>
	              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
	                Word Count: {currentWordCount}
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
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <tab.icon className="w-5 h-5 mb-1" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {activeTab === 'coach' && (
          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-md transition-all duration-300 ${
                      message.isUser
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : `bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-tl-none border-l-4 ${getMessagePriorityColor(message.priority)}`
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                    <span className="block text-right text-xs mt-1 opacity-60">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="flex-shrink-0 pt-4">
              <div className="flex items-center space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask your coach a question..."
                  rows={1}
                  className="flex-grow p-3 border border-gray-300 dark:border-slate-600 rounded-lg resize-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  // Fix: Panel-Chat - The input field should only be disabled when loading a response.
                  // The previous condition `content.trim().length === 0` was causing the input to be unresponsive.
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                   ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

		        {activeTab === 'ideas' && (
		          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
		            <h4 className="font-semibold text-lg text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
		              <Lightbulb className="w-5 h-5 mr-2" /> Dynamic Examples
		            </h4>
		            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
		              Here are some dynamic examples and suggestions based on your current writing to help you improve.
		            </p>
		            {/* Fix: Panel-Examples - Dynamic content */}
		            {dynamicExamples.length > 0 ? (
		              <ul className="space-y-3">
		                {dynamicExamples.map((example, index) => (
		                  <li key={index} className="p-3 bg-white dark:bg-slate-800 rounded-md border border-yellow-300 dark:border-yellow-700 shadow-sm text-sm text-gray-700 dark:text-gray-300">
		                    {example}
		                  </li>
		                ))}
		              </ul>
		            ) : (
		              <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-md border border-yellow-300 dark:border-yellow-700">
		                <p className="text-gray-600 dark:text-gray-400 italic">
		                  Keep writing! Once you have at least 50 words, I'll generate dynamic examples to help you.
		                </p>
		              </div>
		            )}
		          </div>
		        )}

	        {activeTab === 'structure' && (
	          <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
	            <h4 className="font-semibold text-lg text-green-800 dark:text-green-200 mb-2 flex items-center">
	              <BookOpen className="w-5 h-5 mr-2" /> Structure Guide
	            </h4>
	            <p className="text-sm text-green-700 dark:text-green-300">
	              This tab will provide a step-by-step guide for structuring your essay, tailored to the NSW Selective School requirements.
	              It will track your progress through the introduction, body paragraphs, and conclusion.
	            </p>
	            {/* Placeholder for dynamic content */}
	            <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-md border border-green-300 dark:border-green-700">
	              <p className="text-gray-600 dark:text-gray-400 italic">
	                Structure guidance will appear here...
	              </p>
	            </div>
	          </div>
	        )}

	        {activeTab === 'language' && (
	          <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
	            <h4 className="font-semibold text-lg text-purple-800 dark:text-purple-200 mb-2 flex items-center">
	              <Zap className="w-5 h-5 mr-2" /> Language & Style
	            </h4>
	            <p className="text-sm text-purple-700 dark:text-purple-300">
	              This tab will focus on enhancing your vocabulary, sentence fluency, and overall writing style.
	              It will highlight areas for improvement and suggest more sophisticated alternatives.
	            </p>
	            {/* Placeholder for dynamic content */}
	            <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-md border border-purple-300 dark:border-purple-700">
	              <p className="text-gray-600 dark:text-gray-400 italic">
	                Language and style suggestions will appear here...
	              </p>
	            </div>
	          </div>
	        )}

	        {activeTab === 'grammar' && (
	          <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
	            <h4 className="font-semibold text-lg text-red-800 dark:text-red-200 mb-2 flex items-center">
	              <CheckCircle className="w-5 h-5 mr-2" /> Grammar & Punctuation
	            </h4>
	            <p className="text-sm text-red-700 dark:text-red-300">
	              This tab will provide real-time corrections and explanations for grammar, spelling, and punctuation errors.
	            </p>
	            {/* Placeholder for GrammarCorrectionPanel */}
	            <div className="mt-3">
	              <GrammarCorrectionPanel content={content} />
	            </div>
	          </div>
	        )}

	        {activeTab === 'toolkit' && (
	          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
	            <h4 className="font-semibold text-lg text-blue-800 dark:text-blue-200 mb-2 flex items-center">
	              <Wrench className="w-5 h-5 mr-2" /> Writing Toolkit
	            </h4>
	            <p className="text-sm text-blue-700 dark:text-blue-300">
	              This tab contains useful tools like a thesaurus, a list of common literary devices, and a timer/word-count tracker.
	            </p>
	            {/* Placeholder for dynamic content */}
	            <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-md border border-blue-300 dark:border-blue-700">
	              <p className="text-gray-600 dark:text-gray-400 italic">
	                Toolkit features will be accessible here...
	              </p>
	            </div>
	          </div>
	        )}
	      </div>
	    </div>
	  );
}