/**
 * AI Coach Configuration
 *
 * Centralized configuration for AI Coach UI elements, labels, and static content.
 * All dynamic content (examples, suggestions, vocabulary) is generated via dynamicAICoachService.
 */

export const AI_COACH_CONFIG = {
  // Tab labels and icons
  tabs: {
    chat: {
      label: 'Chat',
      icon: 'MessageSquare',
      description: 'Ask questions and get personalized help'
    },
    examples: {
      label: 'Examples',
      icon: 'BookOpen',
      description: 'View examples relevant to your writing'
    },
    steps: {
      label: 'Steps',
      icon: 'List',
      description: 'Follow guided writing steps'
    },
    detail: {
      label: 'Detail',
      icon: 'Target',
      description: 'See detailed feedback on your writing'
    },
    grammar: {
      label: 'Grammar',
      icon: 'FileCheck',
      description: 'Check grammar and spelling'
    },
    vocabulary: {
      label: 'Vocabulary',
      icon: 'Sparkles',
      description: 'Discover powerful words for your writing'
    },
    sentences: {
      label: 'Sentences',
      icon: 'AlignLeft',
      description: 'Improve sentence structure and variety'
    }
  },

  // UI Messages
  messages: {
    loading: {
      examples: 'Generating examples based on your writing...',
      vocabulary: 'Finding the perfect words for your story...',
      suggestions: 'Analyzing your content...',
      steps: 'Creating your personalized writing guide...',
      chat: 'Thinking...'
    },
    empty: {
      examples: 'Start writing to see examples tailored to your prompt and content!',
      vocabulary: 'Write at least 50 words to get vocabulary suggestions!',
      suggestions: 'Begin writing and I\'ll provide personalized guidance!',
      steps: 'Start your writing journey - I\'ll guide you step by step!',
      chat: 'Ask me anything about your writing!'
    },
    error: {
      examples: 'Unable to generate examples right now. Keep writing and try again!',
      vocabulary: 'Unable to fetch vocabulary. Please try again in a moment!',
      suggestions: 'Unable to generate suggestions. Keep writing!',
      steps: 'Unable to load guidance. Continue with your writing!',
      chat: 'I\'m having trouble right now. Please try asking again!'
    },
    noPrompt: 'You need a writing prompt to get started. Please select or create one!',
    noContent: 'Start writing to receive personalized AI coaching!',
    aiDisconnected: 'AI Assistant is not connected. Some features may be limited.'
  },

  // Writing phases based on word count
  writingPhases: {
    'not-started': {
      name: 'Getting Started',
      emoji: '🚀',
      minWords: 0,
      maxWords: 0,
      focus: 'Begin writing your opening',
      defaultGuidance: 'Hook your reader and set the scene'
    },
    'opening': {
      name: 'Opening',
      emoji: '📖',
      minWords: 1,
      maxWords: 49,
      focus: 'Hook the reader and introduce your topic',
      defaultGuidance: 'Make your opening engaging and clear'
    },
    'early-development': {
      name: 'Early Development',
      emoji: '🌱',
      minWords: 50,
      maxWords: 99,
      focus: 'Build your main ideas',
      defaultGuidance: 'Develop your characters or arguments'
    },
    'mid-development': {
      name: 'Development',
      emoji: '🔨',
      minWords: 100,
      maxWords: 149,
      focus: 'Deepen your content',
      defaultGuidance: 'Add details and examples'
    },
    'building-climax': {
      name: 'Building Climax',
      emoji: '⚡',
      minWords: 150,
      maxWords: 199,
      focus: 'Build toward your conclusion',
      defaultGuidance: 'Create tension or strengthen arguments'
    },
    'conclusion': {
      name: 'Conclusion',
      emoji: '🎯',
      minWords: 200,
      maxWords: 250,
      focus: 'Wrap up effectively',
      defaultGuidance: 'Write a satisfying ending'
    },
    'polishing': {
      name: 'Polishing',
      emoji: '✨',
      minWords: 251,
      maxWords: Infinity,
      focus: 'Review and improve',
      defaultGuidance: 'Check for errors and enhance your writing'
    }
  },

  // Minimum word counts for different features
  minimumWords: {
    vocabulary: 50,
    examples: 20,
    detailedFeedback: 30,
    stepGuidance: 10
  },

  // Debounce timers (in milliseconds)
  debounce: {
    analysis: 1000,
    examples: 2000,
    vocabulary: 2000,
    suggestions: 1500,
    autoSave: 500
  },

  // Quick Questions default prompts (fallback only)
  quickQuestionsFallback: {
    noContent: [
      'How should I start my opening?',
      'What makes a good hook?',
      'Can you give me ideas for my prompt?',
      'What should my first sentence be?'
    ],
    hasContent: [
      'How can I improve this section?',
      'What should I write next?',
      'Is my writing on the right track?',
      'Can you suggest stronger words?',
      'How do I build tension here?'
    ]
  },

  // API endpoints
  endpoints: {
    generateExamples: '/.netlify/functions/ai-operations',
    generateVocabulary: '/.netlify/functions/ai-operations',
    generateSuggestions: '/.netlify/functions/ai-operations',
    generateSteps: '/.netlify/functions/ai-operations',
    generateQuickQuestions: '/.netlify/functions/ai-operations',
    chatResponse: '/.netlify/functions/chat-response'
  },

  // Feature flags
  features: {
    dynamicExamples: true,
    dynamicVocabulary: true,
    dynamicSuggestions: true,
    dynamicSteps: true,
    dynamicQuickQuestions: true,
    contextualChat: true
  }
};

/**
 * Get the current writing phase based on word count
 */
export function getWritingPhaseConfig(wordCount: number) {
  const phases = AI_COACH_CONFIG.writingPhases;

  for (const [key, phase] of Object.entries(phases)) {
    if (wordCount >= phase.minWords && wordCount <= phase.maxWords) {
      return { key, ...phase };
    }
  }

  return { key: 'not-started', ...phases['not-started'] };
}

/**
 * Check if feature should be enabled based on word count
 */
export function shouldEnableFeature(feature: keyof typeof AI_COACH_CONFIG.minimumWords, wordCount: number): boolean {
  return wordCount >= AI_COACH_CONFIG.minimumWords[feature];
}
