/**
 * Enhanced InteractiveTextEditor with CodeMirror 6 for real-time linting and highlighting.
 * Copy to: src/components/InteractiveTextEditor.tsx
 */
import React from "react";
import { EditorState, EditorSelection, TransactionSpec } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder as placeholderExtension } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { basicSetup } from "@codemirror/basic-setup";
import { linter } from "@codemirror/lint";
import { writingCoachLinter } from "../utils/CodeMirrorLinter";
import { detectNewParagraphs, detectWordThreshold } from "../lib/paragraphDetection";
import { eventBus } from "../lib/eventBus";

// Define the custom CodeMirror extensions
const customExtensions = [
  basicSetup,
  lineNumbers(),
  highlightActiveLine(),
  keymap.of(defaultKeymap),
  EditorView.lineWrapping, // Crucial for a prose editor
  linter(writingCoachLinter, { delay: 500 }), // Integrate the custom linter
];

export interface EditorHandle {
  getText(): string;
  setText(text: string): void;
  applyFix(start: number, end: number, replacement: string): void;
}

interface InteractiveTextEditorProps {
  initial?: string;
  placeholder?: string;
  className?: string;
  onTextChange?: (text: string) => void;
  onProgressUpdate?: (metrics: any) => void;
}

export const InteractiveTextEditor = React.forwardRef<EditorHandle, InteractiveTextEditorProps>(({
  initial = "",
  placeholder = "Start your draft here…",
  className = "w-full h-96 p-3 rounded-xl border",
  onTextChange,
  onProgressUpdate
}, ref) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const prevTextRef = React.useRef(initial);
  const lastFeedbackWordCountRef = React.useRef(0);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize CodeMirror
  React.useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: initial,
      extensions: [
        ...customExtensions,
        placeholderExtension(placeholder),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const next = update.state.doc.toString();
            
            // 1. Check for completed paragraphs
            const paragraphEvents = detectNewParagraphs(prevTextRef.current, next);
            if (paragraphEvents.length > 0) {
              paragraphEvents.forEach(event => {
                eventBus.emit("paragraph.ready", event);
              });
            }

            // 2. Check for word threshold milestones
            const wordThresholdEvent = detectWordThreshold(prevTextRef.current, next, 20);
            if (wordThresholdEvent) {
              eventBus.emit("paragraph.ready", {
                paragraph: wordThresholdEvent.text,
                index: 0,
                wordCount: wordThresholdEvent.wordCount,
                trigger: 'word_threshold'
              });
            }

            // 3. Handle delayed feedback for when user pauses typing
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              const currentWordCount = next.trim() ? next.trim().split(/\s+/).length : 0;
              const lastFeedbackWordCount = lastFeedbackWordCountRef.current;
              
              if (currentWordCount >= 15 && currentWordCount > lastFeedbackWordCount + 10) {
                const paragraphs = next.split('\n\n').filter(p => p.trim());
                const recentText = paragraphs[paragraphs.length - 1] || next.slice(-200);
                
                eventBus.emit("paragraph.ready", {
                  paragraph: recentText,
                  index: 0,
                  wordCount: currentWordCount,
                  trigger: 'typing_pause'
                });
                
                lastFeedbackWordCountRef.current = currentWordCount;
              }
            }, 3000); // 3 second pause

            prevTextRef.current = next;
            
            // Call the onTextChange callback
            if (onTextChange) {
              onTextChange(next);
            }
            
            // Call progress update callback
            if (onProgressUpdate) {
              const wordCount = next.trim() ? next.trim().split(/\s+/).length : 0;
              onProgressUpdate({ wordCount, text: next });
            }
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [initial, placeholder, onTextChange, onProgressUpdate]);

  // Expose imperative handle methods
  React.useImperativeHandle(ref, () => ({
    getText: () => viewRef.current?.state.doc.toString() || "",
    setText: (t: string) => {
      const view = viewRef.current;
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: t },
          selection: EditorSelection.cursor(t.length)
        });
      }
    },
    applyFix: (start: number, end: number, replacement: string) => {
      const view = viewRef.current;
      if (view) {
        const transaction: TransactionSpec = {
          changes: { from: start, to: end, insert: replacement }
        };
        view.dispatch(transaction);
      }
    }
  }), []);

  return (
    <div 
      ref={editorRef} 
      className={`cm-editor-container ${className}`}
      style={{ minHeight: '400px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}
    />
  );
});

InteractiveTextEditor.displayName = 'InteractiveTextEditor';

// Default export for compatibility
export default InteractiveTextEditor;