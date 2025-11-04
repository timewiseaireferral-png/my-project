import React, { useState, useEffect } from 'react';
import {
  BookOpen, ChevronRight, CheckCircle, Circle, Lightbulb,
  Target, Star, TrendingUp, Zap, Eye, MessageSquare,
  ArrowRight, Sparkles, Award
} from 'lucide-react';
import { narrativeStructure } from '../config/writingStages';
import {
  generateNarrativeCoaching,
  detectNarrativeStage,
  generateNarrativeVocabulary,
  type ContextualExample
} from '../lib/enhancedNarrativeCoach';

interface EnhancedNarrativeBuilderProps {
  content: string;
  onChange: (content: string) => void;
  darkMode?: boolean;
}

export function EnhancedNarrativeBuilder({ content, onChange, darkMode = false }: EnhancedNarrativeBuilderProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [coaching, setCoaching] = useState<ReturnType<typeof generateNarrativeCoaching> | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const [showRubric, setShowRubric] = useState(false);

  // Update coaching when content changes
  useEffect(() => {
    if (content.trim().length > 0) {
      const coachingFeedback = generateNarrativeCoaching(content);
      setCoaching(coachingFeedback);

      // Update active stage based on progress
      const stages = detectNarrativeStage(content);
      const completedCount = stages.filter(s => s.detected).length;
      setActiveStageIndex(Math.min(completedCount, narrativeStructure.stages.length - 1));
    }
  }, [content]);

  const stages = narrativeStructure.stages;
  const currentStage = stages[activeStageIndex];

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Narrative Writing Guide
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {coaching ? `${Math.round(coaching.stageProgress)}% Complete` : 'Follow the stages to build your story'}
              </p>
            </div>
          </div>

          {coaching && (
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                coaching.rubricAlignment.overall >= 8 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                coaching.rubricAlignment.overall >= 6 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                <Award className="w-4 h-4 inline mr-1" />
                {coaching.rubricAlignment.overall}/10
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {coaching && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Story Progress</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{Math.round(coaching.stageProgress)}%</span>
            </div>
            <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${coaching.stageProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stage Navigation */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto`}>
        <div className="flex space-x-2">
          {stages.map((stage, index) => {
            const isActive = index === activeStageIndex;
            const isCompleted = coaching && detectNarrativeStage(content)[index]?.detected;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageIndex(index)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? darkMode
                      ? 'bg-purple-900 text-purple-100 border-2 border-purple-500'
                      : 'bg-purple-100 text-purple-900 border-2 border-purple-500'
                    : darkMode
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {stage.icon} {stage.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left Column: Stage Guidance */}
        <div className="space-y-6">
          {/* Current Stage Info */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-purple-50 border border-purple-200'}`}>
            <div className="flex items-start space-x-3">
              <div className="text-3xl">{currentStage.icon}</div>
              <div className="flex-1">
                <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentStage.name}
                </h4>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {currentStage.description}
                </p>
              </div>
            </div>
          </div>

          {/* Prompts */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Target className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h5 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Writing Prompts
              </h5>
            </div>
            <div className="space-y-2">
              {currentStage.prompts.map((prompt, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                >
                  <div className="flex items-start space-x-2">
                    <ArrowRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <h5 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Expert Tips
              </h5>
            </div>
            <div className="space-y-2">
              {currentStage.tips.map((tip, index) => (
                <div
                  key={index}
                  className={`p-2 pl-3 rounded border-l-4 ${darkMode ? 'bg-gray-800 border-yellow-500' : 'bg-yellow-50 border-yellow-400'}`}
                >
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Example Starters */}
          {currentStage.examples && currentStage.examples.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <h5 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Example Starters
                </h5>
              </div>
              <div className="space-y-2">
                {currentStage.examples.map((example, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg italic ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-green-50 border border-green-200'}`}
                  >
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      "{example}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contextual Coaching */}
        <div className="space-y-6">
          {/* Strengths */}
          {coaching && coaching.strengths.length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-5 h-5 text-green-500" />
                <h5 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  What You're Doing Well
                </h5>
              </div>
              <ul className="space-y-2">
                {coaching.strengths.map((strength, index) => (
                  <li key={index} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-start space-x-2`}>
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contextual Examples */}
          {coaching && showExamples && coaching.contextualExamples.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Eye className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-