import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Loader2,
  Brain,
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  User,
  Bot,
  Award,
  Zap,
  Eye,
  Sparkles
} from 'lucide-react';
import { getTextTypeStructure } from './lib/textTypeStructures';

// ═══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'realtime';
  content: any;
  timestamp: Date;
  metadata?: {
    inputType?: 'prompt' | 'question' | 'writing' | 'feedback_request';
    writingStage?: 'initial' | 'planning' | 'writing' | 'revising' | 'complete';
    wordCount?: number;
    confidence?: number;
    operations?: string[];
    feedbackType?: 'encouragement' | 'guidance' | 'warning' | 'celebration' | 'tip';
    isRealtime?: boolean;
  };
  phase?: WritingPhase;
  timeGuidance?: TimeGuidance;
  contextual?: ContextualFeedback;
}

interface EnhancedCoachPanelProps {
  content: string;
  textType: string;
  onContentChange?: (content: string) => void;
  onFeedbackReceived?: (feedback: any) => void;
  className?: string;
  timeElapsed?: number;        // NEW: Seconds elapsed (passed from parent)
  wordCount?: number;          // NEW: Current word count (passed from parent)
  analysis?: any;              // NEW: Analysis data from parent
  onAnalysisChange?: (analysis: any) => void;
}

interface WritingPhase {
  phase: 'not-started' | 'opening' | 'development' | 'rising-action' | 'conclusion';
  name: string;
  emoji: string;
  focus: string;
  targetWords: string;
  guidance: string;
}

interface TimeGuidance {
  timePhase: 'early' | 'early-middle' | 'middle' | 'late' | 'final' | 'overtime';
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'complete';
  icon: string;
  paceStatus: 'ahead' | 'on-track' | 'behind' | 'complete';
  paceEmoji: string;
  paceMessage: string;
  timeRemaining: string;
  expectedWords: number;
  wordsAheadBehind: number;
}

interface ContextualFeedback {
  segment: string;
  wordCount: number;
  observations: string[];
  suggestions: string[];
  praise: string[];
}

interface FeedbackHistory {
  timestamp: Date;
  type: string;
  wordCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// WRITING PHASE DETECTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Determines the current writing phase based on word count
 * This is critical for providing appropriate guidance at each stage
 *
 * @param wordCount - Current number of words written
 * @returns Phase identifier and metadata
 */
const getWritingPhase = (wordCount: number): WritingPhase => {
  if (wordCount === 0) {
    return {
      phase: 'not-started',
      name: 'Getting Started',
      emoji: '🚀',
      focus: 'Begin writing your opening',
      targetWords: '0-50 words',
      guidance: 'Hook your reader and set the scene'
    };
  }

  if (wordCount < 50) {
    return {
      phase: 'opening',
      name: 'Opening',
      emoji: '📖',
      focus: 'Hook the reader and introduce your topic',
      targetWords: '0-50 words',
      guidance: 'Set the scene, introduce character/topic, grab attention'
    };
  }

  if (wordCount < 150) {
    return {
      phase: 'development',
      name: 'Development',
      emoji: '🌱',
      focus: 'Develop your ideas with details',
      targetWords: '50-150 words',
      guidance: 'Add descriptions, examples, dialogue, or evidence'
    };
  }

  if (wordCount < 250) {
    return {
      phase: 'rising-action',
      name: 'Rising Action',
      emoji: '⚡',
      focus: 'Build tension and develop complexity',
      targetWords: '150-250 words',
      guidance: 'Deepen ideas, add complications, build to climax'
    };
  }

  return {
    phase: 'conclusion',
    name: 'Conclusion',
    emoji: '🎯',
    focus: 'Wrap up your writing',
    targetWords: '250+ words',
    guidance: 'Provide resolution, final thoughts, satisfying ending'
  };
};

// ═══════════════════════════════════════════════════════════════════
// TIME-AWARE GUIDANCE SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * Generates time-appropriate coaching messages
 * Helps students manage their time during the 40-minute test
 *
 * @param seconds - Time elapsed in seconds
 * @param wordCount - Current word count
 * @returns Time-aware coaching message
 */
const getTimeAwareGuidance = (seconds: number, wordCount: number): TimeGuidance => {
  const minutes = Math.floor(seconds / 60);
  const targetWordsPerMinute = 300 / 40; // 7.5 words/min for 300 words in 40 mins
  const expectedWords = Math.floor(targetWordsPerMinute * minutes);
  const wordsAheadBehind = wordCount - expectedWords;

  // Calculate pace status
  let paceStatus: 'ahead' | 'on-track' | 'behind' | 'complete' = 'on-track';
  let paceEmoji = '✅';
  let paceMessage = "You're right on track!";

  if (wordsAheadBehind > 50) {
    paceStatus = 'ahead';
    paceEmoji = '🚀';
    paceMessage = "Excellent pace! You're ahead of schedule.";
  } else if (wordsAheadBehind < -50) {
    paceStatus = 'behind';
    paceEmoji = '⏰';
    paceMessage = "Let's pick up the pace a bit!";
  }

  // Time-based guidance
  if (minutes < 10) {
    return {
      timePhase: 'early',
      message: "Great start! Focus on getting your ideas flowing naturally.",
      urgency: 'low',
      icon: '🌟',
      paceStatus,
      paceEmoji,
      paceMessage,
      timeRemaining: `${40 - minutes} minutes left`,
      expectedWords,
      wordsAheadBehind
    };
  }

  if (minutes < 20) {
    return {
      timePhase: 'early-middle',
      message: "You're making good progress. Keep developing your ideas with details.",
      urgency: 'low',
      icon: '💪',
      paceStatus,
      paceEmoji,
      paceMessage,
      timeRemaining: `${40 - minutes} minutes left`,
      expectedWords,
      wordsAheadBehind
    };
  }

  if (minutes < 30) {
    return {
      timePhase: 'middle',
      message: "Excellent! Start thinking about how to wrap up your writing.",
      urgency: 'medium',
      icon: '🎯',
      paceStatus,
      paceEmoji,
      paceMessage,
      timeRemaining: `${40 - minutes} minutes left`,
      expectedWords,
      wordsAheadBehind
    };
  }

  if (minutes < 35) {
    return {
      timePhase: 'late',
      message: "Time to focus on your conclusion! Wrap up your main ideas.",
      urgency: 'medium',
      icon: '⏰',
      paceStatus,
      paceEmoji,
      paceMessage,
      timeRemaining: `${40 - minutes} minutes left`,
      expectedWords,
      wordsAheadBehind
    };
  }

  if (minutes < 40) {
    return {
      timePhase: 'final',
      message: "Final minutes! Review and polish your work.",
      urgency: 'high',
      icon: '🔥',
      paceStatus,
      paceEmoji,
      paceMessage,
      timeRemaining: `${40 - minutes} minutes left`,
      expectedWords,
      wordsAheadBehind
    };
  }

  return {
    timePhase: 'overtime',
    message: "Time's up! Great effort!",
    urgency: 'complete',
    icon: '🏁',
    paceStatus: 'complete',
    paceEmoji: '✨',
    paceMessage: "You've completed the test!",
    timeRemaining: "0 minutes left",
    expectedWords,
    wordsAheadBehind
  };
};

// ═══════════════════════════════════════════════════════════════════
// CONTEXTUAL FEEDBACK ANALYZER
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyzes newly added text to provide specific contextual feedback
 * This makes feedback feel personal and relevant to what student JUST wrote
 *
 * @param newText - The text that was just added
 * @param fullContent - Complete content for context
 * @param textType - Type of writing (narrative, persuasive, etc.)
 * @returns Contextual feedback object
 */
const analyzeNewContent = (
  newText: string,
  fullContent: string,
  textType: string
): ContextualFeedback | null => {
  if (!newText || newText.trim().length < 10) {
    return null; // Don't analyze very small additions
  }

  const newWords = newText.trim().split(/\s+/);
  const newWordCount = newWords.length;

  // Extract what they just wrote (last sentence)
  const sentences = newText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lastSentence = sentences[sentences.length - 1] || '';

  // Initialize feedback
  const feedback: ContextualFeedback = {
    segment: lastSentence.trim(),
    wordCount: newWordCount,
    observations: [],
    suggestions: [],
    praise: []
  };

  // Check for descriptive language in new text
  const descriptiveWords = [
    'mysterious', 'shimmering', 'ancient', 'gleaming', 'dusty', 'ornate',
    'beautiful', 'magnificent', 'brilliant', 'enormous', 'tiny', 'spectacular',
    'dazzling', 'gloomy', 'vibrant', 'delicate', 'towering', 'sparkling'
  ];
  const foundDescriptive = descriptiveWords.filter(word =>
    newText.toLowerCase().includes(word.toLowerCase())
  );

  if (foundDescriptive.length > 0) {
    feedback.praise.push(`Love your use of "${foundDescriptive[0]}"! That's vivid vocabulary.`);
  }

  // Check for dialogue in new text
  const hasDialogue = (newText.match(/[""][^""]*[""]/g) || []).length > 0;
  if (hasDialogue) {
    feedback.praise.push("Great use of dialogue to bring your story to life!");
  }

  // Check for sensory details
  const sensoryWords = {
    sight: ['saw', 'looked', 'appeared', 'gleamed', 'shone', 'sparkled'],
    sound: ['heard', 'whispered', 'shouted', 'echoed', 'rustled', 'creaked'],
    touch: ['felt', 'smooth', 'rough', 'cold', 'warm', 'soft', 'hard'],
    smell: ['smelled', 'scent', 'aroma', 'fragrance', 'stench'],
    taste: ['tasted', 'sweet', 'bitter', 'sour', 'savory']
  };

  let sensoryCount = 0;
  Object.values(sensoryWords).forEach(words => {
    words.forEach(word => {
      if (newText.toLowerCase().includes(word)) {
        sensoryCount++;
      }
    });
  });

  if (sensoryCount > 2) {
    feedback.praise.push("Excellent use of sensory details! Your reader can really imagine the scene.");
  }

  // Check for showing vs telling
  const tellingPhrases = [
    'felt happy', 'felt sad', 'felt excited', 'felt nervous', 'felt scared',
    'was happy', 'was sad', 'was excited', 'was nervous', 'was scared',
    'felt angry', 'was angry', 'felt proud', 'was proud'
  ];

  const foundTelling = tellingPhrases.filter(phrase =>
    newText.toLowerCase().includes(phrase)
  );

  if (foundTelling.length > 0) {
    const emotion = foundTelling[0].split(' ')[1];
    feedback.suggestions.push(
      `Instead of telling us they "${foundTelling[0]}", try showing ${emotion} through actions, facial expressions, or dialogue!`
    );
  }

  // Check for sentence variety in new text
  if (sentences.length > 1) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const allSimilar = lengths.every(len => Math.abs(len - avgLength) < 3);

    if (allSimilar && avgLength < 8) {
      feedback.suggestions.push("Try combining some short sentences for better flow.");
    } else if (allSimilar && avgLength > 15) {
      feedback.suggestions.push("Consider breaking long sentences into shorter ones for clarity.");
    } else if (!allSimilar) {
      feedback.praise.push("Nice sentence variety! Your writing has good rhythm.");
    }
  }

  // Check for overused words in new text
  const wordFrequency: Record<string, number> = {};
  newWords.forEach(word => {
    const lower = word.toLowerCase().replace(/[^\w]/g, '');
    if (lower.length > 3 && !['that', 'this', 'then', 'when', 'with'].includes(lower)) {
      wordFrequency[lower] = (wordFrequency[lower] || 0) + 1;
    }
  });

  const overused = Object.entries(wordFrequency)
    .filter(([word, count]) => count > 2)
    .sort(([, a], [, b]) => b - a);

  if (overused.length > 0) {
    const [word, count] = overused[0];
    feedback.suggestions.push(
      `You used "${word}" ${count} times in this section. Try finding a synonym to add variety!`
    );
  }

  // Check for transition words
  const transitions = [
    'however', 'furthermore', 'meanwhile', 'suddenly', 'finally',
    'therefore', 'moreover', 'consequently', 'nevertheless', 'although'
  ];

  const foundTransitions = transitions.filter(word =>
    newText.toLowerCase().includes(word)
  );

  if (foundTransitions.length > 0) {
    feedback.praise.push(`Great transition word: "${foundTransitions[0]}"! This helps your writing flow smoothly.`);
  }

  // Check for strong verbs
  const strongVerbs = [
    'sprinted', 'whispered', 'exclaimed', 'discovered', 'transformed',
    'shattered', 'gleamed', 'trembled', 'surged', 'plunged'
  ];

  const foundStrongVerbs = strongVerbs.filter(verb =>
    newText.toLowerCase().includes(verb)
  );

  if (foundStrongVerbs.length > 0) {
    feedback.praise.push(`"${foundStrongVerbs[0]}" is a powerful verb choice! Much better than basic verbs.`);
  }

  // Return null if no meaningful feedback
  if (feedback.praise.length === 0 && feedback.suggestions.length === 0) {
    return null;
  }

  return feedback;
};

// ═══════════════════════════════════════════════════════════════════
// INTELLIGENT RESPONSE GENERATOR
// ═══════════════════════════════════════════════════════════════════

/**
 * Generates comprehensive, context-aware coaching responses
 * Combines phase awareness, time tracking, and contextual feedback
 */
const generateCoachResponse = (
  content: string,
  textType: string,
  writingPhase: WritingPhase,
  timeGuidance: TimeGuidance,
  contextualFeedback: ContextualFeedback | null
) => {
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const structure = getTextTypeStructure(textType);

  // Generate phase-specific guidance
  let phaseGuidance = '';
  const currentPhaseIndex = ['not-started', 'opening', 'development', 'rising-action', 'conclusion'].indexOf(writingPhase.phase);

  if (currentPhaseIndex >= 0 && currentPhaseIndex < structure.phases.length) {
    const structurePhase = structure.phases[currentPhaseIndex];
    phaseGuidance = `${writingPhase.guidance}. ${structurePhase?.description || ''}`;
  }

  // Generate encouragement based on progress
  let encouragement = '';
  if (wordCount === 0) {
    encouragement = "Ready to start? Just begin writing and I'll guide you!";
  } else if (wordCount < 50) {
    encouragement = "Great start! Keep the momentum going!";
  } else if (wordCount < 100) {
    encouragement = "You're building nicely! Keep developing your ideas.";
  } else if (wordCount < 200) {
    encouragement = "Excellent progress! You're in the flow.";
  } else if (wordCount < 250) {
    encouragement = "Well done! You're approaching the target word count.";
  } else if (wordCount < 300) {
    encouragement = "Outstanding! You've reached the target range!";
  } else {
    encouragement = "Fantastic! You've written a comprehensive response!";
  }

  // Generate specific tip based on phase and time
  let specificTip = '';
  if (writingPhase.phase === 'opening' && timeGuidance.urgency === 'low') {
    specificTip = "Hook your reader with an interesting opening sentence or question.";
  } else if (writingPhase.phase === 'development') {
    specificTip = "Add specific details, examples, or descriptions to strengthen your ideas.";
  } else if (writingPhase.phase === 'rising-action') {
    specificTip = "Build complexity and depth. This is where your writing really develops!";
  } else if (writingPhase.phase === 'conclusion') {
    specificTip = "Wrap up your ideas and leave your reader with a memorable final thought.";
  } else if (timeGuidance.urgency === 'high') {
    specificTip = "Focus on finishing strong! Review for any spelling or grammar errors.";
  }

  return {
    encouragement,
    phaseInfo: `${writingPhase.emoji} ${writingPhase.name} Phase`,
    phaseGuidance,
    phaseTarget: writingPhase.targetWords,
    timeInfo: `${timeGuidance.icon} ${timeGuidance.timeRemaining}`,
    paceInfo: `${timeGuidance.paceEmoji} ${timeGuidance.paceMessage}`,
    timeMessage: timeGuidance.message,
    specificTip,
    contextual: contextualFeedback ? {
      type: contextualFeedback.praise.length > 0 ? 'praise' : 'suggestion',
      text: contextualFeedback.praise.length > 0
        ? contextualFeedback.praise[0]
        : contextualFeedback.suggestions[0],
      icon: contextualFeedback.praise.length > 0 ? '🌟' : '💡',
      segment: contextualFeedback.segment
    } : null
  };
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const EnhancedCoachPanel: React.FC<EnhancedCoachPanelProps> = ({
  content,
  textType,
  onContentChange,
  onFeedbackReceived,
  className = "",
  timeElapsed = 0,
  wordCount: propWordCount,
  analysis: propAnalysis,
  onAnalysisChange
}) => {
  // State management
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previousContent, setPreviousContent] = useState('');
  const [previousWordCount, setPreviousWordCount] = useState(0);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);
  const [currentPhase, setCurrentPhase] = useState<WritingPhase | null>(null);
  const [currentTimeGuidance, setCurrentTimeGuidance] = useState<TimeGuidance | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const realtimeFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ═══════════════════════════════════════════════════════════════════
  // REAL-TIME FEEDBACK SYSTEM - Core Intelligence
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Clear existing timer
    if (realtimeFeedbackTimerRef.current) {
      clearInterval(realtimeFeedbackTimerRef.current);
    }

    // Only provide real-time feedback if student is actively writing
    if (content.trim().length === 0) {
      setPreviousContent('');
      setPreviousWordCount(0);
      return;
    }

    // Set up 10-second interval for intelligent feedback
    realtimeFeedbackTimerRef.current = setInterval(() => {
      const currentWordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

      // Skip if content hasn't changed
      if (content === previousContent) {
        return;
      }

      // Detect new content
      const newContent = content.slice(previousContent.length);
      const hasSignificantChange = currentWordCount - previousWordCount >= 5;

      if (!hasSignificantChange) {
        return;
      }

      // Analyze current state
      const writingPhase = getWritingPhase(currentWordCount);
      const timeGuidance = getTimeAwareGuidance(timeElapsed, currentWordCount);
      const contextualFeedback = analyzeNewContent(newContent, content, textType);

      // Update state
      setCurrentPhase(writingPhase);
      setCurrentTimeGuidance(timeGuidance);

      // Generate intelligent response
      const coachResponse = generateCoachResponse(
        content,
        textType,
        writingPhase,
        timeGuidance,
        contextualFeedback
      );

      // Create message
      const feedbackMessage: ConversationMessage = {
        id: `realtime_${Date.now()}`,
        type: 'realtime',
        content: coachResponse,
        timestamp: new Date(),
        phase: writingPhase,
        timeGuidance: timeGuidance,
        contextual: contextualFeedback,
        metadata: {
          wordCount: currentWordCount,
          writingStage: writingPhase.phase === 'opening' ? 'planning' :
                       writingPhase.phase === 'development' ? 'writing' :
                       writingPhase.phase === 'rising-action' ? 'writing' : 'revising',
          feedbackType: timeGuidance.urgency === 'high' ? 'warning' :
                       contextualFeedback?.praise.length ? 'celebration' : 'guidance',
          isRealtime: true
        }
      };

      // Add to messages (keep only recent realtime messages)
      setMessages(prev => {
        const filtered = prev.filter(m =>
          m.type !== 'realtime' ||
          Date.now() - m.timestamp.getTime() < 60000
        );
        return [...filtered, feedbackMessage];
      });

      // Update feedback history
      setFeedbackHistory(prev => [
        ...prev,
        {
          timestamp: new Date(),
          type: feedbackMessage.metadata?.feedbackType || 'guidance',
          wordCount: currentWordCount
        }
      ].slice(-10)); // Keep last 10

      // Update tracking
      setPreviousContent(content);
      setPreviousWordCount(currentWordCount);

      // Notify parent
      if (onAnalysisChange) {
        onAnalysisChange({
          wordCount: currentWordCount,
          phase: writingPhase,
          timeGuidance: timeGuidance
        });
      }

    }, 10000); // Every 10 seconds

    return () => {
      if (realtimeFeedbackTimerRef.current) {
        clearInterval(realtimeFeedbackTimerRef.current);
      }
    };
  }, [content, textType, timeElapsed, previousContent, previousWordCount, onAnalysisChange]);

  // Send initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: ConversationMessage = {
        id: `greeting_${Date.now()}`,
        type: 'ai',
        content: {
          encouragement: `Hi! I'm your writing coach, and I'm excited to help you with your ${textType} writing today!`,
          message: "I'll be watching your progress and giving you helpful tips as you write. You're aiming for 200-300 words in about 40 minutes. Ready to start? Just begin writing, and I'll guide you along the way!"
        },
        timestamp: new Date(),
        metadata: {
          writingStage: 'initial',
          operations: ['greeting'],
          feedbackType: 'encouragement'
        }
      };
      setMessages([greetingMessage]);
    }
  }, [textType, messages.length]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);

    try {
      // Simple response for user questions
      const aiMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: {
          encouragement: "Thanks for your question!",
          message: "I'm here to help! Keep writing and I'll provide feedback as you go. If you need specific help with something, just ask!"
        },
        timestamp: new Date(),
        metadata: {
          operations: ['response']
        }
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentInput, isProcessing]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message icon
  const getMessageIcon = (message: ConversationMessage) => {
    if (message.type === 'user') return <User className="h-4 w-4" />;
    if (message.type === 'system') return <Brain className="h-4 w-4" />;

    if (message.type === 'realtime') {
      const feedbackType = message.metadata?.feedbackType;
      if (feedbackType === 'celebration') return <Award className="h-4 w-4" />;
      if (feedbackType === 'warning') return <Clock className="h-4 w-4" />;
      if (feedbackType === 'tip') return <Lightbulb className="h-4 w-4" />;
      if (feedbackType === 'encouragement') return <TrendingUp className="h-4 w-4" />;
      return <Sparkles className="h-4 w-4" />;
    }

    return <Bot className="h-4 w-4" />;
  };

  // Get message styling
  const getMessageStyle = (message: ConversationMessage) => {
    if (message.type === 'user') return 'bg-blue-600 text-white';
    if (message.type === 'system') return 'bg-gray-100 text-gray-700 text-sm';

    if (message.type === 'realtime') {
      const urgency = message.timeGuidance?.urgency;
      if (urgency === 'high') return 'bg-orange-50 text-orange-900 border border-orange-200';
      if (urgency === 'medium') return 'bg-yellow-50 text-yellow-900 border border-yellow-200';
      return 'bg-blue-50 text-blue-900 border border-blue-200';
    }

    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header with Phase & Time Status */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Writing Coach</h3>
        </div>

        {currentPhase && currentTimeGuidance && (
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded shadow-sm">
              <span>{currentPhase.emoji}</span>
              <span className="font-medium">{currentPhase.name}</span>
            </div>
            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded shadow-sm">
              <Clock className="h-3 w-3 text-gray-600" />
              <span className="font-medium">{currentTimeGuidance.timeRemaining}</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded shadow-sm ${
              currentTimeGuidance.paceStatus === 'ahead' ? 'bg-green-100 text-green-800' :
              currentTimeGuidance.paceStatus === 'behind' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <span>{currentTimeGuidance.paceEmoji}</span>
              <span className="font-medium">{currentTimeGuidance.paceStatus === 'ahead' ? 'Ahead' :
                                            currentTimeGuidance.paceStatus === 'behind' ? 'Behind' : 'On Track'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user'
                ? 'bg-blue-100 text-blue-600'
                : message.type === 'system'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
            }`}>
              {getMessageIcon(message)}
            </div>

            <div className={`flex-1 max-w-lg ${
              message.type === 'user' ? 'text-right' : ''
            }`}>
              <div className={`p-3 rounded-lg shadow-sm ${getMessageStyle(message)}`}>
                {message.type === 'user' ? (
                  <div className="text-sm">{message.content}</div>
                ) : (
                  <div className="space-y-2">
                    {/* Encouragement Header */}
                    <div className="font-semibold text-sm">
                      {message.content.encouragement || message.content}
                    </div>

                    {/* Phase and Time Status */}
                    {message.phase && message.timeGuidance && (
                      <div className="space-y-1.5 border-t pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-indigo-700">
                            {message.content.phaseInfo}
                          </span>
                          <span className="font-medium text-blue-700">
                            {message.content.timeInfo}
                          </span>
                        </div>
                        <div className="text-xs bg-white bg-opacity-50 p-1.5 rounded">
                          {message.content.paceInfo}
                        </div>
                      </div>
                    )}

                    {/* Contextual Feedback - What They Just Wrote */}
                    {message.content.contextual && (
                      <div className={`p-2 rounded border-l-2 text-xs ${
                        message.content.contextual.type === 'praise'
                          ? 'bg-green-50 border-green-400'
                          : 'bg-yellow-50 border-yellow-400'
                      }`}>
                        <div className="font-medium flex items-center space-x-1 mb-1">
                          <span>{message.content.contextual.icon}</span>
                          <span>
                            {message.content.contextual.type === 'praise'
                              ? 'I noticed this!'
                              : 'Quick tip:'}
                          </span>
                        </div>
                        {message.content.contextual.segment && (
                          <div className="text-gray-600 italic mb-1 text-xs">
                            "{message.content.contextual.segment.substring(0, 50)}{message.content.contextual.segment.length > 50 ? '...' : ''}"
                          </div>
                        )}
                        <div className={message.content.contextual.type === 'praise' ? 'text-green-700' : 'text-yellow-700'}>
                          {message.content.contextual.text}
                        </div>
                      </div>
                    )}

                    {/* Main Guidance */}
                    {message.content.specificTip && (
                      <div className="text-xs bg-white bg-opacity-50 p-2 rounded">
                        <span className="font-medium">💡 Tip: </span>
                        {message.content.specificTip}
                      </div>
                    )}

                    {/* Time Message */}
                    {message.content.timeMessage && (
                      <div className="text-xs text-gray-700">
                        {message.content.timeMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`text-xs text-gray-500 mt-1 ${
                message.type === 'user' ? 'text-right' : ''
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </div>
            <div className="bg-gray-100 text-gray-600 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your writing..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isProcessing}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {currentPhase && (
          <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
            <span>
              <span className="font-medium">Focus:</span> {currentPhase.focus}
            </span>
            <span className="text-gray-500">
              Target: {currentPhase.targetWords}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCoachPanel;
