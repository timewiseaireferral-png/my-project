import React from "react";
import { InteractiveTextEditor, EditorHandle } from "../components/InteractiveTextEditor";
import { EnhancedCoachPanel } from "../components/EnhancedCoachPanel";
import { CoachProvider } from "../components/CoachProvider";
import { WritingStatusBar } from "../components/WritingStatusBar";
import { NSWStandaloneSubmitSystem } from "../components/NSWStandaloneSubmitSystem";
import ProgressCoach from "../components/ProgressCoach";
import type { DetailedFeedback, LintFix } from "../types/feedback";
import { evaluateEssay, saveDraft } from "../lib/api";
import { validateDetailedFeedback } from "../types/feedback.validate";
import { eventBus } from "../lib/eventBus";
import { detectNewParagraphs } from "../lib/paragraphDetection";
import { ChevronDown, Clock, BookOpen, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WritingWorkspaceFixed() {
  const navigate = useNavigate();
  const editorRef = React.useRef<EditorHandle>(null);
  const [analysis, setAnalysis] = React.useState<DetailedFeedback | null>(null);
  const [nswReport, setNswReport] = React.useState<any>(null);
  const [status, setStatus] = React.useState<"idle"|"loading"|"success"|"error">("idle");
  const [err, setErr] = React.useState<string|undefined>(undefined);
  const [currentText, setCurrentText] = React.useState<string>("");
  const [textType, setTextType] = React.useState<"narrative" | "persuasive" | "informative">("narrative");
  const [targetWordCount, setTargetWordCount] = React.useState<number>(300);
  const [wordCount, setWordCount] = React.useState<number>(0);
  const [showNSWEvaluation, setShowNSWEvaluation] = React.useState<boolean>(false);
  const [promptExpanded, setPromptExpanded] = React.useState<boolean>(true);
  const prevTextRef = React.useRef<string>("");

  const draftId = React.useRef<string>(
    `draft-${(
      (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function")
        ? globalThis.crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2))
    )}`
  );
  const [version, setVersion] = React.useState(0);

  // Listen for submit events from AppContent
  React.useEffect(() => {
    const handleSubmitEvent = (event: CustomEvent) => {
      console.log('📨 WritingWorkspace: Received submit event:', event.detail);
      onNSWSubmit();
    };

    window.addEventListener('submitForEvaluation', handleSubmitEvent as EventListener);
    
    return () => {
      window.removeEventListener('submitForEvaluation', handleSubmitEvent as EventListener);
    };
  }, []);

  // Track text changes for progress monitoring AND coach feedback
  React.useEffect(() => {
    const interval = setInterval(() => {
      const text = editorRef.current?.getText() || "";
      if (text !== currentText) {
        setCurrentText(text);
        
        // Update word count
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);

        // Trigger coach feedback for new paragraphs
        const events = detectNewParagraphs(prevTextRef.current, text);
        if (events.length) {
          console.log("Emitting paragraph.ready event:", events[events.length - 1]);
          eventBus.emit("paragraph.ready", events[events.length - 1]);
        }
        prevTextRef.current = text;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentText]);

  // NSW Evaluation Submit Handler
  async function onNSWSubmit() {
    console.log('🎯 NSW Submit triggered');
    setStatus("loading");
    setErr(undefined);
    setShowNSWEvaluation(true);
    
    try {
      const text = editorRef.current?.getText() || currentText || "";
      if (!text.trim()) {
        throw new Error("Please write some content before submitting for evaluation");
      }
      
      console.log("NSW Evaluation initiated for:", { 
        text: text.substring(0, 100) + "...", 
        textType, 
        wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length 
      });
      
    } catch (e: any) {
      console.error('NSW Submit error:', e);
      setStatus("error");
      setErr(e?.message || "Failed to initiate NSW evaluation");
      setShowNSWEvaluation(false);
    }
  }

  // Handle NSW evaluation completion
  function onNSWEvaluationComplete(report: any) {
    console.log("NSW Evaluation completed:", report);
    console.log("Report domains:", report.domains);
    setNswReport(report);
    setStatus("success");
    
    // Convert NSW report to DetailedFeedback format for compatibility
    const convertedAnalysis: DetailedFeedback = {
      overallScore: report.overallScore || 0,
      criteria: {
        ideasContent: {
          score: Math.round((report.domains?.contentAndIdeas?.score || 0) / 5) || 0,
          weight: 30,
          strengths: [report.domains?.contentAndIdeas?.feedback || "Good content development"],
          improvements: report.domains?.contentAndIdeas?.improvements || []
        },
        structureOrganization: {
          score: Math.round((report.domains?.textStructure?.score || 0) / 5) || 0,
          weight: 25,
          strengths: [report.domains?.textStructure?.feedback || "Clear structure"],
          improvements: report.domains?.textStructure?.improvements || []
        },
        languageVocab: {
          score: Math.round((report.domains?.languageFeatures?.score || 0) / 5) || 0,
          weight: 25,
          strengths: [report.domains?.languageFeatures?.feedback || "Good language use"],
          improvements: report.domains?.languageFeatures?.improvements || []
        },
        spellingPunctuationGrammar: {
          score: Math.round((report.domains?.conventions?.score || 0) / 5) || 0,
          weight: 20,
          strengths: [report.domains?.conventions?.feedback || "Accurate conventions"],
          improvements: report.domains?.conventions?.improvements || []
        }
      },
      grammarCorrections: report.grammarCorrections || [],
      vocabularyEnhancements: report.vocabularyEnhancements || [],
      id: report.id || `nsw-${Date.now()}`,
      assessmentId: report.assessmentId
    };
    
    setAnalysis(convertedAnalysis);
  }

  async function onApplyFix(fix: LintFix) {
    editorRef.current?.applyFix(fix.start, fix.end, fix.replacement);
  }

  function onProgressUpdate(metrics: any) {
    console.log('Progress updated:', metrics);
  }

  // Simple autosave
  React.useEffect(() => {
    const int = setInterval(async () => {
      const text = editorRef.current?.getText() || "";
      localStorage.setItem(draftId.current, JSON.stringify({ text, version }));
      try {
        await saveDraft(draftId.current, text, version);
      } catch (e) {
        console.warn("Autosave failed:", e);
      }
    }, 10000);
    return () => clearInterval(int);
  }, [version]);

  // Load saved draft on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(draftId.current);
    if (saved) {
      try {
        const { text } = JSON.parse(saved);
        editorRef.current?.setText(text);
        setCurrentText(text);
      } catch (e) {
        console.warn("Failed to load draft:", e);
      }
    }
  }, []);

  const prompt = "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!";

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* NARROWER HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between h-16">
        {/* Left: Back to Home Button, Title and Text Type */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-all text-gray-700 text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-gray-900">NSW Selective Writing</h1>
          </div>
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
            <span className="text-xs text-gray-600 font-medium">TEXT TYPE:</span>
            <select
              value={textType}
              onChange={(e) => setTextType(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="narrative">Narrative</option>
              <option value="persuasive">Persuasive</option>
              <option value="informative">Informative</option>
            </select>
          </div>
        </div>

        {/* Right: Status and Word Count */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span className="font-medium">Words:</span>
            <span className="font-bold text-gray-900">{wordCount}</span>
          </div>
          <WritingStatusBar
            status={status}
            examMode={true}
          />
        </div>
      </div>

      {/* MAIN LAYOUT: Left Prompt Panel + Right Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - VERTICAL PROMPT */}
        <div className="w-72 flex flex-col bg-gradient-to-b from-blue-50 to-blue-25 border-r border-blue-200 overflow-hidden">
          {/* Prompt Header */}
          <div 
            onClick={() => setPromptExpanded(!promptExpanded)}
            className="px-4 py-3 bg-blue-100 border-b border-blue-200 cursor-pointer hover:bg-blue-150 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <h2 className="font-semibold text-sm text-blue-900">Writing Prompt</h2>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-blue-700 transition-transform ${promptExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Prompt Content */}
          {promptExpanded && (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                {prompt}
              </p>
              
              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t border-blue-200 space-y-3">
                <div className="bg-white bg-opacity-60 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Target Word Count</p>
                  <p className="text-sm text-blue-700">300-500 words</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Time Limit</p>
                  <p className="text-sm text-blue-700">30 minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed State - Show Icon Only */}
          {!promptExpanded && (
            <div className="flex-1 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
          )}
        </div>

        {/* RIGHT PANEL - EDITOR AND COACH */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CoachProvider>
            <div className="flex-1 flex overflow-hidden">
              {/* Main Content: Editor */}
              <div className="flex-1 flex flex-col relative">
                <InteractiveTextEditor
                  ref={editorRef}
                  analysis={analysis}
                  onApplyFix={onApplyFix}
                  className="flex-1 p-8 bg-white text-lg leading-relaxed focus:outline-none overflow-y-auto"
                />
                {showNSWEvaluation && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 z-10 flex items-center justify-center">
                    <NSWStandaloneSubmitSystem 
                      text={currentText}
                      textType={textType}
                      wordCount={wordCount}
                      onEvaluationComplete={onNSWEvaluationComplete}
                      onClose={() => setShowNSWEvaluation(false)}
                    />
                  </div>
                )}
              </div>

              {/* Right Sidebar: Coach Panel */}
              <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
                <EnhancedCoachPanel 
                  analysis={analysis}
                  onApplyFix={onApplyFix} 
                />
              </div>
            </div>

            {/* Footer with Progress Coach */}
            <div className="bg-white border-t border-gray-200 p-4">
              <ProgressCoach 
                wordCount={wordCount}
                targetWordCount={targetWordCount}
                onUpdate={onProgressUpdate}
              />
            </div>
          </CoachProvider>
        </div>
      </div>
    </div>
  );
}
