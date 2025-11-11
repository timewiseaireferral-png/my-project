import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Award,
  Sparkles,
  X,
} from 'lucide-react';
import type { ComprehensiveFeedback } from '../lib/comprehensiveFeedbackAnalyzer';

interface ComprehensiveFeedbackDisplayProps {
  feedback: ComprehensiveFeedback;
  darkMode?: boolean;
}

export const ComprehensiveFeedbackDisplay: React.FC<ComprehensiveFeedbackDisplayProps> = ({
  feedback,
  darkMode = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['grammar', 'nsw']));
  const [dismissedIssues, setDismissedIssues] = useState<Set<number>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const dismissIssue = (index: number) => {
    const newDismissed = new Set(dismissedIssues);
    newDismissed.add(index);
    setDismissedIssues(newDismissed);
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreColorByPercentage = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>

      {/* Grammar, Spelling & Punctuation Section */}
      {feedback.grammarIssues.length > 0 && (
        <div className={`border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={() => toggleSection('grammar')}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-left">Grammar, Spelling & Punctuation</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor('high')}`}>
                {feedback.grammarIssues.length} {feedback.grammarIssues.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>
            {expandedSections.has('grammar') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.has('grammar') && (
            <div className="px-4 pb-4 space-y-3">
              {feedback.grammarIssues.filter((_, idx) => !dismissedIssues.has(idx)).map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)} relative`}
                >
                  <button
                    onClick={() => dismissIssue(idx)}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                  <div className="flex items-start justify-between mb-2 pr-8">
                    <span className="text-xs font-medium uppercase">{issue.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium">Found:</span>
                      <p className="text-sm line-through opacity-75">{issue.original}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-green-600">Correct:</span>
                      <p className="text-sm font-semibold text-green-700">{issue.correction}</p>
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <strong>Why:</strong> {issue.explanation}
                    </div>

                    {/* Before & After Examples */}
                    {issue.beforeExample && issue.afterExample && (
                      <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 border-blue-500`}>
                        <p className="text-xs font-semibold mb-1">Before & After:</p>
                        <p className="text-xs mb-1">
                          <span className="text-red-600">Before:</span> <span className="line-through opacity-75">{issue.beforeExample}</span>
                        </p>
                        <p className="text-xs">
                          <span className="text-green-600">After:</span> <span className="font-medium">{issue.afterExample}</span>
                        </p>
                      </div>
                    )}

                    {/* NSW Tip */}
                    {issue.nswTip && (
                      <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-100'} border border-blue-300`}>
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          <strong>NSW Tip:</strong> {issue.nswTip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NSW Criteria Section */}
      <div className={`border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={() => toggleSection('nsw')}
          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-left">NSW Selective Test Criteria</h3>
            {feedback.nswCriteria.scoringSummary ? (
              <span className={`text-xs px-2 py-1 rounded-full ${getScoreColorByPercentage(feedback.nswCriteria.scoringSummary.percentageScore?.score || 0)} bg-opacity-10`}>
                {feedback.nswCriteria.scoringSummary.weightedTotal?.displayFormat || `${feedback.nswCriteria.overallScore}/30`}
              </span>
            ) : (
              <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(feedback.nswCriteria.overallScore)} bg-opacity-10`}>
                Score: {feedback.nswCriteria.overallScore}/16
              </span>
            )}
          </div>
          {expandedSections.has('nsw') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {expandedSections.has('nsw') && (
          <div className="px-4 pb-4 space-y-4">
            {/* Ideas & Content */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                  Ideas & Content
                </h4>
                <span className={`font-bold ${getScoreColor(feedback.nswCriteria.ideas.score)}`}>
                  {feedback.nswCriteria.ideas.score}/4
                </span>
              </div>
              {feedback.nswCriteria.ideas.strengths.length > 0 && (
                <div className="mb-2">
                  {feedback.nswCriteria.ideas.strengths.map((strength, idx) => (
                    <div key={idx} className="flex items-start text-sm text-green-600 mb-1">
                      <CheckCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              )}
              {feedback.nswCriteria.ideas.improvements.length > 0 && (
                <div className="mb-2">
                  {feedback.nswCriteria.ideas.improvements.map((improvement, idx) => (
                    <div key={idx} className="flex items-start text-sm text-orange-600 mb-1">
                      <XCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{improvement}</span>
                    </div>
                  ))}
                </div>
              )}
              {feedback.nswCriteria.ideas.examples.length > 0 && (
                <div className={`text-xs mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <strong>Tips:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {feedback.nswCriteria.ideas.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Structure & Organization */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                  Structure & Organization
                </h4>
                <span className={`font-bold ${getScoreColor(feedback.nswCriteria.structure.score)}`}>
                  {feedback.nswCriteria.structure.score}/4
                </span>
              </div>
              {feedback.nswCriteria.structure.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start text-sm text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
              {feedback.nswCriteria.structure.improvements.map((improvement, idx) => (
                <div key={idx} className="flex items-start text-sm text-orange-600 mb-1">
                  <XCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </div>
              ))}
            </div>

            {/* Language & Vocabulary */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                  Language & Vocabulary
                </h4>
                <span className={`font-bold ${getScoreColor(feedback.nswCriteria.language.score)}`}>
                  {feedback.nswCriteria.language.score}/4
                </span>
              </div>
              {feedback.nswCriteria.language.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start text-sm text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
              {feedback.nswCriteria.language.improvements.map((improvement, idx) => (
                <div key={idx} className="flex items-start text-sm text-orange-600 mb-1">
                  <XCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </div>
              ))}
            </div>

            {/* Mechanics */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center">
                  <Target className="w-4 h-4 mr-2 text-green-500" />
                  Spelling & Grammar
                </h4>
                <span className={`font-bold ${getScoreColor(feedback.nswCriteria.mechanics.score)}`}>
                  {feedback.nswCriteria.mechanics.score}/4
                </span>
              </div>
              {feedback.nswCriteria.mechanics.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start text-sm text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
              {feedback.nswCriteria.mechanics.improvements.map((improvement, idx) => (
                <div key={idx} className="flex items-start text-sm text-orange-600 mb-1">
                  <XCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </div>
              ))}
            </div>

            {/* NSW Guidance */}
            <div className={`p-3 rounded-lg border-2 border-blue-300 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">NSW Selective Test Guidance:</h4>
              <ul className="text-sm space-y-1">
                {feedback.nswCriteria.nswGuidance.map((guide, idx) => (
                  <li key={idx} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>• {guide}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Enhancements */}
      {feedback.vocabularyEnhancements.length > 0 && (
        <div className={`border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={() => toggleSection('vocabulary')}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-left">Vocabulary Enhancement</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                {feedback.vocabularyEnhancements.length} suggestions
              </span>
            </div>
            {expandedSections.has('vocabulary') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.has('vocabulary') && (
            <div className="px-4 pb-4 space-y-3">
              {feedback.vocabularyEnhancements.map((enhancement, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'} border-l-4 border-purple-500`}>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Replace:</span>
                    <p className="text-sm font-semibold">{enhancement.original}</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">With:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {enhancement.suggestions.map((suggestion, sidx) => (
                        <span key={sidx} className="px-2 py-1 bg-purple-200 text-purple-900 text-sm rounded font-medium">
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{enhancement.reasoning}</p>

                  {/* Before & After Examples */}
                  {enhancement.beforeExample && enhancement.afterExample && (
                    <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} border border-purple-300`}>
                      <p className="text-xs font-semibold mb-1 text-purple-700 dark:text-purple-300">Before & After:</p>
                      <p className="text-xs mb-1">
                        <span className="text-red-600">Before:</span> <span className="opacity-75">{enhancement.beforeExample}</span>
                      </p>
                      <p className="text-xs">
                        <span className="text-green-600">After:</span> <span className="font-medium text-green-700">{enhancement.afterExample}</span>
                      </p>
                    </div>
                  )}

                  {/* NSW Alignment */}
                  {enhancement.nswAlignment && (
                    <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-100'} border border-purple-300`}>
                      <p className="text-xs text-purple-800 dark:text-purple-200">
                        <strong>NSW Alignment:</strong> {enhancement.nswAlignment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show, Don't Tell */}
      {feedback.showDontTellExamples.length > 0 && (
        <div className={`border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={() => toggleSection('showdonttell')}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-left">Show, Don't Tell</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                {feedback.showDontTellExamples.length} examples
              </span>
            </div>
            {expandedSections.has('showdonttell') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.has('showdonttell') && (
            <div className="px-4 pb-4 space-y-3">
              {feedback.showDontTellExamples.map((example, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} border-l-4 border-yellow-500`}>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">❌ Telling:</span>
                    <p className="text-sm italic line-through opacity-75">{example.telling}</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">✅ Showing:</span>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">{example.showing}</p>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    <strong>Technique:</strong> {example.technique}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} italic mb-2`}>
                    {example.explanation}
                  </div>

                  {/* Teaching Point */}
                  {example.teachingPoint && (
                    <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border border-yellow-400`}>
                      <p className="text-xs font-semibold mb-1 text-yellow-800 dark:text-yellow-200">💡 What is "Show, Don't Tell"?</p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">{example.teachingPoint}</p>
                    </div>
                  )}

                  {/* Before & After Full Sentence */}
                  {example.beforeSentence && example.afterSentence && (
                    <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} border border-yellow-300`}>
                      <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">Before & After in Context:</p>
                      <p className="text-xs mb-1">
                        <span className="text-red-600">Before:</span> <span className="opacity-75">{example.beforeSentence}</span>
                      </p>
                      <p className="text-xs">
                        <span className="text-green-600">After:</span> <span className="font-medium text-green-700">{example.afterSentence}</span>
                      </p>
                    </div>
                  )}

                  {/* NSW Relevance */}
                  {example.nswRelevance && (
                    <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-100'} border border-blue-300`}>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>NSW Relevance:</strong> {example.nswRelevance}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sentence Structure */}
      {feedback.sentenceStructureIssues.length > 0 && (
        <div className={`border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={() => toggleSection('structure')}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-left">Sentence Structure</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {feedback.sentenceStructureIssues.length} suggestions
              </span>
            </div>
            {expandedSections.has('structure') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.has('structure') && (
            <div className="px-4 pb-4 space-y-3">
              {feedback.sentenceStructureIssues.map((issue, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Issue:</span>
                    <p className="text-sm font-semibold">{issue.issue}</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Suggestion:</span>
                    <p className="text-sm">{issue.suggestion}</p>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    <strong>Example:</strong> {issue.example}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} italic`}>
                    📚 {issue.nswAlignment}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Story Arc & Pacing */}
      <div className={`border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <button
          onClick={() => toggleSection('story')}
          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-left">Story Arc & Pacing</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
              {Math.round(feedback.storyArc.completeness)}% complete
            </span>
          </div>
          {expandedSections.has('story') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {expandedSections.has('story') && (
          <div className="px-4 pb-4 space-y-3">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className="mb-2">
                <span className="text-xs font-medium">Current Stage:</span>
                <p className="text-sm font-semibold capitalize">{feedback.storyArc.currentStage.replace('-', ' ')}</p>
              </div>
              {feedback.storyArc.strengths.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Strengths:</span>
                  {feedback.storyArc.strengths.map((strength, idx) => (
                    <p key={idx} className="text-sm flex items-start">
                      <CheckCircle className="w-4 h-4 mr-1 mt-0.5 text-green-600 flex-shrink-0" />
                      {strength}
                    </p>
                  ))}
                </div>
              )}
              {feedback.storyArc.gaps.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">To Improve:</span>
                  {feedback.storyArc.gaps.map((gap, idx) => (
                    <p key={idx} className="text-sm flex items-start">
                      <XCircle className="w-4 h-4 mr-1 mt-0.5 text-orange-600 flex-shrink-0" />
                      {gap}
                    </p>
                  ))}
                </div>
              )}
              {feedback.storyArc.nextSteps.length > 0 && (
                <div className={`text-xs mt-2 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <strong>Next Steps:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {feedback.storyArc.nextSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pacing */}
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <div className="mb-2">
                <span className="text-xs font-medium">Overall Pacing:</span>
                <p className="text-sm font-semibold capitalize">{feedback.pacing.overall.replace('-', ' ')}</p>
              </div>
              {feedback.pacing.sections.length > 0 && (
                <div>
                  <span className="text-xs font-medium">Section Analysis:</span>
                  {feedback.pacing.sections.map((section, idx) => (
                    <div key={idx} className="text-sm mt-1">
                      <strong>{section.section}:</strong> {section.pace}
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{section.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
