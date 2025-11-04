import React, { useState } from 'react';
import { Star, Target, BookOpen, AlertCircle, CheckCircle, TrendingUp, Award, Lightbulb, MessageSquare, BarChart3, Sparkles, Heart, Zap, Eye, ThumbsUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface TextPosition {
  start: number;
  end: number;
}

interface FeedbackItem {
  exampleFromText: string;
  position: TextPosition;
  comment?: string;
  suggestionForImprovement?: string;
}

interface GrammarCorrection {
  original: string;
  suggestion: string;
  explanation: string;
  position: TextPosition;
}

interface VocabularyEnhancement {
  original: string;
  suggestion: string;
  explanation: string;
  position: TextPosition;
}

interface CriteriaFeedback {
  category: string;
  score: number;
  strengths: FeedbackItem[];
  areasForImprovement: FeedbackItem[];
}

export interface DetailedFeedback {
  overallScore: number;
  criteriaScores: {
    ideasAndContent: number;
    textStructureAndOrganization: number;
    languageFeaturesAndVocabulary: number;
    spellingPunctuationAndGrammar: number;
  };
  feedbackCategories: CriteriaFeedback[];
  grammarCorrections: GrammarCorrection[];
  vocabularyEnhancements: VocabularyEnhancement[];
}

interface EnhancedFeedbackSystemProps {
  feedback: DetailedFeedback | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function EnhancedFeedbackSystem({
  feedback,
  isLoading,
  onRefresh
}: EnhancedFeedbackSystemProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Work';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Writing</h3>
          <p className="text-sm text-gray-600">
            Our AI is carefully reviewing your work against NSW Selective criteria...
          </p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <MessageSquare className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            Start writing (50+ characters) and I'll automatically analyze your work!
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Analyze Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">NSW Selective Analysis</h2>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-colors"
            title="Refresh Analysis"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{feedback.overallScore}/100</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(feedback.overallScore, 100)}`}>
                {getScoreBadge(feedback.overallScore, 100)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(feedback.overallScore / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'ideasAndContent', label: 'Ideas & Content', icon: Lightbulb },
          { key: 'textStructureAndOrganization', label: 'Structure & Organization', icon: Target },
          { key: 'languageFeaturesAndVocabulary', label: 'Language & Vocabulary', icon: BookOpen },
          { key: 'spellingPunctuationAndGrammar', label: 'Grammar & Mechanics', icon: CheckCircle }
        ].map(({ key, label, icon: Icon }) => {
          const score = feedback.criteriaScores[key as keyof typeof feedback.criteriaScores];
          return (
            <div key={key} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900 text-sm">{label}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score, 5)}`}>
                  {score}/5
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Feedback Categories */}
      {feedback.feedbackCategories && feedback.feedbackCategories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            Detailed Feedback
          </h3>
          
          {feedback.feedbackCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{category.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(category.score, 5)}`}>
                      {category.score}/5
                    </span>
                  </div>
                  {expandedCategories.has(category.category) ? 
                    <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                </div>
              </button>
              
              {expandedCategories.has(category.category) && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Strengths */}
                  {category.strengths && category.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2 flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Strengths
                      </h4>
                      <div className="space-y-2">
                        {category.strengths.map((strength, idx) => (
                          <div key={idx} className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="text-sm text-green-800 font-medium mb-1">
                              "{strength.exampleFromText}"
                            </div>
                            {strength.comment && (
                              <div className="text-xs text-green-600">{strength.comment}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Areas for Improvement */}
                  {category.areasForImprovement && category.areasForImprovement.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Areas for Improvement
                      </h4>
                      <div className="space-y-2">
                        {category.areasForImprovement.map((improvement, idx) => (
                          <div key={idx} className="bg-orange-50 border border-orange-200 rounded-md p-3">
                            <div className="text-sm text-orange-800 font-medium mb-1">
                              "{improvement.exampleFromText}"
                            </div>
                            {improvement.suggestionForImprovement && (
                              <div className="text-xs text-orange-600">
                                💡 {improvement.suggestionForImprovement}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grammar Corrections */}
      {feedback.grammarCorrections && feedback.grammarCorrections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-red-500" />
            Grammar & Spelling Corrections
          </h3>
          <div className="space-y-2">
            {feedback.grammarCorrections.map((correction, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="line-through text-red-600 font-medium">{correction.original}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-600 font-medium">{correction.suggestion}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{correction.explanation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary Enhancements */}
      {feedback.vocabularyEnhancements && feedback.vocabularyEnhancements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
            Vocabulary Enhancements
          </h3>
          <div className="space-y-2">
            {feedback.vocabularyEnhancements.map((enhancement, index) => (
              <div key={index} className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="text-gray-600 font-medium">{enhancement.original}</span>
                      <span className="mx-2">→</span>
                      <span className="text-purple-600 font-medium">{enhancement.suggestion}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{enhancement.explanation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
