import React, { useState, useEffect } from 'react';
import { Clock, X, FileText, AlertCircle, CheckCircle, ChevronDown, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { NSWEvaluationReportGenerator } from '../components/NSWEvaluationReportGenerator';
import { NSWEvaluationReportDisplay } from '../components/NSWEvaluationReportDisplay';

interface ExamSimulationModeProps {
  content?: string;
  onChange?: (content: string) => void;
  textType?: string;
  initialPrompt?: string;
  wordCount?: number;
  onWordCountChange?: () => void;
  darkMode?: boolean;
  isTimerRunning?: boolean;
  elapsedTime?: number;
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  onResetTimer?: () => void;
  onSubmit?: () => void;
  user?: any;
  openAIConnected?: boolean | null;
  openAILoading?: boolean;
  onExit?: () => void;
  prompt?: string;
}

export function ExamSimulationMode({
  content: initialContent = '',
  onChange,
  textType = 'narrative',
  initialPrompt = '',
  wordCount: initialWordCount = 0,
  onWordCountChange,
  darkMode = false,
  isTimerRunning = false,
  elapsedTime = 0,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSubmit,
  user,
  openAIConnected,
  openAILoading,
  onExit,
  prompt: propPrompt,
}: ExamSimulationModeProps) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isActive, setIsActive] = useState(true); // Start timer automatically
  const [content, setContent] = useState(initialContent);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(true);

  // Use the prompt from props, or fall back to initialPrompt
  const displayPrompt = propPrompt || initialPrompt || 'Persuasive Writing Task: "Should schools replace traditional textbooks with digital devices like tablets and laptops?" In your response, you should: • Present a clear position on this issue • Support your argument with relevant examples and evidence • Consider and address opposing viewpoints • Use persuasive language techniques effectively • Organize your ideas in a logical structure Target: 300-500 words | Time: 30 minutes';

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            handleAutoSubmit();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!content.trim() || content.trim().length < 20) {
      alert("Please write at least 20 characters before submitting for evaluation.");
      setShowSubmitConfirm(false);
      return;
    }

    setIsSubmitted(true);
    setIsActive(false);
    setShowSubmitConfirm(false);
    setIsEvaluating(true);
    setEvaluationError(null);
    
    // Store the essay for evaluation
    localStorage.setItem('examEssay', content);
    localStorage.setItem('examSubmissionTime', new Date().toISOString());
    localStorage.setItem("examTimeUsed", (30 * 60 - timeRemaining).toString());

    try {
      // Generate NSW Evaluation Report
      const generatorReport = NSWEvaluationReportGenerator.generateReport({
        essayContent: content,
        textType: textType || 'narrative',
        prompt: displayPrompt,
        wordCount: content.trim().split(/\s+/).length,
        targetWordCountMin: 100,
        targetWordCountMax: 500,
      });

      // Transform generator output to match display expectations
      const transformedReport = {
        overallScore: generatorReport.overallScore,
        overallGrade: calculateGrade(generatorReport.overallScore),
        domains: generatorReport.domains,
        detailedFeedback: {
          wordCount: content.trim().split(/\s+/).length,
          sentenceVariety: {
            simple: 0,
            compound: 0,
            complex: 0,
            analysis: "Sentence variety analysis available in detailed feedback."
          },
          vocabularyAnalysis: {
            sophisticatedWords: [],
            repetitiveWords: [],
            suggestions: []
          },
          literaryDevices: {
            identified: [],
            suggestions: []
          },
          structuralElements: {
            hasIntroduction: true,
            hasConclusion: true,
            paragraphCount: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            coherence: "Good"
          },
          technicalAccuracy: {
            spellingErrors: 0,
            grammarIssues: [],
            punctuationIssues: []
          }
        },
        recommendations: [],
        strengths: [],
        areasForImprovement: [],
        essayContent: generatorReport.cleanedEssay || content,
        criticalWarnings: []
      };

      console.log("NSW Evaluation Report Generated:", transformedReport);
      setEvaluationReport(transformedReport);
      setIsEvaluating(false);
    } catch (error: any) {
      console.error("Error generating NSW evaluation report:", error);
      setEvaluationError(error.message || "Failed to generate evaluation report. Please try again.");
      setIsEvaluating(false);
      setIsSubmitted(false);
    }

    function calculateGrade(score: number): string {
      if (score >= 9) return 'A+';
      if (score >= 8.5) return 'A';
      if (score >= 8) return 'A-';
      if (score >= 7.5) return 'B+';
      if (score >= 7) return 'B';
      if (score >= 6.5) return 'B-';
      if (score >= 6) return 'C+';
      if (score >= 5.5) return 'C';
      if (score >= 5) return 'C-';
      if (score >= 4) return 'D';
      return 'E';
    }
  };

  const handleAutoSubmit = async () => {
    setIsSubmitted(true);

    if (!content.trim() || content.trim().length < 20) {
      console.warn("Auto-submit with essay too short. Skipping evaluation.");
      return;
    }

    localStorage.setItem('examEssay', content);
    localStorage.setItem('examSubmissionTime', new Date().toISOString());
    localStorage.setItem("examTimeUsed", (30 * 60).toString());

    try {
      // Generate NSW Evaluation Report on auto-submit
      const generatorReport = NSWEvaluationReportGenerator.generateReport({
        essayContent: content,
        textType: textType || 'narrative',
        prompt: displayPrompt,
        wordCount: content.trim().split(/\s+/).length,
        targetWordCountMin: 100,
        targetWordCountMax: 500,
      });

      // Transform generator output to match display expectations
      const transformedReport = {
        overallScore: generatorReport.overallScore,
        overallGrade: calculateGrade(generatorReport.overallScore),
        domains: generatorReport.domains,
        detailedFeedback: {
          wordCount: content.trim().split(/\s+/).length,
          sentenceVariety: {
            simple: 0,
            compound: 0,
            complex: 0,
            analysis: "Sentence variety analysis available in detailed feedback."
          },
          vocabularyAnalysis: {
            sophisticatedWords: [],
            repetitiveWords: [],
            suggestions: []
          },
          literaryDevices: {
            identified: [],
            suggestions: []
          },
          structuralElements: {
            hasIntroduction: true,
            hasConclusion: true,
            paragraphCount: content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            coherence: "Good"
          },
          technicalAccuracy: {
            spellingErrors: 0,
            grammarIssues: [],
            punctuationIssues: []
          }
        },
        recommendations: [],
        strengths: [],
        areasForImprovement: [],
        essayContent: generatorReport.cleanedEssay || content,
        criticalWarnings: []
      };

      console.log("NSW Evaluation Report Generated (Auto-Submit):", transformedReport);
      setEvaluationReport(transformedReport);
    } catch (error: any) {
      console.error("Error generating NSW evaluation report on auto-submit:", error);
      setEvaluationError(error.message || "Failed to generate evaluation report on auto-submit. Please try again.");
    }

    function calculateGrade(score: number): string {
      if (score >= 9) return 'A+';
      if (score >= 8.5) return 'A';
      if (score >= 8) return 'A-';
      if (score >= 7.5) return 'B+';
      if (score >= 7) return 'B';
      if (score >= 6.5) return 'B-';
      if (score >= 6) return 'C+';
      if (score >= 5.5) return 'C';
      if (score >= 5) return 'C-';
      if (score >= 4) return 'D';
      return 'E';
    }
  };

  const cancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'text-green-600'; // > 10 minutes
    if (timeRemaining > 300) return 'text-yellow-600'; // > 5 minutes
    return 'text-red-600'; // < 5 minutes
  };

  const { isDarkMode, toggleTheme } = useTheme();

  // Show evaluation report if available
  if (evaluationReport) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden">
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-2 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">NSW Evaluation Report</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Practice Exam Results</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
            <button
              onClick={onExit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
              aria-label="Exit exam mode"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <NSWEvaluationReportDisplay 
            report={evaluationReport}
            essayText={content}
            onClose={onExit}
          />
        </div>
      </div>
    );
  }

  // Show submission success screen
  if (isSubmitted && isEvaluating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Generating Report</h1>
            <p className="text-blue-100 text-lg">Analyzing your essay...</p>
          </div>
          <div className="p-8">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600">Please wait while we evaluate your essay against NSW criteria</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if evaluation failed
  if (evaluationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Evaluation Error</h1>
            <p className="text-red-100 text-lg">Unable to generate report</p>
          </div>
          <div className="p-8">
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <p className="text-sm text-red-800">{evaluationError}</p>
            </div>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEvaluationError(null);
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* HEADER with proper height and Back to Home button */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">NSW Selective Writing Test</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Practice Exam Mode</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
            aria-label="Back to home"
          >
            Back to Home
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
            aria-label="Exit exam mode"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT: Left Prompt Panel + Right Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - VERTICAL PROMPT */}
        <div className="w-72 flex flex-col bg-gradient-to-b from-blue-50 to-blue-25 dark:from-slate-800 dark:to-slate-900 border-r border-blue-200 dark:border-slate-700 overflow-hidden">
          {/* Prompt Header */}
          <div
            onClick={() => setPromptExpanded(!promptExpanded)}
            className="px-4 py-3 bg-blue-100 dark:bg-slate-700 border-b border-blue-200 dark:border-slate-600 cursor-pointer hover:bg-blue-150 dark:hover:bg-slate-600 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <h2 className="font-semibold text-sm text-blue-900 dark:text-blue-200">Writing Prompt</h2>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-blue-700 dark:text-blue-400 transition-transform ${promptExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Prompt Content */}
          {promptExpanded && (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                {displayPrompt}
              </p>
              
              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t border-blue-200 dark:border-slate-600 space-y-3">
                <div className="bg-white dark:bg-slate-700 bg-opacity-60 dark:bg-opacity-60 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">Target Word Count</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">300-500 words</p>
                </div>
                <div className="bg-white dark:bg-slate-700 bg-opacity-60 dark:bg-opacity-60 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">Time Limit</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">30 minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed State - Show Icon Only */}
          {!promptExpanded && (
            <div className="flex-1 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-blue-300" />
            </div>
          )}
        </div>

        {/* RIGHT PANEL - WRITING AREA */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 overflow-hidden">

          {/* Timer Bar - Compact */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-2 flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Time Remaining:</span>
              <span className={`text-sm font-bold ${getTimeColor()} dark:brightness-125`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Writing Area */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <textarea
              disabled={!isActive}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none text-base leading-relaxed text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder={isActive ? "Start writing your response here..." : "Click Start Exam to begin"}
            />
          </div>

          {/* Submit Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSubmit}
              disabled={!isActive || content.trim().length === 0}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 ${
                !isActive || content.trim().length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg'
              }`}
            >
              Submit Essay
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">You are about to submit your essay. This action cannot be undone.</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={cancelSubmit}
                className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md text-sm"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
