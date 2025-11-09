import { GrammarSpellingChecker } from '../grammarSpellingChecker';

describe('Grammar Checker - Than/Then Context-Aware Rules', () => {
  let checker: GrammarSpellingChecker;

  beforeEach(() => {
    checker = new GrammarSpellingChecker();
  });

  describe('Correct usage of "than" in comparisons', () => {
    const correctThanSentences = [
      'This is better than that.',
      'She is taller than her brother.',
      'I like apples more than oranges.',
      'The car is faster than the bike.',
      'He is older than me.',
      'This book is easier than the last one.',
      'My house is bigger than yours.',
      'She runs faster than I do.',
      'Today is worse than yesterday.',
      'I would rather go swimming than hiking.',
      'She is happier than she was before.',
      'This test is harder than the practice one.'
    ];

    correctThanSentences.forEach(sentence => {
      it(`should NOT flag: "${sentence}"`, () => {
        const errors = checker.checkGrammar(sentence);
        const thanErrors = errors.filter(e =>
          e.message.toLowerCase().includes('than') ||
          e.message.toLowerCase().includes('then')
        );
        expect(thanErrors.length).toBe(0);
      });
    });
  });

  describe('Correct usage of "then" for time/sequence', () => {
    const correctThenSentences = [
      'First we eat, then we play.',
      'I went to the store, and then I came home.',
      'Back then, things were different.',
      'Since then, I have improved.',
      'We will go now and then later.',
      'Next, then finally.',
      'If you study, then you will pass.'
    ];

    correctThenSentences.forEach(sentence => {
      it(`should NOT flag: "${sentence}"`, () => {
        const errors = checker.checkGrammar(sentence);
        const thenErrors = errors.filter(e =>
          e.message.toLowerCase().includes('than') ||
          e.message.toLowerCase().includes('then')
        );
        expect(thenErrors.length).toBe(0);
      });
    });
  });

  describe('Incorrect usage - "then" instead of "than" in comparisons', () => {
    const incorrectSentences = [
      {
        text: 'This is better then that.',
        expected: 'better than that'
      },
      {
        text: 'She is taller then her brother.',
        expected: 'taller than her'
      },
      {
        text: 'I like apples more then oranges.',
        expected: 'more than oranges'
      },
      {
        text: 'He is older then me.',
        expected: 'older than me'
      },
      {
        text: 'I would rather go swimming then hiking.',
        expected: 'rather go swimming than'
      }
    ];

    incorrectSentences.forEach(({ text, expected }) => {
      it(`should FLAG: "${text}"`, () => {
        const errors = checker.checkGrammar(text);
        const thanErrors = errors.filter(e =>
          e.message.toLowerCase().includes('than') &&
          e.message.toLowerCase().includes('comparison')
        );
        expect(thanErrors.length).toBeGreaterThan(0);
        expect(thanErrors[0].message).toContain('than');
      });
    });
  });

  describe('Incorrect usage - "than" instead of "then" for time', () => {
    const incorrectSentences = [
      {
        text: 'First we eat, than we play.',
        expected: 'eat, then we'
      },
      {
        text: 'I went to the store, and than I came home.',
        expected: 'and then I'
      },
      {
        text: 'Since than, I have improved.',
        expected: 'Since then'
      },
      {
        text: 'Next than finally.',
        expected: 'Next then'
      }
    ];

    incorrectSentences.forEach(({ text, expected }) => {
      it(`should FLAG: "${text}"`, () => {
        const errors = checker.checkGrammar(text);
        const thenErrors = errors.filter(e =>
          e.message.toLowerCase().includes('then') &&
          (e.message.toLowerCase().includes('time') || e.message.toLowerCase().includes('sequence'))
        );
        expect(thenErrors.length).toBeGreaterThan(0);
        expect(thenErrors[0].message).toContain('then');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple instances correctly', () => {
      const text = 'This is better than that, and then we went home. She is taller than me.';
      const errors = checker.checkGrammar(text);
      const thanThenErrors = errors.filter(e =>
        e.message.toLowerCase().includes('than') ||
        e.message.toLowerCase().includes('then')
      );
      expect(thanThenErrors.length).toBe(0);
    });

    it('should handle mixed correct and incorrect usage', () => {
      const text = 'This is better then that. First we eat, then we play.';
      const errors = checker.checkGrammar(text);
      const thanThenErrors = errors.filter(e =>
        e.message.toLowerCase().includes('than') ||
        e.message.toLowerCase().includes('then')
      );
      expect(thanThenErrors.length).toBe(1);
      expect(thanThenErrors[0].message).toContain('than');
    });

    it('should be case-insensitive', () => {
      const errors = checker.checkGrammar('This is BETTER THEN that.');
      const thanErrors = errors.filter(e =>
        e.message.toLowerCase().includes('than')
      );
      expect(thanErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Comparative adjectives detection', () => {
    const comparatives = [
      'better', 'worse', 'more', 'less', 'greater', 'smaller',
      'higher', 'lower', 'faster', 'slower', 'bigger', 'older',
      'younger', 'taller', 'shorter', 'stronger', 'weaker',
      'richer', 'poorer', 'happier', 'sadder', 'easier', 'harder'
    ];

    comparatives.forEach(comparative => {
      it(`should detect "${comparative} then" as error`, () => {
        const text = `The result is ${comparative} then expected.`;
        const errors = checker.checkGrammar(text);
        const thanErrors = errors.filter(e =>
          e.message.toLowerCase().includes('than')
        );
        expect(thanErrors.length).toBeGreaterThan(0);
      });

      it(`should NOT flag "${comparative} than" as error`, () => {
        const text = `The result is ${comparative} than expected.`;
        const errors = checker.checkGrammar(text);
        const thanThenErrors = errors.filter(e =>
          e.message.toLowerCase().includes('than') ||
          e.message.toLowerCase().includes('then')
        );
        expect(thanThenErrors.length).toBe(0);
      });
    });
  });
});
