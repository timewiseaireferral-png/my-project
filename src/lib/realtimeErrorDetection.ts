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
    pattern: /\b(\w+s)\s+(is|was|has)\b/gi,
    message: 'Possible subject-verb agreement error',
    check: (match: string) => {
      const parts = match.split(/\s+/);
      const subject = parts[0].toLowerCase();
      return subject.endsWith('s') && !['is', 'was', 'has'].includes(subject);
    }
  },
  {
    pattern: /\b(don't|doesn't|didn't)\s+(\w+)/gi,
    message: 'Check subject-verb agreement with negatives',
    check: (match: string) => true
  },
  {
    pattern: /\bthan\s+then\b|\bthen\s+than\b/gi,
    message: 'Confused "than" and "then"',
    check: () => true
  },
  {
    pattern: /\byour\s+going\b|\byour\s+coming\b/gi,
    message: 'Should be "you\'re" (you are)',
    check: () => true
  },
  {
    pattern: /\bits\s+a\b/gi,
    message: 'Possible missing apostrophe: "it\'s" means "it is"',
    check: () => true
  },
  {
    pattern: /[a-z]\s+,/g,
    message: 'Space before comma - remove the space',
    check: () => true
  },
  {
    pattern: /,[A-Z]/g,
    message: 'Missing space after comma',
    check: () => true
  },
  {
    pattern: /\.\./g,
    message: 'Multiple periods - use one period or ellipsis (...)',
    check: () => true
  },
];

// Style suggestions
const STYLE_PATTERNS = [
  {
    pattern: /\b(very|really|quite|just|actually|basically|literally)\s+/gi,
    message: 'Consider removing filler word for stronger writing',
    type: 'wordiness'
  },
  {
    pattern: /\b(was|were|is|are|been)\s+(\w+ed|being)\b/gi,
    message: 'Passive voice detected - consider active voice',
    type: 'passive'
  },
  {
    pattern: /\b(a lot of|lots of)\b/gi,
    message: 'Informal phrase - consider "many" or "numerous"',
    type: 'informal'
  },
  {
    pattern: /\b(good|bad|nice|big|small)\b/gi,
    message: 'Simple adjective - consider more descriptive word',
    type: 'vocabulary'
  },
  {
    pattern: /\b(thing|stuff|things|stuffs)\b/gi,
    message: 'Vague noun - be more specific',
    type: 'clarity'
  },
  {
    pattern: /\b(got|get|gets|getting)\b/gi,
    message: 'Weak verb - consider more precise alternative',
    type: 'vocabulary'
  },
];

/**
 * Detect spelling errors in text
 */
export function detectSpellingErrors(text: string): TextError[] {
  const errors: TextError[] = [];
  const words = text.matchAll(/\b[a-zA-Z]+\b/g);

  for (const match of words) {
    const word = match[0].toLowerCase();
    const startIndex = match.index!;

    if (COMMON_MISSPELLINGS[word]) {
      errors.push({
        id: `spell-${startIndex}`,
        category: 'spelling',
        startIndex,
        endIndex: startIndex + match[0].length,
        text: match[0],
        message: `Spelling error: Did you mean "${COMMON_MISSPELLINGS[word]}"?`,
        suggestion: COMMON_MISSPELLINGS[word],
        severity: 'error'
      });
    }
  }

  return errors;
}

/**
 * Detect grammar and mechanics errors
 */
export function detectGrammarErrors(text: string): TextError[] {
  const errors: TextError[] = [];

  for (const pattern of GRAMMAR_PATTERNS) {
    const matches = text.matchAll(pattern.pattern);

    for (const match of matches) {
      if (pattern.check(match[0])) {
        const startIndex = match.index!;
        errors.push({
          id: `grammar-${startIndex}`,
          category: 'grammar',
          startIndex,
          endIndex: startIndex + match[0].length,
          text: match[0],
          message: pattern.message,
          severity: 'warning'
        });
      }
    }
  }

  return errors;
}

/**
 * Detect style and clarity issues
 */
export function detectStyleIssues(text: string): TextError[] {
  const errors: TextError[] = [];

  for (const pattern of STYLE_PATTERNS) {
    const matches = text.matchAll(pattern.pattern);

    for (const match of matches) {
      const startIndex = match.index!;
      errors.push({
        id: `style-${startIndex}-${pattern.type}`,
        category: 'style',
        startIndex,
        endIndex: startIndex + match[0].length,
        text: match[0],
        message: pattern.message,
        severity: 'suggestion'
      });
    }
  }

  return errors;
}

/**
 * Main function to analyze text and return all errors
 */
export function analyzeTextForErrors(text: string): TextError[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const spellingErrors = detectSpellingErrors(text);
  const grammarErrors = detectGrammarErrors(text);
  const styleIssues = detectStyleIssues(text);

  // Combine and sort by position
  const allErrors = [...spellingErrors, ...grammarErrors, ...styleIssues];
  allErrors.sort((a, b) => a.startIndex - b.startIndex);

  return allErrors;
}

/**
 * Get color and style for error category
 */
export function getErrorStyle(category: ErrorCategory): { color: string; underlineStyle: string; className: string } {
  switch (category) {
    case 'spelling':
      return {
        color: '#ef4444',
        underlineStyle: 'wavy',
        className: 'error-highlight-spelling'
      };
    case 'grammar':
      return {
        color: '#3b82f6',
        underlineStyle: 'wavy',
        className: 'error-highlight-grammar'
      };
    case 'style':
      return {
        color: '#f97316',
        underlineStyle: 'dotted',
        className: 'error-highlight-style'
      };
  }
}

/**
 * Convert text with errors into highlighted HTML
 */
export function generateHighlightedHTML(text: string, errors: TextError[]): string {
  if (errors.length === 0) {
    return escapeHtml(text);
  }

  let html = '';
  let lastIndex = 0;

  // Sort errors by start index to process them in order
  const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

  for (const error of sortedErrors) {
    // Add text before error
    html += escapeHtml(text.substring(lastIndex, error.startIndex));

    // Add highlighted error
    const style = getErrorStyle(error.category);
    html += `<span class="error-highlight ${style.className}" data-error-id="${error.id}" data-category="${error.category}" style="text-decoration: underline ${style.underlineStyle}; text-decoration-color: ${style.color}; cursor: pointer;">`;
    html += escapeHtml(text.substring(error.startIndex, error.endIndex));
    html += '</span>';

    lastIndex = error.endIndex;
  }

  // Add remaining text
  html += escapeHtml(text.substring(lastIndex));

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Find error by position in text
 */
export function findErrorAtPosition(errors: TextError[], position: number): TextError | null {
  return errors.find(error =>
    position >= error.startIndex && position < error.endIndex
  ) || null;
}

/**
 * Group errors by category for sidebar display
 */
export function groupErrorsByCategory(errors: TextError[]): {
  spelling: TextError[];
  grammar: TextError[];
  style: TextError[];
} {
  return {
    spelling: errors.filter(e => e.category === 'spelling'),
    grammar: errors.filter(e => e.category === 'grammar'),
    style: errors.filter(e => e.category === 'style')
  };
}

/**
 * Debounce function for performance optimization
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
