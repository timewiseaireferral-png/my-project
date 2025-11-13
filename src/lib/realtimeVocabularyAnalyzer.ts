// Real-time vocabulary analysis for students
// Only analyzes after 50 words to avoid distraction

export interface VocabularySuggestion {
  word: string;
  definition: string;
  example: string;
  contextRelevance: string;
  sophisticationLevel: 'basic' | 'intermediate' | 'advanced';
  category: 'descriptive' | 'emotion' | 'action' | 'transition' | 'dialogue';
}

export interface VocabularyAnalysis {
  wordCount: number;
  uniqueWords: number;
  sophisticatedWords: string[];
  overusedWords: Array<{ word: string; count: number }>;
  suggestions: VocabularySuggestion[];
  vocabularyScore: number; // 0-5
  feedback: string;
}

// Advanced vocabulary by category
const SOPHISTICATED_VOCAB: Record<string, string[]> = {
  descriptive: ['magnificent', 'peculiar', 'immense', 'delicate', 'ancient', 'vibrant', 'luminous', 'majestic', 'serene', 'ominous'],
  emotion: ['anxious', 'elated', 'devastated', 'bewildered', 'thrilled', 'distraught', 'content', 'furious', 'melancholy', 'exhilarated'],
  action: ['sprinted', 'whispered', 'observed', 'contemplated', 'investigated', 'emerged', 'vanished', 'ascended', 'descended', 'persevered'],
  transition: ['meanwhile', 'subsequently', 'nevertheless', 'consequently', 'furthermore', 'alternatively', 'ultimately', 'initially', 'eventually', 'suddenly'],
  dialogue: ['exclaimed', 'murmured', 'insisted', 'responded', 'declared', 'announced', 'admitted', 'protested', 'suggested', 'questioned']
};

// Overused/weak words to upgrade
const UPGRADE_OPPORTUNITIES: Record<string, VocabularySuggestion[]> = {
  'said': [
    {
      word: 'whispered',
      definition: 'To speak very softly or quietly',
      example: '"I have a secret," she whispered to her friend.',
      contextRelevance: 'Use when someone speaks quietly or secretly',
      sophisticationLevel: 'intermediate',
      category: 'dialogue'
    },
    {
      word: 'exclaimed',
      definition: 'To cry out suddenly or with strong emotion',
      example: '"What an amazing discovery!" he exclaimed.',
      contextRelevance: 'Use when someone speaks with excitement or surprise',
      sophisticationLevel: 'intermediate',
      category: 'dialogue'
    },
    {
      word: 'murmured',
      definition: 'To speak in a low, soft voice',
      example: '"I\'m not sure," she murmured thoughtfully.',
      contextRelevance: 'Use when someone speaks softly or uncertainly',
      sophisticationLevel: 'advanced',
      category: 'dialogue'
    }
  ],
  'went': [
    {
      word: 'sprinted',
      definition: 'To run at full speed for a short distance',
      example: 'The athlete sprinted towards the finish line.',
      contextRelevance: 'Use when describing fast, urgent movement',
      sophisticationLevel: 'intermediate',
      category: 'action'
    },
    {
      word: 'wandered',
      definition: 'To walk slowly without a clear direction',
      example: 'She wandered through the mysterious forest.',
      contextRelevance: 'Use when describing aimless or casual movement',
      sophisticationLevel: 'intermediate',
      category: 'action'
    },
    {
      word: 'ventured',
      definition: 'To go somewhere despite risks or uncertainty',
      example: 'They ventured into the dark cave.',
      contextRelevance: 'Use when describing brave or risky movement',
      sophisticationLevel: 'advanced',
      category: 'action'
    }
  ],
  'big': [
    {
      word: 'immense',
      definition: 'Extremely large or great',
      example: 'The immense building towered over the street.',
      contextRelevance: 'Use to describe something enormous',
      sophisticationLevel: 'intermediate',
      category: 'descriptive'
    },
    {
      word: 'colossal',
      definition: 'Extraordinarily large',
      example: 'A colossal wave crashed against the shore.',
      contextRelevance: 'Use to emphasize extreme size',
      sophisticationLevel: 'advanced',
      category: 'descriptive'
    }
  ],
  'small': [
    {
      word: 'tiny',
      definition: 'Very small',
      example: 'A tiny mouse scurried across the floor.',
      contextRelevance: 'Use to describe something very small',
      sophisticationLevel: 'basic',
      category: 'descriptive'
    },
    {
      word: 'minuscule',
      definition: 'Extremely small',
      example: 'The minuscule details were barely visible.',
      contextRelevance: 'Use to emphasize extreme smallness',
      sophisticationLevel: 'advanced',
      category: 'descriptive'
    }
  ],
  'good': [
    {
      word: 'excellent',
      definition: 'Extremely good; outstanding',
      example: 'She received excellent marks on her test.',
      contextRelevance: 'Use to describe something of high quality',
      sophisticationLevel: 'intermediate',
      category: 'descriptive'
    },
    {
      word: 'magnificent',
      definition: 'Extremely beautiful or impressive',
      example: 'The magnificent sunset painted the sky orange.',
      contextRelevance: 'Use to describe something impressive',
      sophisticationLevel: 'advanced',
      category: 'descriptive'
    }
  ],
  'bad': [
    {
      word: 'terrible',
      definition: 'Extremely bad or serious',
      example: 'The storm caused terrible damage.',
      contextRelevance: 'Use to describe something very bad',
      sophisticationLevel: 'intermediate',
      category: 'descriptive'
    },
    {
      word: 'dreadful',
      definition: 'Very bad or unpleasant',
      example: 'The dreadful weather kept everyone inside.',
      contextRelevance: 'Use to emphasize how bad something is',
      sophisticationLevel: 'advanced',
      category: 'descriptive'
    }
  ],
  'happy': [
    {
      word: 'delighted',
      definition: 'Very pleased',
      example: 'She was delighted with her birthday present.',
      contextRelevance: 'Use to describe great happiness',
      sophisticationLevel: 'intermediate',
      category: 'emotion'
    },
    {
      word: 'elated',
      definition: 'Extremely happy and excited',
      example: 'He was elated when he won the competition.',
      contextRelevance: 'Use to describe extreme joy',
      sophisticationLevel: 'advanced',
      category: 'emotion'
    }
  ],
  'sad': [
    {
      word: 'miserable',
      definition: 'Very unhappy',
      example: 'She felt miserable after losing her pet.',
      contextRelevance: 'Use to describe deep sadness',
      sophisticationLevel: 'intermediate',
      category: 'emotion'
    },
    {
      word: 'melancholy',
      definition: 'A feeling of thoughtful sadness',
      example: 'A melancholy mood settled over the room.',
      contextRelevance: 'Use to describe reflective sadness',
      sophisticationLevel: 'advanced',
      category: 'emotion'
    }
  ]
};

export function analyzeVocabularyRealtime(text: string, textType: string = 'narrative'): VocabularyAnalysis {
  // Count words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const wordCount = words.length;

  // If less than 50 words, return minimal analysis
  if (wordCount < 50) {
    return {
      wordCount,
      uniqueWords: 0,
      sophisticatedWords: [],
      overusedWords: [],
      suggestions: [],
      vocabularyScore: 0,
      feedback: 'Keep writing! Vocabulary suggestions will appear after 50 words.'
    };
  }

  // Count unique words
  const uniqueWordsSet = new Set(words.filter(w => w.length > 3));
  const uniqueWords = uniqueWordsSet.size;

  // Find sophisticated words used
  const sophisticatedWords: string[] = [];
  const allSophisticated = Object.values(SOPHISTICATED_VOCAB).flat();
  words.forEach(word => {
    if (allSophisticated.includes(word) && !sophisticatedWords.includes(word)) {
      sophisticatedWords.push(word);
    }
  });

  // Find overused words
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3 && !['that', 'this', 'then', 'what', 'when', 'where', 'they', 'their', 'there', 'with'].includes(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });

  const overusedWords = Object.entries(wordFrequency)
    .filter(([_, count]) => count >= 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate suggestions based on words found in text
  const suggestions: VocabularySuggestion[] = [];
  const weakWords = ['said', 'went', 'big', 'small', 'good', 'bad', 'happy', 'sad', 'nice', 'very'];

  weakWords.forEach(weakWord => {
    const regex = new RegExp(`\\b${weakWord}\\b`, 'i');
    if (regex.test(text) && UPGRADE_OPPORTUNITIES[weakWord]) {
      // Add suggestions for this weak word
      const upgrades = UPGRADE_OPPORTUNITIES[weakWord];
      // Add 1-2 suggestions per weak word found
      suggestions.push(...upgrades.slice(0, 2));
    }
  });

  // Add general sophisticated words for their text type
  if (textType === 'narrative' && suggestions.length < 5) {
    const narrativeWords: VocabularySuggestion[] = [
      {
        word: 'mysterious',
        definition: 'Difficult to understand or explain; strange',
        example: 'A mysterious figure appeared in the shadows.',
        contextRelevance: 'Perfect for creating suspense in narratives',
        sophisticationLevel: 'intermediate',
        category: 'descriptive'
      },
      {
        word: 'hesitated',
        definition: 'Paused before saying or doing something',
        example: 'She hesitated before opening the door.',
        contextRelevance: 'Shows character uncertainty or fear',
        sophisticationLevel: 'intermediate',
        category: 'action'
      }
    ];
    suggestions.push(...narrativeWords.filter(w => !suggestions.find(s => s.word === w.word)));
  }

  // Limit to 6 suggestions to avoid overwhelming
  const finalSuggestions = suggestions.slice(0, 6);

  // Calculate vocabulary score (0-5)
  const lexicalDiversityRatio = uniqueWords / wordCount;
  const sophisticatedRatio = sophisticatedWords.length / (wordCount / 50);

  let score = 0;
  if (lexicalDiversityRatio > 0.7) score += 2;
  else if (lexicalDiversityRatio > 0.5) score += 1;

  if (sophisticatedRatio > 0.8) score += 2;
  else if (sophisticatedRatio > 0.4) score += 1;

  if (overusedWords.length === 0) score += 1;

  const vocabularyScore = Math.min(5, score);

  // Generate feedback
  let feedback = '';
  if (vocabularyScore >= 4) {
    feedback = '🌟 Excellent vocabulary! You\'re using varied and sophisticated words.';
  } else if (vocabularyScore >= 3) {
    feedback = '👍 Good vocabulary variety. Try adding more descriptive words.';
  } else if (vocabularyScore >= 2) {
    feedback = '📚 Your vocabulary is developing. Use the suggestions below to enhance your writing.';
  } else {
    feedback = '💡 Let\'s expand your vocabulary! Try replacing simple words with more specific ones.';
  }

  return {
    wordCount,
    uniqueWords,
    sophisticatedWords,
    overusedWords,
    suggestions: finalSuggestions,
    vocabularyScore,
    feedback
  };
}
