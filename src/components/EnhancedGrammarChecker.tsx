import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, BookOpen, Lightbulb, X, ThumbsUp } from 'lucide-react';
import { generateChatResponse } from '../lib/openai';

interface GrammarIssue {
  id: string;
  type: 'grammar' | 'punctuation' | 'spelling' | 'sentence_structure';
  original: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
  severity: 'low' | 'medium' | 'high';
  example: string;
}

interface EnhancedGrammarCheckerProps {
  content: string;
  onContentChange: (newContent: string) => void;
  isEnabled: boolean;
  textType: string;
}

export function EnhancedGrammarChecker({
  content,
  onContentChange,
  isEnabled,
  textType
}: EnhancedGrammarCheckerProps) {
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<GrammarIssue | null>(null);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

  // Common grammar patterns for 10-12 year olds
  const commonIssues = {
    apostrophes: {
      pattern: /\b(its)\b/g,
      check: (match: string, context: string) => {
        // Check if "its" should be "it's"
        const beforeContext = context.substring(0, context.indexOf(match));
        const afterContext = context.substring(context.indexOf(match) + match.length);
        
        // Simple heuristic: if followed by a verb, might need apostrophe
        if (afterContext.match(/^\s+(is|was|been|going)/)) {
          return {
            type: 'grammar' as const,
            suggestion: "it's",
            explanation: "Use 'it's' when you mean 'it is' or 'it has'. Use 'its' to show possession.",
            example: "It's raining outside. The dog wagged its tail."
          };
        }
        return null;
      }
    },
    
    commaSpices: {
      pattern: /([.!?])\s*([a-z])/g,
      check: (match: string, context: string) => {
        // Check for comma splices (two independent clauses joined by comma)
        const sentences = context.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (sentence.includes(',') && sentence.split(',').length === 2) {
            const parts = sentence.split(',');
            if (parts[0].trim().split(' ').length > 3 && parts[1].trim().split(' ').length > 3) {
              return {
                type: 'punctuation' as const,
                suggestion: "Use a period, semicolon, or conjunction",
                explanation: "A comma splice occurs when two complete sentences are joined by only a comma. Fix this by using a period, semicolon, or adding a conjunction like 'and', 'but', or 'so'.",
                example: "Wrong: I went to the store, I bought milk. Right: I went to the store, and I bought milk."
              };
            }
          }
        }
        return null;
      }
    },

    subjectVerbAgreement: {
      pattern: /\b(he|she|it)\s+(are|were)\b/gi,
      check: (match: string) => ({
        type: 'grammar' as const,
        suggestion: match.replace(/(are|were)/i, (m) => m.toLowerCase() === 'are' ? 'is' : 'was'),
        explanation: "Singular subjects (he, she, it) need singular verbs (is, was), while plural subjects need plural verbs (are, were).",
        example: "He is happy. They are happy."
      })
    },

    sentenceFragments: {
      pattern: /\.\s*([A-Z][a-z]*ing\s+[^.!?]*[.!?])/g,
      check: (match: string) => ({
        type: 'sentence_structure' as const,
        suggestion: "Connect to previous sentence or add a subject",
        explanation: "This looks like a sentence fragment. Every sentence needs a subject (who or what) and a predicate (what they do).",
        example: "Fragment: Running quickly. Complete: She was running quickly."
      })
    }
  };

  // Analyze content for grammar issues
  const analyzeGrammar = async (text: string) => {
    if (!isEnabled || text.length < 10 || text === lastAnalyzedContent) return;
    
    setIsAnalyzing(true);
    
    try {
      // First, check common patterns
      const patternIssues = findPatternIssues(text);
      
      // Then get AI-powered analysis
      const aiIssues = await getAIGrammarAnalysis(text);
      
      // Combine and deduplicate
      const allIssues = [...patternIssues, ...aiIssues]
        .sort((a, b) => a.position.start - b.position.start)
        .slice(0, 8); // Limit to 8 issues to avoid overwhelming
      
      setGrammarIssues(allIssues);
      setLastAnalyzedContent(text);
    } catch (error) {
      console.error('Grammar analysis error:', error);
      // Fallback to pattern-only analysis
      const patternIssues = findPatternIssues(text);
      setGrammarIssues(patternIssues);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Find issues using pattern matching
  const findPatternIssues = (text: string): GrammarIssue[] => {
    const issues: GrammarIssue[] = [];
    
    Object.entries(commonIssues).forEach(([key, rule]) => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        const result = rule.check(match[0], text);
        if (result) {
          issues.push({
            id: `pattern-${key}-${match.index}`,
            type: result.type,
            original: match[0],
            suggestion: result.suggestion,
            explanation: result.explanation,
            position: { start: match.index, end: match.index + match[0].length },
            severity: 'medium',
            example: result.example
          });
        }
      }
    });
    
    return issues;
  };

  // Get AI-powered grammar analysis
  const getAIGrammarAnalysis = async (text: string): Promise<GrammarIssue[]> => {
    const prompt = `Analyze this writing by a 10-12 year old for grammar, punctuation, and spelling errors. Focus on common mistakes for this age group and provide helpful, encouraging explanations.

Text: "${text}"

For each error found, provide:
1. The exact text that has the error
2. The suggested correction
3. A simple explanation suitable for a 10-12 year old
4. An example showing correct usage

Format each error as:
ERROR_TYPE|ORIGINAL_TEXT|SUGGESTION|EXPLANATION|EXAMPLE|START_POS|END_POS|SEVERITY

Error types: grammar, punctuation, spelling, sentence_structure
Severity: low, medium, high

Focus on the most important errors that will help improve their writing for NSW Selective test.`;

    try {
      const response = await generateChatResponse({
        userMessage: prompt,
        textType: 'grammar_analysis',
        currentContent: text,
        wordCount: text.split(/\s+/).length,
        context: 'Grammar checking for NSW Selective test preparation'
      });

      return parseAIGrammarResponse(response, text);
    } catch (error) {
      console.error('AI grammar analysis failed:', error);
      return [];
    }
  };

  // Parse AI response into grammar issues
  const parseAIGrammarResponse = (response: string, text: string): GrammarIssue[] => {
    const issues: GrammarIssue[] = [];
    const lines = response.split('\n').filter(line => line.includes('|'));
    
    lines.forEach((line, index) => {
      const parts = line.split('|');
      if (parts.length >= 7) {
        const [type, original, suggestion, explanation, example, startStr, endStr, severity] = parts;
        
        // Find the position of the original text in the content
        const start = text.toLowerCase().indexOf(original.toLowerCase());
        if (start !== -1) {
          issues.push({
            id: `ai-${index}`,
            type: type.toLowerCase() as any,
            original: original.trim(),
            suggestion: suggestion.trim(),
            explanation: explanation.trim(),
            position: { start, end: start + original.length },
            severity: (severity?.toLowerCase() as any) || 'medium',
            example: example.trim()
          });
        }
      }
    });
    
    return issues;
  };

  // Apply correction
  const applyCorrection = (issue: GrammarIssue) => {
    const { start, end } = issue.position;
    const newContent = content.substring(0, start) + issue.suggestion + content.substring(end);
    onContentChange(newContent);
    
    // Remove the corrected issue
    setGrammarIssues(prev => prev.filter(i => i.id !== issue.id));
    setSelectedIssue(null);
  };

  // Dismiss issue
  const dismissIssue = (issueId: string) => {
    setGrammarIssues(prev => prev.filter(i => i.id !== issueId));
    if (selectedIssue?.id === issueId) {
      setSelectedIssue(null);
    }
  };

  // Debounced analysis
  useEffect(() => {
    if (!isEnabled) return;
    
    const timer = setTimeout(() => {
      analyzeGrammar(content);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [content, isEnabled]);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'grammar': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'punctuation': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'spelling': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'sentence_structure': return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'red';
      case 'punctuation': return 'orange';
      case 'spelling': return 'blue';
      case 'sentence_structure': return 'purple';
      default: return 'gray';
    }
  };

  if (!isEnabled || grammarIssues.length === 0) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">
            {isAnalyzing ? 'Checking your writing...' : 'Great job! No grammar issues found.'}
          </span>
        </div>
        {isAnalyzing && (
          <div className="mt-2">
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Grammar & Writing Check
            </span>
          </div>
          <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
            {grammarIssues.length} suggestion{grammarIssues.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isAnalyzing && (
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '40%' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {grammarIssues.map((issue) => (
          <div
            key={issue.id}
            className={`p-4 rounded-lg border-l-4 border-${getIssueColor(issue.type)}-400 bg-${getIssueColor(issue.type)}-50 hover:bg-${getIssueColor(issue.type)}-100 transition-colors cursor-pointer`}
            onClick={() => setSelectedIssue(issue)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getIssueIcon(issue.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-medium text-${getIssueColor(issue.type)}-800 capitalize`}>
                      {issue.type.replace('_', ' ')} Issue
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded bg-${getIssueColor(issue.type)}-200 text-${getIssueColor(issue.type)}-700`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className={`text-sm text-${getIssueColor(issue.type)}-700 mb-2`}>
                    <span className="font-medium">Found:</span> "{issue.original}"
                  </p>
                  <p className={`text-sm text-${getIssueColor(issue.type)}-600`}>
                    {issue.explanation}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissIssue(issue.id);
                }}
                className={`p-1 hover:bg-${getIssueColor(issue.type)}-200 rounded`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Issue Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getIssueIcon(selectedIssue.type)}
                <h3 className="font-semibold text-gray-800 capitalize">
                  {selectedIssue.type.replace('_', ' ')} Suggestion
                </h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Original text:</p>
                <p className="text-sm font-medium text-gray-800 bg-gray-100 p-2 rounded">
                  "{selectedIssue.original}"
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Suggested correction:</p>
                <p className="text-sm font-medium text-green-800 bg-green-100 p-2 rounded">
                  "{selectedIssue.suggestion}"
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Why this helps:</p>
                <p className="text-sm text-gray-700">
                  {selectedIssue.explanation}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Example:</p>
                <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                  {selectedIssue.example}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => applyCorrection(selectedIssue)}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Apply Fix</span>
                </button>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Keep Original
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}