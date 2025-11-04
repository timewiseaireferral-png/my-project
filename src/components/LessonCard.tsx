import React from 'react';
import { Clock, Award, Lock, CheckCircle, Play } from 'lucide-react';

interface LessonCardProps {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: string;
  points: number;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export function LessonCard({
  title,
  description,
  duration,
  difficulty,
  category,
  points,
  isCompleted,
  isLocked,
  onClick
}: LessonCardProps) {
  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Foundations': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Grammar & Style': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'Structure': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
      case 'Creative Writing': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
      case 'Persuasive Writing': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`relative group text-left transition-all duration-300 ${
        isLocked ? 'cursor-not-allowed opacity-60' : 'hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      <div className={`h-full rounded-lg border-2 p-6 transition-all ${
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          : isLocked
          ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
      }`}>
        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1">
            <CheckCircle size={18} />
          </div>
        )}

        {/* Locked Badge */}
        {isLocked && (
          <div className="absolute top-3 right-3 bg-gray-400 text-white rounded-full p-1">
            <Lock size={18} />
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 pr-8 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {description}
        </p>

        {/* Category Badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(category)}`}>
            {category}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Clock size={16} />
            <span>{duration}</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </div>
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
            <Award size={16} />
            <span>{points} pts</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Start'}
          </span>
          <div className={`p-2 rounded-full transition-colors ${
            isCompleted
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : isLocked
              ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800'
          }`}>
            {isCompleted ? <CheckCircle size={18} /> : <Play size={18} />}
          </div>
        </div>
      </div>
    </button>
  );
}