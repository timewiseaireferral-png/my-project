// Real-time sentence analysis for students
// Only analyzes after 50 words to avoid distraction

export interface SentencePattern {
  type: 'simple' | 'compound' | 'complex';
  length: number;
  startsWithCapital: boolean;
  endsWithPunctuation: boolean;
  example: string;
}

export interface SentenceAnalysis {
  totalSentences: number;
  averageLength: number;
  patterns: {
    simple: number;
    compound: number;
    complex: number;
  };
  variety: {
    score: number; // 0-5
    feedback: string;
  };
  issues: Array<{
    type: 'too_long' | 'too_short' | 'run_on' | 'fragment' | 'repetitive_starts';
    sentence: string;
    suggestion: string;
  }>;
  strengths: string[];
  suggestions: string[];
}

// Common sentence starters to track repetition
const SENTENCE_STARTERS = ['the', 'i', 'it', 'he', 'she', 'they', 'we', 'there', 'this', 'that'];

export function analyzeSentencesRealtime(text: string): SentenceAnalysis {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  // If less than 50 words, return minimal analysis
  if (wordCount < 50) {
    return {
      totalSentences: 0,
      averageLength: 0,
      patterns: { simple: 0, compound: 0, complex: 0 },
      variety: {
        score: 0,
        feedback: 'Keep writing! Sentence analysis will appear after 50 words.'
      },
      issues: [],
      strengths: [],
      suggestions: []
    };
  }

  // Split into sentences (approximate)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const totalSentences = sentences.length;

  if (totalSentences === 0) {
    return {
      totalSentences: 0,
      averageLength: 0,
      patterns: { simple: 0, compound: 0, complex: 0 },
      variety: {
        score: 0,
        feedback: 'No complete sentences detected yet.'
      },
      issues: [],
      strengths: [],
      suggestions: []
    };
  }

  // Analyze each sentence
  const sentenceLengths: number[] = [];
  const patterns = { simple: 0, compound: 0, complex: 0 };
  const issues: Array<{
    type: 'too_long' | 'too_short' | 'run_on' | 'fragment' | 'repetitive_starts';
    sentence: string;
    suggestion: string;
  }> = [];
  const starterCounts: Record<string, number> = {};

  sentences.forEach(sentence => {
    const words = sentence.split(/\s+/);
    const length = words.length;
    sentenceLengths.push(length);

    // Check sentence length issues
    if (length < 4) {
      issues.push({
        type: 'too_short',
        sentence: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
        suggestion: 'This sentence is very short. Try adding more detail or combining with another sentence.'
      });
    } else if (length > 30) {
      issues.push({
        type: 'too_long',
        sentence: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
        suggestion: 'This sentence is quite long. Consider breaking it into two sentences for clarity.'
      });
    }

    // Detect run-on sentences (multiple "and" or commas without proper conjunctions)
    const andCount = (sentence.match(/\band\b/gi) || []).length;
    const commaCount = (sentence.match(/,/g) || []).length;
    if (andCount >= 3 || (commaCount >= 4 && !sentence.includes('because') && !sentence.includes('although'))) {
      issues.push({
        type: 'run_on',
        sentence: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
        suggestion: 'This might be a run-on sentence. Try using periods or semicolons to separate ideas.'
      });
    }

    // Classify sentence pattern
    const hasConjunction = /\b(and|but|or|so|yet)\b/i.test(sentence);
    const hasSubordinator = /\b(because|although|while|when|if|since|unless|after|before)\b/i.test(sentence);
    const hasComma = sentence.includes(',');

    if (hasSubordinator || (hasComma && sentence.split(',').length > 2)) {
      patterns.complex++;
    } else if (hasConjunction || (hasComma && hasConjunction)) {
      patterns.compound++;
    } else {
      patterns.simple++;
    }

    // Track sentence starters
    const firstWord = words[0]?.toLowerCase() || '';
    if (SENTENCE_STARTERS.includes(firstWord)) {
      starterCounts[firstWord] = (starterCounts[firstWord] || 0) + 1;
    }
  });

  // Check for repetitive sentence starters
  Object.entries(starterCounts).forEach(([starter, count]) => {
    if (count >= 3 && totalSentences >= 5) {
      issues.push({
        type: 'repetitive_starts',
        sentence: `"${starter.charAt(0).toUpperCase() + starter.slice(1)}" appears at the start of ${count} sentences`,
        suggestion: `Try varying your sentence beginnings. Use different words or phrases to start sentences.`
      });
    }
  });

  // Calculate average length
  const averageLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / totalSentences;

  // Calculate variety score
  let varietyScore = 0;
  const patternPercentages = {
    simple: (patterns.simple / totalSentences) * 100,
    compound: (patterns.compound / totalSentences) * 100,
    complex: (patterns.complex / totalSentences) * 100
  };

  // Good variety means no single pattern dominates
  const maxPattern = Math.max(patternPercentages.simple, patternPercentages.compound, patternPercentages.complex);

  if (maxPattern < 70) varietyScore += 2; // Good balance
  else if (maxPattern < 85) varietyScore += 1; // Okay balance

  // Check if they use all three types
  if (patterns.simple > 0 && patterns.compound > 0 && patterns.complex > 0) {
    varietyScore += 2;
  } else if ((patterns.simple > 0 && patterns.compound > 0) || (patterns.simple > 0 && patterns.complex > 0)) {
    varietyScore += 1;
  }

  // Check length variety (not all the same length)
  const lengthVariance = Math.max(...sentenceLengths) - Math.min(...sentenceLengths);
  if (lengthVariance > 10) varietyScore += 1;

  varietyScore = Math.min(5, varietyScore);

  // Generate variety feedback
  let varietyFeedback = '';
  if (varietyScore >= 4) {
    varietyFeedback = '🌟 Excellent sentence variety! You\'re using different structures effectively.';
  } else if (varietyScore >= 3) {
    varietyFeedback = '👍 Good variety. Try adding more complex sentences for sophistication.';
  } else if (varietyScore >= 2) {
    varietyFeedback = '📝 Mix up your sentence structures more. Use simple, compound, and complex sentences.';
  } else {
    varietyFeedback = '💡 Your sentences are too similar. Try varying length and structure.';
  }

  // Generate strengths
  const strengths: string[] = [];
  if (patterns.complex >= totalSentences * 0.2) {
    strengths.push('✓ Good use of complex sentences');
  }
  if (averageLength >= 12 && averageLength <= 20) {
    strengths.push('✓ Sentences are well-balanced in length');
  }
  if (patterns.compound >= totalSentences * 0.2) {
    strengths.push('✓ Effective use of compound sentences');
  }
  if (lengthVariance > 10) {
    strengths.push('✓ Good variety in sentence length');
  }

  // Generate suggestions
  const suggestions: string[] = [];
  if (patterns.simple > totalSentences * 0.7) {
    suggestions.push('Try combining some simple sentences with "and," "but," or "because"');
  }
  if (patterns.complex < totalSentences * 0.1 && totalSentences >= 5) {
    suggestions.push('Add complex sentences using words like "because," "although," or "when"');
  }
  if (averageLength < 8) {
    suggestions.push('Your sentences are quite short. Try adding more descriptive details');
  }
  if (averageLength > 22) {
    suggestions.push('Some sentences are very long. Break them up for better readability');
  }
  if (Object.keys(starterCounts).length <= 2 && totalSentences >= 5) {
    suggestions.push('Vary how you begin sentences. Try starting with descriptive words or phrases');
  }

  return {
    totalSentences,
    averageLength: Math.round(averageLength * 10) / 10,
    patterns,
    variety: {
      score: varietyScore,
      feedback: varietyFeedback
    },
    issues: issues.slice(0, 5), // Limit to top 5 issues
    strengths,
    suggestions: suggestions.slice(0, 4) // Limit to top 4 suggestions
  };
}
