import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageSquare, BarChart3, Lightbulb, Target, Star, TrendingUp, Award, List, BookOpen, AlertCircle, Loader2, FileCheck, Sparkles, AlignLeft, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { StepByStepWritingBuilder } from './StepByStepWritingBuilder';
import { ContextualAICoachPanel } from './ContextualAICoachPanel';
import { ComprehensiveFeedbackDisplay } from './ComprehensiveFeedbackDisplay';
import { GrammarCorrectionPanel } from './GrammarCorrectionPanel';
import { VocabularyEnhancementPanel } from './VocabularyEnhancementPanel';
import { SentenceStructurePanel } from './SentenceStructurePanel';
import { generateIntelligentResponse, type EnhancedCoachResponse } from '../lib/enhancedIntelligentResponseGenerator';
import { ComprehensiveFeedbackAnalyzer } from '../lib/comprehensiveFeedbackAnalyzer';
import { generateDynamicExamples, formatExamplesForDisplay } from '../lib/dynamicExampleGenerator';
import { ChatSessionService } from '../lib/chatSessionService';
import { NSW_MARKING_CRITERIA, generateScoringGuidance, mapToNSWScores, getImprovementExamples } from '../lib/nswMarkingCriteria';
import { NSWCriteriaCompact, NSWCriteriaDisplay } from './NSWCriteriaDisplay';
import { WRITING_MATE_SIDEBAR_CONTENT } from '../lib/textTypeContent'; // <-- NEW IMPORT

/**
 * Generates time-appropriate coaching messages for 40-minute writing test
 */
function getTimeAwareMessage(seconds: number, wordCount: number) {
  const minutes = Math.floor(seconds / 60);
  const timeRemaining = Math.max(0, 40 - minutes);

  // Calculate expected words (target: 250 words in 40 mins = 6.25 words/min)
  const expectedWords = Math.floor((250 / 40) * minutes);
  const wordsAheadBehind = wordCount - expectedWords;

  // Determine pace
  let paceEmoji = '✅';
  let paceMessage = "You're on track!";

  if (wordsAheadBehind > 50) {
    paceEmoji = '🚀';
    paceMessage = "Great pace! You're ahead of schedule.";
  } else if (wordsAheadBehind < -50 && minutes > 10) {
    paceEmoji = '⏰';
    paceMessage = "Let's pick up the pace a bit!";
  }

  // Time-based messages
  let timeMessage = '';
  let urgency = 'low';

  if (minutes < 10) {
    timeMessage = "Great start! Focus on getting your ideas flowing.";
  } else if (minutes < 20) {
    timeMessage = "Good progress! Keep developing your ideas.";
  } else if (minutes < 30) {
    timeMessage = "You're doing well! Start thinking about your conclusion.";
    urgency = 'medium';
  } else if (minutes < 35) {
    timeMessage = "Time to wrap up! Focus on a strong ending.";
    urgency = 'medium';
  } else if (minutes < 40) {
    timeMessage = "Final minutes! Review and polish your work.";
    urgency = 'high';
  } else {
    timeMessage = "Time's up! Great effort!";
    urgency = 'complete';
  }

  return {
    minutes,
    timeRemaining,
    timeMessage,
    paceEmoji,
    paceMessage,
    urgency
  };
}

/**
 * Determines the current writing phase based on word count
 * Helps students understand what they should focus on at each stage
 */
function getWritingPhase(wordCount: number) {
  if (wordCount === 0) {
    return {
      phase: 'not-started',
      name: 'Getting Started',
      emoji: '🚀',
      color: 'bg-gray-50 border-gray-200',
      darkColor: 'dark:bg-gray-800 dark:border-gray-700',
      textColor: 'text-gray-700',
      darkTextColor: 'dark:text-gray-300',
      focus: 'Begin writing your opening',
      guidance: 'Hook your reader and set the scene'
    };
  }

  if (wordCount < 50) {
    return {
      phase: 'opening',
      name: 'Opening',
      emoji: '📖',
      color: 'bg-blue-50 border-blue-200',
      darkColor: 'dark:bg-blue-900/20 dark:border-blue-800',
      textColor: 'text-blue-700',
      darkTextColor: 'dark:text-blue-300',
      focus: 'Hook the reader and introduce your topic',
      guidance: 'Set the scene, introduce character/topic, grab attention'
    };
  }

  if (wordCount < 150) {
    return {
      phase: 'development',
      name: 'Development',
      emoji: '🌱',
      color: 'bg-green-50 border-green-200',
      darkColor: 'dark:bg-green-900/20 dark:border-green-800',
      textColor: 'text-green-700',
      darkTextColor: 'dark:text-green-300',
      focus: 'Develop your ideas with details',
      guidance: 'Add descriptions, examples, dialogue, or evidence'
    };
  }

  if (wordCount < 250) {
    return {
      phase: 'rising-action',
      name: 'Rising Action',
      emoji: '⚡',
      color: 'bg-purple-50 border-purple-200',
      darkColor: 'dark:bg-purple-900/20 dark:border-purple-800',
      textColor: 'text-purple-700',
      darkTextColor: 'dark:text-purple-300',
      focus: 'Build tension and complexity',
      guidance: 'Deepen ideas, add complications, build to climax'
    };
  }

  return {
    phase: 'conclusion',
    name: 'Conclusion',
    emoji: '🎯',
    color: 'bg-orange-50 border-orange-200',
    darkColor: 'dark:bg-orange-900/20 dark:border-orange-800',
    textColor: 'text-orange-700',
    darkTextColor: 'dark:text-orange-300',
    focus: 'Wrap up your writing',
    guidance: 'Provide resolution, final thoughts, satisfying ending'
  };
}

// NSW Criteria Analysis Engine (preserved from original)
class NSWCriteriaAnalyzer {
  static analyzeContent(content: string, textType: string) {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    
    return {
      ideas: this.analyzeIdeasAndContent(content, textType, wordCount),
      language: this.analyzeLanguageAndVocabulary(content, wordCount),
      structure: this.analyzeStructureAndOrganization(content, wordCount),
      grammar: this.analyzeGrammarAndSpelling(content)
    };
  }

  static analyzeIdeasAndContent(content: string, textType: string, wordCount: number) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    // Basic content check
    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your ideas assessment!"],
        improvements: ["Begin by addressing the prompt and developing your main ideas."]
      };
    }

    // Check for prompt engagement
    const hasPromptElements = content.toLowerCase().includes('key') || 
                             content.toLowerCase().includes('chest') || 
                             content.toLowerCase().includes('grandmother') ||
                             content.toLowerCase().includes('attic');
    
    if (hasPromptElements) {
      score += 1;
      feedback.push("Great! You're engaging with the prompt elements.");
    } else {
      improvements.push("Try to include more elements from the writing prompt in your story.");
    }

    // Check for descriptive details
    const descriptiveWords = ['beautiful', 'mysterious', 'shimmering', 'dusty', 'ornate', 'magical'];
    const hasDescriptiveLanguage = descriptiveWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (hasDescriptiveLanguage) {
      score += 1;
      feedback.push("Excellent use of descriptive language to bring your story to life!");
    } else {
      improvements.push("Add more descriptive words to help readers visualize your story.");
    }

    // Check for character development
    const hasCharacterEmotions = content.toLowerCase().includes('felt') || 
                                content.toLowerCase().includes('excited') ||
                                content.toLowerCase().includes('nervous') ||
                                content.toLowerCase().includes('curious');

    if (hasCharacterEmotions) {
      score += 1;
      feedback.push("Nice work showing character emotions and feelings!");
    } else {
      improvements.push("Include more about how your character feels to create emotional connection.");
    }

    // Word count assessment
    if (wordCount >= 200) {
      score += 1;
      feedback.push("Good length - you're developing your ideas well!");
    } else if (wordCount >= 100) {
      improvements.push("Try to expand your ideas with more details and examples.");
    } else {
      improvements.push("Your story needs more development. Aim for at least 200 words.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }

  static analyzeLanguageAndVocabulary(content: string, wordCount: number) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your language assessment!"],
        improvements: ["Begin writing to analyze your vocabulary and language use."]
      };
    }

    // Check for varied vocabulary
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyVariety = uniqueWords.size / words.length;

    if (vocabularyVariety > 0.7) {
      score += 2;
      feedback.push("Excellent vocabulary variety! You're using diverse words effectively.");
    } else if (vocabularyVariety > 0.5) {
      score += 1;
      feedback.push("Good vocabulary variety. Keep expanding your word choices!");
      improvements.push("Try to avoid repeating the same words too often.");
    } else {
      improvements.push("Work on using more varied vocabulary to make your writing more interesting.");
    }

    // Check for sophisticated words
    const sophisticatedWords = ['magnificent', 'extraordinary', 'mysterious', 'shimmering', 'ornate', 'ancient', 'whispered', 'discovered'];
    const hasSophisticatedVocab = sophisticatedWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );

    if (hasSophisticatedVocab) {
      score += 1;
      feedback.push("Great use of sophisticated vocabulary!");
    } else {
      improvements.push("Try using more advanced vocabulary words to enhance your writing.");
    }

    // Check for sentence variety (basic check)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;

    if (avgSentenceLength > 8 && avgSentenceLength < 20) {
      score += 1;
      feedback.push("Nice sentence variety and length!");
    } else {
      improvements.push("Try varying your sentence lengths - mix short and longer sentences.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }

  static analyzeStructureAndOrganization(content: string, wordCount: number) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    if (wordCount === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your structure assessment!"],
        improvements: ["Begin writing to analyze your structure and organization."]
      };
    }

    // Check for clear opening/closing (basic check)
    const hasClearOpening = content.length > 50 && content.includes('One') || content.includes('In a place');
    const hasClearClosing = content.length > 150 && content.includes('Finally') || content.includes('From that day forward');

    if (hasClearOpening) {
      score += 1;
      feedback.push("Your opening sets the scene well!");
    } else {
      improvements.push("Work on a stronger opening to hook the reader.");
    }

    if (hasClearClosing) {
      score += 1;
      feedback.push("Your conclusion provides a satisfying resolution.");
    } else {
      improvements.push("Plan your ending to ensure a clear resolution to the conflict.");
    }

    // Check for paragraphing
    const paragraphs = content.split(/\n\s*\n/);
    if (paragraphs.length > 2 && wordCount / paragraphs.length < 100) {
      score += 1;
      feedback.push("Good use of paragraphing to organize your ideas.");
    } else {
      improvements.push("Ensure each new idea or shift in action starts a new paragraph.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }

  static analyzeGrammarAndSpelling(content: string) {
    let score = 1;
    let feedback = [];
    let improvements = [];

    if (content.trim().length === 0) {
      return {
        score: 1,
        feedback: ["Start writing to see your grammar assessment!"],
        improvements: ["Begin writing to analyze your grammar and spelling."]
      };
    }

    // Basic spelling check (simulated)
    const misspelledWords = ['teh', 'becuase', 'recieve', 'wierd'];
    const hasMisspelling = misspelledWords.some(word => content.toLowerCase().includes(word));

    if (!hasMisspelling) {
      score += 2;
      feedback.push("Excellent! Your spelling is accurate.");
    } else {
      improvements.push("Check your spelling for common errors like 'teh' or 'becuase'.");
    }

    // Basic grammar check (simulated)
    const grammarErrors = ['I was went', 'he go', 'they is'];
    const hasGrammarError = grammarErrors.some(error => content.toLowerCase().includes(error));

    if (!hasGrammarError) {
      score += 2;
      feedback.push("Great! Your sentence structure and grammar are strong.");
    } else {
      improvements.push("Review your verb tenses and subject-verb agreement.");
    }

    return {
      score: Math.min(score, 5),
      feedback,
      improvements
    };
  }
}


// Component Definition
export const EnhancedCoachPanel = ({
  textType,
  content,
  writingPrompt,
  wordCount,
  analysis,
  user,
  darkMode,
  openAIConnected,
  openAILoading,
  onAnalysisUpdate,
  onApplyFix,
  selectedText,
  isFocusMode,
}) => {
  const [currentView, setCurrentView] = useState<'coach' | 'chat' | 'examples' | 'builder' | 'detailed' | 'grammar' | 'vocabulary' | 'sentences'>('coach');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuickQueriesOpen, setIsQuickQueriesOpen] = useState(false);
  const [comprehensiveFeedback, setComprehensiveFeedback] = useState(null);
  const messagesEndRef = useRef(null);
  const responseStartTime = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [dynamicExamples, setDynamicExamples] = useState(null);

  // NEW: Get dynamic sidebar content based on textType
  const sidebarContent = useMemo(() => {
    return WRITING_MATE_SIDEBAR_CONTENT[textType as keyof typeof WRITING_MATE_SIDEBAR_CONTENT] || WRITING_MATE_SIDEBAR_CONTENT.default;
  }, [textType]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load session on mount
  useEffect(() => {
    if (user?.id) {
      ChatSessionService.loadSession(user.id, textType).then(session => {
        setSessionId(session.sessionId);
        setMessages(session.messages);
        setMessageCount(session.messages.length);
      });
    }
  }, [user?.id, textType]);

  // Scroll on message update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate analysis and feedback generation
  useEffect(() => {
    if (content.trim().length > 10 && !isAnalyzing && !isLoadingResponse) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        const newAnalysis = NSWCriteriaAnalyzer.analyzeContent(content, textType);
        const newFeedback = ComprehensiveFeedbackAnalyzer.analyze(content, newAnalysis, textType);
        setComprehensiveFeedback(newFeedback);
        if (onAnalysisUpdate) {
          onAnalysisUpdate(newAnalysis);
        }
        setIsAnalyzing(false);
      }, 1000); // Debounce time for analysis
      return () => clearTimeout(timer);
    } else if (content.trim().length <= 10) {
      setComprehensiveFeedback(null);
      if (onAnalysisUpdate) {
        onAnalysisUpdate(null);
      }
    }
  }, [content, textType, isAnalyzing, isLoadingResponse, onAnalysisUpdate]);

  // Simulate dynamic example generation
  useEffect(() => {
    if (comprehensiveFeedback) {
      const timer = setTimeout(() => {
        const examples = generateDynamicExamples(textType, comprehensiveFeedback);
        setDynamicExamples(examples);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDynamicExamples(null);
    }
  }, [comprehensiveFeedback, textType]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoadingResponse) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');
    setIsLoadingResponse(true);
    responseStartTime.current = Date.now();

    // Add user message
    const newUserMessage = {
      type: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };
    
    // Add loading message
    const loadingMessage = {
      type: 'loading',
      content: 'Thinking...',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage, loadingMessage]);

    if (sessionId && user?.id) {
      await ChatSessionService.saveMessage(
        sessionId,
        user.id,
        'user',
        newUserMessage.content,
        messageCount + 1
      );
      setMessageCount(prev => prev + 1);
    }

    // Start progress bar simulation
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 90) {
        clearInterval(progressInterval);
      }
      setLoadingProgress(currentProgress);
    }, 100);

    // Fallback for local development if AI function is not available
    if (!openAIConnected && !openAILoading) {
      setTimeout(() => {
        clearInterval(progressInterval);
        setLoadingProgress(100);

        const responseTime = Date.now() - responseStartTime.current;
        console.log(`✅ Response generated in ${responseTime}ms`);

        const assistantMessage = {
          type: 'response',
          content: {
            encouragement: "Great question!",
            nswFocus: "Writing Tip",
            suggestion: "I see you're asking: '" + userMessageContent + "'. Use the automatic feedback above for real-time tips!",
            example: "",
            nextStep: "Keep writing and watch for suggestions in the panels"
          },
          timestamp: new Date()
        };

        setMessages(prev => {
          const filtered = prev.filter(m => m.type !== 'loading');
          return [...filtered, assistantMessage];
        });

        if (sessionId && user?.id) {
          ChatSessionService.saveMessage(
            sessionId,
            user.id,
            'assistant',
            assistantMessage.content,
            messageCount + 1
          );
        }

        setIsLoadingResponse(false);
        setLoadingProgress(0);
      }, 500);
      return;
    }

    try {
      const stage = (wordCount || 0) < 50 ? 'just starting' :
                    (wordCount || 0) < 150 ? 'developing ideas' :
                    'refining and expanding';

      const response = await fetch('/.netlify/functions/chat-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessageContent,
          textType: textType || 'narrative',
          currentContent: content || '',
          wordCount: wordCount || 0,
          stage: stage,
          sessionId: `session-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      clearInterval(progressInterval);
      setLoadingProgress(100);

      const responseTime = Date.now() - responseStartTime.current;
      console.log(`✅ Response received in ${responseTime}ms`);

      const assistantMessage = {
        type: 'response',
        content: {
          encouragement: "",
          nswFocus: "AI Writing Mate",
          suggestion: data.response || "I'm here to help with your writing!",
          example: "",
          nextStep: ""
        },
        timestamp: new Date()
      };

      // Remove loading message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'loading');
        return [...filtered, assistantMessage];
      });

      if (sessionId && user?.id) {
        await ChatSessionService.saveMessage(
          sessionId,
          user.id,
          'assistant',
          assistantMessage.content,
          messageCount + 1
        );
      }

      setIsLoadingResponse(false);
      setLoadingProgress(0);

    } catch (error) {
      clearInterval(progressInterval);
      setLoadingProgress(0);
      setIsLoadingResponse(false);

      // Silently handle the error - chat function not available in dev mode
      // Remove loading message and add fallback response
      setMessages(prev => {
        const filtered = prev.filter(m => m.type !== 'loading');
        return [...filtered, {
          type: 'response',
          content: {
            encouragement: "I'm here to help!",
            nswFocus: "Connection Issue",
            suggestion: "I'm having trouble right now, but I'm here to help! Can you try asking your question again?",
            example: "",
            nextStep: "Try asking again in a moment"
          },
          timestamp: new Date()
        }];
      });
    }
  };


  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* OPTIMIZED: Single Header with Compact Toggle */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex flex-col space-y-2">
          {/* Top Row: Title and Word Count */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">✨ Writing Mate</h2>
            <div className="text-xs text-white opacity-90 font-medium">
              {content.trim() ? `${content.trim().split(/\s+/).length} words` : '0 words'}
            </div>
          </div>

        </div>

        {/* Tab Buttons Row */}
        <div className="flex space-x-1 overflow-x-auto mt-3 pb-1">
          <button
            onClick={() => setCurrentView('coach')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'coach'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setCurrentView('examples')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'examples'
                ? 'bg-white text-green-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Examples</span>
          </button>

          <button
            onClick={() => setCurrentView('builder')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'builder'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <List className="w-3 h-3" />
            <span>Steps</span>
          </button>

          <button
            onClick={() => setCurrentView('detailed')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 relative ${
              currentView === 'detailed'
                ? 'bg-white text-red-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Detail</span>
            {/* Grammar issues badge */}
            {comprehensiveFeedback && comprehensiveFeedback.grammarIssues && comprehensiveFeedback.grammarIssues.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {comprehensiveFeedback.grammarIssues.length}
              </span>
            )}
          </button>


          <button
            onClick={() => setCurrentView('grammar')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'grammar'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FileCheck className="w-3 h-3" />
            <span>Grammar</span>
          </button>

          <button
            onClick={() => setCurrentView('vocabulary')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'vocabulary'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Vocabulary</span>
          </button>

          <button
            onClick={() => setCurrentView('sentences')}
            className={`flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              currentView === 'sentences'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <AlignLeft className="w-3 h-3" />
            <span>Sentences</span>
          </button>
        </div>
      </div>

      {/* OPTIMIZED: Content Area with More Vertical Space */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'coach' ? (
          <>
            {/* Messages Area - OPTIMIZED: More space, less padding */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white dark:bg-slate-900" style={{ height: 'calc(100% - 70px)' }}>

              {/* Getting Started - Dynamic Content */}
              <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">🎯 Getting Started</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Suggestion:</span>
                      {sidebarContent.suggestion}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Example:</span>
                      {sidebarContent.example}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Star className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100">⭐ Next Step:</span>
                      {sidebarContent.nextStep}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Grammar Issues Summary - Always visible if there are issues */}
              {comprehensiveFeedback && comprehensiveFeedback.grammarIssues && comprehensiveFeedback.grammarIssues.length > 0 && (
                <div className="sticky top-0 z-10 mb-3">
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-800">
                          {comprehensiveFeedback.grammarIssues.length} Grammar/Spelling Issue{comprehensiveFeedback.grammarIssues.length > 1 ? 's' : ''} Found
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentView('detailed')}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors font-medium"
                      >
                        View Details
                      </button>
                    </div>

                    {/* Show first 2 grammar issues as preview */}
                    <div className="space-y-2">
                      {comprehensiveFeedback.grammarIssues.slice(0, 2).map((issue, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-2 rounded border border-red-200 dark:border-red-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">{issue.type}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">{issue.severity}</span>
                          </div>
                          <div className="text-xs mb-1">
                            <span className="text-red-600 dark:text-red-400 font-medium">Found:</span> <span className="line-through dark:text-gray-300">{issue.original}</span>
                          </div>
                          <div className="text-xs mb-1">
                            <span className="text-green-600 dark:text-green-400 font-medium">Correct:</span> <span className="font-semibold text-green-700 dark:text-green-400">{issue.correction}</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            <strong>Why:</strong> {issue.explanation}
                          </div>
                        </div>
                      ))}

                      {comprehensiveFeedback.grammarIssues.length > 2 && (
                        <div className="text-xs text-center text-red-700 font-medium">
                          + {comprehensiveFeedback.grammarIssues.length - 2} more issue{comprehensiveFeedback.grammarIssues.length - 2 > 1 ? 's' : ''}
                          {' '}(click "View Details" above)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Show, Don't Tell Teaching - Explicit guidance */}
              {comprehensiveFeedback && comprehensiveFeedback.showDontTellExamples && comprehensiveFeedback.showDontTellExamples.length > 0 && (
                <div className="mb-3">
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">
                          Show, Don't Tell Opportunities
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentView('detailed')}
                        className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors font-medium"
                      >
                        Learn More
                      </button>
                    </div>

                    {/* Explicit Teaching */}
                    <div className="bg-yellow-100 border border-yellow-300 p-2 rounded mb-2">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">💡 What is "Show, Don't Tell"?</p>
                      <p className="text-xs text-yellow-800">
                        Instead of telling readers how a character feels, show it through their actions, body language, and sensory details.
                        This makes your writing more vivid and engaging.
                      </p>
                    </div>

                    {/* First example */}
                    <div className="bg-white p-2 rounded border border-yellow-200">
                      <div className="text-xs mb-1">
                        <span className="text-red-600 font-medium">❌ Telling:</span> <span className="italic line-through">{comprehensiveFeedback.showDontTellExamples[0].telling}</span>
                      </div>
                      <div className="text-xs mb-1">
                        <span className="text-green-600 font-medium">✅ Showing:</span> <span className="font-semibold text-green-700">{comprehensiveFeedback.showDontTellExamples[0].showing}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <strong>Technique:</strong> {comprehensiveFeedback.showDontTellExamples[0].technique}
                      </div>
                    </div>

                    {comprehensiveFeedback.showDontTellExamples.length > 1 && (
                      <div className="text-xs text-center text-yellow-700 font-medium mt-2">
                        + {comprehensiveFeedback.showDontTellExamples.length - 1} more example{comprehensiveFeedback.showDontTellExamples.length - 1 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Story Arc/Plot Development Feedback */}
              {comprehensiveFeedback && comprehensiveFeedback.storyArc && wordCount >= 50 && (
                <div className="mb-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-800 dark:text-blue-300">
                          Story Structure Progress
                        </span>
                      </div>
                      <div className="text-xs bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded font-medium">
                        {comprehensiveFeedback.storyArc.completeness}% Complete
                      </div>
                    </div>

                    {/* Current Stage */}
                    <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 p-2 rounded mb-2">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        📍 Current Stage: <span className="capitalize">{comprehensiveFeedback.storyArc.currentStage.replace('-', ' ')}</span>
                      </p>
                    </div>

                    {/* Strengths */}
                    {comprehensiveFeedback.storyArc.strengths && comprehensiveFeedback.storyArc.strengths.length > 0 && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border border-green-200 dark:border-green-700 mb-2">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">✅ Strengths:</p>
                        {comprehensiveFeedback.storyArc.strengths.slice(0, 2).map((strength, idx) => (
                          <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">• {strength}</p>
                        ))}
                      </div>
                    )}

                    {/* Next Steps */}
                    {comprehensiveFeedback.storyArc.nextSteps && comprehensiveFeedback.storyArc.nextSteps.length > 0 && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">🎯 Next Steps:</p>
                        {comprehensiveFeedback.storyArc.nextSteps.slice(0, 2).map((step, idx) => (
                          <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">• {step}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement and Pacing Feedback */}
              {comprehensiveFeedback && comprehensiveFeedback.pacing && wordCount >= 30 && (
                <div className="mb-3">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-600 p-3 rounded shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-purple-800 dark:text-purple-300">
                          Pacing & Engagement
                        </span>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-medium ${
                        comprehensiveFeedback.pacing.overall === 'good'
                          ? 'bg-green-600 text-white'
                          : comprehensiveFeedback.pacing.overall === 'too-fast'
                          ? 'bg-orange-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {comprehensiveFeedback.pacing.overall === 'good' ? '✓ Good Pace' :
                         comprehensiveFeedback.pacing.overall === 'too-fast' ? '⚡ Fast Pace' : '🐌 Slow Pace'}
                      </div>
                    </div>

                    {/* Pacing Sections */}
                    {comprehensiveFeedback.pacing.sections && comprehensiveFeedback.pacing.sections.length > 0 && (
                      <div className="space-y-2">
                        {comprehensiveFeedback.pacing.sections.slice(0, 2).map((section, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800 p-2 rounded border border-purple-200 dark:border-purple-800">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
                              {section.section}: <span className="font-normal text-purple-600 dark:text-purple-400">{section.pace}</span>
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              💡 {section.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {comprehensiveFeedback.pacing.sections.length === 0 && (
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          ✓ Your pacing is well-balanced! Keep varying your sentence lengths to maintain reader engagement.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* NSW Criteria Dashboard */}
              <div className="mb-3">
                <NSWCriteriaDisplay
                  analysis={analysis}
                  darkMode={darkMode}
                  textType={textType}
                />
              </div>

              {/* Chat History */}
              {messages.map((message, index) => (
                <div key={index} className={`${message.type === 'user' ? 'ml-6' : 'mr-6'}`}>
                  {message.type === 'user' ? (
                    <div className="bg-blue-500 text-white p-2 rounded-lg rounded-br-none text-sm">
                      {message.content}
                    </div>
                  ) : message.type === 'loading' ? (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg rounded-bl-none border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Thinking...</p>
                          {isLoadingResponse && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🤖</span>
                        </div>
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">{message.content.encouragement}</span>
                      </div>

                      {/* TIME AND PHASE AWARENESS SECTION */}
                      {(message.timeInfo || message.phaseInfo) && (
                        <div className="mb-2 space-y-1.5">
                          {/* Time Info */}
                          {message.timeInfo && (
                            <div className={`p-2 rounded text-xs ${
                              message.timeInfo.urgency === 'high'
                                ? 'bg-red-50 border border-red-200'
                                : message.timeInfo.urgency === 'medium'
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700">
                                  ⏱️ {message.timeInfo.timeRemaining} mins left
                                </span>
                                <span className="font-medium">
                                  {message.timeInfo.paceEmoji} Pace
                                </span>
                              </div>
                              <div className={`text-xs ${
                                message.timeInfo.urgency === 'high' ? 'text-red-700 font-medium' : 'text-gray-600'
                              }`}>
                                {message.timeInfo.timeMessage}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {message.timeInfo.paceMessage}
                              </div>
                            </div>
                          )}

                          {/* PHASE INFO */}
                          {message.phaseInfo && (
                            <div className={`p-2 rounded text-xs border ${message.phaseInfo.color} ${message.phaseInfo.darkColor}`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-base">{message.phaseInfo.emoji}</span>
                                <span className={`font-semibold ${message.phaseInfo.textColor} ${message.phaseInfo.darkTextColor}`}>
                                  {message.phaseInfo.name} Phase
                                </span>
                              </div>
                              <div className={`text-xs ${message.phaseInfo.textColor} ${message.phaseInfo.darkTextColor} font-medium mb-0.5`}>
                                🎯 Focus: {message.phaseInfo.focus}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {message.phaseInfo.guidance}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* OPTIMIZED: Compact feedback sections */}
                      <div className="space-y-1 text-xs">
                        <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                          <div className="font-medium text-blue-800">🎯 {message.content.nswFocus}</div>
                        </div>

                        <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                          <div className="font-medium text-green-800 mb-1">💡 Suggestion:</div>
                          <div className="text-green-700 whitespace-pre-line">{message.content.suggestion}</div>
                        </div>

                        <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                          <div className="font-medium text-yellow-800 mb-1">📝 Example:</div>
                          <div className="text-yellow-700 whitespace-pre-line">{message.content.example}</div>
                        </div>

                        {/* Quick Links to Tools based on NSW Focus */}
                        {message.content.nswFocus && (
                          <div className="bg-purple-50 p-2 rounded border border-purple-200">
                            <div className="font-medium text-purple-800 text-xs mb-1.5">🔧 Quick Tools:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {(message.content.nswFocus.includes('Grammar') || message.content.nswFocus.includes('Spelling')) && (
                                <button
                                  onClick={() => setCurrentView('grammar')}
                                  className="px-2 py-1 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded text-xs font-medium text-orange-800 transition-colors flex items-center gap-1"
                                >
                                  <FileCheck className="w-3 h-3" />
                                  Fix Grammar & Spelling
                                </button>
                              )}
                              {(message.content.nswFocus.includes('Language') || message.content.nswFocus.includes('Vocabulary')) && (
                                <button
                                  onClick={() => setCurrentView('vocabulary')}
                                  className="px-2 py-1 bg-pink-100 hover:bg-pink-200 border border-pink-300 rounded text-xs font-medium text-pink-800 transition-colors flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Enhance Vocabulary
                                </button>
                              )}
                              {message.content.nswFocus.includes('Structure') && (
                                <button
                                  onClick={() => setCurrentView('sentences')}
                                  className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded text-xs font-medium text-indigo-800 transition-colors flex items-center gap-1"
                                >
                                  <AlignLeft className="w-3 h-3" />
                                  Check Sentences
                                </button>
                              )}
                              <button
                                onClick={() => setCurrentView('detailed')}
                                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded text-xs font-medium text-blue-800 transition-colors flex items-center gap-1"
                              >
                                <BarChart3 className="w-3 h-3" />
                                Full Analysis
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Contextual Examples (Enhanced) */}
                        {message.content.contextualExamples && message.content.contextualExamples.length > 0 && (
                          <div className="bg-teal-50 p-2 rounded border-l-2 border-teal-400">
                            <div className="font-medium text-teal-800 mb-1">✨ {message.content.contextualExamples[0].title}</div>
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="font-semibold text-red-600">❌ Before: </span>
                                <span className="text-red-700">{message.content.contextualExamples[0].before}</span>
                              </div>
                              <div className="text-xs">
                                <span className="font-semibold text-green-600">✅ After: </span>
                                <span className="text-green-700">{message.content.contextualExamples[0].after}</span>
                              </div>
                              <div className="text-xs text-teal-700 italic mt-1">
                                💡 {message.content.contextualExamples[0].explanation}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show Don't Tell (Enhanced) */}
                        {message.content.showDontTell && (
                          <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-400">
                            <div className="font-medium text-orange-800 mb-1">👁️ Show Don't Tell</div>
                            <div className="text-xs text-orange-700 mb-1">{message.content.showDontTell.issue}</div>
                            <div className="space-y-0.5">
                              {message.content.showDontTell.alternatives.map((alt: string, idx: number) => (
                                <div key={idx} className="text-xs text-orange-600">✓ {alt}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rubric Guidance (Enhanced) */}
                        {message.content.rubricGuidance && (
                          <div className="bg-indigo-50 p-2 rounded border-l-2 border-indigo-400">
                            <div className="font-medium text-indigo-800 mb-1">📊 {message.content.rubricGuidance.criterion}</div>
                            <div className="text-xs text-indigo-700 mb-1">
                              Current: <span className="font-semibold">{message.content.rubricGuidance.currentLevel}</span>
                            </div>
                            <div className="text-xs text-indigo-600">
                              <div className="font-medium mb-0.5">Target Indicators:</div>
                              {message.content.rubricGuidance.targetIndicators.slice(0, 3).map((indicator: string, idx: number) => (
                                <div key={idx}>• {indicator}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                          <div className="font-medium text-purple-800 mb-1">⭐ Next Step:</div>
                          <div className="text-purple-700">{message.content.nextStep}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="mr-6">
                  <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                      <span className="text-xs text-gray-600">Analyzing your writing...</span>
                    </div>
                  </div>
                </div>
              )}


              <div ref={messagesEndRef} />
            </div>

              {/* Quick Query Suggestions - Collapsible */}
            {messages.length === 0 && !isLoadingResponse && (
              <div className="px-3 pb-2">
                <button
                  onClick={() => setIsQuickQueriesOpen(!isQuickQueriesOpen)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
                    darkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Quick Questions</span>
                  </span>
                  {isQuickQueriesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isQuickQueriesOpen && (
                  <div className="grid grid-cols-2 gap-2 p-2 border rounded-lg shadow-inner bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        handleSendMessage("How can I improve my opening?");
                        setIsQuickQueriesOpen(false); // Close after selection
                      }}
                      className="text-left p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-300 transition-colors"
                    >
                      ✨ Improve opening
                    </button>
                    <button
                      onClick={() => {
                        handleSendMessage("What vocabulary can I use?");
                        setIsQuickQueriesOpen(false); // Close after selection
                      }}
                      className="text-left p-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded text-xs text-purple-800 dark:text-purple-300 transition-colors"
                    >
                      📚 Better words
                    </button>
                    <button
                      onClick={() => {
                        handleSendMessage("How do I add more detail?");
                        setIsQuickQueriesOpen(false); // Close after selection
                      }}
                      className="text-left p-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-xs text-green-800 dark:text-green-300 transition-colors"
                    >
                      🎨 Add detail
                    </button>
                    <button
                      onClick={() => {
                        handleSendMessage("What should I write next?");
                        setIsQuickQueriesOpen(false); // Close after selection
                      }}
                      className="text-left p-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-800 dark:text-orange-300 transition-colors"
                    >
                      🎯 What's next?
                    </button>
                  </div>
                )}
              </div>
            )}`],path:

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className={`flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Ask the Writing Mate a question..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoadingResponse && !isAnalyzing) {
                      e.preventDefault(); // Prevent default behavior (e.g., form submission)
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoadingResponse || isAnalyzing}
                />
                <button
                  onClick={handleSendMessage}
                  className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                    isLoadingResponse || isAnalyzing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={isLoadingResponse || isAnalyzing}
                >
                  {isLoadingResponse ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : currentView === 'examples' ? (
          <div className="p-3 overflow-y-auto h-full">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Dynamic Examples</h3>
            <div className="space-y-4">
              {dynamicExamples && dynamicExamples.length > 0 ? (
                dynamicExamples.map((example, index) => (
                  <div key={index} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">{example.title}</h4>
                    <div className="text-sm space-y-2">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-red-600">❌ Before:</span> {example.before}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-green-600">✅ After:</span> {example.after}
                      </p>
                      <p className="text-xs italic text-gray-500 dark:text-gray-400">
                        💡 {example.explanation}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Start writing to generate dynamic examples based on your content!</p>
              )}
            </div>
          </div>
        ) : currentView === 'builder' ? (
          <StepByStepWritingBuilder
            textType={textType}
            darkMode={darkMode}
          />
        ) : currentView === 'detailed' ? (
          comprehensiveFeedback ? (
            <ComprehensiveFeedbackDisplay
              feedback={comprehensiveFeedback}
              darkMode={darkMode}
              onApplyFix={onApplyFix}
            />
          ) : (
            <div className="p-6 text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start Writing to See Detailed Feedback</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Once you start writing, you'll see comprehensive feedback on:
                </p>
                <ul className="text-left inline-block text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <li>✓ Grammar and spelling</li>
                  <li>✓ NSW marking criteria scores</li>
                  <li>✓ Story structure and pacing</li>
                  <li>✓ Vocabulary sophistication</li>
                  <li>✓ Sentence variety</li>
                </ul>
              </div>
            </div>
          )
        ) : currentView === 'grammar' ? (
          <GrammarCorrectionPanel
            text={content || ''}
            aiCorrections={comprehensiveFeedback?.grammarIssues}
            onApplyCorrection={onApplyFix}
          />
        ) : currentView === 'vocabulary' ? (
          <VocabularyEnhancementPanel
            content={content}
            darkMode={darkMode}
            selectedText={selectedText}
          />
        ) : currentView === 'sentences' ? (
          <SentenceStructurePanel
            content={content}
            darkMode={darkMode}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EnhancedCoachPanel;