/**
 * Dynamic AI Coach Service
 *
 * This service eliminates hardcoded content and generates all AI Coach suggestions,
 * examples, vocabulary, and guidance dynamically based on:
 * 1. User's writing prompt
 * 2. User's current content
 * 3. Text type
 * 4. Writing phase/word count
 */

interface DynamicContentRequest {
  writingPrompt: string;
  currentContent: string;
  textType: string;
  wordCount: number;
  userId?: string;
}

interface DynamicExample {
  title: string;
  content: string;
  explanation: string;
  category: string;
}

interface DynamicVocabulary {
  word: string;
  definition: string;
  example: string;
  contextRelevance: string;
}

interface DynamicSuggestion {
  suggestion: string;
  example: string;
  nextStep: string;
  priority: 'high' | 'medium' | 'low';
}

interface DynamicStepGuidance {
  currentStep: string;
  description: string;
  tips: string[];
  example: string;
  nextAction: string;
}

/**
 * Generate dynamic examples based on user's prompt and content
 */
export async function generateDynamicExamples(
  request: DynamicContentRequest
): Promise<DynamicExample[]> {
  const { writingPrompt, currentContent, textType, wordCount } = request;

  try {
    const response = await fetch('/.netlify/functions/ai-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'generate_examples',
        writingPrompt,
        currentContent,
        textType,
        wordCount,
        systemPrompt: `You are an expert writing coach helping a student write a ${textType} piece.

CONTEXT:
- Writing Prompt: "${writingPrompt}"
- Student's Current Work (${wordCount} words): "${currentContent}"

Generate 3-4 highly relevant examples that:
1. Are directly related to their specific prompt and current content
2. Show techniques they can apply to improve their writing
3. Match the ${textType} text type requirements
4. Are at an appropriate skill level for their age (10-12 years old)

Return as JSON array with format:
[
  {
    "title": "Brief descriptive title",
    "content": "The actual example text (2-3 sentences)",
    "explanation": "Why this example is relevant to their writing",
    "category": "What aspect this demonstrates (e.g., 'Opening Hook', 'Character Development', 'Descriptive Language')"
  }
]`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate examples');
    }

    const data = await response.json();
    return data.examples || [];
  } catch (error) {
    console.error('Error generating dynamic examples:', error);
    return getFallbackExamples(textType, writingPrompt);
  }
}

/**
 * Generate dynamic vocabulary suggestions
 */
export async function generateDynamicVocabulary(
  request: DynamicContentRequest
): Promise<DynamicVocabulary[]> {
  const { writingPrompt, currentContent, textType, wordCount } = request;

  try {
    const response = await fetch('/.netlify/functions/ai-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'generate_vocabulary',
        writingPrompt,
        currentContent,
        textType,
        wordCount,
        systemPrompt: `You are a vocabulary coach for a 10-12 year old student writing a ${textType} piece.

CONTEXT:
- Writing Prompt: "${writingPrompt}"
- Student's Current Work: "${currentContent}"

Analyze their writing and suggest 8-10 powerful vocabulary words that:
1. Are directly relevant to their prompt and story/essay
2. Would enhance their current writing if used
3. Are age-appropriate but sophisticated
4. Match the ${textType} text type requirements

For each word, explain HOW and WHERE they could use it in their specific piece.

Return as JSON array:
[
  {
    "word": "The vocabulary word",
    "definition": "Student-friendly definition",
    "example": "Example sentence using this word in context of THEIR prompt",
    "contextRelevance": "Where/how to use this in their current writing"
  }
]`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate vocabulary');
    }

    const data = await response.json();
    return data.vocabulary || [];
  } catch (error) {
    console.error('Error generating dynamic vocabulary:', error);
    return getFallbackVocabulary(textType);
  }
}

/**
 * Generate dynamic writing suggestions
 */
export async function generateDynamicSuggestions(
  request: DynamicContentRequest
): Promise<DynamicSuggestion> {
  const { writingPrompt, currentContent, textType, wordCount } = request;

  try {
    const response = await fetch('/.netlify/functions/ai-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'generate_suggestions',
        writingPrompt,
        currentContent,
        textType,
        wordCount,
        systemPrompt: `You are a writing coach providing real-time guidance for a ${textType} piece.

CONTEXT:
- Writing Prompt: "${writingPrompt}"
- Student's Current Work (${wordCount} words): "${currentContent}"

Analyze their current writing and provide:
1. A specific, actionable suggestion for their next step
2. An example showing how to implement the suggestion using THEIR prompt/content
3. Clear next action they should take

Be specific to what they've written so far. If they have a weak opening, suggest how to improve THEIR opening.
If they're stuck, give them a concrete next sentence or paragraph idea for THEIR story.

Return as JSON:
{
  "suggestion": "Specific suggestion based on their current writing",
  "example": "Concrete example using their prompt/content",
  "nextStep": "Clear action to take next",
  "priority": "high/medium/low"
}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate suggestions');
    }

    const data = await response.json();
    return data.suggestion || getFallbackSuggestion(textType, wordCount);
  } catch (error) {
    console.error('Error generating dynamic suggestions:', error);
    return getFallbackSuggestion(textType, wordCount);
  }
}

/**
 * Generate dynamic step-by-step guidance
 */
export async function generateDynamicStepGuidance(
  request: DynamicContentRequest
): Promise<DynamicStepGuidance> {
  const { writingPrompt, currentContent, textType, wordCount } = request;

  // Determine current phase
  let phase = 'planning';
  if (wordCount === 0) phase = 'getting-started';
  else if (wordCount < 50) phase = 'opening';
  else if (wordCount < 150) phase = 'development';
  else if (wordCount < 200) phase = 'building-climax';
  else phase = 'conclusion';

  try {
    const response = await fetch('/.netlify/functions/ai-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'generate_step_guidance',
        writingPrompt,
        currentContent,
        textType,
        wordCount,
        phase,
        systemPrompt: `You are a step-by-step writing guide for a ${textType} piece at the "${phase}" phase.

CONTEXT:
- Writing Prompt: "${writingPrompt}"
- Student's Current Work (${wordCount} words): "${currentContent}"
- Current Phase: ${phase}

Provide specific guidance for what they should focus on RIGHT NOW:
1. Name the current step they're on
2. Explain what this step involves for THEIR specific writing
3. Give 3-4 concrete tips for this phase
4. Provide an example relevant to THEIR prompt
5. Tell them what comes next

Return as JSON:
{
  "currentStep": "Name of current step",
  "description": "What this step means for their writing",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "example": "Example specific to their prompt",
  "nextAction": "What to do when this step is complete"
}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate step guidance');
    }

    const data = await response.json();
    return data.guidance || getFallbackStepGuidance(phase, textType);
  } catch (error) {
    console.error('Error generating dynamic step guidance:', error);
    return getFallbackStepGuidance(phase, textType);
  }
}

/**
 * Fallback examples when AI is unavailable
 */
function getFallbackExamples(textType: string, prompt: string): DynamicExample[] {
  return [
    {
      title: 'Start Writing',
      content: 'Begin by exploring your prompt: "' + prompt + '"',
      explanation: 'Connect with the AI to get personalized examples for your writing.',
      category: 'Getting Started'
    }
  ];
}

/**
 * Fallback vocabulary when AI is unavailable
 */
function getFallbackVocabulary(textType: string): DynamicVocabulary[] {
  const basicWords = ['vivid', 'compelling', 'intriguing', 'captivating'];
  return basicWords.map(word => ({
    word,
    definition: 'Connect to AI for detailed definitions',
    example: 'Connect to AI for contextual examples',
    contextRelevance: 'AI will suggest how to use this in your writing'
  }));
}

/**
 * Fallback suggestion when AI is unavailable
 */
function getFallbackSuggestion(textType: string, wordCount: number): DynamicSuggestion {
  if (wordCount === 0) {
    return {
      suggestion: 'Start writing your first sentence',
      example: 'Begin with an engaging opening that hooks your reader',
      nextStep: 'Write 2-3 sentences to get started',
      priority: 'high'
    };
  }

  return {
    suggestion: 'Keep developing your ideas',
    example: 'Connect to AI for personalized guidance based on your writing',
    nextStep: 'Continue writing and the AI will provide specific feedback',
    priority: 'medium'
  };
}

/**
 * Fallback step guidance when AI is unavailable
 */
function getFallbackStepGuidance(phase: string, textType: string): DynamicStepGuidance {
  return {
    currentStep: phase.charAt(0).toUpperCase() + phase.slice(1),
    description: `You're in the ${phase} phase of your ${textType} writing`,
    tips: [
      'Connect to the AI for personalized guidance',
      'Start writing to receive specific feedback',
      'Your tips will be customized to your prompt and content'
    ],
    example: 'AI will generate examples based on your specific writing',
    nextAction: 'Continue writing to move to the next phase'
  };
}

/**
 * Generate dynamic quick questions based on current content
 */
export async function generateQuickQuestions(
  request: DynamicContentRequest
): Promise<string[]> {
  const { writingPrompt, currentContent, textType, wordCount } = request;

  try {
    const response = await fetch('/.netlify/functions/ai-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'generate_quick_questions',
        writingPrompt,
        currentContent,
        textType,
        wordCount,
        systemPrompt: `Generate 4-5 quick question prompts for a student writing a ${textType} piece.

CONTEXT:
- Prompt: "${writingPrompt}"
- Current Work (${wordCount} words): "${currentContent}"

Generate questions that:
1. Are specific to their prompt and current content
2. Help them overcome writer's block
3. Guide them to the next step in their writing
4. Are phrased as helpful questions they can click to ask

Return as JSON array of strings:
["Question 1?", "Question 2?", "Question 3?"]`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate quick questions');
    }

    const data = await response.json();
    return data.questions || getFallbackQuestions(wordCount);
  } catch (error) {
    console.error('Error generating quick questions:', error);
    return getFallbackQuestions(wordCount);
  }
}

function getFallbackQuestions(wordCount: number): string[] {
  if (wordCount === 0) {
    return [
      'How should I start my story?',
      'What makes a good opening sentence?',
      'Can you help me brainstorm ideas?'
    ];
  }

  return [
    'How can I improve what I\'ve written?',
    'What should I write next?',
    'Is my writing on track?',
    'Can you suggest better words?'
  ];
}
