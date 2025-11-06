import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send, MessageSquare, BarChart3, Lightbulb, Target, Star, TrendingUp, Award, List, BookOpen, AlertCircle, Loader2, FileCheck, Sparkles, AlignLeft, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { StepByStepWritingBuilder } from './StepByStepWritingBuilder';
import { ContextualAICoachPanel } from './ContextualAICoachPanel';
import { ComprehensiveFeedbackDisplay } from './ComprehensiveFeedbackDisplay';
import { GrammarCorrectionPanel } from './GrammarCorrectionPanel';
import { VocabularyEnhancementPanel } from './VocabularyEnhancementPanel';
import { SentenceStructurePanel } from './SentenceStructurePanel';
import { TieredFeedbackChat } from './TieredFeedbackChat'; // <-- Import the dedicated chat component
import { generateIntelligentResponse, type EnhancedCoachResponse } from '../lib/enhancedIntelligentResponseGenerator';
import { ComprehensiveFeedbackAnalyzer } from '../lib/comprehensiveFeedbackAnalyzer';
import { generateDynamicExamples, formatExamplesForDisplay } from '../lib/dynamicExampleGenerator';
import { ChatSessionService } from '../lib/chatSessionService';
import { NSW_MARKING_CRITERIA, generateScoringGuidance, mapToNSWScores, getImprovementExamples } from '../lib/nswMarkingCriteria';
import { NSWCriteriaCompact, NSWCriteriaDisplay } from './NSWCriteriaDisplay';
import { WRITING_MATE_SIDEBAR_CONTENT } from '../lib/textTypeContent'; // <-- NEW IMPORT

// ... (rest of the functions: getTimeAwareMessage, getWritingPhase, NSWCriteriaAnalyzer)

// ... (rest of the component props and interface definitions)

export const EnhancedCoachPanel: React.FC<EnhancedCoachPanelProps> = ({
  textType,
  content,
  writingPrompt,
  wordCount,
  analysis,
  onApplyFix,
  darkMode = false,
  selectedText = '',
  isFocusMode = false,
}) => {
  // Removed internal chat state and logic to use the dedicated TieredFeedbackChat component.
  // The auto-response logic was also removed from here.
  const [currentView, setCurrentView] = useState<CoachView>('chat');
  const [comprehensiveFeedback, setComprehensiveFeedback] = useState<DetailedFeedback | null>(null);
  const [dynamicExamples, setDynamicExamples] = useState<DynamicExample[] | null>(null);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isGeneratingContextual, setIsGeneratingContextual] = useState(false);
  const [contextualFeedback, setContextualFeedback] = useState<EnhancedCoachResponse | null>(null);

  // Timer for time-aware messages
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [lastParagraph, setLastParagraph] = useState('');
  const [lastParagraphFeedbackTime, setLastParagraphFeedbackTime] = useState(0);
  const [lastParagraphFeedback, setLastParagraphFeedback] = useState<EnhancedCoachResponse | null>(null);
  const [lastParagraphWordCount, setLastParagraphWordCount] = useState(0);
  const [lastParagraphPhase, setLastParagraphPhase] = useState<ReturnType<typeof getWritingPhase> | null>(null);
  const [lastParagraphTimeInfo, setLastParagraphTimeInfo] = useState<ReturnType<typeof getTimeAwareMessage> | null>(null);

  // ... (rest of the useEffects and handlers)

  // Tabs for the Coach Panel
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, component: TieredFeedbackChat },
    { id: 'examples', label: 'Examples', icon: Lightbulb, component: DynamicExamplesPanel },
    { id: 'steps', label: 'Steps', icon: List, component: StepByStepWritingBuilder },
    { id: 'detailed', label: 'Detail', icon: BarChart3, component: ComprehensiveFeedbackDisplay },
    { id: 'grammar', label: 'Grammar', icon: FileCheck, component: GrammarCorrectionPanel },
    { id: 'vocabulary', label: 'Vocab', icon: Sparkles, component: VocabularyEnhancementPanel },
    { id: 'sentences', label: 'Sentences', icon: AlignLeft, component: SentenceStructurePanel },
  ];

  // ... (rest of the component logic)

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'dark' : ''}`}>
      {/* Tab Navigation */}
      <div className={`flex-shrink-0 flex border-b ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id as CoachView)}
            className={`flex-1 flex items-center justify-center space-x-2 p-3 text-sm font-medium transition-colors ${
              currentView === tab.id
                ? `text-blue-600 border-b-2 border-blue-600 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`
                : `text-gray-500 hover:text-gray-700 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {currentView === 'chat' ? (
          <TieredFeedbackChat
            textType={textType}
            currentContent={content}
            wordCount={wordCount}
            className="flex-1"
          />
        ) : currentView === 'examples' ? (
          <DynamicExamplesPanel
            textType={textType}
            content={content}
            darkMode={darkMode}
            examples={dynamicExamples}
            isGenerating={isGeneratingExamples}
          />
        ) : currentView === 'steps' ? (
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
              <div className={`rounded-lg p-6 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-blue-50 border border-blue-200'}`}>
                <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Start Writing to See Detailed Feedback</h3>
                <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Once you start writing, you'll see comprehensive feedback on:
                </p>
                <ul className={`text-left inline-block text-sm space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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