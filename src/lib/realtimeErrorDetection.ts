/**
 * Real-Time Error Detection Service
 * Analyzes text for spelling, grammar, and style errors with inline highlighting
 */

export type ErrorCategory = 'spelling' | 'grammar' | 'style';

export interface TextError {
  id: string;
  category: ErrorCategory;
  startIndex: number;
  endIndex: number;
  text: string;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'suggestion';
}

export interface ErrorHighlight {
  error: TextError;
  color: string;
  underlineStyle: string;
  className: string;
}

// Common spelling errors for quick detection
const COMMON_MISSPELLINGS: { [key: string]: string } = {
  'beleive': 'believe',
  'recieve': 'receive',
  'occured': 'occurred',
  'goverment': 'government',
  'seperate': 'separate',
  'definately': 'definitely',
  'neccessary': 'necessary',
  'occassion': 'occasion',
  'accomodate': 'accommodate',
  'embarass': 'embarrass',
  'untill': 'until',
  'writting': 'writing',
  'wich': 'which',
  'thier': 'their',
  'alot': 'a lot',
  'becuase': 'because',
  'begining': 'beginning',
  'wierd': 'weird',
  'freind': 'friend',
  'maintainance': 'maintenance',
};

// Grammar patterns to detect
const GRAMMAR_PATTERNS = [
  {
    pattern: /\b(dogs|cats|books|students|teachers)\s+(runs|goes|has|was|is)\b/gi,
    message: 'Subject-verb agreement error. Plural subjects need plural verbs.',
    suggestion: (match: string) => {
      const parts = match.split(/\s+/);
      const verb = parts[1].toLowerCase();
      const verbMap: { [key: string]: string } = {
        'runs': 'run',
        'goes': 'go',
        'has': 'have',
        'was': 'were',
        'is': 'are'
      };
      return `${parts[0]} ${verbMap[verb] || verb}`;
    }
  },
  {
    pattern: /\b(don't|doesn't|didn't)\s+(\w+)/gi,
    message: 'Check subject-verb agreement with negatives',
    suggestion: null
  },
  {
    pattern: /\bthan\s+then\b|\bthen\s+than\b/gi,
    message: 'Confused "than" and "then"',
    suggestion: null
  },
  {
    pattern: /\byour\s+(going|coming|being)\b/gi,
    message: 'Should be "you\'re" (you are)',
    suggestion: (match: string) => match.replace('your', "you're")
  },
  {
    pattern: /\bits\s+a\b/gi,
    message: 'Possible missing apostrophe: "it\'s" means "it is"',
    suggestion: null
  },
  {
    pattern: /[a-z]\s+,/g,
    message: 'Space before comma - remove the space',
    suggestion: null
  },
  {
    pattern: /,[A-Z]/g,
    message: 'Missing space after comma',
    suggestion: null
  },
  {
    pattern: /\.\./g,
    message: 'Multiple periods - use one period or ellipsis (...)',
    suggestion: null
  },
];

// Style suggestions
const STYLE_PATTERNS = [
  {
    pattern: /\b(very|really|quite|just|actually|basically|literally)\s+/gi,
    message: 'Consider removing weak intensifiers for stronger writing',
    suggestion: null
  },
  {
    pattern: /\b(thing|stuff|something|things)\b/gi,
    message: 'Replace vague words with specific nouns',
    suggestion: null
  },
  {
    pattern: /\b(good|bad|nice|big|small)\b/gi,
    message: 'Use more descriptive adjectives',
    suggestion: null
  },
  {
    pattern: /\b(got|get|gets|getting)\b/gi,
    message: 'Consider using more specific verbs',
    suggestion: null
  },
];

/**
 * Get error style configuration based on category
 */
export function getErrorStyle(category: ErrorCategory): ErrorHighlight['color'] & { className: string; underlineStyle: string; color: string } {
  switch (category) {
    case 'spelling':
      return {
        color: '#ef4444', // Red
        underlineStyle: 'wavy',
        className: 'error-spelling'
      };
    case 'grammar':
      return {
        color: '#3b82f6', // Blue
        underlineStyle: 'wavy',
        className: 'error-grammar'
      };
    case 'style':
      return {
        color: '#f97316', // Orange
        underlineStyle: 'dotted',
        className: 'error-style'
      };
    default:
      return {
        color: '#6b7280', // Gray
        underlineStyle: 'solid',
        className: 'error-unknown'
      };
  }
}

/**
 * Generate unique ID for error
 */
function generateErrorId(category: ErrorCategory, startIndex: number, endIndex: number): string {
  return `${category}-${startIndex}-${endIndex}-${Date.now()}`;
}

/**
 * Analyze text for spelling errors
 */
function detectSpellingErrors(text: string): TextError[] {
  const errors: TextError[] = [];
  const words = text.match(/\b\w+\b/g) || [];
  let currentIndex = 0;

  words.forEach(word => {
    const wordIndex = text.indexOf(word, currentIndex);
    const lowerWord = word.toLowerCase();

    if (COMMON_MISSPELLINGS[lowerWord]) {
      errors.push({
        id: generateErrorId('spelling', wordIndex, wordIndex + word.length),
        category: 'spelling',
        startIndex: wordIndex,
        endIndex: wordIndex + word.length,
        text: word,
        message: `Possible spelling error`,
        suggestion: COMMON_MISSPELLINGS[lowerWord],
        severity: 'error'
      });
    }

    currentIndex = wordIndex + word.length;
  });

  return errors;
}

/**
 * Analyze text for grammar errors
 */
function detectGrammarErrors(text: string): TextError[] {
  const errors: TextError[] = [];

  GRAMMAR_PATTERNS.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchText.length;

      let suggestion: string | undefined;
      if (typeof pattern.suggestion === 'function') {
        suggestion = pattern.suggestion(matchText);
      }

      errors.push({
        id: generateErrorId('grammar', startIndex, endIndex),
        category: 'grammar',
        startIndex,
        endIndex,
        text: matchText,
        message: pattern.message,
        suggestion,
        severity: 'error'
      });
    }
  });

  return errors;
}

/**
 * Analyze text for style issues
 */
function detectStyleIssues(text: string): TextError[] {
  const errors: TextError[] = [];

  STYLE_PATTERNS.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchText.length;

      errors.push({
        id: generateErrorId('style', startIndex, endIndex),
        category: 'style',
        startIndex,
        endIndex,
        text: matchText,
        message: pattern.message,
        suggestion: pattern.suggestion || undefined,
        severity: 'suggestion'
      });
    }
  });

  return errors;
}

/**
 * Main analysis function
 */
export function analyzeTextForErrors(text: string): TextError[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const spellingErrors = detectSpellingErrors(text);
  const grammarErrors = detectGrammarErrors(text);
  const styleIssues = detectStyleIssues(text);

  // Combine and sort by start index
  const allErrors = [...spellingErrors, ...grammarErrors, ...styleIssues];
  return allErrors.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Debounce utility
 */
export function debounce<T extends (...args: any[]) => any>(
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

/**
 * Get category label
 */
export function getCategoryLabel(category: ErrorCategory): string {
  switch (category) {
    case 'spelling':
      return 'Spelling';
    case 'grammar':
      return 'Grammar & Mechanics';
    case 'style':
      return 'Style & Clarity';
    default:
      return 'Error';
  }
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: 'error' | 'warning' | 'suggestion'): string {
  switch (severity) {
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'warning':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'suggestion':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}
