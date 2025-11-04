import React from 'react';
import { Clock, Target, Star, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';

// Enhanced Coach Response Types for NSW Integration
export interface EnhancedCoachResponse {
  encouragement: string; // "🌟 Great start!" or "💪 You're improving!"
  nswFocus: {
    criterion: 'ideas' | 'language' | 'structure' | 'grammar';
    currentScore: 1 | 2 | 3 | 4 | 5;
    feedback: string;
  };
  suggestion: string; // Specific, actionable advice
  example?: string; // Brief example if helpful
  nextStep: string; // Immediate action for student
  timestamp: string;
  confidence: 1 | 2 | 3 | 4 | 5; // AI confidence in assessment
}

interface EnhancedNSWCoachMessageProps {
  response: EnhancedCoachResponse;
  darkMode?: boolean;
  onApplySuggestion?: () => void;
}

// NSW Coaching Logic Class
export class NSWCoachingLogic {
  static generateCoachResponse(
    content: string, 
    textType: string, 
    primaryFocus: {
      criterion: 'ideas' | 'language' | 'structure' | 'grammar';
      score: 1 | 2 | 3 | 4 | 5;
      feedback: string;
    }
  ): EnhancedCoachResponse {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const overallScore = this.calculateOverallScore(content, textType);
    
    const encouragement = this.getEncouragement(overallScore);
    const suggestion = this.getSuggestion(primaryFocus, content, textType);
    const example = this.getExample(primaryFocus, content, textType);
    const nextStep = this.getNextStep(primaryFocus, wordCount);
    const confidence = this.calculateConfidence(content, primaryFocus);
    
    return {
      encouragement,
      nswFocus: {
        criterion: primaryFocus.criterion,
        currentScore: primaryFocus.score,
        feedback: primaryFocus.feedback
      },
      suggestion,
      example,
      nextStep,
      timestamp: new Date().toISOString(),
      confidence
    };
  }
  
  static getEncouragement(overallScore: number): string {
    if (overallScore >= 16) return "🌟 Excellent work! You're writing at NSW excellence level!";
    if (overallScore >= 12) return "💪 Good progress! You're developing strong writing skills!";
    if (overallScore >= 8) return "👍 Nice work! Let's make your writing even stronger!";
    return "🚀 Great start! Every writer improves with practice!";
  }
  
  static getSuggestion(
    focus: { criterion: string; score: number; feedback: string }, 
    text: string, 
    textType: string
  ): string {
    const wordCount = text.trim().split(/\s+/).length;
    
    switch(focus.criterion) {
      case 'ideas':
        if (wordCount < 50) {
          return "Add more details about your characters and setting. What do they look like? How do they feel?";
        } else if (wordCount < 150) {
          return "Try adding dialogue or describing what your character is thinking to make it more engaging.";
        } else {
          return "Consider adding a surprising twist or exploring your character's emotions more deeply.";
        }
        
      case 'language':
        return this.getVocabularyUpgrade(text);
        
      case 'structure':
        return this.getStructureGuidance(text, textType);
        
      case 'grammar':
        return this.getGrammarFeedback(text);
        
      default:
        return "Keep writing and developing your ideas!";
    }
  }
  
  static getVocabularyUpgrade(text: string): string {
    const overusedWords = ['said', 'went', 'good', 'nice', 'big'];
    const foundOverused = overusedWords.find(word => 
      text.toLowerCase().includes(word)
    );
    
    if (foundOverused) {
      const alternatives = {
        'said': 'whispered, exclaimed, declared, announced',
        'went': 'rushed, strolled, wandered, marched',
        'good': 'excellent, wonderful, fantastic, amazing',
        'nice': 'delightful, pleasant, charming, lovely',
        'big': 'enormous, gigantic, massive, tremendous'
      };
      return `Try replacing "${foundOverused}" with words like: ${alternatives[foundOverused as keyof typeof alternatives]}`;
    }
    
    return "Use more descriptive adjectives and powerful verbs to make your writing come alive!";
  }
  
  static getStructureGuidance(text: string, textType: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length <= 1) {
      return "Break your writing into paragraphs. Start a new paragraph when you introduce a new idea or event.";
    }
    
    if (textType.toLowerCase().includes('narrative')) {
      if (!text.toLowerCase().includes('finally') && !text.toLowerCase().includes('in the end')) {
        return "Add a strong conclusion to wrap up your story. What happens in the end?";
      }
    }
    
    return "Use transition words like 'first', 'then', 'next', 'finally' to connect your ideas smoothly.";
  }
  
  static getGrammarFeedback(text: string): string {
    // Check for common Year 5-6 errors
    if (text.includes('there') && text.includes('is')) {
      return "Check your use of 'their', 'there', and 'they're' - make sure you're using the right one!";
    }
    
    if (text.includes('your') && text.includes('are')) {
      return "Double-check 'your' vs 'you're' - 'you're' means 'you are'!";
    }
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgLength < 5) {
      return "Try combining some short sentences to create more interesting, complex sentences.";
    }
    
    return "Check your spelling and punctuation carefully. Read your work aloud to catch any errors!";
  }
  
  static getExample(
    focus: { criterion: string; score: number }, 
    text: string, 
    textType: string
  ): string | undefined {
    switch(focus.criterion) {
      case 'ideas':
        return "Instead of 'The dog was big', try 'The enormous golden retriever bounded across the yard, its tail wagging like a flag in the wind.'";
        
      case 'language':
        return "Instead of 'She said hello', try 'She whispered a cheerful greeting' or 'She exclaimed with excitement.'";
        
      case 'structure':
        return "Use transitions: 'First, Sarah opened the mysterious box. Then, a bright light filled the room. Finally, she discovered the magical secret inside.'";
        
      case 'grammar':
        return "Remember: 'Their house' (belongs to them), 'There it is' (location), 'They're happy' (they are happy).";
        
      default:
        return undefined;
    }
  }
  
  static getNextStep(focus: { criterion: string }, wordCount: number): string {
    if (wordCount < 50) {
      return "Write 2-3 more sentences to develop your opening.";
    } else if (wordCount < 150) {
      return "Add a paragraph about what happens next in your story.";
    } else if (wordCount < 250) {
      return "Work towards your conclusion - how will your story end?";
    } else {
      return "Review and polish your writing, checking for any errors.";
    }
  }
  
  static calculateOverallScore(content: string, textType: string): number {
    // Simplified scoring - in production, use more sophisticated analysis
    const wordCount = content.trim().split(/\s+/).length;
    let score = 4; // Base score
    
    if (wordCount > 200) score += 4;
    else if (wordCount > 100) score += 2;
    else if (wordCount > 50) score += 1;
    
    // Check for creativity and structure
    const creativityWords = ['suddenly', 'mysterious', 'amazing', 'whispered'];
    if (creativityWords.some(word => content.toLowerCase().includes(word))) {
      score += 2;
    }
    
    const structureWords = ['first', 'then', 'finally', 'however'];
    if (structureWords.some(word => content.toLowerCase().includes(word))) {
      score += 2;
    }
    
    return Math.min(20, score);
  }
  
  static calculateConfidence(content: string, focus: { criterion: string; score: number }): 1 | 2 | 3 | 4 | 5 {
    const wordCount = content.trim().split(/\s+/).length;
    
    if (wordCount > 200) return 5;
    if (wordCount > 100) return 4;
    if (wordCount > 50) return 3;
    if (wordCount > 20) return 2;
    return 1;
  }
}

// Enhanced NSW Coach Message Component
export const EnhancedNSWCoachMessage: React.FC<EnhancedNSWCoachMessageProps> = ({
  response,
  darkMode = false,
  onApplySuggestion
}) => {
  const getCriterionColor = (criterion: string) => {
    switch (criterion) {
      case 'ideas': return 'from-yellow-500 to-orange-600';
      case 'language': return 'from-blue-500 to-blue-700';
      case 'structure': return 'from-green-500 to-green-700';
      case 'grammar': return 'from-purple-500 to-purple-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };
  
  const getCriterionIcon = (criterion: string) => {
    switch (criterion) {
      case 'ideas': return '💡';
      case 'language': return '📚';
      case 'structure': return '🎯';
      case 'grammar': return '✅';
      default: return '📝';
    }
  };
  
  const getCriterionBorderColor = (criterion: string) => {
    switch (criterion) {
      case 'ideas': return 'border-l-yellow-500';
      case 'language': return 'border-l-blue-500';
      case 'structure': return 'border-l-green-500';
      case 'grammar': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  return (
    <div className={`enhanced-coach-message border-l-4 ${getCriterionBorderColor(response.nswFocus.criterion)} rounded-lg p-4 mb-4 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Message Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{response.encouragement}</span>
        </div>
        
        <div className={`criterion-badge flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
          darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
        }`}>
          <span>{getCriterionIcon(response.nswFocus.criterion)}</span>
          <span className="capitalize">{response.nswFocus.criterion} Focus</span>
        </div>
      </div>
      
      {/* Message Content */}
      <div className="space-y-3">
        {/* NSW Feedback */}
        <div className={`p-3 rounded-lg ${
          darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-start space-x-2">
            <Target className={`w-4 h-4 mt-0.5 ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div>
              <h4 className={`font-semibold text-sm mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                📝 NSW Focus:
              </h4>
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {response.nswFocus.feedback}
              </p>
            </div>
          </div>
        </div>
        
        {/* Suggestion */}
        <div className={`p-3 rounded-lg ${
          darkMode ? 'bg-gray-700/50' : 'bg-blue-50'
        }`}>
          <div className="flex items-start space-x-2">
            <Lightbulb className={`w-4 h-4 mt-0.5 ${
              darkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div>
              <h4 className={`font-semibold text-sm mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                💡 Suggestion:
              </h4>
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {response.suggestion}
              </p>
            </div>
          </div>
        </div>
        
        {/* Example (if provided) */}
        {response.example && (
          <div className={`p-3 rounded-lg ${
            darkMode ? 'bg-gray-700/50' : 'bg-green-50'
          }`}>
            <div className="flex items-start space-x-2">
              <Star className={`w-4 h-4 mt-0.5 ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <div>
                <h4 className={`font-semibold text-sm mb-1 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  ✨ Example:
                </h4>
                <p className={`text-sm italic ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {response.example}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Next Step */}
        <div className={`p-3 rounded-lg ${
          darkMode ? 'bg-gray-700/50' : 'bg-purple-50'
        }`}>
          <div className="flex items-start space-x-2">
            <TrendingUp className={`w-4 h-4 mt-0.5 ${
              darkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <div>
              <h4 className={`font-semibold text-sm mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                🎯 Next Step:
              </h4>
              <p className={`text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {response.nextStep}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Message Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Current:
            </span>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={`w-3 h-3 ${
                    index < response.nswFocus.currentScore
                      ? 'text-yellow-400 fill-yellow-400'
                      : darkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatTime(response.timestamp)}
          </span>
        </div>
      </div>
      
      {/* Apply Suggestion Button */}
      {onApplySuggestion && (
        <div className="mt-3">
          <button
            onClick={onApplySuggestion}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Apply This Suggestion</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedNSWCoachMessage;