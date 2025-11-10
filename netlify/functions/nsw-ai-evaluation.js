// netlify/functions/nsw-ai-evaluation.js
// AI-POWERED NSW Selective School Writing Evaluation
// Uses OpenAI GPT-4 for sophisticated, real-time feedback

const { OpenAI } = require("openai");
// NOTE: The subscriptionMiddleware is a TypeScript file (.ts) and needs to be compiled to JavaScript (.js)
// for Netlify to run it. Assuming the build process handles this and the compiled file is available
// as 'subscriptionMiddleware.js' in the same directory.
const { validateProSubscription, unauthorizedResponse } = require("./lib/subscriptionMiddleware");

const SYSTEM_PROMPT = `You are an expert NSW Selective School writing assessor for students aged 9-11 preparing for placement tests.

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

RESPONSE FORMAT (JSON only):
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
  "narrativeStructure": {
    "hasOrientation": boolean,
    "hasComplication": boolean,
    "hasClimax": boolean,
    "hasResolution": boolean,
    "structureNotes": "notes"
  }
}

Be encouraging but honest. Provide specific, actionable feedback with exact text positions for highlighting.`;

async function evaluateWithAI(essayText, textType, prompt) {
  console.log('Starting NSW evaluation...');
  console.log(`Text type: ${textType}, Essay length: ${essayText?.length || 0} chars`);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable not set');
    throw new Error("OpenAI API key not configured");
  }
  if (!apiKey.startsWith("sk-")) {
    console.error('OPENAI_API_KEY does not start with sk-');
    throw new Error("OpenAI API key is invalid");
  }

  console.log('API key validated, initializing OpenAI client...');
  const openai = new OpenAI({ apiKey });

  const userPrompt = `Evaluate this ${textType} writing for NSW Selective School assessment.

PROMPT GIVEN TO STUDENT:
"${prompt}"

STUDENT'S WRITING:
"""
${essayText}
"""

Word Count: ${essayText.split(/\s+/).length}

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
6. Narrative structure analysis (orientation, complication, climax, resolution)

Return ONLY valid JSON matching the specified format.`;

  const startTime = Date.now();

  console.log('Calling OpenAI API...');
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });
    console.log('OpenAI API call successful');
  } catch (apiError) {
    console.error('OpenAI API call failed:', apiError.message);
    throw new Error(`OpenAI API error: ${apiError.message}`);
  }

  const latency = Date.now() - startTime;
  console.log(`OpenAI latency: ${latency}ms`);

  const response = completion.choices[0].message.content;
  console.log('Parsing OpenAI response...');

  try {
    const feedback = JSON.parse(response);

    // CRITICAL: Enforce NSW weighting - Override AI if it returns wrong values
    if (feedback.criteriaScores) {
      const scores = feedback.criteriaScores;

      // Force correct maximum values (NSW rubric: 40-20-25-15)
      if (scores.ideasContent && scores.ideasContent.outOf !== 12) {
        console.warn(`Correcting ideasContent outOf from ${scores.ideasContent.outOf} to 12`);
        // Recalculate score proportionally
        const percentage = scores.ideasContent.score / scores.ideasContent.outOf;
        scores.ideasContent.outOf = 12;
        scores.ideasContent.score = Math.round(percentage * 12 * 10) / 10;
      }

      if (scores.structureOrganization && scores.structureOrganization.outOf !== 6) {
        console.warn(`Correcting structureOrganization outOf from ${scores.structureOrganization.outOf} to 6`);
        const percentage = scores.structureOrganization.score / scores.structureOrganization.outOf;
        scores.structureOrganization.outOf = 6;
        scores.structureOrganization.score = Math.round(percentage * 6 * 10) / 10;
      }

      if (scores.languageVocab && scores.languageVocab.outOf !== 7.5) {
        console.warn(`Correcting languageVocab outOf from ${scores.languageVocab.outOf} to 7.5`);
        const percentage = scores.languageVocab.score / scores.languageVocab.outOf;
        scores.languageVocab.outOf = 7.5;
        scores.languageVocab.score = Math.round(percentage * 7.5 * 10) / 10;
      }

      if (scores.spellingGrammar && scores.spellingGrammar.outOf !== 4.5) {
        console.warn(`Correcting spellingGrammar outOf from ${scores.spellingGrammar.outOf} to 4.5`);
        const percentage = scores.spellingGrammar.score / scores.spellingGrammar.outOf;
        scores.spellingGrammar.outOf = 4.5;
        scores.spellingGrammar.score = Math.round(percentage * 4.5 * 10) / 10;
      }

      // Recalculate total score
      feedback.totalScore =
        scores.ideasContent.score +
        scores.structureOrganization.score +
        scores.languageVocab.score +
        scores.spellingGrammar.score;

      feedback.totalScore = Math.round(feedback.totalScore * 10) / 10;

      console.log('✅ NSW weighting enforced:', {
        ideasContent: `${scores.ideasContent.score}/${scores.ideasContent.outOf}`,
        structure: `${scores.structureOrganization.score}/${scores.structureOrganization.outOf}`,
        language: `${scores.languageVocab.score}/${scores.languageVocab.outOf}`,
        grammar: `${scores.spellingGrammar.score}/${scores.spellingGrammar.outOf}`,
        total: feedback.totalScore
      });
    }

    feedback.timings = { modelLatencyMs: latency };
    feedback.modelVersion = "gpt-4o-mini";
    feedback.generatedAt = new Date().toISOString();
    return feedback;
  } catch (parseError) {
    console.error("Failed to parse AI response:", response);
    throw new Error("AI returned invalid JSON");
  }
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  // SUBSCRIPTION CHECK: Validate Pro subscription
  console.log('🔒 Checking subscription access...');
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const subscriptionCheck = await validateProSubscription(authHeader);

  if (!subscriptionCheck.hasAccess) {
    console.log(`❌ Access denied: ${subscriptionCheck.error}`);
    // FIX: Use the unauthorizedResponse from the imported module
    return unauthorizedResponse('This feature requires a Pro subscription. Upgrade now to unlock unlimited AI evaluations and feedback.');
  }

  console.log(`✅ Access granted for user: ${subscriptionCheck.userId}`);

  try {
    console.log('NSW Evaluation Handler: Parsing request body...');
    const body = JSON.parse(event.body || "{}");
    const { essayContent, textType = "narrative", prompt = "" } = body;

    console.log(`Request details: textType=${textType}, essayLength=${essayContent?.length || 0}, hasPrompt=${!!prompt}`);

    // Validation
    if (!essayContent || essayContent.trim().length < 20) {
      console.log('Validation failed: Essay content too short');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Essay content is too short (minimum 20 characters)"
        })
      };
    }

    // Call AI evaluation
    console.log(`Evaluating ${textType} essay (${essayContent.length} chars)...`);

    try {
      const feedback = await evaluateWithAI(essayContent, textType, prompt);
      console.log('Evaluation successful, returning feedback');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(feedback)
      };
    } catch (evalError) {
      console.error("AI evaluation error:", evalError);

      // Return a structured error response
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "AI evaluation failed",
          message: evalError.message || "Unknown error during evaluation",
          details: {
            apiKeyConfigured: !!process.env.OPENAI_API_KEY,
            errorType: evalError.name || "Error"
          }
        })
      };
    }
  } catch (error) {
    console.error("NSW AI Evaluation Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to evaluate essay",
        message: error.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      })
    };
  }
};