import React, { useState } from 'react';

interface NSWStandaloneSubmitSystemProps {
  content: string;
  textType: string;
  wordCount: number; // Added wordCount prop based on usage in WritingWorkspace.tsx
  onEvaluationComplete: (report: any) => void; // Corrected prop name
  onClose: () => void;
}

export function NSWStandaloneSubmitSystem({
  content,
  textType,
  wordCount, // Added wordCount prop
  onEvaluationComplete, // Corrected prop name
  onClose,
}: NSWStandaloneSubmitSystemProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEvaluation = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Retrieve prompt from localStorage
      const prompt = localStorage.getItem("generatedPrompt") || localStorage.getItem(`${textType.toLowerCase()}_prompt`) || "";

      if (!content || content.trim().length === 0) {
        throw new Error("Essay content cannot be empty.");
      }

      console.log("NSWStandaloneSubmitSystem: Calling AI evaluation API...");

      // Call AI evaluation backend
      const response = await fetch("/.netlify/functions/nsw-ai-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayContent: content,
          textType: textType,
          prompt: prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to evaluate essay");
      }

      const report = await response.json();
      console.log("NSWStandaloneSubmitSystem: AI evaluation received:", report);
      onEvaluationComplete(report); // Corrected prop name
    } catch (err: any) {
      console.error("NSWStandaloneSubmitSystem: Submission error:", err);
      setError(err.message || "Failed to generate analysis report. Please try again.");
      onEvaluationComplete(null); // Corrected prop name
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    submitEvaluation();
  }, []); // Run once on mount

  return null; // This component no longer renders UI directly
}