// Grammar and Spelling Checker Utility
// This utility provides real-time grammar, spelling, and language error detection

export interface GrammarError {
  start: number;
  end: number;
  message: string;
  type: 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'word-choice' | 'style';
  suggestions: string[];
  severity: 'low' | 'medium' | 'high';
  rule?: string;
}

export interface SpellingError {
  start: number;
  end: number;
  word: string;
  suggestions: string[];
  type: 'spelling';
}

// Common grammar rules and patterns
const GRAMMAR_RULES = {
  // Subject-verb agreement
  subjectVerbAgreement: [
    {
      pattern: /\b(he|she|it)\s+(are|were)\b/gi,
      message: "Subject-verb disagreement. Use 'is' or 'was' with singular subjects.",
      suggestions: (match: string) => [
        match.replace(/are/gi, 'is').replace(/were/gi, 'was')
      ]
    },
    {
      pattern: /\b(they|we|you)\s+(is|was)\b/gi,
      message: "Subject-verb disagreement. Use 'are' or 'were' with plural subjects.",
      suggestions: (match: string) => [
        match.replace(/is/gi, 'are').replace(/was/gi, 'were')
      ]
    }
  ],

  // Common word confusions
  wordChoice: [
    {
      pattern: /\bthere\s+(is|are)\s+a\s+lot\s+of\b/gi,
      message: "Consider using 'many' or 'much' instead of 'a lot of' for more formal writing.",
      suggestions: ['there are many', 'there is much']
    },
    {
      pattern: /\byour\s+(going|coming|doing)\b/gi,
      message: "Did you mean 'you\'re' (you are)?",
      suggestions: (match: string) => [match.replace('your', "you\'re")]
    },
    {
      pattern: /\bits\s+(going|coming|doing)\b/gi,
      message: "Did you mean 'it\'s' (it is)?",
      suggestions: (match: string) => [match.replace('its', "it\'s")]
    }
  ],

  // Punctuation rules
  punctuation: [
    {
      pattern: /\s+,/g,
      message: "Remove space before comma.",
      suggestions: [',']
    },
    {
      pattern: /,(?!\s)/g,
      message: "Add space after comma.",
      suggestions: [', ']
    },
    {
      pattern: /\s+\./g,
      message: "Remove space before period.",
      suggestions: ['.']
    },
    {
      pattern: /\.(?!\s|$)/g,
      message: "Add space after period.",
      suggestions: ['. ']
    }
  ],

  // Capitalization rules
  capitalization: [
    {
      pattern: /^\s*[a-z]/gm,
      message: "Capitalize the first letter of each sentence.",
      suggestions: (match: string) => [match.toUpperCase()]
    },
    {
      pattern: /\.\s+[a-z]/g,
      message: "Capitalize the first letter after a period.",
      suggestions: (match: string) => [match.replace(/([.]\s+)([a-z])/, '$1$2'.toUpperCase())]
    }
  ],

  // Style improvements
  style: [
    {
      pattern: /\bvery\s+(good|bad|big|small|nice|pretty|ugly)\b/gi,
      message: "Consider using a stronger adjective instead of 'very + adjective'.",
      suggestions: ['excellent', 'terrible', 'enormous', 'tiny', 'wonderful', 'beautiful', 'hideous']
    },
    {
      pattern: /\bthing\b/gi,
      message: "Consider using a more specific noun instead of 'thing'.",
      suggestions: ['item', 'object', 'matter', 'issue', 'concept']
    }
  ],

  // More granular punctuation rules
  morePunctuation: [
    {
      pattern: /([a-zA-Z0-9])([.,!?;:])(?!\s)/g,
      message: "Missing space after punctuation mark.",
      suggestions: (match: string) => [match.replace(/([.,!?;:])/, '$1 ')]
    },
    {
      pattern: /\s{2,}[.,!?;:]/g,
      message: "Excessive space before punctuation mark.",
      suggestions: (match: string) => [match.trimLeft()]
    },
    {
      pattern: /([a-zA-Z])([,.;:])([a-zA-Z])/g,
      message: "Missing space after punctuation mark.",
      suggestions: (match: string) => [match.replace(/([,.;:])/, '$1 ')]
    },
    {
      pattern: /\b(i)\b/g,
      message: "The pronoun 'I' should always be capitalized.",
      suggestions: (match: string) => [match.toUpperCase()]
    }
  ],

  // Common grammar errors
  commonGrammar: [
    {
      pattern: /\b(affect|effect)\b/gi,
      message: "Check if you\'re using 'affect' (verb) or 'effect' (noun).",
      suggestions: ["affect", "effect"]
    },
    {
      pattern: /\b(their|there|they\'re)\b/gi,
      message: "Check if you\'re using 'their' (possession), 'there' (place), or 'they\'re' (they are).",
      suggestions: ["their", "there", "they\'re"]
    },
    {
      pattern: /\b(to|too|two)\b/gi,
      message: "Check if you\'re using 'to' (preposition), 'too' (also/excessively), or 'two' (number).",
      suggestions: ["to", "too", "two"]
    },
    {
      pattern: /\b(lose|loose)\b/gi,
      message: "Check if you\'re using 'lose' (verb) or 'loose' (adjective).",
      suggestions: ["lose", "loose"]
    }
  ],

  // Context-aware than/then rules
  thenThanRules: [
    {
      pattern: /\b(better|worse|more|less|greater|smaller|higher|lower|faster|slower|bigger|smaller|older|younger|taller|shorter|stronger|weaker|richer|poorer|happier|sadder|easier|harder)\s+then\b/gi,
      message: "Did you mean 'than' (for comparison)? 'Then' refers to time.",
      suggestions: (match: string) => [match.replace(/then/gi, 'than')]
    },
    {
      pattern: /\b(rather|other)\s+then\b/gi,
      message: "Did you mean 'than' (for comparison)? 'Then' refers to time.",
      suggestions: (match: string) => [match.replace(/then/gi, 'than')]
    },
    {
      pattern: /\b(more|less)\s+\w+\s+then\b/gi,
      message: "Did you mean 'than' (for comparison)? 'Then' refers to time.",
      suggestions: (match: string) => [match.replace(/then/gi, 'than')]
    },
    {
      pattern: /\b(first|next|and)\s+than\b/gi,
      message: "Did you mean 'then' (for time sequence)? 'Than' is used for comparisons.",
      suggestions: (match: string) => [match.replace(/than/gi, 'then')]
    },
    {
      pattern: /\b(since|back|until|now)\s+than\b/gi,
      message: "Did you mean 'then' (for time)? 'Than' is used for comparisons.",
      suggestions: (match: string) => [match.replace(/than/gi, 'then')]
    }
  ]
};

// Common misspellings dictionary
const COMMON_MISSPELLINGS: { [key: string]: string[] } = {
  'recieve': ['receive'],
  'seperate': ['separate'],
  'definately': ['definitely'],
  'occured': ['occurred'],
  'begining': ['beginning'],
  'writting': ['writing'],
  'grammer': ['grammar'],
  'speach': ['speech'],
  'acheive': ['achieve'],
  'beleive': ['believe'],
  'freind': ['friend'],
  'wierd': ['weird'],
  'neccessary': ['necessary'],
  'accomodate': ['accommodate'],
  'embarass': ['embarrass'],
  'existance': ['existence'],
  'maintainance': ['maintenance'],
  'occassion': ['occasion'],
  'priviledge': ['privilege'],
  'recomend': ['recommend'],
  'rythm': ['rhythm'],
  'tommorrow': ['tomorrow'],
  'untill': ['until'],
  'wether': ['whether'],
  'alot': ['a lot'],
  'cant': ["can't"],
  'dont': ["don't"],
  'wont': ["won't"],
  'shouldnt': ["shouldn't"],
  'couldnt': ["couldn't"],
  'wouldnt': ["wouldn't"],
  'isnt': ["isn't"],
  'arent': ["aren't"],
  'wasnt': ["wasn't"],
  'werent': ["weren't"],
  'hasnt': ["hasn't"],
  'havent': ["haven't"],
  'hadnt': ["hadn't"],
  'didnt': ["didn't"],
  'doesnt': ["doesn't"]
};

export class GrammarSpellingChecker {
  private customDictionary: Set<string> = new Set();
  private ignoredWords: Set<string> = new Set();
  private dictionary: Set<string> = new Set();

  constructor() {
    // Initialize with common words that might be flagged incorrectly
    this.customDictionary.add('ok');
    this.customDictionary.add('okay');
    this.customDictionary.add('yeah');
    this.customDictionary.add('yep');

    // A basic dictionary of common English words
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
      'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
      'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
      'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
      'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
      'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
      'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
      'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      // Add more words to the dictionary as needed
      'atmosphere', 'yawning', 'decided', 'heard'
    ];
    this.dictionary = new Set(commonWords);
  }

  // Add word to custom dictionary
  addToCustomDictionary(word: string): void {
    this.customDictionary.add(word.toLowerCase());
  }

  // Add word to ignore list
  ignoreWord(word: string): void {
    this.ignoredWords.add(word.toLowerCase());
  }

  // Levenshtein distance function
  private levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Check for spelling errors
  checkSpelling(text: string): SpellingError[] {
    const errors: SpellingError[] = [];
    const words = text.match(/\b[a-zA-Z]+\b/g) || [];
    let currentIndex = 0;

    words.forEach(word => {
      const wordIndex = text.indexOf(word, currentIndex);
      const lowerWord = word.toLowerCase();

      // Skip if word is in custom dictionary or ignore list
      if (this.customDictionary.has(lowerWord) || this.ignoredWords.has(lowerWord) || this.dictionary.has(lowerWord)) {
        currentIndex = wordIndex + word.length;
        return;
      }

      // Check against common misspellings
      if (COMMON_MISSPELLINGS[lowerWord]) {
        errors.push({
          start: wordIndex,
          end: wordIndex + word.length,
          word: word,
          suggestions: COMMON_MISSPELLINGS[lowerWord],
          type: 'spelling'
        });
      } else {
        const suggestions = this.generateSpellingSuggestions(word);
        if (suggestions.length > 0) {
          errors.push({
            start: wordIndex,
            end: wordIndex + word.length,
            word: word,
            suggestions: suggestions,
            type: 'spelling'
          });
        }
      }

      currentIndex = wordIndex + word.length;
    });

    return errors;
  }

  // Generate spelling suggestions using Levenshtein distance
  private generateSpellingSuggestions(word: string): string[] {
    const lowerWord = word.toLowerCase();
    const suggestions: { word: string; distance: number }[] = [];

    for (const dictWord of this.dictionary) {
      const distance = this.levenshteinDistance(lowerWord, dictWord);
      if (distance <= 2) { // Suggest words with a Levenshtein distance of 2 or less
        suggestions.push({ word: dictWord, distance });
      }
    }

    // Sort suggestions by distance
    suggestions.sort((a, b) => a.distance - b.distance);

    return suggestions.slice(0, 3).map(s => s.word); // Return top 3 suggestions
  }

  // Check for grammar errors
  checkGrammar(text: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check all grammar rule categories
    Object.entries(GRAMMAR_RULES).forEach(([category, rules]) => {
      (rules as any[]).forEach(rule => {
        let match;
        const regex = new RegExp(rule.pattern);
        
        while ((match = regex.exec(text)) !== null) {
          const suggestions = typeof rule.suggestions === 'function' 
            ? rule.suggestions(match[0])
            : rule.suggestions;

          errors.push({
            start: match.index,
            end: match.index + match[0].length,
            message: rule.message,
            type: this.getCategoryType(category),
            suggestions: suggestions,
            severity: this.getSeverityForCategory(category),
            rule: category
          });

          // Prevent infinite loop for global regex
          if (!rule.pattern.global) break;
        }
      });
    });

    return errors;
  }

  // Comprehensive check combining grammar and spelling
  checkText(text: string): GrammarError[] {
    const grammarErrors = this.checkGrammar(text);
    const spellingErrors = this.checkSpelling(text);

    // Convert spelling errors to grammar error format
    const convertedSpellingErrors: GrammarError[] = spellingErrors.map(error => ({
      start: error.start,
      end: error.end,
      message: `Possible spelling error: "${error.word}"`,
      type: 'spelling' as const,
      suggestions: error.suggestions,
      severity: 'high' as const,
      rule: 'spelling'
    }));

    // Combine and sort by position
    const allErrors = [...grammarErrors, ...convertedSpellingErrors];
    return allErrors.sort((a, b) => a.start - b.start);
  }

  // Get error type based on category
  private getCategoryType(category: string): 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'word-choice' | 'style' {
    switch (category) {
      case 'subjectVerbAgreement': return 'grammar';
      case 'wordChoice': return 'word-choice';
      case 'punctuation': return 'punctuation';
      case 'capitalization': return 'capitalization';
      case 'style': return 'style';
      case 'morePunctuation': return 'punctuation'; // Map new category to existing type
      case 'commonGrammar': return 'grammar'; // Map new category to existing type
      default: return 'grammar';
    }
  }

  // Get severity based on category
  private getSeverityForCategory(category: string): 'low' | 'medium' | 'high' {
    switch (category) {
      case 'subjectVerbAgreement':
      case 'punctuation':
      case 'capitalization':
      case 'morePunctuation': // Assign severity for new category
      case 'commonGrammar': // Assign severity for new category
        return 'high';
      case 'wordChoice':
        return 'medium';
      case 'style':
        return 'low';
      default:
        return 'medium';
    }
  }
}

// Export singleton instance
export const grammarSpellingChecker = new GrammarSpellingChecker();

// Utility function for real-time checking with debouncing
export const createDebouncedChecker = (
  checker: GrammarSpellingChecker,
  delay: number = 1000
) => {
  let timeoutId: any;
  
  return (text: string, callback: (errors: GrammarError[]) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const errors = checker.checkText(text);
      callback(errors);
    }, delay);
  };
};


import { ShowDontTellMeter } from './showDontTellMeter';
import { LiteraryDevicesDetector } from './literaryDevicesDetector';
import { SentenceVarietyAnalyzer } from './sentenceVarietyAnalyzer';



export class EnhancedWritingAnalyzer {
  private grammarSpellingChecker = new GrammarSpellingChecker();
  private showDontTellMeter = new ShowDontTellMeter();
  private literaryDevicesDetector = new LiteraryDevicesDetector();
  private sentenceVarietyAnalyzer = new SentenceVarietyAnalyzer();

  analyze(text: string) {
    const grammarErrors = this.grammarSpellingChecker.checkText(text);
    const showDontTell = this.showDontTellMeter.analyze(text);
    const literaryDevices = this.literaryDevicesDetector.detect(text);
    const sentenceVariety = this.sentenceVarietyAnalyzer.analyze(text);

    return {
      grammarErrors,
      showDontTell,
      literaryDevices,
      sentenceVariety,
    };
  }
}