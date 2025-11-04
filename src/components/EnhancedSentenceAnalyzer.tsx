import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Target, Zap, Brain, ArrowRight, ChevronDown, ChevronUp, BookOpen, Star } from 'lucide-react';
import { generateChatResponse } from '../lib/openai';

interface SentenceAnalysis {
  id: string;
  sentence: string;
  type: 'simple' | 'compound' | 'complex' | 'compound-complex';
  length: 'short' | 'medium' | 'long';
  complexity: number; // 1-10 scale
  issues: SentenceIssue[];
  suggestions: SentenceImprovement[];
  position: { start: number; end: number };
}

interface SentenceIssue {
  type: 'run_on' | 'fragment' | 'repetitive' | 'too_simple' | 'unclear';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

interface SentenceImprovement {
  type: 'combine' | 'split' | 'enhance' | 'vary';
  description: string;
  example: string;
  benefit: string;
}

interface EnhancedSentenceAnalyzerProps {
  content: string;
  textType: string;
  onSentenceImproved: (original: string, improved: string) => void;
  isVisible: boolean;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
}

export function EnhancedSentenceAnalyzer({
  content,
  textType,
  onSentenceImproved,
  isVisible,
  assistanceLevel
}: EnhancedSentenceAnalyzerProps) {
  const [sentenceAnalyses, setSentenceAnalyses] = useState<SentenceAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSentence, setExpandedSentence] = useState<string | null>(null);
  const [overallStats, setOverallStats] = useState({
    averageLength: 0,
    complexityScore: 0,
    varietyScore: 0,
    readabilityLevel: 'beginner'
  });
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

  // Sentence structure patterns for NSW Selective level
  const sentencePatterns = {
    simple: {
      pattern: /^[A-Z][^.!?]*[.!?]$/,
      description: 'Subject + Verb + Object',
      example: 'The cat sat on the mat.',
      sophistication: 1
    },
    compound: {
      pattern: /[^.!?]*(?:and|but|or|so|yet|for|nor)[^.!?]*[.!?]/,
      description: 'Two independent clauses joined by conjunction',
      example: 'The cat sat on the mat, and the dog lay on the floor.',
      sophistication: 3
    },
    complex: {
      pattern: /[^.!?]*(?:because|although|since|while|when|if|unless|after|before)[^.!?]*[.!?]/,
      description: 'Independent clause + dependent clause',
      example: 'Although it was raining, the cat sat outside.',
      sophistication: 5
    },
    compoundComplex: {
      pattern: /[^.!?]*(?:and|but|or)[^.!?]*(?:because|although|since|while|when|if)[^.!?]*[.!?]/,
      description: 'Multiple independent and dependent clauses',
      example: 'The cat sat outside because it was sunny, and the dog joined it.',
      sophistication: 7
    }
  };

  // Advanced sentence starters for NSW Selective
  const sophisticatedStarters = {
    narrative: [
      'Suddenly,', 'Meanwhile,', 'Without warning,', 'In that moment,', 'As the sun set,',
      'Despite everything,', 'Throughout the journey,', 'Beyond the horizon,', 'In the distance,',
      'Unexpectedly,', 'Gradually,', 'Immediately,', 'Eventually,', 'Simultaneously,'
    ],
    persuasive: [
      'Furthermore,', 'Moreover,', 'Consequently,', 'Nevertheless,', 'Undoubtedly,',
      'In contrast,', 'Similarly,', 'Therefore,', 'However,', 'Additionally,',
      'On the contrary,', 'As a result,', 'In conclusion,', 'Most importantly,'
    ],
    descriptive: [
      'Majestically,', 'Gracefully,', 'Mysteriously,', 'Brilliantly,', 'Silently,',
      'Beneath the surface,', 'High above,', 'Deep within,', 'Across the landscape,',
      'Through the mist,', 'Against the backdrop,', 'In the foreground,'
    ]
  };

  // Analyze sentences in the content
  const analyzeSentences = async (text: string) => {
    if (!isVisible || text.length < 30 || text === lastAnalyzedContent) return;
    
    setIsAnalyzing(true);
    
    try {
      // Split text into sentences
      const sentences = splitIntoSentences(text);
      
      // Analyze each sentence
      const analyses = await Promise.all(
        sentences.map(async (sentence, index) => {
          const basicAnalysis = analyzeBasicStructure(sentence, index);
          const aiEnhancement = await getAIEnhancement(sentence, textType);
          
          return {
            ...basicAnalysis,
            suggestions: [...basicAnalysis.suggestions, ...aiEnhancement]
          };
        })
      );
      
      // Calculate overall statistics
      const stats = calculateOverallStats(analyses);
      
      setSentenceAnalyses(analyses);
      setOverallStats(stats);
      setLastAnalyzedContent(text);
    } catch (error) {
      console.error('Sentence analysis error:', error);
      // Fallback to basic analysis
      const sentences = splitIntoSentences(text);
      const basicAnalyses = sentences.map((sentence, index) => 
        analyzeBasicStructure(sentence, index)
      );
      setSentenceAnalyses(basicAnalyses);
      setOverallStats(calculateOverallStats(basicAnalyses));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Split text into sentences
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5)
      .map(s => s + '.');
  };

  // Analyze basic sentence structure
  const analyzeBasicStructure = (sentence: string, index: number): SentenceAnalysis => {
    const words = sentence.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Determine sentence type
    const type = determineSentenceType(sentence);
    
    // Determine length category
    const length = wordCount < 8 ? 'short' : wordCount < 15 ? 'medium' : 'long';
    
    // Calculate complexity score
    const complexity = calculateComplexity(sentence, type, wordCount);
    
    // Find issues
    const issues = findSentenceIssues(sentence, wordCount, type);
    
    // Generate basic suggestions
    const suggestions = generateBasicSuggestions(sentence, type, wordCount, textType);
    
    return {
      id: `sentence-${index}`,
      sentence,
      type,
      length,
      complexity,
      issues,
      suggestions,
      position: { start: 0, end: sentence.length }
    };
  };

  // Determine sentence type
  const determineSentenceType = (sentence: string): SentenceAnalysis['type'] => {
    const lowerSentence = sentence.toLowerCase();
    
    // Check for compound-complex
    if (lowerSentence.match(/(?:and|but|or).*(?:because|although|since|while|when|if)/)) {
      return 'compound-complex';
    }
    
    // Check for complex
    if (lowerSentence.match(/\b(?:because|although|since|while|when|if|unless|after|before)\b/)) {
      return 'complex';
    }
    
    // Check for compound
    if (lowerSentence.match(/\b(?:and|but|or|so|yet|for|nor)\b/)) {
      return 'compound';
    }
    
    return 'simple';
  };

  // Calculate complexity score
  const calculateComplexity = (sentence: string, type: string, wordCount: number): number => {
    let score = 1;
    
    // Base score by type
    switch (type) {
      case 'simple': score = 2; break;
      case 'compound': score = 4; break;
      case 'complex': score = 6; break;
      case 'compound-complex': score = 8; break;
    }
    
    // Adjust for length
    if (wordCount > 20) score += 2;
    else if (wordCount > 15) score += 1;
    else if (wordCount < 6) score -= 1;
    
    // Adjust for sophisticated vocabulary
    const sophisticatedWords = sentence.match(/\b(?:magnificent|extraordinary|consequently|furthermore|nevertheless|simultaneously)\b/gi);
    if (sophisticatedWords) score += sophisticatedWords.length;
    
    return Math.min(10, Math.max(1, score));
  };

  // Find sentence issues
  const findSentenceIssues = (sentence: string, wordCount: number, type: string): SentenceIssue[] => {
    const issues: SentenceIssue[] = [];
    
    // Run-on sentences
    if (wordCount > 25) {
      issues.push({
        type: 'run_on',
        description: 'This sentence might be too long and complex',
        severity: 'medium',
        suggestion: 'Consider breaking this into two shorter sentences'
      });
    }
    
    // Too simple for NSW Selective
    if (type === 'simple' && wordCount < 8) {
      issues.push({
        type: 'too_simple',
        description: 'This sentence could be more sophisticated',
        severity: 'low',
        suggestion: 'Try adding descriptive details or combining with another sentence'
      });
    }
    
    // Repetitive sentence starters
    const starter = sentence.split(' ')[0].toLowerCase();
    if (['the', 'i', 'it', 'they', 'he', 'she'].includes(starter)) {
      issues.push({
        type: 'repetitive',
        description: 'Consider varying your sentence starters',
        severity: 'low',
        suggestion: 'Try starting with an adverb, prepositional phrase, or dependent clause'
      });
    }
    
    return issues;
  };

  // Generate basic suggestions
  const generateBasicSuggestions = (
    sentence: string, 
    type: string, 
    wordCount: number, 
    textType: string
  ): SentenceImprovement[] => {
    const suggestions: SentenceImprovement[] = [];
    
    // Suggest combining short simple sentences
    if (type === 'simple' && wordCount < 10) {
      suggestions.push({
        type: 'combine',
        description: 'Combine with the next sentence for better flow',
        example: 'The cat sat. The dog barked. → The cat sat while the dog barked.',
        benefit: 'Creates more sophisticated sentence structure'
      });
    }
    
    // Suggest enhancing with descriptive details
    if (wordCount < 12) {
      suggestions.push({
        type: 'enhance',
        description: 'Add descriptive details to make it more vivid',
        example: 'She ran. → She ran swiftly through the misty forest.',
        benefit: 'Makes writing more engaging and sophisticated'
      });
    }
    
    // Suggest varying sentence starters
    const starters = sophisticatedStarters[textType as keyof typeof sophisticatedStarters] || sophisticatedStarters.narrative;
    const randomStarter = starters[Math.floor(Math.random() * starters.length)];
    
    suggestions.push({
      type: 'vary',
      description: 'Try a more sophisticated sentence starter',
      example: `${randomStarter} ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`,
      benefit: 'Shows advanced writing skills and improves flow'
    });
    
    return suggestions;
  };

  // Get AI enhancement suggestions
  const getAIEnhancement = async (sentence: string, textType: string): Promise<SentenceImprovement[]> => {
    if (assistanceLevel === 'minimal') return [];
    
    try {
      const prompt = `Analyze this sentence from a ${textType} piece by a 10-12 year old preparing for NSW Selective test. Suggest ONE specific improvement that would make it more sophisticated while keeping it age-appropriate.

Sentence: "${sentence}"

Provide:
1. Type of improvement (combine/split/enhance/vary)
2. Specific suggestion
3. Example of the improved sentence
4. Why this improvement helps for selective school writing

Format as: TYPE|DESCRIPTION|EXAMPLE|BENEFIT`;

      const response = await generateChatResponse({
        userMessage: prompt,
        textType: 'sentence_analysis',
        currentContent: sentence,
        wordCount: sentence.split(/\s+/).length,
        context: 'NSW Selective sentence structure improvement'
      });

      return parseAISentenceResponse(response);
    } catch (error) {
      console.error('AI sentence enhancement failed:', error);
      return [];
    }
  };

  // Parse AI sentence response
  const parseAISentenceResponse = (response: string): SentenceImprovement[] => {
    const suggestions: SentenceImprovement[] = [];
    const lines = response.split('\n').filter(line => line.includes('|'));
    
    lines.forEach(line => {
      const parts = line.split('|');
      if (parts.length >= 4) {
        const [type, description, example, benefit] = parts;
        suggestions.push({
          type: type.toLowerCase() as any,
          description: description.trim(),
          example: example.trim(),
          benefit: benefit.trim()
        });
      }
    });
    
    return suggestions;
  };

  // Calculate overall statistics
  const calculateOverallStats = (analyses: SentenceAnalysis[]) => {
    if (analyses.length === 0) {
      return {
        averageLength: 0,
        complexityScore: 0,
        varietyScore: 0,
        readabilityLevel: 'beginner'
      };
    }
    
    const totalWords = analyses.reduce((sum, analysis) => 
      sum + analysis.sentence.split(/\s+/).length, 0
    );
    const averageLength = totalWords / analyses.length;
    
    const averageComplexity = analyses.reduce((sum, analysis) => 
      sum + analysis.complexity, 0
    ) / analyses.length;
    
    // Calculate variety score based on sentence type distribution
    const typeCount = analyses.reduce((count, analysis) => {
      count[analysis.type] = (count[analysis.type] || 0) + 1;
      return count;
    }, {} as Record<string, number>);
    
    const varietyScore = Object.keys(typeCount).length * 2.5; // Max 10 for 4 types
    
    const readabilityLevel = averageComplexity < 3 ? 'beginner' : 
                           averageComplexity < 6 ? 'intermediate' : 'advanced';
    
    return {
      averageLength: Math.round(averageLength * 10) / 10,
      complexityScore: Math.round(averageComplexity * 10) / 10,
      varietyScore: Math.round(varietyScore * 10) / 10,
      readabilityLevel
    };
  };

  // Handle sentence improvement
  const handleSentenceImprovement = (original: string, improved: string) => {
    onSentenceImproved(original, improved);
  };

  // Debounced analysis
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      analyzeSentences(content);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [content, isVisible]);

  const getComplexityColor = (complexity: number) => {
    if (complexity < 3) return 'red';
    if (complexity < 6) return 'yellow';
    if (complexity < 8) return 'blue';
    return 'green';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Sentence Structure Analysis</h3>
        </div>
        <div className="text-sm text-gray-600">
          {isAnalyzing ? 'Analyzing...' : `${sentenceAnalyses.length} sentences`}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Avg Length</span>
          </div>
          <span className="text-lg font-bold text-blue-900">{overallStats.averageLength}</span>
          <span className="text-xs text-blue-600 ml-1">words</span>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-1">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Complexity</span>
          </div>
          <span className="text-lg font-bold text-purple-900">{overallStats.complexityScore}</span>
          <span className="text-xs text-purple-600 ml-1">/10</span>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-1">
            <Star className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Variety</span>
          </div>
          <span className="text-lg font-bold text-green-900">{overallStats.varietyScore}</span>
          <span className="text-xs text-green-600 ml-1">/10</span>
        </div>

        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-2 mb-1">
            <Target className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Level</span>
          </div>
          <span className="text-sm font-bold text-orange-900 capitalize">{overallStats.readabilityLevel}</span>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            <span className="text-blue-800 font-medium">Analyzing sentence structures...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}

      {/* Sentence Analysis */}
      {sentenceAnalyses.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Individual Sentence Analysis</span>
          </h4>

          {sentenceAnalyses.map((analysis) => (
            <div key={analysis.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedSentence(expandedSentence === analysis.id ? null : analysis.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${getComplexityColor(analysis.complexity)}-100 text-${getComplexityColor(analysis.complexity)}-700`}>
                        {analysis.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.sentence.split(/\s+/).length} words
                      </span>
                      <span className="text-xs text-gray-500">
                        Complexity: {analysis.complexity}/10
                      </span>
                      {analysis.issues.length > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          {analysis.issues.length} issue{analysis.issues.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {analysis.sentence}
                    </p>
                  </div>
                  {expandedSentence === analysis.id ? 
                    <ChevronUp className="w-5 h-5 text-gray-400 ml-2" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-400 ml-2" />
                  }
                </div>
              </div>

              {expandedSentence === analysis.id && (
                <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                  {/* Full sentence */}
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Full Sentence:</h5>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                      {analysis.sentence}
                    </p>
                  </div>

                  {/* Issues */}
                  {analysis.issues.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span>Issues to Address:</span>
                      </h5>
                      <div className="space-y-2">
                        {analysis.issues.map((issue, index) => (
                          <div key={index} className={`p-3 rounded-lg bg-${getSeverityColor(issue.severity)}-50 border border-${getSeverityColor(issue.severity)}-200`}>
                            <p className={`text-sm font-medium text-${getSeverityColor(issue.severity)}-800 mb-1`}>
                              {issue.description}
                            </p>
                            <p className={`text-xs text-${getSeverityColor(issue.severity)}-600`}>
                              💡 {issue.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <span>Improvement Suggestions:</span>
                      </h5>
                      <div className="space-y-3">
                        {analysis.suggestions.map((suggestion, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800 mb-1">
                                  {suggestion.description}
                                </p>
                                <p className="text-sm text-blue-700 bg-white p-2 rounded mb-2">
                                  <strong>Example:</strong> {suggestion.example}
                                </p>
                                <p className="text-xs text-blue-600">
                                  <strong>Why it helps:</strong> {suggestion.benefit}
                                </p>
                              </div>
                              <button
                                onClick={() => handleSentenceImprovement(analysis.sentence, suggestion.example)}
                                className="ml-3 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Apply</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tips for NSW Selective */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start space-x-2">
          <Target className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-medium mb-2">Sentence Structure Tips for NSW Selective:</p>
            <ul className="text-xs space-y-1">
              <li>• Mix simple, compound, and complex sentences for variety</li>
              <li>• Aim for 12-18 words per sentence on average</li>
              <li>• Start sentences in different ways to show sophistication</li>
              <li>• Use connecting words like "although," "meanwhile," "consequently"</li>
              <li>• Combine short sentences to create more complex structures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}