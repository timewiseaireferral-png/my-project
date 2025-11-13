// Real-time pacing and engagement analysis
// Only analyzes after 50 words to avoid distraction

export interface PacingAnalysis {
  overallPace: 'too_slow' | 'good' | 'too_fast';
  paceScore: number; // 0-5
  feedback: string;
  details: {
    sentenceRhythm: {
      score: number;
      feedback: string;
    };
    paragraphBalance: {
      score: number;
      feedback: string;
    };
    engagement: {
      score: number;
      feedback: string;
    };
  };
  strengths: string[];
  suggestions: string[];
}

export function analyzePacingRealtime(text: string, textType: string = 'narrative'): PacingAnalysis {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  // If less than 50 words, return minimal analysis
  if (wordCount < 50) {
    return {
      overallPace: 'good',
      paceScore: 0,
      feedback: 'Keep writing! Pacing feedback will appear after 50 words.',
      details: {
        sentenceRhythm: { score: 0, feedback: 'Not enough text yet' },
        paragraphBalance: { score: 0, feedback: 'Not enough text yet' },
        engagement: { score: 0, feedback: 'Not enough text yet' }
      },
      strengths: [],
      suggestions: []
    };
  }

  // Analyze sentence rhythm
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;

  // Calculate variance in sentence length (good rhythm = varied lengths)
  const variance = sentenceLengths.reduce((sum, len) => {
    return sum + Math.pow(len - avgSentenceLength, 2);
  }, 0) / sentenceLengths.length;

  const standardDeviation = Math.sqrt(variance);

  // Sentence rhythm score (0-5)
  let rhythmScore = 0;
  if (standardDeviation > 5) {
    rhythmScore = 5; // Excellent variety
  } else if (standardDeviation > 3) {
    rhythmScore = 4; // Good variety
  } else if (standardDeviation > 2) {
    rhythmScore = 3; // Moderate variety
  } else if (standardDeviation > 1) {
    rhythmScore = 2; // Some variety
  } else {
    rhythmScore = 1; // Little variety
  }

  const rhythmFeedback = rhythmScore >= 4
    ? '✓ Excellent sentence rhythm with good variation'
    : rhythmScore >= 3
    ? 'Good rhythm. Try mixing short and long sentences more'
    : 'Sentences are too similar in length. Vary your rhythm';

  // Analyze paragraph balance
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const paragraphWordCounts = paragraphs.map(p => p.split(/\s+/).length);
  const avgParagraphLength = paragraphWordCounts.reduce((sum, len) => sum + len, 0) / paragraphs.length;

  // Paragraph balance score (0-5)
  let balanceScore = 0;
  if (avgParagraphLength >= 40 && avgParagraphLength <= 80) {
    balanceScore = 5; // Perfect balance
  } else if (avgParagraphLength >= 30 && avgParagraphLength <= 100) {
    balanceScore = 4; // Good balance
  } else if (avgParagraphLength >= 20 && avgParagraphLength <= 120) {
    balanceScore = 3; // Okay balance
  } else if (avgParagraphLength >= 10) {
    balanceScore = 2; // Poor balance
  } else {
    balanceScore = 1; // Very poor balance
  }

  const balanceFeedback = balanceScore >= 4
    ? '✓ Well-balanced paragraphs'
    : balanceScore >= 3
    ? 'Paragraphs are okay but could be more balanced'
    : avgParagraphLength < 30
    ? 'Paragraphs are too short. Develop ideas more fully'
    : 'Paragraphs are too long. Break them into smaller chunks';

  // Analyze engagement factors
  let engagementScore = 0;

  // 1. Check for dialogue (engages readers)
  const hasDialogue = /["']/.test(text);
  if (hasDialogue) engagementScore += 1;

  // 2. Check for action words (dynamic vs static)
  const actionWords = ['ran', 'jumped', 'shouted', 'grabbed', 'sprinted', 'whispered', 'discovered', 'realized', 'rushed', 'burst'];
  const actionCount = actionWords.filter(word => new RegExp(`\\b${word}\\b`, 'i').test(text)).length;
  if (actionCount >= 2) engagementScore += 1;

  // 3. Check for descriptive language
  const adjectives = text.match(/\b(beautiful|dark|bright|mysterious|ancient|enormous|tiny|strange|wonderful|terrible|magnificent|dreadful)\b/gi) || [];
  if (adjectives.length >= 3) engagementScore += 1;

  // 4. Check for varied punctuation (!, ?)
  const hasExclamation = /!/.test(text);
  const hasQuestion = /\?/.test(text);
  if (hasExclamation || hasQuestion) engagementScore += 1;

  // 5. Check for sensory details (sight, sound, touch, smell, taste)
  const sensoryWords = ['saw', 'heard', 'felt', 'smelled', 'tasted', 'looked', 'sounded', 'seemed', 'appeared', 'glistened', 'echoed', 'whispered'];
  const sensoryCount = sensoryWords.filter(word => new RegExp(`\\b${word}\\b`, 'i').test(text)).length;
  if (sensoryCount >= 2) engagementScore += 1;

  engagementScore = Math.min(5, engagementScore);

  const engagementFeedback = engagementScore >= 4
    ? '✓ Highly engaging with varied techniques'
    : engagementScore >= 3
    ? 'Good engagement. Add more dialogue or sensory details'
    : 'Try adding dialogue, action, or descriptive details to engage readers';

  // Calculate overall pace score (0-5)
  const paceScore = Math.round((rhythmScore + balanceScore + engagementScore) / 3);

  // Determine overall pace
  let overallPace: 'too_slow' | 'good' | 'too_fast' = 'good';
  if (avgSentenceLength < 8 && engagementScore >= 4) {
    overallPace = 'too_fast'; // Short sentences + high action = very fast pace
  } else if (avgSentenceLength > 20 && engagementScore <= 2) {
    overallPace = 'too_slow'; // Long sentences + little action = slow pace
  }

  // Generate overall feedback
  let feedback = '';
  if (overallPace === 'good') {
    feedback = paceScore >= 4
      ? '🎯 Excellent pacing! Your writing flows naturally and keeps readers engaged.'
      : '👍 Good pace. Your writing flows well with room for minor improvements.';
  } else if (overallPace === 'too_fast') {
    feedback = '⚡ Your pacing is very fast. Consider slowing down with longer sentences and more description.';
  } else {
    feedback = '🐌 Your pacing feels slow. Try shorter sentences, more action, or dialogue to speed things up.';
  }

  // Generate strengths
  const strengths: string[] = [];
  if (rhythmScore >= 4) strengths.push('✓ Varied sentence rhythm');
  if (balanceScore >= 4) strengths.push('✓ Well-balanced paragraphs');
  if (engagementScore >= 4) strengths.push('✓ Highly engaging writing');
  if (hasDialogue) strengths.push('✓ Effective use of dialogue');
  if (sensoryCount >= 2) strengths.push('✓ Good sensory details');

  // Generate suggestions
  const suggestions: string[] = [];
  if (rhythmScore < 3) {
    suggestions.push('Mix short, punchy sentences with longer, flowing ones');
  }
  if (balanceScore < 3) {
    if (avgParagraphLength < 30) {
      suggestions.push('Develop your paragraphs more fully with additional details');
    } else {
      suggestions.push('Break long paragraphs into smaller, focused chunks');
    }
  }
  if (engagementScore < 3) {
    suggestions.push('Add dialogue to make your writing more dynamic');
    suggestions.push('Include more sensory details (what characters see, hear, feel)');
  }
  if (!hasDialogue && textType === 'narrative') {
    suggestions.push('Consider adding dialogue to vary your pacing');
  }
  if (overallPace === 'too_slow') {
    suggestions.push('Speed up the pace with shorter sentences and more action');
  } else if (overallPace === 'too_fast') {
    suggestions.push('Slow down with descriptive passages and reflection');
  }

  return {
    overallPace,
    paceScore,
    feedback,
    details: {
      sentenceRhythm: {
        score: rhythmScore,
        feedback: rhythmFeedback
      },
      paragraphBalance: {
        score: balanceScore,
        feedback: balanceFeedback
      },
      engagement: {
        score: engagementScore,
        feedback: engagementFeedback
      }
    },
    strengths: strengths.slice(0, 4),
    suggestions: suggestions.slice(0, 4)
  };
}
