// src/components/EnhancedWritingLayoutNSW.tsx - MODIFIED VERSION WITH BOTTOM SUBMIT BUTTON

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanningToolModal } from './PlanningToolModal';
import { StructureGuideModal } from './StructureGuideModal';
import { TipsModal } from './TipsModal';
import { EnhancedCoachPanel } from './EnhancedCoachPanel';
import { NSWStandaloneSubmitSystem } from './NSWStandaloneSubmitSystem';
import { ReportModal } from './ReportModal';
import { AIEvaluationReportDisplay } from './AIEvaluationReportDisplay';
import { NSWSubmitButton } from './NSWSubmitButton';
import { PromptOptionsModal } from './PromptOptionsModal';
import { InlineTextHighlighter } from './InlineTextHighlighter';
import { generatePrompt } from '../lib/openai';
import { promptConfig } from '../config/prompts';
import type { DetailedFeedback, LintFix } from '../types/feedback';
import { eventBus } from '../lib/eventBus';
import { detectNewParagraphs } from '../lib/paragraphDetection';
import { NSWEvaluationReportGenerator } from './NSWEvaluationReportGenerator';
import { useTheme } from '../contexts/ThemeContext';
import {
  PenTool,
  Play,
  BookOpen,
  Lightbulb as LightbulbIcon,
  Settings,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Target,
  Info,
  Clock,
  FileText,
  Type,
  Zap,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  X,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';

interface EnhancedWritingLayoutNSWProps {
  content: string;
  onChange: (content: string) => void;
  textType: string;
  initialPrompt: string;
  wordCount: number;
  onWordCountChange: (count: number) => void;
  darkMode?: boolean;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  onSettingsChange?: (settings: any) => void;
  isTimerRunning?: boolean;
  elapsedTime?: number;
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  onResetTimer?: () => void;
  focusMode?: boolean;
  onToggleFocus?: () => void;
  showStructureGuide?: boolean;
  onToggleStructureGuide?: () => void;
  showTips?: boolean;
  onToggleTips?: () => void;
  analysis?: DetailedFeedback | null;
  onAnalysisChange?: (analysis: DetailedFeedback | null) => void;
  setPrompt?: (prompt: string) => void;
  assistanceLevel?: string;
  onAssistanceLevelChange?: (level: string) => void;
  onSubmit?: (content: string) => void;
  selectedText?: string;
  onTextTypeChange?: (type: string) => void;
  onPopupCompleted?: () => void;
  popupFlowCompleted?: boolean;
  user?: any;
  openAIConnected?: boolean;
  openAILoading?: boolean;
  panelVisible?: boolean;
  setPanelVisible?: (visible: boolean) => void;
}

export function EnhancedWritingLayoutNSW(props: EnhancedWritingLayoutNSWProps) {
  console.log("EnhancedWritingLayoutNSW Props:", props);
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';

  const {
    content,
    onChange,
    textType,
    initialPrompt,
    wordCount,
    onWordCountChange,
    darkMode: darkModeProp = false,
    fontFamily = 'Inter',
    fontSize = 16,
    lineHeight = 1.6,
    onSettingsChange,
    isTimerRunning = false,
    elapsedTime = 0,
    onStartTimer,
    onPauseTimer,
    onResetTimer,
    focusMode = false,
    onToggleFocus,
    showStructureGuide = false,
    onToggleStructureGuide,
    showTips = false,
    onToggleTips,
    analysis,
    onAnalysisChange,
    assistanceLevel,
    onAssistanceLevelChange,
    onSubmit,
    selectedText,
    onTextTypeChange,
    onPopupCompleted,
    popupFlowCompleted,
    user,
    openAIConnected,
    openAILoading,
    panelVisible = true,
    setPanelVisible,
    setPrompt,
  } = props;

  // State management
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [customPromptInput, setCustomPromptInput] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNSWEvaluation, setShowNSWEvaluation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [nswReport, setNswReport] = useState<any>(null);
  const [aiEvaluationReport, setAiEvaluationReport] = useState<any>(null);
  const [showAIReport, setShowAIReport] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [evaluationProgress, setEvaluationProgress] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false);

  // Auto-hide prompt after 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isPromptCollapsed) {
        setIsPromptCollapsed(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [isPromptCollapsed]);
  
  // New states for missing functionality
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showTipsModalLocal, setShowTipsModalLocal] = useState(false);
  const [examModeLocal, setExamModeLocal] = useState(false);
  const [showGrammarHighlights, setShowGrammarHighlights] = useState(true);
  const [expandedGrammarStats, setExpandedGrammarStats] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);


  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Prompt starts expanded - will auto-collapse after 5 minutes (handled by timer above)
  // Removed auto-collapse on mount to show prompt initially

  // Calculate word count first (needed by other metrics)
  const currentWordCount = React.useMemo(() => {
    return localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
  }, [localContent]);

  // Calculate grammar stats
  const grammarStats = React.useMemo(() => {
    const text = localContent;
    if (!text) return { weakVerbs: 0, overused: 0, passive: 0, weakAdjectives: 0 };

    const weakVerbs = (text.match(/\b(is|are|was|were|be|been|being)\b/gi) || []).length;
    const overused = (text.match(/\b(very|really|just|actually|basically|literally)\b/gi) || []).length;
    const passive = (text.match(/\b(was|were|been)\s+\w+ed\b/gi) || []).length;
    const weakAdjectives = (text.match(/\b(good|bad|nice|big|small)\b/gi) || []).length;

    return { weakVerbs, overused, passive, weakAdjectives };
  }, [localContent]);

  // Calculate additional writing metrics
  const writingMetrics = React.useMemo(() => {
    const text = localContent.trim();
    if (!text) return {
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTime: 0,
      avgWordsPerSentence: 0
    };

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const readingTime = Math.ceil(currentWordCount / 200); // 200 words per minute
    const avgWordsPerSentence = sentences > 0 ? Math.round(currentWordCount / sentences) : 0;

    return { characters, charactersNoSpaces, sentences, paragraphs, readingTime, avgWordsPerSentence };
  }, [localContent, currentWordCount]);

  // Calculate writing quality score
  const qualityScore = React.useMemo(() => {
    if (currentWordCount === 0) return 0;

    let score = 100;

    // Deduct points for issues
    score -= grammarStats.weakVerbs * 2;
    score -= grammarStats.overused * 3;
    score -= grammarStats.passive * 2;
    score -= grammarStats.weakAdjectives * 2;

    // Deduct if outside word count range
    if (currentWordCount < 50) score -= 10;
    if (currentWordCount > 50) score -= 15;

    // Deduct for short sentences (less than 8 words avg)
    if (writingMetrics.avgWordsPerSentence < 8) score -= 5;

    // Deduct for very long sentences (more than 25 words avg)
    if (writingMetrics.avgWordsPerSentence > 25) score -= 5;

    return Math.max(0, Math.min(100, score));
  }, [currentWordCount, grammarStats, writingMetrics]);

  // Get effective prompt
  const effectivePrompt = generatedPrompt || customPromptInput || initialPrompt;
  console.log("EnhancedWritingLayoutNSW State:", { generatedPrompt, customPromptInput, localContent, effectivePrompt, showPromptOptionsModal, hidePrompt, popupFlowCompleted });

  // Initialize content
  useEffect(() => {
    if (content !== undefined) {
      setLocalContent(content);
    }
  }, [content]);

  // Auto-save content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== content && onChange) {
        onChange(localContent);
        setLastSaved(new Date());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localContent, content, onChange]);

  // Update word count
  useEffect(() => {
    const words = localContent.trim().split(/\s+/).filter(word => word.length > 0);
    const newWordCount = words.length;
    if (newWordCount !== wordCount && onWordCountChange) {
      onWordCountChange(newWordCount);
    }
  }, [localContent, wordCount, onWordCountChange]);

  // Show prompt modal if no prompt exists
  useEffect(() => {
    if (!effectivePrompt && !popupFlowCompleted) {
      setShowPromptOptionsModal(true);
    }
  }, [effectivePrompt, popupFlowCompleted]);

  // Auto-fetch AI analysis for Grammar/Vocabulary tabs (debounced)
  useEffect(() => {
    // Only fetch if content is substantial (50+ words)
    const wordCount = localContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 50) {
      return;
    }

    // Debounce: wait 3 seconds after user stops typing
    const timeoutId = setTimeout(async () => {
      console.log('🔄 Auto-fetching AI analysis for Writing Mate tabs...');
      try {
        const feedbackResponse = await fetch("/.netlify/functions/ai-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            essayText: localContent,
            textType: textType
          })
        });

        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          console.log('✅ Auto-fetched AI feedback:', {
            grammar: feedbackData.grammarCorrections?.length || 0,
            vocab: feedbackData.vocabularyEnhancements?.length || 0
          });
          setAiAnalysis(feedbackData);
        }
      } catch (error) {
        console.error('❌ Auto-fetch error:', error);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [localContent, textType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateNewPrompt = useCallback(async () => {
    setIsLoadingPrompt(true);
    setIsLoadingPrompt(true);
    try {
      const newPrompt = await generatePrompt(textType, promptConfig.systemPrompts.promptGenerator);
      setGeneratedPrompt(newPrompt);
      setLocalContent(newPrompt);
      if (setPrompt) {
        setPrompt(newPrompt);
      }
      if (onChange) {
        onChange(newPrompt);
      }
      setShowPromptOptionsModal(false);
      if (onPopupCompleted) onPopupCompleted();
    setIsLoadingPrompt(false);
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate a prompt. Please try again.");
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [textType, setPrompt, onChange, onPopupCompleted]);

  const handleCustomPromptInput = useCallback((promptText: string) => {
    setIsLoadingPrompt(true);
    setCustomPromptInput(promptText);
    setLocalContent(promptText);
    if (setPrompt) {
      setPrompt(promptText);
    }
    if (onChange) {
      onChange(promptText);
    }
    setShowPromptOptionsModal(false);
    if (onPopupCompleted) onPopupCompleted();
    setIsLoadingPrompt(false);
  }, [setPrompt, onChange, onPopupCompleted]);

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    
    if (newContent.trim().length > 0 && !isTimerRunning && elapsedTime === 0 && onStartTimer) {
      onStartTimer();
    }
    
    if (eventBus && detectNewParagraphs) {
      const newParagraphs = detectNewParagraphs(content, newContent);
      if (newParagraphs.length > 0) {
        eventBus.emit('newParagraphsDetected', { paragraphs: newParagraphs, textType });
      }
    }
  }, [content, isTimerRunning, elapsedTime, onStartTimer, textType]);

  // Convert NSW report format to DetailedFeedback format
  const convertNSWReportToDetailedFeedback = (report: any): any => {
    const maxScore = 10;
    return {
      id: `nsw-${Date.now()}`,
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: Math.min(report.domains?.contentAndIdeas?.score || 0, maxScore),
          weight: report.domains?.contentAndIdeas?.weight || 40,
          strengths: (report.domains?.contentAndIdeas?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('idea') || item.toLowerCase().includes('content'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Consider developing this area further'
            }))
        },
        structureOrganization: {
          score: Math.min(report.domains?.textStructure?.score || 0, maxScore),
          weight: report.domains?.textStructure?.weight || 20,
          strengths: (report.domains?.textStructure?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('structure') || item.toLowerCase().includes('organization'))
            .map((text: any) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Work on improving your structure'
            }))
        },
        languageVocab: {
          score: Math.min(report.domains?.languageFeatures?.score || 0, maxScore),
          weight: report.domains?.languageFeatures?.weight || 25,
          strengths: (report.domains?.languageFeatures?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('language') || item.toLowerCase().includes('vocabulary'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Enhance your vocabulary'
            }))
        },
        spellingPunctuationGrammar: {
          score: Math.min(report.domains?.spellingAndGrammar?.score || 0, maxScore),
          weight: report.domains?.spellingAndGrammar?.weight || 15,
          strengths: (report.domains?.spellingAndGrammar?.feedback || []).map((text: string) => ({ 
            text, 
            start: 0, 
            end: 0 
          })),
          improvements: (report.areasForImprovement || [])
            .filter((item: any) => item.toLowerCase().includes('spelling') || item.toLowerCase().includes('grammar'))
            .map((text: string) => ({
              issue: text,
              evidence: { text: '', start: 0, end: 0 },
              suggestion: 'Review spelling and grammar rules'
            }))
        }
      },
      grammarCorrections: [],
      vocabularyEnhancements: [],
      overallGrade: report.overallGrade,
      domains: report.domains,
      detailedFeedback: report.detailedFeedback,
      recommendations: report.recommendations,
      strengths: report.strengths,
      areasForImprovement: report.areasForImprovement,
      essayContent: report.essayContent,
      originalityReport: report.originalityReport
    };
  };

  // Calculate content status
  const hasContent = localContent.trim().length > 0;
    const showWordCountWarning = currentWordCount > 50;

  const handleSubmitForEvaluation = useCallback(async () => {
    console.log('🎯 Submit button clicked!');
    console.log('Content length:', localContent.length);
    console.log('Has content:', hasContent);
    
    if (!localContent.trim()) {
      alert("Please write something before submitting for evaluation.");
      return;
    }

    if (onSubmit) {
      console.log('Calling onSubmit prop...');
      onSubmit(localContent);
    }

    console.log('Starting NSW evaluation...');
    setEvaluationStatus("loading");
    setShowNSWEvaluation(true);
    setEvaluationProgress("Analyzing your writing with AI...");

    try {
      setTimeout(() => setEvaluationProgress("Checking grammar and structure..."), 1000);
      setTimeout(() => setEvaluationProgress("Evaluating content and ideas..."), 2000);
      setTimeout(() => setEvaluationProgress("Generating detailed feedback..."), 3000);

      console.log('Calling AI NSW evaluation API...');

      // Call AI evaluation backend
      const response = await fetch("/.netlify/functions/nsw-ai-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayContent: localContent,
          textType: textType,
          prompt: effectivePrompt || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to evaluate essay");
      }

      const aiReport = await response.json();
      console.log('AI Report received:', aiReport);

      setAiEvaluationReport(aiReport);
      setShowNSWEvaluation(false);
      setShowAIReport(true);
      setEvaluationStatus("success");

      // CRITICAL: Also call ai-feedback endpoint to get grammar/vocabulary analysis for Writing Mate tabs
      console.log('🔍 Calling ai-feedback for Grammar/Vocabulary analysis...');
      try {
        const feedbackResponse = await fetch("/.netlify/functions/ai-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            essayText: localContent,
            textType: textType
          })
        });

        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          console.log('✅ AI Feedback received:', feedbackData);
          console.log('Grammar corrections:', feedbackData.grammarCorrections?.length || 0);
          console.log('Vocabulary enhancements:', feedbackData.vocabularyEnhancements?.length || 0);

          // Set analysis data for Grammar and Vocabulary tabs
          setAiAnalysis(feedbackData);
        } else {
          console.warn('⚠️ ai-feedback call failed, tabs will use fallback logic');
        }
      } catch (feedbackError) {
        console.error('❌ ai-feedback error:', feedbackError);
        console.warn('⚠️ Grammar/Vocabulary tabs will use fallback logic');
      }

      console.log('✅ AI Evaluation complete!');
    } catch (error) {
      console.error("❌ NSW AI evaluation error:", error);
      setEvaluationStatus("error");
      setShowNSWEvaluation(false);
      alert(`There was an error during evaluation: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    }
  }, [localContent, onSubmit, textType, effectivePrompt]);

  const handleApplyFix = useCallback((fix: LintFix) => {
    if (textareaRef.current) {
      const start = fix.evidence.start;
      const end = fix.evidence.end;
      const newContent = localContent.substring(0, start) + fix.replacement + localContent.substring(end);
      setLocalContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    }
  }, [localContent, onChange]);

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex flex-col flex-1">
        {/* Enhanced Header with Stunning Gradient and Professional Styling */}
        <div className={`h-16 flex items-center justify-between px-6 border-b shadow-lg ${
          darkMode
            ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-gray-700'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-700'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-white font-semibold text-lg">Text Type:</span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/30">
                {textType}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-white font-medium border border-white/20 hover:border-white/40"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-white font-medium border border-white/20 hover:border-white/40"
            >
              <span>🏠 Home</span>
            </button>
          </div>
        </div>

        {/* Prompt Section */}
        <div className={`flex-shrink-0 border-b ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Prompt Header */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center space-x-2">
              <LightbulbIcon className={`w-4 h-4 flex-shrink-0 ${
                examModeLocal ? 'text-gray-600' : darkMode ? 'text-cyan-400' : 'text-blue-600'
              }`} />
              <h3 className={`font-medium text-sm flex-shrink-0 ${
                examModeLocal ? 'text-gray-800' : darkMode ? 'text-gray-100' : 'text-blue-800'
              }`}>
                {examModeLocal ? 'NSW Selective Writing Exam' : 'Prompt'}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                examModeLocal
                  ? 'bg-gray-200 text-gray-700'
                  : darkMode ? 'bg-cyan-900/50 text-cyan-200 border border-cyan-700' : 'bg-blue-200 text-blue-800'
              }`}>
                {textType}
              </span>
              {!examModeLocal && isPromptCollapsed && effectivePrompt && (
                <span className={`text-xs italic truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {effectivePrompt.substring(0, 80)}...
                </span>
              )}
            </div>

            {!examModeLocal && (
            <button
              onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-xs font-medium flex-shrink-0 border ${
                darkMode
                  ? 'text-cyan-300 hover:text-cyan-100 hover:bg-slate-700 border-cyan-700'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50 border-blue-300'
              }`}
            >
              {isPromptCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              <span>{isPromptCollapsed ? 'Show Prompt' : 'Hide Prompt'}</span>
            </button>
            )}
            {examModeLocal && (
              <button
                onClick={() => setExamModeLocal(false)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Exit Exam Mode</span>
              </button>
            )}
          </div>

          {/* Prompt Content - Always visible in exam mode */}
          {(examModeLocal || !isPromptCollapsed) && effectivePrompt && (
            <div className="px-3 pb-2">
              <div className={`p-2 rounded-lg border text-sm ${
                examModeLocal
                  ? darkMode
                    ? 'bg-slate-800 border-slate-600 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                  : darkMode
                  ? 'bg-slate-900/50 border-slate-700 text-gray-100'
                  : 'bg-white border-blue-200 text-blue-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{effectivePrompt}</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Section - Clean & Minimal (hidden in exam mode) */}
        {!examModeLocal && (
        <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            {/* Plan Button */}
            <button
              onClick={() => {
                console.log('Plan button clicked');
                setShowPlanningTool(!showPlanningTool);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                showPlanningTool
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : darkMode
                  ? 'bg-gray-700 text-blue-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
              title="Planning Tool"
            >
              <PenTool className="w-4 h-4" />
              <span>Plan</span>
            </button>

            {/* Structure Button */}
            <button
              onClick={() => {
                console.log('Structure button clicked');
                setShowStructureModal(!showStructureModal);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                showStructureModal
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                  : darkMode
                  ? 'bg-gray-700 text-green-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
              title="Structure Guide"
            >
              <BookOpen className="w-4 h-4" />
              <span>Structure</span>
            </button>

            {/* Tips Button */}
            <button
              onClick={() => {
                console.log('Tips button clicked');
                setShowTipsModalLocal(!showTipsModalLocal);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                showTipsModalLocal
                  ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
                  : darkMode
                  ? 'bg-gray-700 text-orange-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
              }`}
              title="Writing Tips"
            >
              <LightbulbIcon className="w-4 h-4" />
              <span>Tips</span>
            </button>

            {/* Exam Mode Button */}
            <button
              onClick={() => {
                console.log('Exam button clicked');
                setExamModeLocal(!examModeLocal);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm ${
                examModeLocal
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                  : darkMode
                  ? 'bg-gray-700 text-red-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
              title="Exam Mode"
            >
              <Target className="w-4 h-4" />
              <span>Exam</span>
            </button>
          </div>

          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm tabular-nums font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTime(elapsedTime)}
              </span>
              <button
                onClick={() => isTimerRunning ? (onPauseTimer && onPauseTimer()) : (onStartTimer && onStartTimer())}
                className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                title={isTimerRunning ? "Pause Timer" : "Start Timer"}
              >
                {isTimerRunning ? (
                  <PauseCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <PlayCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </button>
              <button
                onClick={() => onResetTimer && onResetTimer()}
                className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                title="Reset Timer"
              >
                <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Word Count */}
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-bold tabular-nums ${
                currentWordCount >= 400 ? 'text-green-600' :
                currentWordCount >= 250 ? 'text-blue-600' :
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {currentWordCount} {currentWordCount === 1 ? 'word' : 'words'}
              </span>
            </div>

            {/* Pacing Indicator */}
            {currentWordCount > 0 && elapsedTime > 0 && (
              <div className={`text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {currentWordCount < (elapsedTime / 60) * 6.25 ? (
                  <span>Behind • Speed up a bit!</span>
                ) : (
                  <span>On track</span>
                )}
              </div>
            )}


            {/* Toggle Writing Mate Panel */}
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Writing Mate
              </span>
              <button
                onClick={() => setPanelVisible && setPanelVisible(!panelVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  panelVisible
                    ? 'bg-blue-600'
                    : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}
                title={panelVisible ? "Hide Writing Mate" : "Show Writing Mate"}
                role="switch"
                aria-checked={panelVisible}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    panelVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-md transition-colors ${
                showSettings
                  ? darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'
                  : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        )}

        {/* Exam Mode Status Bar */}
        {examModeLocal && (
        <div className="flex items-center justify-center px-6 py-3 border-b flex-shrink-0 bg-gray-100 border-gray-300">
          <div className="flex items-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm tabular-nums font-medium text-gray-800">
                {formatTime(elapsedTime)}
              </span>
            </div>

            {/* Word Count */}
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className={`text-sm font-bold tabular-nums ${
                currentWordCount >= 400 ? 'text-green-600' :
                currentWordCount >= 250 ? 'text-blue-600' :
                'text-gray-700'
              }`}>
                {currentWordCount} {currentWordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-3 border-b flex-shrink-0 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                ⚙️ Writing Settings
              </h4>
              <button
                onClick={() => setShowSettings(false)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Close Settings"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Font Family */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📝 Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => onSettingsChange && onSettingsChange({ fontFamily: e.target.value })}
                  className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode ? 'bg-slate-800 text-gray-100 border-slate-600' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                >
                  <option value="Inter">Inter</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>


// Font Size
<div className="space-y-2">
  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
    📏 Font Size
  </label>
  <select
    value={fontSize}
    onChange={(e) => onSettingsChange && onSettingsChange({ fontSize: parseInt(e.target.value) })}
    className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
      darkMode ? 'bg-slate-800 text-gray-100 border-slate-600' : 'bg-white text-gray-900 border-gray-300'
    }`}
  >
    <option value="14">14px (Small)</option>
    <option value="16">16px (Default)</option>
    <option value="18">18px (Medium)</option>
    <option value="20">20px (Large)</option>
    <option value="24">24px (Extra Large)</option>
  </select>
</div>

// Line Height
<div className="space-y-2">
  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
    📐 Line Height
  </label>
  <select
    value={lineHeight}
    onChange={(e) => onSettingsChange && onSettingsChange({ lineHeight: parseFloat(e.target.value) })}
    className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
      darkMode ? 'bg-slate-800 text-gray-100 border-slate-600' : 'bg-white text-gray-900 border-gray-300'
    }`}
  >
    <option value="1.4">1.4 (Compact)</option>
    <option value="1.6">1.6 (Default)</option>
    <option value="1.8">1.8 (Comfortable)</option>
    <option value="2.0">2.0 (Double Space)</option>
  </select>
</div>

            </div>
          </div>
        )}

        {/* Writing Area - Takes remaining space */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="relative h-full">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`w-full h-full resize-none p-4 rounded-xl shadow-lg transition-all duration-300 text-base leading-relaxed focus:outline-none ${
                darkMode
                  ? 'bg-slate-900 text-gray-100 placeholder-gray-500 border-2 border-slate-700 focus:border-cyan-500 focus:shadow-cyan-500/20'
                  : 'bg-white text-gray-800 placeholder-gray-400 border-2 border-gray-200 focus:border-blue-500 focus:shadow-blue-500/20'
              }`}
              style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: lineHeight.toString() }}
              placeholder="Start writing your amazing story here! Let your creativity flow and bring your ideas to life..."
            />

            {/* Encouragement Message - Minimal */}
            {currentWordCount >= 250 && currentWordCount < 300 && (
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-sm ${
                darkMode ? 'bg-blue-900/80 text-blue-200' : 'bg-blue-50/90 text-blue-700 border border-blue-200'
              }`}>
                🚀 Great progress! Keep going...
              </div>
            )}

          </div>
        </div>

        {/* Bottom Submit Area */}
        <div className="flex-shrink-0 p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
          <NSWSubmitButton
            content={localContent}
            wordCount={currentWordCount}
            isSubmitting={evaluationStatus === 'loading'}
            onSubmit={handleSubmitForEvaluation}
            darkMode={darkMode}
            minWords={50}
          />
        </div>
      </div>

      {/* AI Coach Panel - Conditional */}
      {panelVisible && (
        <div className={`w-[340px] flex-shrink-0 border-l overflow-y-auto transition-all duration-300 ${
          darkMode ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <EnhancedCoachPanel
          textType={textType}
          content={localContent}
          writingPrompt={initialPrompt}
          wordCount={currentWordCount}
          analysis={aiAnalysis || analysis}
          user={user}
          darkMode={darkMode}
          openAIConnected={openAIConnected}
          openAILoading={openAILoading}
          onAnalysisUpdate={(newAnalysis) => onAnalysisChange && onAnalysisChange(newAnalysis)}
          onApplyFix={(fix: LintFix) => {
            // Implement fix application logic here
          }}
          selectedText={selectedText}
          isFocusMode={false}
        />
        </div>
      )}

      {/* Modals */}
      <PlanningToolModal
        isOpen={showPlanningTool}
        onClose={() => setShowPlanningTool(false)}
        textType={textType}
        onSavePlan={(plan) => {
          console.log('Plan saved:', plan);
          setShowPlanningTool(false);
        }}
      />
      <StructureGuideModal
        isOpen={showStructureModal}
        onClose={() => setShowStructureModal(false)}
        textType={textType}
      />
      <TipsModal
        isOpen={showTipsModalLocal}
        onClose={() => setShowTipsModalLocal(false)}
        textType={textType}
      />
      {showAIReport && aiEvaluationReport && (
        <AIEvaluationReportDisplay
          report={aiEvaluationReport}
          essayText={localContent}
          textType={textType} // Pass the writing type
          onClose={() => {
            setShowAIReport(false);
            setAiEvaluationReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
          }}
        />
      )}
      {showReportModal && nswReport && (
        <ReportModal
          isOpen={showReportModal}
          data={nswReport}
          onClose={() => {
            setShowReportModal(false);
            setNswReport(null);
            if (onAnalysisChange) onAnalysisChange(null);
          }}
          onApplyFix={handleApplyFix}
          studentName="Student"
          essayText={localContent}
        />
      )}
      {showNSWEvaluation && evaluationStatus === "loading" && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`p-8 rounded-xl shadow-2xl text-center max-w-md ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'
          }`}>
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-cyan-500 mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-cyan-500 animate-pulse" />
              </div>
            </div>
            <p className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>Evaluating your writing...</p>
            <p className={`text-sm mt-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{evaluationProgress}</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            {evaluationStatus === "error" && (
              <button
                onClick={() => {
                  setShowNSWEvaluation(false);
                  setEvaluationStatus("idle");
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          loading={isLoadingPrompt}
          onGeneratePrompt={handleGenerateNewPrompt}
          onCustomPrompt={handleCustomPromptInput}
          textType={textType}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default EnhancedWritingLayoutNSW;