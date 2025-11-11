/**
 * Score Migration Utility
 * Provides backward compatibility for old feedback format
 * Fixes the "8/5" bug by adding missing scoringSummary structure
 */

interface OldCriteriaScores {
  ideas?: { score: number };
  structure?: { score: number };
  language?: { score: number };
  grammar?: { score: number };
  mechanics?: { score: number };
}

interface OldNSWCriteria {
  overallScore?: number;
  ideas?: { score: number };
  structure?: { score: number };
  language?: { score: number };
  grammar?: { score: number };
  mechanics?: { score: number };
}

interface ScoringSummary {
  rawTotal: {
    score: number;
    outOf: number;
    displayFormat: string;
    explanation: string;
  };
  weightedTotal: {
    score: number;
    outOf: number;
    displayFormat: string;
    explanation: string;
  };
  normalizedTotal: {
    score: number;
    outOf: number;
    displayFormat: string;
    explanation: string;
  };
  percentageScore: {
    score: number;
    outOf: number;
    displayFormat: string;
    explanation: string;
  };
}

/**
 * Migrate old feedback format to new format with comprehensive scoring
 */
export function migrateFeedbackScore(feedback: any): any {
  if (!feedback) return feedback;

  // Check if already has new format
  if (feedback.scoringSummary || feedback.nswCriteria?.scoringSummary) {
    return feedback;
  }

  // Migrate nswCriteria if present
  if (feedback.nswCriteria) {
    const criteria = feedback.nswCriteria as OldNSWCriteria;

    // Calculate raw total from individual scores (assuming 1-4 scale)
    const rawIdeas = criteria.ideas?.score || 0;
    const rawStructure = criteria.structure?.score || 0;
    const rawLanguage = criteria.language?.score || 0;
    const rawGrammar = (criteria.grammar?.score || criteria.mechanics?.score || 0);
    const rawTotal = rawIdeas + rawStructure + rawLanguage + rawGrammar;

    // Calculate weighted scores using NSW percentages
    const weightedIdeas = (rawIdeas / 4) * 12; // 40% of 30
    const weightedStructure = (rawStructure / 4) * 6; // 20% of 30
    const weightedLanguage = (rawLanguage / 4) * 7.5; // 25% of 30
    const weightedGrammar = (rawGrammar / 4) * 4.5; // 15% of 30
    const weightedTotal = weightedIdeas + weightedStructure + weightedLanguage + weightedGrammar;

    // Calculate percentage
    const percentage = (weightedTotal / 30) * 100;

    // Add scoringSummary
    feedback.nswCriteria.scoringSummary = {
      rawTotal: {
        score: Math.round(rawTotal * 10) / 10,
        outOf: 16,
        displayFormat: `${Math.round(rawTotal * 10) / 10}/16`,
        explanation: "Sum of all raw criterion scores (1-4 scale)"
      },
      weightedTotal: {
        score: Math.round(weightedTotal * 10) / 10,
        outOf: 30,
        displayFormat: `${Math.round(weightedTotal * 10) / 10}/30`,
        explanation: "NSW official weighted total using rubric percentages"
      },
      normalizedTotal: {
        score: Math.round((rawTotal / 16) * 5 * 10) / 10,
        outOf: 5,
        displayFormat: `${Math.round((rawTotal / 16) * 5 * 10) / 10}/5`,
        explanation: "Converted to 5-point scale for user-friendly display"
      },
      percentageScore: {
        score: Math.round(percentage * 10) / 10,
        outOf: 100,
        displayFormat: `${Math.round(percentage * 10) / 10}%`,
        explanation: "Overall performance as percentage"
      }
    };

    // Fix overallScore if it exists (change from sum to weighted total)
    if (criteria.overallScore) {
      feedback.nswCriteria.overallScore = Math.round(weightedTotal * 10) / 10;
    }

    console.log('✅ Migrated old feedback format to new scoring structure');
  }

  return feedback;
}

/**
 * Validate score structure and ensure no impossible scores
 */
export function validateScores(feedback: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!feedback) {
    errors.push('Feedback object is null or undefined');
    return { valid: false, errors };
  }

  // Validate scoringSummary if present
  if (feedback.scoringSummary || feedback.nswCriteria?.scoringSummary) {
    const summary = (feedback.scoringSummary || feedback.nswCriteria.scoringSummary) as ScoringSummary;

    // Check raw total
    if (summary.rawTotal) {
      if (summary.rawTotal.score < 0 || summary.rawTotal.score > summary.rawTotal.outOf) {
        errors.push(`Invalid rawTotal: ${summary.rawTotal.score}/${summary.rawTotal.outOf}`);
      }
      if (summary.rawTotal.outOf !== 16) {
        errors.push(`Invalid rawTotal maximum: expected 16, got ${summary.rawTotal.outOf}`);
      }
    }

    // Check weighted total
    if (summary.weightedTotal) {
      if (summary.weightedTotal.score < 0 || summary.weightedTotal.score > summary.weightedTotal.outOf) {
        errors.push(`Invalid weightedTotal: ${summary.weightedTotal.score}/${summary.weightedTotal.outOf}`);
      }
      if (summary.weightedTotal.outOf !== 30) {
        errors.push(`Invalid weightedTotal maximum: expected 30, got ${summary.weightedTotal.outOf}`);
      }
    }

    // Check normalized total
    if (summary.normalizedTotal) {
      if (summary.normalizedTotal.score < 0 || summary.normalizedTotal.score > summary.normalizedTotal.outOf) {
        errors.push(`Invalid normalizedTotal: ${summary.normalizedTotal.score}/${summary.normalizedTotal.outOf}`);
      }
      if (summary.normalizedTotal.outOf !== 5) {
        errors.push(`Invalid normalizedTotal maximum: expected 5, got ${summary.normalizedTotal.outOf}`);
      }
    }

    // Check percentage
    if (summary.percentageScore) {
      if (summary.percentageScore.score < 0 || summary.percentageScore.score > 100) {
        errors.push(`Invalid percentage: ${summary.percentageScore.score}%`);
      }
    }
  }

  // Validate individual criteria scores
  if (feedback.nswCriteria || feedback.criteriaScores) {
    const criteria = feedback.nswCriteria || feedback.criteriaScores;

    const checkCriterion = (name: string, criterion: any) => {
      if (!criterion) return;

      // Check raw score (1-4 scale)
      if (criterion.rawScore !== undefined) {
        if (criterion.rawScore < 1 || criterion.rawScore > 4) {
          errors.push(`Invalid ${name} rawScore: ${criterion.rawScore} (must be 1-4)`);
        }
      }

      // Check score field (could be raw or weighted)
      if (criterion.score !== undefined) {
        if (criterion.score < 0) {
          errors.push(`Invalid ${name} score: ${criterion.score} (cannot be negative)`);
        }
      }

      // Check percentage
      if (criterion.percentage !== undefined) {
        if (criterion.percentage < 0 || criterion.percentage > 100) {
          errors.push(`Invalid ${name} percentage: ${criterion.percentage}%`);
        }
      }
    };

    checkCriterion('ideas', criteria.ideas || criteria.ideasContent);
    checkCriterion('structure', criteria.structure || criteria.structureOrganization);
    checkCriterion('language', criteria.language || criteria.languageVocab);
    checkCriterion('grammar', criteria.grammar || criteria.mechanics || criteria.spellingGrammar);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format score for display based on available data
 */
export function formatScoreDisplay(
  feedback: any,
  format: 'weighted' | 'percentage' | 'normalized' | 'raw' = 'weighted'
): string {
  if (!feedback) return 'N/A';

  const summary = feedback.scoringSummary || feedback.nswCriteria?.scoringSummary;

  if (!summary) {
    // Fallback for old format
    if (feedback.nswCriteria?.overallScore !== undefined) {
      return `${feedback.nswCriteria.overallScore}/16`;
    }
    return 'N/A';
  }

  switch (format) {
    case 'weighted':
      return summary.weightedTotal?.displayFormat || 'N/A';
    case 'percentage':
      return summary.percentageScore?.displayFormat || 'N/A';
    case 'normalized':
      return summary.normalizedTotal?.displayFormat || 'N/A';
    case 'raw':
      return summary.rawTotal?.displayFormat || 'N/A';
    default:
      return summary.weightedTotal?.displayFormat || 'N/A';
  }
}

/**
 * Get color class based on percentage score
 */
export function getScoreColorClass(feedback: any): string {
  const summary = feedback?.scoringSummary || feedback?.nswCriteria?.scoringSummary;

  if (!summary?.percentageScore) {
    return 'text-gray-600';
  }

  const percentage = summary.percentageScore.score;

  if (percentage >= 75) return 'text-green-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}
