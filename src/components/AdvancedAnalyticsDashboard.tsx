import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Calendar, BarChart3, PieChart, Clock, Star, Zap, Brain, BookOpen, CheckCircle, ArrowUp, ArrowDown, Minus, Trophy, Medal, Crown, Sparkles } from 'lucide-react';

interface WritingSession {
  id: string;
  date: Date;
  textType: string;
  wordCount: number;
  timeSpent: number; // in minutes
  scores: {
    ideas: number;
    structure: number;
    vocabulary: number;
    grammar: number;
    nswCriteria: number;
    overall: number;
  };
  improvements: string[];
  feedback: string;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
}

interface AnalyticsStats {
  totalSessions: number;
  totalWords: number;
  totalTime: number;
  averageScore: number;
  improvementRate: number;
  streakDays: number;
  achievements: Achievement[];
  weeklyProgress: WeeklyProgress[];
  skillBreakdown: SkillProgress[];
  textTypePerformance: TextTypeStats[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlockedDate?: Date;
  progress: number;
  target: number;
  category: 'writing' | 'consistency' | 'improvement' | 'milestone';
}

interface WeeklyProgress {
  week: string;
  sessions: number;
  averageScore: number;
  wordsWritten: number;
  timeSpent: number;
}

interface SkillProgress {
  skill: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  sessions: number[];
}

interface TextTypeStats {
  textType: string;
  sessions: number;
  averageScore: number;
  bestScore: number;
  averageWords: number;
  improvement: number;
}

interface AdvancedAnalyticsDashboardProps {
  currentSession?: Partial<WritingSession>;
  onGoalSet?: (goal: string, target: number) => void;
  isVisible: boolean;
}

export function AdvancedAnalyticsDashboard({
  currentSession,
  onGoalSet,
  isVisible
}: AdvancedAnalyticsDashboardProps) {
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [selectedView, setSelectedView] = useState<'overview' | 'skills' | 'achievements' | 'textTypes'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration - in real app, this would come from backend
  const mockSessions: WritingSession[] = [
    {
      id: '1',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      textType: 'narrative',
      wordCount: 245,
      timeSpent: 25,
      scores: { ideas: 8, structure: 7, vocabulary: 6, grammar: 8, nswCriteria: 7, overall: 7.2 },
      improvements: ['Better vocabulary choices', 'Improved sentence variety'],
      feedback: 'Great creative ideas! Work on using more sophisticated vocabulary.',
      assistanceLevel: 'moderate'
    },
    {
      id: '2',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      textType: 'persuasive',
      wordCount: 198,
      timeSpent: 20,
      scores: { ideas: 7, structure: 8, vocabulary: 7, grammar: 7, nswCriteria: 7, overall: 7.2 },
      improvements: ['Strong arguments', 'Clear structure'],
      feedback: 'Well-structured argument. Try adding more persuasive language.',
      assistanceLevel: 'moderate'
    },
    {
      id: '3',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      textType: 'descriptive',
      wordCount: 267,
      timeSpent: 30,
      scores: { ideas: 6, structure: 6, vocabulary: 8, grammar: 7, nswCriteria: 6, overall: 6.6 },
      improvements: ['Vivid descriptions', 'Good use of adjectives'],
      feedback: 'Beautiful descriptive language! Focus on organizing ideas better.',
      assistanceLevel: 'comprehensive'
    },
    {
      id: '4',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      textType: 'narrative',
      wordCount: 189,
      timeSpent: 22,
      scores: { ideas: 6, structure: 5, vocabulary: 5, grammar: 6, nswCriteria: 5, overall: 5.4 },
      improvements: ['Creative plot', 'Good character development'],
      feedback: 'Interesting story! Work on sentence structure and vocabulary.',
      assistanceLevel: 'comprehensive'
    },
    {
      id: '5',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      textType: 'persuasive',
      wordCount: 156,
      timeSpent: 18,
      scores: { ideas: 5, structure: 6, vocabulary: 5, grammar: 6, nswCriteria: 5, overall: 5.4 },
      improvements: ['Clear opinion', 'Good examples'],
      feedback: 'Good start! Try using more persuasive techniques.',
      assistanceLevel: 'comprehensive'
    }
  ];

  // Achievements system
  const allAchievements: Achievement[] = [
    {
      id: 'first_story',
      title: 'First Story',
      description: 'Complete your first writing piece',
      icon: <BookOpen className="w-6 h-6" />,
      progress: 1,
      target: 1,
      category: 'milestone',
      unlockedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'word_warrior',
      title: 'Word Warrior',
      description: 'Write 1000 words total',
      icon: <Zap className="w-6 h-6" />,
      progress: 1055,
      target: 1000,
      category: 'writing',
      unlockedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'consistent_writer',
      title: 'Consistent Writer',
      description: 'Write for 7 days in a row',
      icon: <Calendar className="w-6 h-6" />,
      progress: 3,
      target: 7,
      category: 'consistency'
    },
    {
      id: 'vocabulary_master',
      title: 'Vocabulary Master',
      description: 'Score 8+ on vocabulary 5 times',
      icon: <Brain className="w-6 h-6" />,
      progress: 1,
      target: 5,
      category: 'improvement'
    },
    {
      id: 'nsw_ready',
      title: 'NSW Ready',
      description: 'Score 8+ overall on NSW criteria',
      icon: <Crown className="w-6 h-6" />,
      progress: 0,
      target: 1,
      category: 'milestone'
    },
    {
      id: 'improvement_streak',
      title: 'Improvement Streak',
      description: 'Improve your score 3 times in a row',
      icon: <TrendingUp className="w-6 h-6" />,
      progress: 2,
      target: 3,
      category: 'improvement'
    }
  ];

  // Calculate analytics statistics
  const calculateAnalyticsStats = (sessions: WritingSession[]): AnalyticsStats => {
    const totalSessions = sessions.length;
    const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
    const totalTime = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
    const averageScore = sessions.reduce((sum, s) => sum + s.scores.overall, 0) / totalSessions;
    
    // Calculate improvement rate (comparing first half to second half)
    const sortedSessions = sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalf = sortedSessions.slice(0, midPoint);
    const secondHalf = sortedSessions.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, s) => sum + s.scores.overall, 0) / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, s) => sum + s.scores.overall, 0) / secondHalf.length : 0;
    
    const improvementRate = secondHalfAvg - firstHalfAvg;
    
    // Calculate streak (consecutive days with sessions)
    const streakDays = calculateStreak(sessions);
    
    // Generate weekly progress
    const weeklyProgress = generateWeeklyProgress(sessions);
    
    // Generate skill breakdown
    const skillBreakdown = generateSkillBreakdown(sessions);
    
    // Generate text type performance
    const textTypePerformance = generateTextTypeStats(sessions);
    
    // Update achievements
    const achievements = updateAchievements(sessions, allAchievements);
    
    return {
      totalSessions,
      totalWords,
      totalTime,
      averageScore: Math.round(averageScore * 10) / 10,
      improvementRate: Math.round(improvementRate * 10) / 10,
      streakDays,
      achievements,
      weeklyProgress,
      skillBreakdown,
      textTypePerformance
    };
  };

  // Calculate writing streak
  const calculateStreak = (sessions: WritingSession[]): number => {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = new Date(sessionDate);
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  };

  // Generate weekly progress data
  const generateWeeklyProgress = (sessions: WritingSession[]): WeeklyProgress[] => {
    const weeks: { [key: string]: WritingSession[] } = {};
    
    sessions.forEach(session => {
      const weekStart = new Date(session.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(session);
    });
    
    return Object.entries(weeks).map(([week, weekSessions]) => ({
      week,
      sessions: weekSessions.length,
      averageScore: weekSessions.reduce((sum, s) => sum + s.scores.overall, 0) / weekSessions.length,
      wordsWritten: weekSessions.reduce((sum, s) => sum + s.wordCount, 0),
      timeSpent: weekSessions.reduce((sum, s) => sum + s.timeSpent, 0)
    })).sort((a, b) => a.week.localeCompare(b.week));
  };

  // Generate skill breakdown
  const generateSkillBreakdown = (sessions: WritingSession[]): SkillProgress[] => {
    const skills = ['ideas', 'structure', 'vocabulary', 'grammar', 'nswCriteria'];
    
    return skills.map(skill => {
      const scores = sessions
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(s => s.scores[skill as keyof typeof s.scores]);
      const current = scores.length > 0 ? scores[scores.length - 1] : 0;
      const previous = scores.length > 1 ? scores[scores.length - 2] : current;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (current > previous) trend = 'up';
      else if (current < previous) trend = 'down';
      
      return {
        skill: skill.charAt(0).toUpperCase() + skill.slice(1).replace(/([A-Z])/g, ' $1'),
        current,
        previous,
        trend,
        sessions: scores
      };
    });
  };

  // Generate text type performance stats
  const generateTextTypeStats = (sessions: WritingSession[]): TextTypeStats[] => {
    const textTypes: { [key: string]: WritingSession[] } = {};
    
    sessions.forEach(session => {
      if (!textTypes[session.textType]) textTypes[session.textType] = [];
      textTypes[session.textType].push(session);
    });
    
    return Object.entries(textTypes).map(([textType, typeSessions]) => {
      const sortedSessions = typeSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
      const averageScore = typeSessions.reduce((sum, s) => sum + s.scores.overall, 0) / typeSessions.length;
      const bestScore = Math.max(...typeSessions.map(s => s.scores.overall));
      const averageWords = typeSessions.reduce((sum, s) => sum + s.wordCount, 0) / typeSessions.length;
      
      // Calculate improvement (first vs last session)
      const firstScore = sortedSessions[0]?.scores.overall || 0;
      const lastScore = sortedSessions[sortedSessions.length - 1]?.scores.overall || 0;
      const improvement = lastScore - firstScore;
      
      return {
        textType: textType.charAt(0).toUpperCase() + textType.slice(1),
        sessions: typeSessions.length,
        averageScore: Math.round(averageScore * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
        averageWords: Math.round(averageWords),
        improvement: Math.round(improvement * 10) / 10
      };
    });
  };

  // Update achievements based on progress
  const updateAchievements = (sessions: WritingSession[], achievements: Achievement[]): Achievement[] => {
    return achievements.map(achievement => {
      let progress = achievement.progress;
      
      switch (achievement.id) {
        case 'word_warrior':
          progress = sessions.reduce((sum, s) => sum + s.wordCount, 0);
          break;
        case 'consistent_writer':
          progress = calculateStreak(sessions);
          break;
        case 'vocabulary_master':
          progress = sessions.filter(s => s.scores.vocabulary >= 8).length;
          break;
        case 'nsw_ready':
          progress = sessions.filter(s => s.scores.overall >= 8).length;
          break;
        case 'improvement_streak':
          // Check for consecutive improvements
          const sortedSessions = sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
          let streak = 0;
          let maxStreak = 0;
          for (let i = 1; i < sortedSessions.length; i++) {
            if (sortedSessions[i].scores.overall > sortedSessions[i-1].scores.overall) {
              streak++;
              maxStreak = Math.max(maxStreak, streak);
            } else {
              streak = 0;
            }
          }
          progress = maxStreak;
          break;
      }
      
      const wasUnlocked = achievement.unlockedDate !== undefined;
      const isNowUnlocked = progress >= achievement.target;
      
      return {
        ...achievement,
        progress,
        unlockedDate: !wasUnlocked && isNowUnlocked ? new Date() : achievement.unlockedDate
      };
    });
  };

  // Load analytics data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const stats = calculateAnalyticsStats(mockSessions);
      setAnalyticsStats(stats);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  if (isLoading || !analyticsStats) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="font-semibold text-gray-800">Loading Analytics...</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Advanced Analytics</h3>
        </div>
        
        {/* View Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['overview', 'skills', 'textTypes', 'achievements'].map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedView === view
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {view === 'textTypes' ? 'Text Types' : view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Sessions</span>
              </div>
              <span className="text-2xl font-bold text-blue-900">{analyticsStats.totalSessions}</span>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Words</span>
              </div>
              <span className="text-2xl font-bold text-green-900">{analyticsStats.totalWords}</span>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Avg Score</span>
              </div>
              <span className="text-2xl font-bold text-purple-900">{analyticsStats.averageScore}</span>
              <span className="text-sm text-purple-600">/10</span>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Streak</span>
              </div>
              <span className="text-2xl font-bold text-orange-900">{analyticsStats.streakDays}</span>
              <span className="text-sm text-orange-600">days</span>
            </div>
          </div>

          {/* Improvement Indicator */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Overall Improvement</h4>
                <p className="text-sm text-gray-600">
                  Your writing has improved by{' '}
                  <span className={`font-bold ${analyticsStats.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analyticsStats.improvementRate >= 0 ? '+' : ''}{analyticsStats.improvementRate} points
                  </span>{' '}
                  over your recent sessions!
                </p>
              </div>
              <div className="text-3xl">
                {analyticsStats.improvementRate >= 1 ? '🚀' : 
                 analyticsStats.improvementRate >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Weekly Progress</span>
            </h4>
            <div className="space-y-3">
              {analyticsStats.weeklyProgress.map((week, index) => (
                <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Week {index + 1}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {week.sessions} session{week.sessions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getScoreColor(week.averageScore)}`}>
                      {week.averageScore.toFixed(1)}/10
                    </div>
                    <div className="text-sm text-gray-600">
                      {week.wordsWritten} words
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {selectedView === 'skills' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Skill Breakdown</span>
          </h4>
          
          <div className="space-y-3">
            {analyticsStats.skillBreakdown.map(skill => (
              <div key={skill.skill} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{skill.skill}</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(skill.trend)}
                    <span className={`text-lg font-bold ${getScoreColor(skill.current)}`}>
                      {skill.current}/10
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(skill.current / 10) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Previous: {skill.previous}</span>
                  <span>
                    {skill.trend === 'up' && '+'}
                    {skill.current - skill.previous} change
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Types Tab */}
      {selectedView === 'textTypes' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            <PieChart className="w-5 h-5" />
            <span>Text Type Performance</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsStats.textTypePerformance.map(textType => (
              <div key={textType.textType} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-800">{textType.textType}</h5>
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {textType.sessions} session{textType.sessions !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Score:</span>
                    <span className={`font-medium ${getScoreColor(textType.averageScore)}`}>
                      {textType.averageScore}/10
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Best Score:</span>
                    <span className={`font-medium ${getScoreColor(textType.bestScore)}`}>
                      {textType.bestScore}/10
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Words:</span>
                    <span className="font-medium text-gray-800">{textType.averageWords}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Improvement:</span>
                    <span className={`font-medium ${textType.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {textType.improvement >= 0 ? '+' : ''}{textType.improvement}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {selectedView === 'achievements' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Achievements</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsStats.achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.unlockedDate 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlockedDate ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    {achievement.unlockedDate ? achievement.icon : 
                     <div className="opacity-50">{achievement.icon}</div>
                    }
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className={`font-medium ${
                        achievement.unlockedDate ? 'text-yellow-800' : 'text-gray-600'
                      }`}>
                        {achievement.title}
                      </h5>
                      {achievement.unlockedDate && (
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    
                    <p className={`text-sm mb-2 ${
                      achievement.unlockedDate ? 'text-yellow-700' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            achievement.unlockedDate ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {achievement.unlockedDate && (
                      <p className="text-xs text-yellow-600 mt-2">
                        Unlocked {achievement.unlockedDate.toLocaleDateString()}
                      </p>
                    )}
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
