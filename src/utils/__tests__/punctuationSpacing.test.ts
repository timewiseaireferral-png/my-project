/**
 * Test Suite for Punctuation Spacing Fix
 * Tests the cleanPunctuationSpacing function to ensure it correctly
 * removes spaces before final punctuation marks
 */

// Helper function to fix punctuation spacing issues
const cleanPunctuationSpacing = (text: string): string => {
  // Remove spaces before punctuation marks at the end of text or before line breaks
  return text.replace(/\s+([.,!?;:])\s*$/g, '$1')
             .replace(/\s+([.,!?;:])\s*(\n)/g, '$1$2')
             .replace(/\s+([.,!?;:])\s+/g, '$1 '); // Normalize multiple spaces after punctuation
};

describe('Punctuation Spacing Fix', () => {
  describe('Remove space before final punctuation', () => {
    it('should remove space before period at end of text', () => {
      const input = 'This is the end of the story .';
      const expected = 'This is the end of the story.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before exclamation mark at end of text', () => {
      const input = 'What an amazing day !';
      const expected = 'What an amazing day!';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before question mark at end of text', () => {
      const input = 'Where are you going ?';
      const expected = 'Where are you going?';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before semicolon at end of text', () => {
      const input = 'I have three items: apples, oranges, and bananas ;';
      const expected = 'I have three items: apples, oranges, and bananas;';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before colon at end of text', () => {
      const input = 'Here is my answer :';
      const expected = 'Here is my answer:';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before comma at end of text', () => {
      const input = 'I like apples, oranges, bananas ,';
      const expected = 'I like apples, oranges, bananas,';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });
  });

  describe('Remove space before punctuation before line breaks', () => {
    it('should remove space before period before newline', () => {
      const input = 'First sentence .\nSecond sentence.';
      const expected = 'First sentence.\nSecond sentence.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before exclamation before newline', () => {
      const input = 'Amazing !\nGreat job.';
      const expected = 'Amazing!\nGreat job.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should remove space before question mark before newline', () => {
      const input = 'What is this ?\nI dont know.';
      const expected = 'What is this?\nI dont know.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });
  });

  describe('Handle multiple spaces correctly', () => {
    it('should remove multiple spaces before final punctuation', () => {
      const input = 'This is the end   .';
      const expected = 'This is the end.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should normalize multiple spaces after punctuation to single space', () => {
      const input = 'Hello.   How are you?';
      const expected = 'Hello. How are you?';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle multiple punctuation issues in one text', () => {
      const input = 'First sentence .  Second sentence !  Third sentence ?';
      const expected = 'First sentence. Second sentence! Third sentence?';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });
  });

  describe('Preserve correct punctuation spacing', () => {
    it('should not modify correctly spaced period', () => {
      const input = 'This is correct.';
      const expected = 'This is correct.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should not modify correctly spaced question mark', () => {
      const input = 'Is this correct?';
      const expected = 'Is this correct?';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should not modify correctly spaced exclamation', () => {
      const input = 'This is amazing!';
      const expected = 'This is amazing!';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should preserve single space after punctuation mid-sentence', () => {
      const input = 'Hello. How are you?';
      const expected = 'Hello. How are you?';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const input = '';
      const expected = '';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle text with only punctuation', () => {
      const input = '...';
      const expected = '...';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle text with space before punctuation mid-text', () => {
      const input = 'Hello , world.';
      const expected = 'Hello, world.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle multiple paragraphs', () => {
      const input = 'First paragraph .\n\nSecond paragraph !\n\nThird paragraph ?';
      const expected = 'First paragraph.\n\nSecond paragraph!\n\nThird paragraph?';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle mixed correct and incorrect spacing', () => {
      const input = 'This is correct. This is wrong . This is also correct!';
      const expected = 'This is correct. This is wrong. This is also correct!';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });
  });

  describe('Real-world examples', () => {
    it('should fix user example from bug report', () => {
      const input = 'This is the end of the story .';
      const expected = 'This is the end of the story.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle complex narrative text', () => {
      const input = 'The sun was setting over the horizon . Birds flew gracefully in the sky ! It was a beautiful sight .';
      const expected = 'The sun was setting over the horizon. Birds flew gracefully in the sky! It was a beautiful sight.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle dialogue with various punctuation', () => {
      const input = '"Hello ," she said . "How are you ?" he asked . "I am fine !" she replied .';
      const expected = '"Hello," she said. "How are you?" he asked. "I am fine!" she replied.';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });

    it('should handle lists with commas and semicolons', () => {
      const input = 'I need: apples , oranges , and bananas ;';
      const expected = 'I need: apples, oranges, and bananas;';
      expect(cleanPunctuationSpacing(input)).toBe(expected);
    });
  });
});

// Export for use in components
export { cleanPunctuationSpacing };
