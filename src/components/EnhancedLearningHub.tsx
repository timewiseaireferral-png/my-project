import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Lock, 
  Star,
  Clock,
  Award,
  TrendingUp,
  Target,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';
import { LessonCard } from './LessonCard';
import { LessonDetail } from './LessonDetail';
import lessonsData from '../data/lessons.json';

type ViewMode = 'grid' | 'detail';
type CategoryFilter = 'All' | 'Foundations' | 'Grammar & Style' | 'Structure' | 'Creative Writing' | 'Persuasive Writing';

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

interface EnhancedLearningHubProps {
  onNavigate?: (page: string) => void;
}

export const EnhancedLearningHub: React.FC<EnhancedLearningHubProps> = ({ onNavigate }) => {
  const { progress } = useLearning();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  const lessons: Lesson[] = lessonsData;

  // Filter and search lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || lesson.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === 'All' || lesson.difficulty === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, selectedCategory, difficultyFilter]);

  // Determine lesson status
  const getLessonStatus = (lesson: Lesson) => {
    const isCompleted = progress.completedLessons.includes(lesson.id);
    const prerequisitesMet = lesson.prerequisites.length === 0 ||
      lesson.prerequisites.every(prereq => progress.completedLessons.includes(prereq));
    const isLocked = !prerequisitesMet && !isCompleted;
    
    return { isCompleted, isLocked, prerequisitesMet };
  };

  // Get categories from lessons
  const categories: CategoryFilter[] = ['All', 'Foundations', 'Grammar & Style', 'Structure', 'Creative Writing', 'Persuasive Writing'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Calculate stats
  const stats = {
    completed: progress.completedLessons.length,
    total: lessons.length,
    completionRate: Math.round((progress.completedLessons.length / lessons.length) * 100),
    nextRecommended: progress.getRecommendations()[0] || null
  };

  if (viewMode === 'detail' && selectedLessonId) {
    return (
      <LessonDetail
        lessonId={selectedLessonId}
        onBack={() => {
          setViewMode('grid');
          setSelectedLessonId(null);
        }}
        onStartLesson={() => {
          // Handle lesson start
          console.log('Starting lesson:', selectedLessonId);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Writing Skills Academy</h1>
              <p className="text-gray-600 dark:text-gray-400">Master all writing types with our structured learning system</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lessons Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}/{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                  <Zap className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <Target className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <TrendingUp className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.currentStreak} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Filter size={16} className="inline mr-2" />
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Zap size={16} className="inline mr-2" />
                Difficulty
              </label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      difficultyFilter === diff
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {filteredLessons.length} {filteredLessons.length === 1 ? 'Lesson' : 'Lessons'}
          </h2>
          
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No lessons found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map(lesson => {
                const status = getLessonStatus(lesson);
                return (
                  <LessonCard
                    key={lesson.id}
                    id={lesson.id}
                    title={lesson.title}
                    description={lesson.description}
                    duration={lesson.duration}
                    difficulty={lesson.difficulty as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'}
                    category={lesson.category}
                    points={lesson.points}
                    isCompleted={status.isCompleted}
                    isLocked={status.isLocked}
                    onClick={() => {
                      setSelectedLessonId(lesson.id);
                      setViewMode('detail');
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
