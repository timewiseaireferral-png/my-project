import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Award, Target, BarChart3, Zap } from 'lucide-react';
import {
  calculateRealtimeNSWScore,
  compareScores,
  getScoreFeedback,
  debounceScoring,
  type RealtimeNSWScore,
  type ScoreChange
} from '../lib/realtimeNSWScoring';

interface RealtimeNSWScoreDisplayProps {
  content: string;
  textType?: string;
  darkMode?: boolean;
  onScoreUpdate?: (score: RealtimeNSWScore) => void;
}

export const RealtimeNSWScoreDisplay: React.FC<RealtimeNSWScoreDisplayProps> = ({
  content,
  textType = 'narrative',
  darkMode = false,
  onScoreUpdate
}) => {
  const [currentScore, setCurrentScore] = useState<RealtimeNSWScore | null>(null);
  const [previousScore, setPreviousScore] = useState<RealtimeNSWScore | null>(null);
  const [recentChanges, setRecentChanges] = useState<ScoreChange[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showChangeAnimation, setShowChangeAnimation] = useState(false);

  // Debounced score calculation
  const calculateScore = useCallback(
    debounceScoring((text: string) => {
      if (text.trim().length === 0) {
        setCurrentScore(null);
        setPreviousScore(null);
        return;
      }

      setIsCalculating(true);

      const newScore = calculateRealtimeNSWScore(text, textType);

      if (currentScore) {
        const changes = compareScores(currentScore, newScore);
        if (changes.length > 0) {
          setRecentChanges(changes);
          setShowChangeAnimation(true);
          setTimeout(() => setShowChangeAnimation(false), 2000);
        }
        setPreviousScore(currentScore);
      }

      setCurrentScore(newScore);
      setIsCalculating(false);

      if (onScoreUpdate) {
        onScoreUpdate(newScore);
      }
    }, 1000), // 1 second debounce
    [currentScore, textType, onScoreUpdate]
  );

  // Calculate score when content changes
  useEffect(() => {
    calculateScore(content);
  }, [content, calculateScore]);

  if (!currentScore) {
    return (
      <div className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Start writing to see your NSW scores in real-time!</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return darkMode ? 'text-green-400' : 'text-green-600';
    if (score >= 3) return darkMode ? 'text-blue-400' : 'text-blue-600';
    if (score >= 2) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    return darkMode ? 'text-red-400' : 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200';
    if (score >= 3) return darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200';
    if (score >= 2) return darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200';
    return darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200';
  };

  const criteriaData = [
    {
      key: 'ideasContent',
      label: 'Ideas & Content',
      icon: <Target className="w-5 h-5" />,
      weight: '40%',
      score: currentScore.ideasContent,
      contribution: currentScore.breakdown.ideasContent
    },
    {
      key: 'structureOrganization',
      label: 'Structure & Organization',
      icon: <BarChart3 className="w-5 h-5" />,
      weight: '20%',
      score: currentScore.structureOrganization,
      contribution: currentScore.breakdown.structure
    },
    {
      key: 'vocabularyLanguage',
      label: 'Vocabulary & Language',
      icon: <Zap className="w-5 h-5" />,
      weight: '25%',
      score: currentScore.vocabularyLanguage,
      contribution: currentScore.breakdown.language
    },
    {
      key: 'grammarMechanics',
      label: 'Grammar & Mechanics',
      icon: <Award className="w-5 h-5" />,
      weight: '15%',
      score: currentScore.grammarMechanics,
      contribution: currentScore.breakdown.grammar
    }
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Overall Score Card */}
      <div className={`relative rounded-xl border-2 p-6 ${
        showChangeAnimation ? 'score-pulse' : ''
      } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}`}>
        {isCalculating && (
          <div className="absolute top-3 right-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            NSW Score
          </h2>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(currentScore.weightedScore)}`}>
              {currentScore.totalOutOf30.toFixed(1)}
              <span className="text-2xl">/30</span>
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentScore.percentage.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-3 rounded-full overflow-hidden ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div
            className={`h-full transition-all duration-500 ${
              currentScore.percentage >= 75
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : currentScore.percentage >= 50
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}
            style={{ width: `${currentScore.percentage}%` }}
          />
        </div>

        <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="font-semibold">Live Score</span> • Updates as you type
        </div>
      </div>

      {/* Recent Changes Banner */}
      {recentChanges.length > 0 && showChangeAnimation && (
        <div className={`rounded-lg border p-3 animate-fade-in ${
          darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
        }`}>
          <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            Score Updates:
          </p>
          {recentChanges.map((change, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {change.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {change.criterion}: {change.oldScore} → {change.newScore}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Individual Criteria Scores */}
      <div className="space-y-3">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Criteria Breakdown
        </h3>

        {criteriaData.map((criterion) => (
          <div
            key={criterion.key}
            className={`rounded-lg border-2 p-4 transition-all duration-300 ${getScoreBg(criterion.score)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={getScoreColor(criterion.score)}>
                  {criterion.icon}
                </div>
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {criterion.label}
                  </h4>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {criterion.weight} of total score
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(criterion.score)}`}>
                  {criterion.score}
                  <span className="text-lg">/4</span>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {criterion.contribution.toFixed(1)} marks
                </div>
              </div>
            </div>

            {/* Level Indicator */}
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    level <= criterion.score
                      ? criterion.score >= 4
                        ? 'bg-green-500'
                        : criterion.score >= 3
                        ? 'bg-blue-500'
                        : criterion.score >= 2
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                      : darkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Feedback */}
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {getScoreFeedback(criterion.score, criterion.label)}
            </p>
          </div>
        ))}
      </div>

      {/* Score Legend */}
      <div className={`rounded-lg border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          NSW Scoring Guide
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-green-500"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Level 4: Exceptional (12-16 marks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-blue-500"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Level 3: Solid (8-11 marks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-yellow-500"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Level 2: Developing (4-7 marks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 rounded bg-red-500"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Level 1: Beginning (0-3 marks)</span>
          </div>
        </div>
      </div>

      <style>{`
        .score-pulse {
          animation: score-pulse 0.5s ease-in-out;
        }

        @keyframes score-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-in;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
