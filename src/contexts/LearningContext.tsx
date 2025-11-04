import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LearningProgress {
  completedLessons: number[];
  currentStreak: number;
  totalPoints: number;
  earnedBadges: string[];
  lessonScores: { [key: number]: number };
  timeSpent: { [key: number]: number };
  lastActivity: Date;
  preferences: {
    difficulty: 'adaptive' | 'standard' | 'challenge';
    focusAreas: string[];
  };
}

interface LearningContextType {
  progress: LearningProgress;
  updateProgress: (updates: Partial<LearningProgress>) => void;
  completeLesson: (day: number, score: number, timeSpent: number) => void;
  earnBadge: (badgeId: string) => void;
  resetProgress: () => void;
  getRecommendations: () => number[];
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

const initialProgress: LearningProgress = {
  completedLessons: [],
  currentStreak: 0,
  totalPoints: 0,
  earnedBadges: [],
  lessonScores: {},
  timeSpent: {},
  lastActivity: new Date(),
  preferences: {
    difficulty: 'standard',
    focusAreas: []
  }
};

const calculateStreak = (completedLessons: number[]): number => {
  const sortedLessons = completedLessons.sort((a, b) => a - b);
  let streak = 0;
  let expectedDay = Math.max(...sortedLessons);
  
  for (let i = sortedLessons.length - 1; i >= 0; i--) {
    if (sortedLessons[i] === expectedDay) {
      streak++;
      expectedDay--;
    } else {
      break;
    }
  }
  
  return streak;
};

// Define lesson prerequisites (based on lessons.json)
const prerequisites: { [key: number]: number[] } = {
  4: [2],
  5: [3],
  6: [3, 5],
  7: [6],
  8: [5],
  9: [4, 7],
  10: [6, 7],
  11: [8, 9],
  12: [3],
  13: [12],
  14: [12, 13],
  15: [14],
  16: [5],
  17: [16],
  18: [16],
  19: [17, 18],
  20: [19],
  21: [20],
  22: [20],
  23: [21, 22],
  24: [23],
  25: [13],
  26: [14, 25],
  27: [25],
  28: [27],
  29: [28],
  30: [26, 29]
};

export function LearningProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<LearningProgress>(initialProgress);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress({
          ...parsed,
          lastActivity: new Date(parsed.lastActivity)
        });
      } catch (error) {
        console.error('Error loading learning progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('learningProgress', JSON.stringify(progress));
  }, [progress]);

  const updateProgress = (updates: Partial<LearningProgress>) => {
    setProgress(prev => ({ ...prev, ...updates, lastActivity: new Date() }));
  };

  const completeLesson = (day: number, score: number, timeSpent: number) => {
    setProgress(prev => {
      const newCompletedLessons = [...new Set([...prev.completedLessons, day])];
      const newLessonScores = { ...prev.lessonScores, [day]: score };
      const newTimeSpent = { ...prev.timeSpent, [day]: timeSpent };
      const pointsEarned = Math.round(score * 0.5); // Convert percentage to points
      
      return {
        ...prev,
        completedLessons: newCompletedLessons,
        lessonScores: newLessonScores,
        timeSpent: newTimeSpent,
        totalPoints: prev.totalPoints + pointsEarned,
        currentStreak: calculateStreak(newCompletedLessons),
        lastActivity: new Date()
      };
    });
  };

  const earnBadge = (badgeId: string) => {
    setProgress(prev => ({
      ...prev,
      earnedBadges: [...new Set([...prev.earnedBadges, badgeId])],
      lastActivity: new Date()
    }));
  };

  const resetProgress = () => {
    setProgress(initialProgress);
    localStorage.removeItem('learningProgress');
  };

  const getRecommendations = (): number[] => {
    const completed = progress.completedLessons;
    const available = [];
    
    for (let day = 1; day <= 30; day++) {
      if (!completed.includes(day)) {
        const prereqs = prerequisites[day] || [];
        if (prereqs.length === 0 || prereqs.every(req => completed.includes(req))) {
          available.push(day);
        }
      }
    }
    
    return available.slice(0, 3); // Return top 3 recommendations
  };

  const value: LearningContextType = {
    progress,
    updateProgress,
    completeLesson,
    earnBadge,
    resetProgress,
    getRecommendations
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  // FIX: Destructure all properties to prevent minification from breaking access.
  const { progress, updateProgress, completeLesson, earnBadge, resetProgress, getRecommendations } = context;
  return { progress, updateProgress, completeLesson, earnBadge, resetProgress, getRecommendations };
}