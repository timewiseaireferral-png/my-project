/**
 * CodeMirrorLinter.ts
 * Wraps the existing GrammarSpellingChecker to integrate with CodeMirror 6's linting system.
 */
import { linter, Diagnostic } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { GrammarSpellingChecker, GrammarError } from "./grammarSpellingChecker";

// Instantiate the checker
const checker = new GrammarSpellingChecker();

// Map GrammarError severity to CodeMirror Diagnostic severity
const mapSeverity = (severity: GrammarError['severity']): Diagnostic['severity'] => {
  switch (severity) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
    default:
      return 'info';
  }
};

// Map GrammarError to CodeMirror Diagnostic
const toDiagnostic = (error: GrammarError): Diagnostic => {
  // Create a message that includes the suggestion for the quick-fix tooltip
  const message = `${error.message} (Suggestion: ${error.suggestions.join(', ')})`;

  return {
    from: error.start,
    to: error.end,
    message: message,
    severity: mapSeverity(error.severity),
    source: "Writing Mate Coach",
    // Add a custom action for quick-fix application
    actions: error.suggestions.length > 0 ? [{
      name: `Fix: ${error.suggestions[0]}`,
      apply(view: EditorView, from: number, to: number) {
        view.dispatch({
          changes: { from, to, insert: error.suggestions[0] }
        });
      }
    }] : []
  };
};

// Create the linter function
export const writingCoachLinter = linter(view => {
  const text = view.state.doc.toString();
  
  // The checkText method is synchronous, so we can return the result directly.
  // CodeMirror's linter extension handles the debouncing (via the { delay: 500 } option).
  const errors = checker.checkText(text);
  const diagnostics = errors.map(toDiagnostic);
  return diagnostics;
}, { delay: 500 }); // CodeMirror's built-in debounce

// Export the checker instance for potential external use (e.g., in WritingWorkspace)
export { checker as grammarSpellingCheckerInstance };