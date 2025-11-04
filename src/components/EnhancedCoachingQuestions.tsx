/**
 * Enhanced Coaching Questions Component
 * 
 * Integrates the NSW-specific and age-appropriate question bank
 * Provides contextual question suggestions based on writing stage and content
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, HelpCircle, Target, BookOpen, Lightbulb, ChevronRight } from 'lucide-react';
import { 
  getRelevantQuestions, 
  getQuestionsByNSWCriteria, 
  findQuestionsByKeywords,
  getFollowUpQuestions,
  questionCategories,
  type CoachingQuestion 
} from '../config/coachingQuestionBank';

interface EnhancedCoachingQuestionsProps {
  textType: string;
  content: string;
  wordCount: number;
  onQuestionSelect: (question: string) => void;
  currentStage?: string;
  nswScores?: any;
  darkMode?: boolean;
}

export function EnhancedCoachingQuestions({
  textType,
  content,
  wordCount,
  onQuestionSelect,
  currentStage = 'opening',
  nswScores,
  darkMode = false
}: EnhancedCoachingQuestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('suggested');
  const [suggestedQuestions, setSuggestedQuestions] = useState<CoachingQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<CoachingQuestion | null>(null);
  const [showFollowUps, setShowFollowUps] = useState(false);

  // Determine age group based on content complexity
  const getAgeGroup = (): 'primary' | 'intermediate' | 'advanced' => {
    if (wordCount < 50) return 'primary';
    if (wordCount < 150) return 'intermediate';
    return 'advanced';
  };

  // Get contextual questions based on current writing state
  useEffect(() => {
    const ageGroup = getAgeGroup();
    let contextualQuestions: CoachingQuestion[] = [];

    // Get questions based on writing stage
    if (wordCount === 0) {
      // Getting started questions
      contextualQuestions = getRelevantQuestions(textType, 'primary', undefined, 3);
    } else if (wordCount < 50) {
      // Opening/beginning questions
      contextualQuestions = [
        ...getQuestionsByNSWCriteria('ideas_content', textType, 2),
        ...getQuestionsByNSWCriteria('text_structure', textType, 1)
      ];
    } else if (wordCount < 150) {
      // Development questions
      contextualQuestions = [
        ...getQuestionsByNSWCriteria('language_features', textType, 2),
        ...getQuestionsByNSWCriteria('ideas_content', textType, 1)
      ];
    } else {
      // Conclusion/refinement questions
      contextualQuestions = [
        ...getQuestionsByNSWCriteria('text_structure', textType, 1),
        ...getQuestionsByNSWCriteria('grammar_mechanics', textType, 1),
        ...getQuestionsByNSWCriteria('language_features', textType, 1)
      ];
    }

    // Add questions based on NSW scores (if available)
    if (nswScores) {
      const lowestScore = Object.entries(nswScores).reduce((lowest, [key, score]: [string, any]) => {
        return score.score < lowest.score ? { key, score: score.score } : lowest;
      }, { key: '', score: 5 });

      if (lowestScore.score < 3) {
        const criteriaMap: { [key: string]: string } = {
          'ideasContent': 'ideas_content',
          'structureOrganization': 'text_structure',
          'languageVocab': 'language_features',
          'spellingPunctuationGrammar': 'grammar_mechanics'
        };
        
        const criteriaKey = criteriaMap[lowestScore.key];
        if (criteriaKey) {
          const improvementQuestions = getQuestionsByNSWCriteria(
            criteriaKey as any, 
            textType, 
            2
          );
          contextualQuestions = [...improvementQuestions, ...contextualQuestions.slice(0, 2)];
        }
      }
    }

    // Remove duplicates and limit to 4-5 questions
    const uniqueQuestions = contextualQuestions.filter((question, index, self) => 
      index === self.findIndex(q => q.id === question.id)
    ).slice(0, 5);

    setSuggestedQuestions(uniqueQuestions);
  }, [textType, wordCount, currentStage, nswScores]);

  const handleQuestionClick = (question: CoachingQuestion) => {
    setSelectedQuestion(question);
    setShowFollowUps(true);
    onQuestionSelect(question.text);
  };

  const handleFollowUpClick = (followUpQuestion: string) => {
    setShowFollowUps(false);
    onQuestionSelect(followUpQuestion);
  };

  const getCategoryQuestions = (categoryName: string) => {
    const category = questionCategories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
    return category ? category.questions.filter(q => 
      q.textTypes.includes(textType) || q.textTypes.includes('all')
    ).slice(0, 6) : [];
  };

  const renderQuestionButton = (question: CoachingQuestion, isFollowUp = false) => (
    <button
      key={question.id}
      onClick={() => handleQuestionClick(question)}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md group ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-blue-600 text-gray-200' 
          : 'bg-white border-gray-200 hover:border-blue-400 text-gray-800'
      } ${isFollowUp ? 'ml-4 border-l-4 border-l-blue-400' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <HelpCircle className={`w-4 h-4 ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <span className="text-sm font-medium">{question.text}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className={`px-2 py-1 rounded ${
              question.category === 'ideas_content' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              question.category === 'text_structure' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              question.category === 'language_features' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
              'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
            }`}>
              {question.category.replace('_', ' & ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className={`px-2 py-1 rounded ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {question.ageGroup}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`} />
      </div>
    </button>
  );

  const renderFollowUpQuestions = () => {
    if (!selectedQuestion || !showFollowUps) return null;

    const followUps = getFollowUpQuestions(selectedQuestion.id);
    if (followUps.length === 0) return null;

    return (
      <div className={`mt-4 p-4 rounded-lg border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-sm font-semibold ${
            darkMode ? 'text-blue-300' : 'text-blue-800'
          }`}>
            Follow-up Questions:
          </span>
        </div>
        <div className="space-y-2">
          {followUps.map((followUp, index) => (
            <button
              key={index}
              onClick={() => handleFollowUpClick(followUp)}
              className={`w-full text-left p-2 rounded border transition-colors ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200' 
                  : 'bg-white border-blue-200 hover:bg-blue-50 text-gray-700'
              }`}
            >
              <span className="text-sm">{followUp}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Coaching Questions
          </h3>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 overflow-x-auto">
          {['suggested', 'ideas', 'structure', 'language', 'grammar'].map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setShowFollowUps(false);
                setSelectedQuestion(null);
              }}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              {category === 'suggested' ? '🎯 Suggested' :
               category === 'ideas' ? '💡 Ideas' :
               category === 'structure' ? '📋 Structure' :
               category === 'language' ? '✨ Language' : '✅ Grammar'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeCategory === 'suggested' && (
          <div className="space-y-3">
            {suggestedQuestions.length > 0 ? (
              <>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  Questions tailored to your current writing stage ({wordCount} words)
                </div>
                {suggestedQuestions.map(question => renderQuestionButton(question))}
              </>
            ) : (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start writing to see personalized question suggestions!</p>
              </div>
            )}
          </div>
        )}

        {activeCategory !== 'suggested' && (
          <div className="space-y-3">
            {getCategoryQuestions(activeCategory).map(question => renderQuestionButton(question))}
          </div>
        )}

        {renderFollowUpQuestions()}
      </div>

      {/* Footer Info */}
      <div className={`p-3 border-t text-xs ${
        darkMode ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-white text-gray-500'
      }`}>
        <div className="flex items-center justify-between">
          <span>💡 Click any question to get personalized help</span>
          <span>NSW Aligned</span>
        </div>
      </div>
    </div>
  );
}

export default EnhancedCoachingQuestions;