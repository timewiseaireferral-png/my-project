// netlify/functions/lib/hybridEvaluationService.js
// Advanced Hybrid Evaluation Service
// Combines LLM (GPT-4) for qualitative feedback with LanguageTool for grammar checking

const { OpenAI } = require("openai");
const LanguageToolAPI = require("languagetool-api").default;

/**
 * Get grammar and spelling corrections using LanguageTool
 * Provides robust, rule-based corrections
 */
async function getGrammarFeedback(text) {
  console.log('🔍 Running LanguageTool grammar check...');

  try {
    const results = await LanguageToolAPI.check({
      text: text,
      language: 'en-US'
    });

    const feedbackList = [];

    for (const match of results.matches) {
      // Filter out minor style issues to focus on core grammar and spelling
      if (['WHITESPACE_RULE', 'COMMA_PARENTHESIS_WHITESPACE', 'EN_QUOTES'].includes(match.rule.id)) {
        continue;
      }

      // Extract the suggested replacement
      const suggestion = match.replacements && match.replacements.length > 0
        ? match.replacements[0].value
        : null;

      // Determine type and severity
      let matchType = 'grammar-error';
      let severity = 'error';

      if (match.rule.issueType === 'misspelling' || match.rule.issueType === 'typographical') {
        matchType = 'spelling-error';
        severity = 'error';
      } else if (match.rule.issueType === 'style' || match.rule.issueType === 'non-standard') {
        matchType = 'style-warning';
        severity = 'warning';
      }

      feedbackList.push({
        original: text.substring(match.offset, match.offset + match.length),
        suggestion: suggestion,
        explanation: match.message,
        position: {
          start: match.offset,
          end: match.offset + match.length
        },
        type: matchType,
        severity: severity,
        ruleId: match.rule.id,
        category: match.rule.category.name
      });
    }

    console.log(`✅ LanguageTool found ${feedbackList.length} issues`);
    return feedbackList;
  } catch (error) {
    console.error('❌ LanguageTool error:', error.message);
    // Return empty array on error - don't fail the entire evaluation
    return [];
  }
}

/**
 * Validate feedback positions to prevent out-of-bounds errors
 */
function validateFeedbackPositions(feedbackData, originalText) {
  const textLength = originalText.length;

  // Validate feedback categories
  if (feedbackData.feedbackCategories) {
    for (const category of feedbackData.feedbackCategories) {
      if (category.strengths) {
        category.strengths = fixPositionsInItems(category.strengths, originalText, textLength);
      }

      if (category.areasForImprovement) {
        category.areasForImprovement = fixPositionsInItems(category.areasForImprovement, originalText, textLength);
      }
    }
  }

  // Validate grammar corrections
  if (feedbackData.grammarCorrections) {
    feedbackData.grammarCorrections = fixPositionsInItems(feedbackData.grammarCorrections, originalText, textLength);
  }

  // Validate vocabulary enhancements
  if (feedbackData.vocabularyEnhancements) {
    feedbackData.vocabularyEnhancements = fixPositionsInItems(feedbackData.vocabularyEnhancements, originalText, textLength);
  }

  // Validate highlights (for NSW evaluation format)
  if (feedbackData.highlights) {
    feedbackData.highlights = feedbackData.highlights.map(item => {
      if (item.startIndex < 0 || item.endIndex > textLength || item.startIndex > item.endIndex) {
        item.startIndex = 0;
        item.endIndex = 0;
      }
      return item;
    });
  }

  return feedbackData;
}

/**
 * Fix positions in feedback items
 */
function fixPositionsInItems(items, originalText, textLength) {
  return items.map(item => {
    // Handle different position formats
    let start, end;

    if (item.position) {
      start = item.position.start;
      end = item.position.end;
    } else if (typeof item.startIndex !== 'undefined') {
      start = item.startIndex;
      end = item.endIndex;
    }

    if (typeof start !== 'undefined' && typeof end !== 'undefined') {
      if (start < 0 || end > textLength || start > end) {
        // Invalidate position if it's clearly wrong
        if (item.position) {
          item.position = { start: 0, end: 0 };
        } else {
          item.startIndex = 0;
          item.endIndex = 0;
        }
      }
    }

    return item;
  });
}

/**
 * Create fallback feedback when LLM fails
 */
function createFallbackFeedback(content, wordCount, grammarFeedback) {
  console.log('⚠️ Creating fallback feedback due to LLM error');

  return {
    overallBand: 0,
    totalScore: 0,
    bandDescription: "Unable to generate automated feedback. Please try again.",
    criteriaScores: {
      ideasContent: { score: 0, outOf: 12, band: 0, rawScore: 0 },
      structureOrganization: { score: 0, outOf: 6, band: 0, rawScore: 0 },
      languageVocab: { score: 0, outOf: 7.5, band: 0, rawScore: 0 },
      spellingGrammar: { score: 0, outOf: 4.5, band: 0, rawScore: 0 }
    },
    highlights: [],
    detailedFeedback: {
      strengths: [],
      areasToImprove: ["Could not process feedback due to an error. Grammar check results are still available below."],
      nextSteps: ["Please try submitting your work again."]
    },
    grammarCorrections: grammarFeedback, // Still provide grammar feedback
    vocabularyEnhancements: [],
    narrativeStructure: {
      hasOrientation: false,
      hasComplication: false,
      hasClimax: false,
      hasResolution: false,
      structureNotes: "Unable to analyze structure"
    },
    error: true,
    errorMessage: "LLM evaluation failed but grammar checking succeeded"
  };
}

/**
 * Main hybrid evaluation function
 * Combines GPT-4 for qualitative feedback with LanguageTool for grammar
 */
async function generateHybridEvaluation(essayContent, textType, prompt, apiKey) {
  console.log('🚀 Starting hybrid evaluation...');
  console.log(`Text type: ${textType}, Word count: ${essayContent.split(/\s+/).length}`);

  // Validate inputs
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  if (!essayContent || essayContent.trim().length < 20) {
    throw new Error("Essay content is too short");
  }

  const openai = new OpenAI({ apiKey });
  const wordCount = essayContent.split(/\s+/).length;

  // Step 1: Get grammar feedback from LanguageTool (runs independently)
  const grammarFeedbackPromise = getGrammarFeedback(essayContent);

  // Step 2: Get qualitative feedback from GPT-4
  const systemPrompt = `You are an expert NSW Selective School writing assessor for students aged 9-11 preparing for placement tests.

Your role is to provide sophisticated, actionable feedback that:
1. Analyzes writing against official NSW marking criteria with proper weighting
2. Identifies specific strengths and areas for improvement with text positions
3. Provides before/after examples for improvements
4. Categorizes feedback by color: green (strengths), amber (improvements), blue (suggestions)

OFFICIAL NSW RUBRIC WEIGHTING (CRITICAL - FOLLOW EXACTLY):
- Content & Ideas: 40% of total mark (12 points out of 30)
- Text Structure: 20% of total mark (6 points out of 30)
- Language Features: 25% of total mark (7.5 points out of 30)
- Spelling & Grammar: 15% of total mark (4.5 points out of 30)

SCORING BANDS (1-6):
- Band 6 (Outstanding): Sophisticated vocabulary, complex sentences, excellent structure, engaging content
- Band 5 (High): Strong vocabulary, varied sentences, clear structure, interesting ideas
- Band 4 (Sound): Good vocabulary, some variety, organized structure, clear ideas
- Band 3 (Basic): Simple vocabulary, basic sentences, basic structure, simple ideas
- Band 2 (Limited): Very basic vocabulary, repetitive sentences, weak structure
- Band 1 (Minimal): Insufficient content or copied text

CRITICAL: DO NOT include "grammarCorrections" in your response. Grammar checking is handled by a separate, more robust system.

Return ONLY valid JSON in this exact format:
{
  "overallBand": number (1-6),
  "totalScore": number (0-30),
  "bandDescription": "description of band level",
  "criteriaScores": {
    "ideasContent": {"score": number, "outOf": 12, "band": number},
    "structureOrganization": {"score": number, "outOf": 6, "band": number},
    "languageVocab": {"score": number, "outOf": 7.5, "band": number},
    "spellingGrammar": {"score": number, "outOf": 4.5, "band": number}
  },
  "highlights": [
    {
      "type": "strength|improvement|suggestion",
      "color": "green|amber|blue",
      "text": "actual text from essay",
      "startIndex": number,
      "endIndex": number,
      "title": "brief title",
      "explanation": "detailed explanation",
      "beforeAfter": {"before": "original text", "after": "improved version"}
    }
  ],
  "detailedFeedback": {
    "strengths": ["strength 1", "strength 2"],
    "areasToImprove": ["area 1", "area 2"],
    "nextSteps": ["step 1", "step 2"]
  },
  "vocabularyEnhancements": [
    {
      "original": "simple word",
      "suggestion": "sophisticated word",
      "explanation": "why this word is better",
      "position": {"start": number, "end": number}
    }
  ],
  "narrativeStructure": {
    "hasOrientation": boolean,
    "hasComplication": boolean,
    "hasClimax": boolean,
    "hasResolution": boolean,
    "structureNotes": "notes"
  }
}`;

  const userPrompt = `Evaluate this ${textType} writing for NSW Selective School assessment.

PROMPT GIVEN TO STUDENT:
"${prompt}"

STUDENT'S WRITING:
"""
${essayContent}
"""

Word Count: ${wordCount}

CRITICAL SCORING REQUIREMENTS:
You MUST use the official NSW weighting for all scores:
- Ideas/Content: Score out of 12 (40% weight)
- Structure/Organization: Score out of 6 (20% weight)
- Language/Vocab: Score out of 7.5 (25% weight)
- Spelling/Grammar: Score out of 4.5 (15% weight)
Total must equal 30 points maximum.

Provide comprehensive feedback with:
1. Overall band score (1-6) and total score out of 30
2. Scores for each criterion using the EXACT maximum values above
3. Specific text highlights with positions for interactive display
4. Before/after examples for key improvements
5. Categorized feedback (strengths in green, improvements in amber, suggestions in blue)
6. Vocabulary enhancements with positions
7. Narrative structure analysis

IMPORTANT: DO NOT include grammarCorrections in your response.

Return ONLY valid JSON matching the specified format.`;

  let llmFeedback;
  const startTime = Date.now();

  try {
    console.log('📡 Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const latency = Date.now() - startTime;
    console.log(`✅ OpenAI responded in ${latency}ms`);

    const response = completion.choices[0].message.content;
    llmFeedback = JSON.parse(response);

    // Validate and fix positions in LLM output
    console.log('🔧 Validating feedback positions...');
    llmFeedback = validateFeedbackPositions(llmFeedback, essayContent);

    // Enforce NSW weighting
    if (llmFeedback.criteriaScores) {
      const scores = llmFeedback.criteriaScores;

      // Force correct maximum values
      if (scores.ideasContent && scores.ideasContent.outOf !== 12) {
        const percentage = scores.ideasContent.score / scores.ideasContent.outOf;
        scores.ideasContent.outOf = 12;
        scores.ideasContent.score = Math.round(percentage * 12 * 10) / 10;
      }

      if (scores.structureOrganization && scores.structureOrganization.outOf !== 6) {
        const percentage = scores.structureOrganization.score / scores.structureOrganization.outOf;
        scores.structureOrganization.outOf = 6;
        scores.structureOrganization.score = Math.round(percentage * 6 * 10) / 10;
      }

      if (scores.languageVocab && scores.languageVocab.outOf !== 7.5) {
        const percentage = scores.languageVocab.score / scores.languageVocab.outOf;
        scores.languageVocab.outOf = 7.5;
        scores.languageVocab.score = Math.round(percentage * 7.5 * 10) / 10;
      }

      if (scores.spellingGrammar && scores.spellingGrammar.outOf !== 4.5) {
        const percentage = scores.spellingGrammar.score / scores.spellingGrammar.outOf;
        scores.spellingGrammar.outOf = 4.5;
        scores.spellingGrammar.score = Math.round(percentage * 4.5 * 10) / 10;
      }

      // Recalculate total score
      llmFeedback.totalScore =
        scores.ideasContent.score +
        scores.structureOrganization.score +
        scores.languageVocab.score +
        scores.spellingGrammar.score;

      llmFeedback.totalScore = Math.round(llmFeedback.totalScore * 10) / 10;

      // Add comprehensive score summary
      const rawIdeas = Math.round((scores.ideasContent.score / 12) * 4 * 10) / 10;
      const rawStructure = Math.round((scores.structureOrganization.score / 6) * 4 * 10) / 10;
      const rawLanguage = Math.round((scores.languageVocab.score / 7.5) * 4 * 10) / 10;
      const rawGrammar = Math.round((scores.spellingGrammar.score / 4.5) * 4 * 10) / 10;
      const rawTotal = rawIdeas + rawStructure + rawLanguage + rawGrammar;
      const percentage = (llmFeedback.totalScore / 30) * 100;

      llmFeedback.scoringSummary = {
        rawTotal: {
          score: Math.round(rawTotal * 10) / 10,
          outOf: 16,
          displayFormat: `${Math.round(rawTotal * 10) / 10}/16`
        },
        weightedTotal: {
          score: llmFeedback.totalScore,
          outOf: 30,
          displayFormat: `${llmFeedback.totalScore}/30`
        },
        percentageScore: {
          score: Math.round(percentage * 10) / 10,
          outOf: 100,
          displayFormat: `${Math.round(percentage * 10) / 10}%`
        }
      };

      // Add raw scores to criteria
      scores.ideasContent.rawScore = rawIdeas;
      scores.structureOrganization.rawScore = rawStructure;
      scores.languageVocab.rawScore = rawLanguage;
      scores.spellingGrammar.rawScore = rawGrammar;
    }

    llmFeedback.timings = { modelLatencyMs: latency };
    llmFeedback.modelVersion = "gpt-4o-mini";
    llmFeedback.generatedAt = new Date().toISOString();

  } catch (error) {
    console.error('❌ LLM evaluation error:', error.message);

    // Wait for grammar feedback
    const grammarFeedback = await grammarFeedbackPromise;

    // Return fallback with grammar feedback
    return createFallbackFeedback(essayContent, wordCount, grammarFeedback);
  }

  // Step 3: Integrate LanguageTool grammar feedback
  console.log('🔗 Integrating grammar feedback...');
  const grammarFeedback = await grammarFeedbackPromise;
  llmFeedback.grammarCorrections = grammarFeedback;

  console.log('✅ Hybrid evaluation complete!');
  console.log(`   - LLM feedback: ${llmFeedback.totalScore}/30`);
  console.log(`   - Grammar issues found: ${grammarFeedback.length}`);

  return llmFeedback;
}

module.exports = {
  generateHybridEvaluation,
  getGrammarFeedback,
  validateFeedbackPositions,
  createFallbackFeedback
};
