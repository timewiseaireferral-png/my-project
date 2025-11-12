/**
 * Real-Time NSW Selective Test Scoring System
 * Provides instant score calculations as user types
 */

import { NSW_MARKING_CRITERIA, calculateWeightedScore, calculateTotalMarks } from './nswMarkingCriteria';
import { analyzeText } from './textAnalyzer';

export interface RealtimeNSWScore {
  ideasContent: number; // 1-4 scale
  structureOrganization: number; // 1-4 scale
  vocabularyLanguage: number; // 1-4 scale
  grammarMechanics: number; // 1-4 scale
  weightedScore: number; // Weighted average
  totalOutOf30: number; // NSW standard scoring
  percentage: number; // Percentage score
  breakdown: {
    ideasContent: number; // out of 12 (40% of 30)
    structure: number; // out of 6 (20% of 30)
    language: number; // out of 7.5 (25% of 30)
    grammar: number; // out of 4.5 (15% of 30)
  };
  timestamp: Date;
}

export interface ScoreChange {
  criterion: string;
  oldScore: number;
  newScore: number;
  direction: 'up' | 'down' | 'same';
}

/**
 * Analyze Ideas and Content score (40% weighting)
 * Assesses creativity, originality, depth of ideas, relevance
 */
function analyzeIdeasContent(content: string, textType: string): number {
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerContent = content.toLowerCase();

  let score = 1;

  // Word count thresholds
  if (wordCount === 0) return 1;

  // Basic scoring based on depth and development
  if (wordCount >= 50) score = 2; // Basic development
  if (wordCount >= 150) score = 3; // Well-developed
  if (wordCount >= 250) score = 4; // Extensive development

  // Check for sophistication markers
  const sophisticatedWords = [
    'however', 'furthermore', 'consequently', 'therefore', 'nevertheless',
    'although', 'despite', 'moreover', 'alternatively', 'ultimately'
  ];
  const sophisticationCount = sophisticatedWords.filter(word =>
    lowerContent.includes(word)
  ).length;

  // Check for creative/complex elements
  const creativeMarkers = [
    'imagine', 'suddenly', 'mysterious', 'unexpected', 'remarkable',
    'extraordinary', 'peculiar', 'astonishing', 'intriguing', 'fascinating'
  ];
  const creativityCount = creativeMarkers.filter(word =>
    lowerContent.includes(word)
  ).length;

  // Adjust score based on sophistication
  if (sophisticationCount >= 3 && wordCount >= 150) score = Math.max(score, 3);
  if (sophisticationCount >= 5 && creativityCount >= 2 && wordCount >= 200) score = 4;

  // Check for paragraph structure (indicates organization of ideas)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 3 && wordCount >= 150) score = Math.max(score, 3);

  // Cap score if content is too short
  if (wordCount < 100 && score > 2) score = 2;
  if (wordCount < 50 && score > 1) score = 1;

  return Math.max(1, Math.min(4, score));
}

/**
 * Analyze Structure and Organization score (20% weighting)
 * Assesses text structure, paragraph organization, cohesion, flow
 */
function analyzeStructure(content: string, textType: string): number {
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;

  if (wordCount === 0) return 1;

  let score = 1;

  // Check paragraph structure
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 20);
  const paragraphCount = paragraphs.length;

  // Basic structure scoring
  if (paragraphCount >= 1) score = 2; // Has some structure
  if (paragraphCount >= 3) score = 3; // Clear structure
  if (paragraphCount >= 4) score = 4; // Sophisticated structure

  // Check for transition words/phrases
  const transitionWords = [
    'firstly', 'secondly', 'finally', 'next', 'then', 'meanwhile',
    'however', 'furthermore', 'in addition', 'consequently', 'as a result'
  ];
  const transitionCount = transitionWords.filter(word =>
    content.toLowerCase().includes(word)
  ).length;

  if (transitionCount >= 3 && paragraphCount >= 3) score = Math.max(score, 3);
  if (transitionCount >= 5 && paragraphCount >= 4) score = 4;

  // Check for clear opening and conclusion
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const hasOpening = sentences.length > 0 && sentences[0].trim().length > 15;
  const hasConclusion = sentences.length > 3 && sentences[sentences.length - 1].trim().length > 15;

  if (hasOpening && hasConclusion && paragraphCount >= 3) {
    score = Math.max(score, 3);
  }

  // Penalty for very short content
  if (wordCount < 50 && score > 2) score = 2;
  if (wordCount < 100 && score > 3) score = 3;

  return Math.max(1, Math.min(4, score));
}

/**
 * Analyze Vocabulary and Language score (25% weighting)
 * Assesses word choice, figurative language, variety, sophistication
 */
function analyzeVocabularyLanguage(content: string, textType: string): number {
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerContent = content.toLowerCase();

  if (wordCount === 0) return 1;

  let score = 1;

  // Calculate vocabulary diversity (unique words / total words)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversity = uniqueWords.size / wordCount;

  // Check for advanced vocabulary
  const advancedWords = [
    'eloquent', 'meticulous', 'profound', 'intricate', 'compelling',
    'formidable', 'substantial', 'remarkable', 'significant', 'demonstrate',
    'illustrate', 'emphasize', 'convey', 'establish', 'contemplate'
  ];
  const advancedCount = advancedWords.filter(word =>
    lowerContent.includes(word)
  ).length;

  // Check for descriptive adjectives
  const descriptiveAdjectives = [
    'magnificent', 'dreadful', 'brilliant', 'gloomy', 'radiant',
    'pristine', 'ancient', 'luminous', 'turbulent', 'serene'
  ];
  const descriptiveCount = descriptiveAdjectives.filter(word =>
    lowerContent.includes(word)
  ).length;

  // Check for strong verbs
  const strongVerbs = [
    'surged', 'whispered', 'glimpsed', 'pondered', 'revealed',
    'transformed', 'shimmered', 'echoed', 'emerged', 'illuminated'
  ];
  const verbCount = strongVerbs.filter(word =>
    lowerContent.includes(word)
  ).length;

  // Basic scoring
  if (diversity >= 0.5 && wordCount >= 50) score = 2;
  if (diversity >= 0.6 && (advancedCount >= 2 || descriptiveCount >= 2)) score = 3;
  if (diversity >= 0.7 && advancedCount >= 3 && (descriptiveCount + verbCount) >= 3) score = 4;

  // Check for figurative language
  const figurativePatterns = [
    'like a', 'as if', 'as though', 'metaphor', 'seemed to',
    'appeared to', 'resembled', 'as though'
  ];
  const figurativeCount = figurativePatterns.filter(pattern =>
    lowerContent.includes(pattern)
  ).length;

  if (figurativeCount >= 2 && wordCount >= 100) score = Math.max(score, 3);
  if (figurativeCount >= 4 && advancedCount >= 2) score = 4;

  // Cap score for short content
  if (wordCount < 100 && score > 2) score = 2;

  return Math.max(1, Math.min(4, score));
}

/**
 * Analyze Grammar, Punctuation and Spelling score (15% weighting)
 * Assesses sentence structure, grammar accuracy, punctuation, spelling
 */
function analyzeGrammarMechanics(content: string): number {
  if (content.trim().length === 0) return 1;

  const analysis = analyzeText(content);
  let score = 4; // Start with perfect score and deduct

  // Deductions for errors (more lenient than red-line errors)
  const errorCount =
    (analysis.grammar?.errors || 0) +
    (analysis.spelling?.errors || 0) +
    (analysis.punctuation?.errors || 0);

  // Grammar error deductions
  if (errorCount > 0 && errorCount <= 3) score = 3; // Minor errors
  if (errorCount > 3 && errorCount <= 7) score = 2; // Several errors
  if (errorCount > 7) score = 1; // Many errors

  // Check sentence variety
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 3) score = Math.min(score, 2);

  // Check for very short sentences (may indicate poor structure)
  const avgSentenceLength = content.split(/\s+/).length / Math.max(1, sentences.length);
  if (avgSentenceLength < 5) score = Math.min(score, 2);

  // Check for sentence variety indicators
  const hasVariety = sentences.some(s => s.length > 100) &&
                      sentences.some(s => s.length < 50);
  if (hasVariety && errorCount <= 2) score = Math.max(score, 3);

  return Math.max(1, Math.min(4, score));
}

/**
 * Calculate real-time NSW scores
 */
export function calculateRealtimeNSWScore(
  content: string,
  textType: string = 'narrative'
): RealtimeNSWScore {
  const ideasContent = analyzeIdeasContent(content, textType);
  const structureOrganization = analyzeStructure(content, textType);
  const vocabularyLanguage = analyzeVocabularyLanguage(content, textType);
  const grammarMechanics = analyzeGrammarMechanics(content);

  const scores = {
    IDEAS_CONTENT: ideasContent,
    STRUCTURE_ORGANIZATION: structureOrganization,
    VOCABULARY_LANGUAGE: vocabularyLanguage,
    GRAMMAR_MECHANICS: grammarMechanics
  };

  const weightedScore = calculateWeightedScore(scores);
  const marks = calculateTotalMarks(scores);
  const percentage = (marks.totalOutOf30 / 30) * 100;

  return {
    ideasContent,
    structureOrganization,
    vocabularyLanguage,
    grammarMechanics,
    weightedScore,
    totalOutOf30: marks.totalOutOf30,
    percentage,
    breakdown: marks.breakdown,
    timestamp: new Date()
  };
}

/**
 * Compare two scores and identify changes
 */
export function compareScores(
  oldScore: RealtimeNSWScore,
  newScore: RealtimeNSWScore
): ScoreChange[] {
  const changes: ScoreChange[] = [];

  const criteria = [
    { key: 'ideasContent', label: 'Ideas & Content' },
    { key: 'structureOrganization', label: 'Structure' },
    { key: 'vocabularyLanguage', label: 'Vocabulary' },
    { key: 'grammarMechanics', label: 'Grammar' }
  ];

  for (const criterion of criteria) {
    const oldValue = oldScore[criterion.key as keyof RealtimeNSWScore] as number;
    const newValue = newScore[criterion.key as keyof RealtimeNSWScore] as number;

    if (oldValue !== newValue) {
      changes.push({
        criterion: criterion.label,
        oldScore: oldValue,
        newScore: newValue,
        direction: newValue > oldValue ? 'up' : newValue < oldValue ? 'down' : 'same'
      });
    }
  }

  return changes;
}

/**
 * Get feedback message for score level
 */
export function getScoreFeedback(score: number, criterion: string): string {
  const messages = {
    4: [
      `Excellent ${criterion}! You're demonstrating Level 4 mastery.`,
      `Outstanding work on ${criterion}! Keep this up!`,
      `Exceptional ${criterion} - you're at the highest level!`
    ],
    3: [
      `Great ${criterion}! You're at Level 3 - solid work.`,
      `Well done on ${criterion}! Just a bit more to reach Level 4.`,
      `Strong ${criterion} showing! You're on track for high marks.`
    ],
    2: [
      `Your ${criterion} is developing. Focus on adding more depth.`,
      `${criterion} needs more development to reach Level 3.`,
      `Keep working on your ${criterion} - you're making progress!`
    ],
    1: [
      `${criterion} needs attention. Start by writing more content.`,
      `Focus on developing your ${criterion} further.`,
      `${criterion} is just beginning - keep writing to improve!`
    ]
  };

  const levelMessages = messages[score as keyof typeof messages] || messages[1];
  return levelMessages[Math.floor(Math.random() * levelMessages.length)];
}

/**
 * Debounce utility for performance
 */
export function debounceScoring<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
