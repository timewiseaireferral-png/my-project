import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, X } from 'lucide-react';
import { grammarSpellingChecker, GrammarError } from '../utils/grammarSpellingChecker';

interface AIGrammarCorrection {
  original: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
}

interface GrammarCorrectionPanelProps {
  text: string;
  aiCorrections?: AIGrammarCorrection[];
  onApplyCorrection?: (start: number, end: number, correction: string) => void;
}

export const GrammarCorrectionPanel: React.FC<GrammarCorrectionPanelProps> = ({
  text,
  aiCorrections,
  onApplyCorrection
}) => {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [selectedError, setSelectedError] = useState<GrammarError | null>(null);

  useEffect(() => {
    if (!text || text.trim().length === 0) {
      setErrors([]);
      return;
    }

    // Prioritize AI corrections if available
    if (aiCorrections && aiCorrections.length > 0) {
      const aiErrors: GrammarError[] = aiCorrections.map(correction => ({
        type: 'grammar',
        message: correction.explanation,
        start: correction.position.start,
        end: correction.position.end,
        severity: 'high' as const,
        suggestions: [correction.suggestion],
        original: correction.original
      }));
      setErrors(aiErrors);
    } else {
      // Fall back to hardcoded checker if no AI corrections available
      const detectedErrors = grammarSpellingChecker.checkText(text);
      setErrors(detectedErrors);
    }
  }, [text, aiCorrections]);

  const handleApplyCorrection = (error: GrammarError, suggestion: string) => {
    if (onApplyCorrection) {
      onApplyCorrection(error.start, error.end, suggestion);
    }
    dismissError(error);
  };

  const dismissError = (error: GrammarError) => {
    const errorKey = `${error.start}-${error.end}-${error.message}`;
    setDismissedErrors(prev => new Set(prev).add(errorKey));
  };

  const isErrorDismissed = (error: GrammarError): boolean => {
    const errorKey = `${error.start}-${error.end}-${error.message}`;
    return dismissedErrors.has(errorKey);
  };

  const visibleErrors = errors.filter(error => !isErrorDismissed(error));

  const getErrorTypeColor = (type: string): string => {
    switch (type) {
      case 'grammar': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'spelling': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
      case 'punctuation': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
      case 'capitalization': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700';
      case 'word-choice': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'style': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'medium': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'low': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getErrorTypeLabel = (type: string): string => {
    switch (type) {
      case 'grammar': return 'Grammar';
      case 'spelling': return 'Spelling';
      case 'punctuation': return 'Punctuation';
      case 'capitalization': return 'Capitalization';
      case 'word-choice': return 'Word Choice';
      case 'style': return 'Style';
      default: return 'Error';
    }
  };

  const getErrorText = (error: GrammarError): string => {
    return text.substring(error.start, error.end);
  };

  if (visibleErrors.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-center space-x-3 text-green-600 dark:text-green-400">
          <CheckCircle className="w-6 h-6" />
          <p className="font-medium dark:text-gray-200">No grammar, spelling, or punctuation errors detected!</p>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2">
          Your writing looks great! Keep up the good work.
        </p>
      </div>
    );
  }

  const errorsByType = visibleErrors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, GrammarError[]>);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Grammar & Spelling Corrections
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Found {visibleErrors.length} {visibleErrors.length === 1 ? 'issue' : 'issues'} that can be improved
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(errorsByType).map(([type, typeErrors]) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className={`px-2 py-1 rounded-full ${getErrorTypeColor(type)}`}>
                {getErrorTypeLabel(type)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">({typeErrors.length})</span>
            </div>

            {typeErrors.map((error, index) => (
              <div
                key={`${error.start}-${index}`}
                className={`border rounded-lg p-3 ${getErrorTypeColor(error.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    {getErrorIcon(error.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-sm bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-300 dark:border-slate-600 dark:text-gray-200">
                          "{getErrorText(error)}"
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{error.message}</p>

                      {error.suggestions && error.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Suggestions:</p>
                          <div className="flex flex-wrap gap-2">
                            {error.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleApplyCorrection(error, suggestion)}
                                className="px-3 py-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600 transition-colors font-medium text-gray-700 dark:text-gray-200"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissError(error)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                    title="Dismiss this error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {visibleErrors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-2 text-xs text-gray-600">
            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Click on any suggestion to automatically apply the correction to your text.
              You can dismiss suggestions that don't apply to your writing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
