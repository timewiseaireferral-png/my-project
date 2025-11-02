import React from 'react';
import { Award, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import {
  NSW_MARKING_CRITERIA,
  generateScoringGuidance,
  calculateWeightedScore,
  calculateWeightedPercentage,
  calculateTotalMarks,
  type ScoringGuidance
} from '../lib/nswMarkingCriteria';

interface NSWCriteriaDisplayProps {
  scores: {
    IDEAS_CONTENT: number;
    STRUCTURE_ORGANIZATION: number;
    VOCABULARY_LANGUAGE: number;
    GRAMMAR_MECHANICS: number;
  };
  wordCount: number;
  showDetailed?: boolean;
}

/**
 * Display NSW Marking Criteria with explicit references and scoring guidance
 */
export function NSWCriteriaDisplay({ scores, wordCount, showDetailed = false }: NSWCriteriaDisplayProps) {
  // Handle null or undefined scores
  if (!scores || typeof scores !== 'object') {
    return null;
  }

  const criteriaKeys = Object.keys(scores) as Array<keyof typeof scores>;

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 border-green-500 text-green-800';
    if (level >= 3) return 'bg-blue-100 border-blue-500 text-blue-800';
    if (level >= 2) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-red-100 border-red-500 text-red-800';
  };

  const getLevelIcon = (level: number) => {
    if (level >= 4) return <Award className="w-4 h-4" />;
    if (level >= 3) return <CheckCircle className="w-4 h-4" />;
    if (level >= 2) return <TrendingUp className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getLevelName = (level: number) => {
    if (level >= 4) return 'Extensive';
    if (level >= 3) return 'Sound';
    if (level >= 2) return 'Basic';
    return 'Limited';
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-sm text-blue-900">NSW Selective Schools Marking Criteria</h3>
        </div>
        <p className="text-xs text-blue-800 mb-2">
          Your writing is assessed on 4 official NSW criteria. Each criterion is marked on a scale of 1-4.
        </p>
      </div>

      {criteriaKeys.map((key) => {
        const criterion = NSW_MARKING_CRITERIA[key];
        const score = scores[key];
        const levelData = criterion.levels.find(l => l.level === score);
        const guidance = generateScoringGuidance(key, score, `This shows your current performance level.`);

        return (
          <div key={key} className={`border-l-4 rounded-lg p-3 ${getLevelColor(score)}`}>
            {/* Header with Score */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getLevelIcon(score)}
                <div>
                  <h4 className="font-bold text-sm">
                    {criterion.name}
                  </h4>
                  <p className="text-xs opacity-75">NSW Code: {criterion.code} | Weight: {criterion.weighting}%</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-xs font-medium">{getLevelName(score)}</div>
              </div>
            </div>

            {/* Current Level Description */}
            {levelData && (
              <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                <p className="text-xs font-semibold mb-1">📊 Level {score} Descriptor:</p>
                <p className="text-xs">{levelData.descriptor}</p>
              </div>
            )}

            {/* Scoring Guidance */}
            {guidance && showDetailed && (
              <div className="space-y-2 mt-2">
                <div className="bg-white bg-opacity-60 rounded p-2">
                  <p className="text-xs font-semibold mb-1">✅ What You're Doing:</p>
                  <p className="text-xs">{guidance.whatYouDid}</p>
                </div>

                {score < 4 && (
                  <>
                    <div className="bg-white bg-opacity-60 rounded p-2">
                      <p className="text-xs font-semibold mb-1">🎯 To Reach Level {guidance.targetLevel}:</p>
                      <p className="text-xs">{guidance.howToImprove}</p>
                    </div>

                    {/* Specific Examples */}
                    {levelData && levelData.examples && levelData.examples.length > 0 && (
                      <div className="bg-white bg-opacity-60 rounded p-2">
                        <p className="text-xs font-semibold mb-1">💡 Examples at Level {score}:</p>
                        <ul className="text-xs space-y-1 ml-3">
                          {levelData.examples.slice(0, 3).map((example, idx) => (
                            <li key={idx} className="list-disc">{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quick Tips for Lower Scores */}
            {!showDetailed && score < 3 && (
              <div className="mt-2 bg-white bg-opacity-60 rounded p-2">
                <p className="text-xs font-semibold">💡 Quick Tip:</p>
                <p className="text-xs">{guidance?.howToImprove || 'Keep developing your writing skills!'}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Overall Score Summary with Weighting */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
        <div className="mb-3">
          <h4 className="font-bold text-sm text-purple-900 mb-1">Overall Writing Score (Weighted)</h4>
          <p className="text-xs text-purple-700">Based on NSW rubric percentages</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white bg-opacity-50 rounded p-2">
            <p className="text-xs text-purple-700 mb-1">Weighted Score</p>
            <p className="text-2xl font-bold text-purple-900">
              {calculateWeightedScore(scores).toFixed(2)}
            </p>
            <p className="text-xs text-purple-600">out of 4.0</p>
          </div>

          <div className="bg-white bg-opacity-50 rounded p-2">
            <p className="text-xs text-purple-700 mb-1">Percentage</p>
            <p className="text-2xl font-bold text-purple-900">
              {calculateWeightedPercentage(scores).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600">of maximum</p>
          </div>
        </div>

        <div className="bg-white bg-opacity-50 rounded p-2">
          <p className="text-xs text-purple-700 mb-1 font-semibold">Total Mark (NSW Standard)</p>
          <p className="text-2xl font-bold text-purple-900">
            {calculateTotalMarks(scores).totalOutOf30.toFixed(1)} / 30
          </p>
          <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-purple-700">
            <div>Ideas: {calculateTotalMarks(scores).breakdown.ideasContent.toFixed(1)}/12</div>
            <div>Structure: {calculateTotalMarks(scores).breakdown.structure.toFixed(1)}/6</div>
            <div>Language: {calculateTotalMarks(scores).breakdown.language.toFixed(1)}/7.5</div>
            <div>Grammar: {calculateTotalMarks(scores).breakdown.grammar.toFixed(1)}/4.5</div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded p-2">
        <p className="text-xs text-gray-700">
          <strong>About NSW Weighting:</strong> Ideas & Content (40%), Structure (20%),
          Language (25%), Grammar (15%). This reflects how NSW markers assess your writing.
          Focus on Ideas & Content for the biggest impact on your total score.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function NSWCriteriaCompact({ scores }: { scores: NSWCriteriaDisplayProps['scores'] }) {
  const weightedScore = calculateWeightedScore(scores).toFixed(2);
  const totalMark = calculateTotalMarks(scores).totalOutOf30.toFixed(1);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
      <div className="flex items-center space-x-3 mb-2">
        <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-900">NSW Weighted Score</p>
          <p className="text-xs text-blue-700">Ideas 40% | Structure 20% | Language 25% | Grammar 15%</p>
        </div>
      </div>
      <div className="flex justify-between items-center bg-white bg-opacity-50 rounded p-1.5">
        <div className="text-center flex-1">
          <div className="text-lg font-bold text-blue-900">{weightedScore}</div>
          <div className="text-xs text-blue-700">/ 4.0</div>
        </div>
        <div className="text-center flex-1 border-l border-blue-200">
          <div className="text-lg font-bold text-blue-900">{totalMark}</div>
          <div className="text-xs text-blue-700">/ 30</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual criterion card with detailed guidance
 */
export function NSWCriterionCard({
  criterionKey,
  score,
  evidence
}: {
  criterionKey: string;
  score: number;
  evidence: string;
}) {
  const criterion = NSW_MARKING_CRITERIA[criterionKey];
  if (!criterion) return null;

  const levelData = criterion.levels.find(l => l.level === score);
  const guidance = generateScoringGuidance(criterionKey, score, evidence);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-base text-gray-900">{criterion.name}</h3>
          <p className="text-xs text-gray-600">NSW Code: {criterion.code} | {criterion.description}</p>
        </div>
        <div className="text-center bg-blue-100 rounded px-3 py-1">
          <div className="text-2xl font-bold text-blue-900">{score}</div>
          <div className="text-xs text-blue-700">/ 4</div>
        </div>
      </div>

      {levelData && (
        <div className="bg-gray-50 rounded p-3 mb-3">
          <p className="text-sm font-semibold text-gray-800 mb-2">Level {score}: {levelData.descriptor}</p>
          {evidence && (
            <p className="text-xs text-gray-700 mb-2">
              <strong>Evidence:</strong> {evidence}
            </p>
          )}
        </div>
      )}

      {guidance && score < 4 && (
        <div className="space-y-2">
          <div className="border-l-4 border-green-500 bg-green-50 p-2 rounded">
            <p className="text-xs font-semibold text-green-900 mb-1">🎯 Path to Level {guidance.targetLevel}</p>
            <p className="text-xs text-green-800">{guidance.howToImprove}</p>
          </div>

          {levelData && levelData.examples && levelData.examples.length > 0 && (
            <div className="border border-gray-200 rounded p-2">
              <p className="text-xs font-semibold text-gray-800 mb-1">💡 What Level {guidance.targetLevel} looks like:</p>
              <ul className="text-xs text-gray-700 space-y-1 ml-3">
                {criterion.levels.find(l => l.level === guidance.targetLevel)?.examples.slice(0, 3).map((example, idx) => (
                  <li key={idx} className="list-disc">{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
