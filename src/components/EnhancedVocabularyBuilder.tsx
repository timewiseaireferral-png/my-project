import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Lightbulb, TrendingUp, Award, Zap, Brain, Target, ChevronRight, ChevronDown, Copy, Check, Volume2, Sparkles } from 'lucide-react';
import { generateChatResponse } from '../lib/openai';

interface VocabularyWord {
  id: string;
  original: string;
  suggestions: {
    word: string;
    definition: string;
    example: string;
    sophisticationLevel: 'basic' | 'intermediate' | 'advanced';
    context: string;
    synonyms: string[];
  }[];
  category: 'descriptive' | 'action' | 'emotion' | 'transition' | 'academic';
  position: { start: number; end: number };
}

interface EnhancedVocabularyBuilderProps {
  content: string;
  textType: string;
  onWordSelected: (original: string, replacement: string) => void;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
  isVisible: boolean;
}

export function EnhancedVocabularyBuilder({
  content,
  textType,
  onWordSelected,
  assistanceLevel,
  isVisible
}: EnhancedVocabularyBuilderProps) {
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

  // NSW Selective level vocabulary mappings
  const nswVocabularyBank = {
    descriptive: {
      basic: {
        'big': ['enormous', 'massive', 'gigantic', 'colossal', 'tremendous'],
        'small': ['tiny', 'miniature', 'minuscule', 'petite', 'compact'],
        'good': ['excellent', 'outstanding', 'remarkable', 'exceptional', 'superb'],
        'bad': ['terrible', 'dreadful', 'appalling', 'atrocious', 'deplorable'],
        'nice': ['delightful', 'charming', 'pleasant', 'agreeable', 'wonderful'],
        'pretty': ['beautiful', 'stunning', 'gorgeous', 'magnificent', 'breathtaking'],
        'ugly': ['hideous', 'repulsive', 'grotesque', 'unsightly', 'ghastly'],
        'old': ['ancient', 'elderly', 'aged', 'vintage', 'antique'],
        'new': ['fresh', 'modern', 'contemporary', 'recent', 'innovative']
      },
      intermediate: {
        'happy': ['ecstatic', 'jubilant', 'elated', 'euphoric', 'overjoyed'],
        'sad': ['melancholy', 'despondent', 'dejected', 'sorrowful', 'mournful'],
        'angry': ['furious', 'livid', 'enraged', 'incensed', 'irate'],
        'scared': ['terrified', 'petrified', 'horrified', 'apprehensive', 'alarmed'],
        'surprised': ['astonished', 'amazed', 'astounded', 'flabbergasted', 'bewildered']
      }
    },
    
    action: {
      basic: {
        'walk': ['stroll', 'stride', 'march', 'wander', 'amble'],
        'run': ['sprint', 'dash', 'bolt', 'race', 'hurry'],
        'look': ['gaze', 'peer', 'observe', 'examine', 'scrutinize'],
        'say': ['declare', 'announce', 'proclaim', 'express', 'articulate'],
        'go': ['proceed', 'advance', 'journey', 'travel', 'venture'],
        'get': ['obtain', 'acquire', 'retrieve', 'secure', 'attain'],
        'make': ['create', 'construct', 'produce', 'manufacture', 'craft']
      },
      intermediate: {
        'think': ['contemplate', 'ponder', 'deliberate', 'reflect', 'consider'],
        'feel': ['experience', 'perceive', 'sense', 'encounter', 'undergo'],
        'show': ['demonstrate', 'exhibit', 'display', 'reveal', 'illustrate'],
        'help': ['assist', 'support', 'aid', 'facilitate', 'contribute']
      }
    },

    emotion: {
      basic: {
        'love': ['adore', 'cherish', 'treasure', 'worship', 'idolize'],
        'hate': ['despise', 'loathe', 'detest', 'abhor', 'resent'],
        'like': ['enjoy', 'appreciate', 'favor', 'prefer', 'relish'],
        'want': ['desire', 'crave', 'yearn', 'long for', 'aspire']
      }
    },

    transition: {
      basic: {
        'then': ['subsequently', 'afterwards', 'following that', 'next', 'later'],
        'but': ['however', 'nevertheless', 'nonetheless', 'although', 'whereas'],
        'so': ['therefore', 'consequently', 'thus', 'hence', 'accordingly'],
        'also': ['furthermore', 'moreover', 'additionally', 'likewise', 'similarly']
      }
    },

    academic: {
      intermediate: {
        'important': ['significant', 'crucial', 'vital', 'essential', 'paramount'],
        'different': ['distinct', 'unique', 'diverse', 'varied', 'contrasting'],
        'same': ['identical', 'equivalent', 'similar', 'comparable', 'analogous'],
        'because': ['due to', 'owing to', 'as a result of', 'on account of', 'since']
      }
    }
  };

  // Analyze content for vocabulary enhancement opportunities
  const analyzeVocabulary = async (text: string) => {
    if (!isVisible || text.length < 20 || text === lastAnalyzedContent) return;
    
    setIsAnalyzing(true);
    
    try {
      // First, find basic vocabulary that can be enhanced
      const basicWords = findBasicVocabulary(text);
      
      // Get AI-powered sophisticated suggestions
      const aiSuggestions = await getAISuggestions(text, basicWords);
      
      // Combine and prioritize
      const enhancedWords = combineVocabularySuggestions(basicWords, aiSuggestions);
      
      setVocabularyWords(enhancedWords);
      setLastAnalyzedContent(text);
    } catch (error) {
      console.error('Vocabulary analysis error:', error);
      // Fallback to basic analysis
      const basicWords = findBasicVocabulary(text);
      setVocabularyWords(basicWords);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Find basic vocabulary using pattern matching
  const findBasicVocabulary = (text: string): VocabularyWord[] => {
    const words: VocabularyWord[] = [];
    const wordRegex = /\b\w+\b/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0].toLowerCase();
      const suggestions = findWordSuggestions(word);
      
      if (suggestions.length > 0) {
        words.push({
          id: `vocab-${match.index}`,
          original: match[0],
          suggestions,
          category: determineCategory(word),
          position: { start: match.index, end: match.index + match[0].length }
        });
      }
    }

    return words.slice(0, 12); // Limit to prevent overwhelming
  };

  // Find suggestions for a word
  const findWordSuggestions = (word: string) => {
    const suggestions: any[] = [];
    
    // Search through vocabulary bank
    Object.entries(nswVocabularyBank).forEach(([category, levels]) => {
      Object.entries(levels).forEach(([level, words]) => {
        if (words[word]) {
          words[word].forEach((suggestion: string) => {
            suggestions.push({
              word: suggestion,
              definition: getWordDefinition(suggestion),
              example: getWordExample(suggestion, word),
              sophisticationLevel: level,
              context: `Perfect for ${textType} writing`,
              synonyms: getWordSynonyms(suggestion)
            });
          });
        }
      });
    });

    return suggestions.slice(0, 4); // Limit suggestions per word
  };

  // Get AI-powered vocabulary suggestions
  const getAISuggestions = async (text: string, basicWords: VocabularyWord[]) => {
    const prompt = `Analyze this ${textType} writing by a 10-12 year old for NSW Selective test preparation. Suggest sophisticated vocabulary improvements that are age-appropriate but demonstrate advanced thinking.

Text: "${text}"

For each basic word that could be enhanced, provide:
1. The original word
2. 3-4 sophisticated alternatives suitable for selective school entry
3. Simple definitions a 10-12 year old would understand
4. Example sentences showing proper usage
5. Why this word choice is better for selective test writing

Focus on words that will impress selectors while remaining natural for this age group.

Format as: ORIGINAL|SUGGESTION|DEFINITION|EXAMPLE|REASON`;

    try {
      const response = await generateChatResponse({
        userMessage: prompt,
        textType: 'vocabulary_enhancement',
        currentContent: text,
        wordCount: text.split(/\s+/).length,
        context: 'NSW Selective vocabulary enhancement'
      });

      return parseAIVocabularyResponse(response);
    } catch (error) {
      console.error('AI vocabulary analysis failed:', error);
      return [];
    }
  };

  // Parse AI vocabulary response
  const parseAIVocabularyResponse = (response: string): VocabularyWord[] => {
    const words: VocabularyWord[] = [];
    const lines = response.split('\n').filter(line => line.includes('|'));
    
    lines.forEach((line, index) => {
      const parts = line.split('|');
      if (parts.length >= 5) {
        const [original, suggestion, definition, example, reason] = parts;
        
        words.push({
          id: `ai-vocab-${index}`,
          original: original.trim(),
          suggestions: [{
            word: suggestion.trim(),
            definition: definition.trim(),
            example: example.trim(),
            sophisticationLevel: 'intermediate',
            context: reason.trim(),
            synonyms: []
          }],
          category: 'academic',
          position: { start: 0, end: 0 }
        });
      }
    });
    
    return words;
  };

  // Combine vocabulary suggestions
  const combineVocabularySuggestions = (basic: VocabularyWord[], ai: VocabularyWord[]) => {
    const combined = [...basic];
    
    // Add AI suggestions that don't duplicate basic ones
    ai.forEach(aiWord => {
      const exists = basic.find(b => b.original.toLowerCase() === aiWord.original.toLowerCase());
      if (!exists) {
        combined.push(aiWord);
      }
    });
    
    return combined.sort((a, b) => {
      // Prioritize by sophistication level and category
      const priorityOrder = { advanced: 3, intermediate: 2, basic: 1 };
      const aPriority = Math.max(...a.suggestions.map(s => priorityOrder[s.sophisticationLevel] || 1));
      const bPriority = Math.max(...b.suggestions.map(s => priorityOrder[s.sophisticationLevel] || 1));
      return bPriority - aPriority;
    });
  };

  // Helper functions
  const determineCategory = (word: string): VocabularyWord['category'] => {
    const actionWords = ['walk', 'run', 'go', 'get', 'make', 'say', 'look', 'think', 'feel'];
    const emotionWords = ['happy', 'sad', 'angry', 'scared', 'love', 'hate', 'like'];
    const transitionWords = ['then', 'but', 'so', 'also', 'because'];
    
    if (actionWords.includes(word)) return 'action';
    if (emotionWords.includes(word)) return 'emotion';
    if (transitionWords.includes(word)) return 'transition';
    return 'descriptive';
  };

  const getWordDefinition = (word: string): string => {
    const definitions: { [key: string]: string } = {
      'enormous': 'extremely large in size or amount',
      'magnificent': 'extremely beautiful and impressive',
      'ecstatic': 'feeling extremely happy and excited',
      'contemplate': 'to think deeply about something',
      'subsequently': 'happening after something else',
      'significant': 'important or meaningful'
    };
    return definitions[word] || `A more sophisticated way to express an idea`;
  };

  const getWordExample = (suggestion: string, original: string): string => {
    return `Instead of "${original}": "The ${suggestion} castle stood majestically on the hill."`;
  };

  const getWordSynonyms = (word: string): string[] => {
    const synonyms: { [key: string]: string[] } = {
      'enormous': ['huge', 'massive', 'gigantic'],
      'magnificent': ['splendid', 'grand', 'majestic'],
      'ecstatic': ['thrilled', 'delighted', 'overjoyed']
    };
    return synonyms[word] || [];
  };

  // Handle word selection
  const handleWordSelection = (original: string, suggestion: string) => {
    onWordSelected(original, suggestion);
    setCopiedWord(suggestion);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  // Filter words by category
  const filteredWords = selectedCategory === 'all' 
    ? vocabularyWords 
    : vocabularyWords.filter(word => word.category === selectedCategory);

  // Debounced analysis
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      analyzeVocabulary(content);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [content, isVisible]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'descriptive': return <Star className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'emotion': return <Brain className="w-4 h-4" />;
      case 'transition': return <TrendingUp className="w-4 h-4" />;
      case 'academic': return <Award className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getSophisticationColor = (level: string) => {
    switch (level) {
      case 'basic': return 'green';
      case 'intermediate': return 'blue';
      case 'advanced': return 'purple';
      default: return 'gray';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Vocabulary Builder</h3>
        </div>
        <div className="text-sm text-gray-600">
          {isAnalyzing ? 'Analyzing...' : `${filteredWords.length} suggestions`}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'descriptive', 'action', 'emotion', 'transition', 'academic'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-1">
              {category !== 'all' && getCategoryIcon(category)}
              <span className="capitalize">{category}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
            <span className="text-purple-800 font-medium">Finding sophisticated words...</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      )}

      {/* Vocabulary Suggestions */}
      {filteredWords.length > 0 ? (
        <div className="space-y-3">
          {filteredWords.map((vocabWord) => (
            <div key={vocabWord.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedWord(expandedWord === vocabWord.id ? null : vocabWord.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(vocabWord.category)}
                    <div>
                      <span className="font-medium text-gray-800">"{vocabWord.original}"</span>
                      <span className="text-sm text-gray-600 ml-2">
                        → {vocabWord.suggestions.length} better option{vocabWord.suggestions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {expandedWord === vocabWord.id ? 
                    <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  }
                </div>
              </div>

              {expandedWord === vocabWord.id && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="space-y-4">
                    {vocabWord.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-lg text-gray-800">
                              {suggestion.word}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded bg-${getSophisticationColor(suggestion.sophisticationLevel)}-100 text-${getSophisticationColor(suggestion.sophisticationLevel)}-700`}>
                              {suggestion.sophisticationLevel}
                            </span>
                          </div>
                          <button
                            onClick={() => handleWordSelection(vocabWord.original, suggestion.word)}
                            className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            {copiedWord === suggestion.word ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Used!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Use</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Definition:</strong> {suggestion.definition}
                        </p>

                        <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded mb-2">
                          <strong>Example:</strong> {suggestion.example}
                        </p>

                        <p className="text-sm text-purple-700">
                          <strong>Why it's better:</strong> {suggestion.context}
                        </p>

                        {suggestion.synonyms.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Similar words:</p>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.synonyms.map((synonym, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                  {synonym}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !isAnalyzing && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Your vocabulary is already sophisticated! Keep writing to get more suggestions.
            </span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Vocabulary Tips for NSW Selective:</p>
            <ul className="text-xs space-y-1">
              <li>• Use sophisticated words naturally - don't force them</li>
              <li>• Vary your word choices to show vocabulary range</li>
              <li>• Choose words that fit your writing style and age</li>
              <li>• Quality over quantity - a few great words beat many basic ones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
