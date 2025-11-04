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

  // Auto-fetch AI analysis for Grammar/Vocabulary tabs (debounced) - FIX: Added loading state management and error handling to clear the stuck "Analyzing" state
  useEffect(() => {
    // Only fetch if content is substantial (50+ words)
    const wordCount = localContent.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 50) {
      return;
    }

    // Debounce: wait 3 seconds after user stops typing
    const timeoutId = setTimeout(async () => {
      setEvaluationStatus("loading"); // Start loading
      console.log('🔄 Auto-fetching AI analysis for Writing Mate tabs...');
      try {
        const feedbackResponse = await fetch("/api/ai-feedback", { 
          
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
          setEvaluationStatus("success"); // Success: Clear loading state
        } else {
          console.error('❌ Failed to fetch AI feedback:', feedbackResponse.statusText);
          setEvaluationStatus("error"); // Error: Clear loading state
        }
      } catch (error) {
        console.error('❌ Error fetching AI feedback:', error);
        setEvaluationStatus("error"); // Network/other error: Clear loading state
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [localContent, textType, setEvaluationStatus, setAiAnalysis]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    // Reset analysis when content changes significantly
    if (aiAnalysis && newContent.length < 50) {
      setAiAnalysis(null);
      setEvaluationStatus("idle");
    }
  };

  const handleApplyFix = (fix: LintFix) => {
    const { start, end, replacement } = fix;
    const newContent = localContent.substring(0, start) + replacement + localContent.substring(end);
    setLocalContent(newContent);
    // Re-trigger analysis after applying fix
    setAiAnalysis(null);
    setEvaluationStatus("idle");
  };

  const handleGenerateNewPrompt = useCallback(async (type: string) => {
    setIsLoadingPrompt(true);
    try {
      const newPrompt = await generatePrompt(type);
      setGeneratedPrompt(newPrompt);
      setCustomPromptInput(null);
      if (setPrompt) setPrompt(newPrompt);
      setShowPromptOptionsModal(false);
      if (onPopupCompleted) onPopupCompleted();
      eventBus.emit('promptGenerated', { prompt: newPrompt, textType: type });
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate prompt. Please try again.");
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [setPrompt, onPopupCompleted]);

  const handleCustomPromptInput = useCallback((prompt: string, type: string) => {
    setCustomPromptInput(prompt);
    setGeneratedPrompt(null);
    if (setPrompt) setPrompt(prompt);
    if (onTextTypeChange) onTextTypeChange(type);
    setShowPromptOptionsModal(false);
    if (onPopupCompleted) onPopupCompleted();
    eventBus.emit('promptGenerated', { prompt: prompt, textType: type });
  }, [setPrompt, onPopupCompleted, onTextTypeChange]);

  const handleSubmitForEvaluation = useCallback(async () => {
    if (currentWordCount < 50) {
      alert("Please write at least 50 words before submitting for evaluation.");
      return;
    }
    
    setShowNSWEvaluation(true);
    setEvaluationStatus("loading");
    setEvaluationProgress("Starting AI evaluation...");

    try {
      // Step 1: Request comprehensive feedback
      setEvaluationProgress("Analyzing content and structure...");
      const feedbackResponse = await fetch("/api/ai-feedback-comprehensive", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayText: localContent,
          textType: textType,
          prompt: effectivePrompt
        })
      });

      if (!feedbackResponse.ok) {
        throw new Error(`API error: ${feedbackResponse.statusText}`);
      }

      const comprehensiveFeedback = await feedbackResponse.json();
      
      // Step 2: Generate NSW Report
      setEvaluationProgress("Generating NSW marking criteria report...");
      const reportGenerator = new NSWEvaluationReportGenerator(comprehensiveFeedback, localContent, textType);
      const nswReportData = reportGenerator.generateReport();
      
      setNswReport(nswReportData);
      setEvaluationProgress("Finalizing report...");
      
      // Step 3: Generate AI Evaluation Report Display Data
      const aiReportData = {
        comprehensiveFeedback,
        nswReportData,
        essayText: localContent,
        textType,
        prompt: effectivePrompt
      };
      setAiEvaluationReport(aiReportData);

      setEvaluationStatus("success");
      setShowReportModal(true); // Show the detailed report modal
      setShowNSWEvaluation(false); // Hide the loading modal

    } catch (error) {
      console.error("Evaluation failed:", error);
      setEvaluationProgress("Evaluation failed. Please try again.");
      setEvaluationStatus("error");
      setTimeout(() => setShowNSWEvaluation(false), 3000); // Hide after a delay
    }
  }, [localContent, textType, effectivePrompt, currentWordCount]);

  // JSX for the component
  return (
    <div className={`flex h-full w-full ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      
      {/* Left Panel: Writing Area */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        
        {/* Top Bar */}
        <div className={`flex items-center justify-between p-3 flex-shrink-0 ${darkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => eventBus.emit('navigate', '/dashboard')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                darkMode
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>🏠 Home</span>
            </button>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Text Type: <span className="font-semibold capitalize text-purple-500">{textType}</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentWordCount} words
              </span>
              <span className={`text-sm font-medium ${currentWordCount >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                {currentWordCount >= 50 ? 'On track' : 'Min 50'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md transition-colors ${
                darkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Prompt Area */}
        <div className={`p-3 flex-shrink-0 ${darkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white border-b border-gray-200'}`}>
          <div className={`p-3 rounded-lg transition-all duration-300 ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LightbulbIcon className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Prompt</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                  textType === 'narrative' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {textType}
                </span>
              </div>
              <button
                onClick={() => setHidePrompt(!hidePrompt)}
                className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                  darkMode ? 'text-gray-400 hover:bg-slate-600' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                {hidePrompt ? 'Show Prompt' : 'Hide Prompt'}
              </button>
            </div>
            
            {!hidePrompt && (
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {effectivePrompt}
              </p>
            )}
          </div>
        </div>

        {/* Writing Tools Bar */}
        <div className={`flex items-center justify-between p-3 flex-shrink-0 ${darkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPlanningTool(true)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                darkMode
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Plan</span>
            </button>
            <button
              onClick={() => setShowStructureModal(true)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                darkMode
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
              <span>Structure</span>
            </button>
            <button
              onClick={() => setShowTipsModalLocal(true)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                darkMode
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LightbulbIcon className="w-4 h-4" />
              <span>Tips</span>
            </button>
            <button
              onClick={() => setExamModeLocal(!examModeLocal)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                examModeLocal
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : darkMode ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Exam</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            {examModeLocal && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className={`text-sm tabular-nums font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {formatTime(elapsedTime)}
                </span>
                <button
                  onClick={isTimerRunning ? onPauseTimer : onStartTimer}
                  className={`p-1 rounded-full transition-colors ${
                    isTimerRunning
                      ? 'text-red-500 hover:bg-red-500/20'
                      : 'text-green-500 hover:bg-green-500/20'
                  }`}
                  title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                >
                  {isTimerRunning ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                </button>
                <button
                  onClick={onResetTimer}
                  className={`p-1 rounded-full text-gray-500 hover:bg-gray-500/20 transition-colors`}
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentWordCount} words
              </span>
              <span className={`text-sm font-medium ${currentWordCount >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                {currentWordCount >= 50 ? 'On track' : 'Min 50'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Writing Mate
              </span>
              <button
                onClick={() => setPanelVisible && setPanelVisible(!panelVisible)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  panelVisible ? 'bg-cyan-500' : 'bg-gray-400'
                }`}
                title={panelVisible ? "Hide Writing Mate" : "Show Writing Mate"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    panelVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
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


              {/* Font Size */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  📏 Font Size
                </label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => onSettingsChange && onSettingsChange({ fontSize: parseInt(e.target.value) })}
                  min="12"
                  max="24"
                  className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode ? 'bg-slate-800 text-gray-100 border-slate-600' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  ↕️ Line Height
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => onSettingsChange && onSettingsChange({ lineHeight: parseFloat(e.target.value) })}
                  min="1.0"
                  max="2.5"
                  className={`w-full p-2 border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode ? 'bg-slate-800 text-gray-100 border-slate-600' : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className={`font-medium text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                📊 Writing Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Characters</p>
                  <p className="tabular-nums font-bold text-lg text-purple-500">{writingMetrics.characters}</p>
                </div>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sentences</p>
                  <p className="tabular-nums font-bold text-lg text-purple-500">{writingMetrics.sentences}</p>
                </div>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Paragraphs</p>
                  <p className="tabular-nums font-bold text-lg text-purple-500">{writingMetrics.paragraphs}</p>
                </div>
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg. Sentence</p>
                  <p className="tabular-nums font-bold text-lg text-purple-500">{writingMetrics.avgWordsPerSentence} words</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Writing Area */}
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
              isSubmitting={evaluationStatus === "loading"}
              onSubmit={handleSubmitForEvaluation}
              darkMode={darkMode}
              minWords={50}
            />
        </div>
      </div>

      {/* Right Panel: Writing Mate Coach */}
      {panelVisible && (
        <div className={`flex-shrink-0 w-80 h-full border-l ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <EnhancedCoachPanel
            content={localContent}
            textType={textType}
            wordCount={currentWordCount}
            darkMode={darkMode}
            analysis={aiAnalysis}
            onApplyFix={handleApplyFix}
            selectedText={selectedText}
            evaluationStatus={evaluationStatus} // Pass the status
            // Other props...
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
