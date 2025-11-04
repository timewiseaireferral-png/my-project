import React, { useState } from 'react';
import { ArrowLeft, Clock, Award, BookOpen, CheckCircle, Lock, Play, AlertCircle } from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';

interface LessonDetailProps {
  lessonId: number;
  onBack: () => void;
  onStartLesson: () => void;
}

interface Lesson {
  id: number;
  title: string;
  category: string;
  prerequisites: number[];
  duration: string;
  difficulty: string;
  points: number;
  description: string;
}

// NOTE: This data is a subset of the full lessons.json for demonstration purposes.
// In a real application, you would fetch the full lesson content dynamically.
const LESSONS_DATA: { [key: number]: Lesson } = {
  1: {
    id: 1,
    title: "NSW Selective Assessment Criteria",
    category: "Foundations",
    prerequisites: [],
    duration: "15 min",
    difficulty: "Beginner",
    points: 50,
    description: "Understanding the marking criteria and what examiners look for in your essays."
  },
  2: {
    id: 2,
    title: "Sentence Structure Mastery",
    category: "Grammar & Style",
    prerequisites: [],
    duration: "20 min",
    difficulty: "Beginner",
    points: 75,
    description: "Learn to craft varied and sophisticated sentence structures that impress examiners."
  },
  3: {
    id: 3,
    title: "Paragraph Building Techniques",
    category: "Structure",
    prerequisites: [],
    duration: "25 min",
    difficulty: "Beginner",
    points: 100,
    description: "Master the art of constructing coherent, well-developed paragraphs."
  },
  6: {
    id: 6,
    title: "Narrative Structure & Plot",
    category: "Creative Writing",
    prerequisites: [3, 5],
    duration: "35 min",
    difficulty: "Intermediate",
    points: 150,
    description: "Learn to structure compelling narratives with strong plot development."
  },
  12: {
    id: 12,
    title: "Persuasive Writing Fundamentals",
    category: "Persuasive Writing",
    prerequisites: [3],
    duration: "25 min",
    difficulty: "Intermediate",
    points: 110,
    description: "Master the basics of persuasive writing and argumentation."
  }
};

const LESSON_CONTENT: { [key: number]: { sections: Array<{ title: string; content: string }> } } = {
  1: {
    sections: [
      {
        title: "What Examiners Look For",
        content: "NSW Selective examiners evaluate your writing based on specific criteria:\n\n• Vocabulary: Use of sophisticated and varied vocabulary appropriate to the text type\n• Grammar & Spelling: Correct use of grammar, spelling, and punctuation\n• Structure: Clear organization with effective paragraphing\n• Technique: Use of literary and persuasive techniques\n• Ideas: Original and well-developed ideas\n• Engagement: Ability to engage and hold the reader's interest"
      },
      {
        title: "Marking Bands",
        content: "Band 1 (Excellent): Sophisticated vocabulary, complex sentence structures, compelling ideas\nBand 2 (Good): Varied vocabulary, good sentence variety, well-developed ideas\nBand 3 (Satisfactory): Adequate vocabulary, some variety, clear ideas\nBand 4 (Needs Improvement): Limited vocabulary, simple structures, basic ideas"
      }
    ]
  },
  2: {
    sections: [
      {
        title: "Types of Sentences",
        content: "1. Simple Sentences: One independent clause\n   Example: 'The cat sat on the mat.'\n\n2. Compound Sentences: Two independent clauses joined by a conjunction\n   Example: 'The cat sat on the mat, and the dog lay beside it.'\n\n3. Complex Sentences: Independent clause with one or more dependent clauses\n   Example: 'While the cat sat on the mat, the dog lay beside it.'\n\n4. Compound-Complex: Multiple independent and dependent clauses\n   Example: 'While the cat sat on the mat, the dog lay beside it, and the birds sang overhead.'"
      },
      {
        title: "Sentence Variety Tips",
        content: "• Vary sentence length: Mix short, punchy sentences with longer, complex ones\n• Vary sentence openings: Start sentences differently to maintain reader interest\n• Use transitional phrases: Connect ideas smoothly between sentences\n• Avoid repetition: Don't start every sentence with the same word or structure"
      }
    ]
  },
  3: {
    sections: [
      {
        title: "Paragraph Structure",
        content: "A well-developed paragraph contains:\n\n1. Topic Sentence: Introduces the main idea\n2. Supporting Sentences: Provide evidence and explanation\n3. Concluding Sentence: Summarizes or transitions to next paragraph\n4. Unity: All sentences relate to the main idea\n5. Coherence: Ideas flow logically from one to the next"
      },
      {
        title: "Paragraph Development Techniques",
        content: "• Examples: Use specific examples to support your point\n• Explanation: Explain why your examples matter\n• Evidence: Use quotes or data to strengthen arguments\n• Analysis: Discuss the significance of your evidence\n• Elaboration: Expand on your ideas with additional details"
      }
    ]
  },
  6: {
    sections: [
      {
        title: "Story Mountain Framework",
        content: "The Story Mountain helps structure narrative writing:\n\n1. Exposition: Introduce characters, setting, and situation\n2. Rising Action: Build tension through events\n3. Climax: The turning point or most intense moment\n4. Falling Action: Events after the climax\n5. Resolution: How the story ends\n\nThis structure keeps your narrative engaging and well-paced."
      },
      {
        title: "Plot Development Techniques",
        content: "• Foreshadowing: Hint at future events\n• Pacing: Control the speed of your narrative\n• Tension: Create suspense and conflict\n• Turning Points: Include moments that change the story\n• Subplots: Add secondary storylines for depth"
      }
    ]
  },
  12: {
    sections: [
      {
        title: "PEEEL Structure",
        content: "Structure your persuasive writing with PEEEL:\n\nP - Point: State your main argument\nE - Evidence: Provide facts, statistics, or examples\nE - Explanation: Explain how the evidence supports your point\nE - Example: Give a specific example\nL - Link: Connect back to your main argument"
      },
      {
        title: "Persuasive Techniques",
        content: "• Rhetorical Questions: Questions that don't require answers\n• Repetition: Repeating key phrases for emphasis\n• Emotive Language: Words that appeal to emotions\n• Statistics: Using numbers to support arguments\n• Expert Opinion: Citing authorities on the subject\n• Analogies: Comparing to similar situations"
      }
    ]
  }
};

export function LessonDetail({ lessonId, onBack, onStartLesson }: LessonDetailProps) {
  const { progress } = useLearning();
  const lesson = LESSONS_DATA[lessonId];
  const content = LESSON_CONTENT[lessonId];
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Lesson not found</p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Lessons
        </button>
      </div>
    );
  }

  const isCompleted = progress.completedLessons.includes(lessonId);
  const prerequisitesMet = lesson.prerequisites.length === 0 || 
    lesson.prerequisites.every(prereq => progress.completedLessons.includes(prereq));
  const isLocked = !prerequisitesMet && !isCompleted;

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
      >
        <ArrowLeft size={20} />
        Back to Lessons
      </button>

      {/* Lesson Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 mb-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg">
              <CheckCircle size={20} />
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lesson.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(lesson.difficulty)}`}>
              {lesson.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={20} className="text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lesson.points} pts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lesson.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      {lesson.prerequisites.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg border ${
          prerequisitesMet 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start gap-3">
            {prerequisitesMet ? (
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Prerequisites</p>
              <p className={prerequisitesMet ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                {prerequisitesMet 
                  ? '✓ All prerequisites completed!' 
                  : 'Complete the required lessons to unlock this one.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content */}
      {content && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lesson Content</h2>
            <div className="space-y-4">
              {content.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center justify-between transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white text-left">{section.title}</h3>
                    <span className="text-gray-600 dark:text-gray-400">
                      {expandedSection === index ? '−' : '+'}
                    </span>
                  </button>
                  {expandedSection === index && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!isLocked && !isCompleted && (
          <button
            onClick={onStartLesson}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Play size={20} />
            Start Lesson
          </button>
        )}
        {isLocked && (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed"
          >
            <Lock size={20} />
            Locked - Complete Prerequisites
          </button>
        )}
        {isCompleted && (
          <button
            onClick={onStartLesson}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Play size={20} />
            Review Lesson
          </button>
        )}
      </div>
    </div>
  );
}
