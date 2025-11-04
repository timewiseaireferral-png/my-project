// netlify/functions/ai-feedback.js
// STRICT SCORING VERSION - Realistic NSW rubric feedback
// Env: OPENAI_API_KEY

const { OpenAI } = require("openai");

// STRICT system prompt that gives realistic low scores for poor content
const SYSTEM_PROMPT = `You are a STRICT NSW Selective School writing assessor for students aged 10-12. 

IMPORTANT SCORING GUIDELINES:
- Score 1: Minimal effort, copied prompts, very short text (under 50 words)
- Score 2: Basic attempt but lacks development (50-100 words, simple ideas)
- Score 3: Adequate writing with some development (100-200 words, clear structure)
- Score 4: Good writing with strong development (200+ words, engaging content)
- Score 5: Excellent writing, exceptional for age group (creative, well-structured, sophisticated)

BE VERY STRICT: Most student writing should score 1-3. Only exceptional work gets 4-5.

If the text is just a copied prompt, instructions, or very short/undeveloped content, give scores of 1-2.

Return ONLY valid JSON with this exact structure:

{
  "overallScore": number (0-100),
  "criteria": {
    "ideasContent": {
      "score": number (1-5, BE STRICT),
      "weight": 30,
      "strengths": [{"text": "strength description", "start": 0, "end": 20}],
      "improvements": [{"issue": "issue description", "evidence": {"text": "evidence text", "start": 0, "end": 20}, "suggestion": "improvement suggestion"}]
    },
    "structureOrganization": {
      "score": number (1-5, BE STRICT),
      "weight": 25,
      "strengths": [{"text": "strength description", "start": 0, "end": 20}],
      "improvements": [{"issue": "issue description", "evidence": {"text": "evidence text", "start": 0, "end": 20}, "suggestion": "improvement suggestion"}]
    },
    "languageVocab": {
      "score": number (1-5, BE STRICT),
      "weight": 25,
      "strengths": [{"text": "strength description", "start": 0, "end": 20}],
      "improvements": [{"issue": "issue description", "evidence": {"text": "evidence text", "start": 0, "end": 20}, "suggestion": "improvement suggestion"}]
    },
    "spellingPunctuationGrammar": {
      "score": number (1-5, BE STRICT),
      "weight": 20,
      "strengths": [{"text": "strength description", "start": 0, "end": 20}],
      "improvements": [{"issue": "issue description", "evidence": {"text": "evidence text", "start": 0, "end": 20}, "suggestion": "improvement suggestion"}]
    }
  },
  "grammarCorrections": [],
  "vocabularyEnhancements": [],
  "narrativeStructure": {
    "orientationPresent": boolean,
    "complicationPresent": boolean,
    "climaxPresent": boolean,
    "resolutionPresent": boolean,
    "notes": "structure notes"
  },
  "timings": {"modelLatencyMs": number},
  "modelVersion": "gpt-4o-mini",
  "id": "feedback-unique-id"
}

REMEMBER: Be extremely strict. Copied prompts = Score 1. Short undeveloped text = Score 1-2. Only well-developed creative stories get 3+.`;

function buildUserPrompt(body) {
  const essayText = (body && body.essayText) || "";
  const textType = (body && body.textType) || "narrative";
  
  return `Evaluate this ${textType} writing for NSW Selective School assessment.

IMPORTANT: Be EXTREMELY STRICT with scoring. This appears to be student work that may be:
- A copied prompt or instructions (Score 1 for all criteria)
- Very short or undeveloped content (Score 1-2)
- Basic attempt with minimal creativity (Score 2-3)

TEXT TO EVALUATE:
"""
${essayText}
"""

STRICT SCORING CRITERIA:

IDEAS & CONTENT (30%):
- Score 1: No original ideas, copied text, or minimal content
- Score 2: Basic ideas but undeveloped
- Score 3: Some creative ideas with adequate development
- Score 4: Good creative ideas with strong development
- Score 5: Exceptional creativity and sophisticated ideas

STRUCTURE & ORGANIZATION (25%):
- Score 1: No clear structure, single paragraph or copied text
- Score 2: Basic structure but poor organization
- Score 3: Clear paragraphs with adequate organization
- Score 4: Well-organized with good transitions
- Score 5: Sophisticated structure with excellent flow

LANGUAGE & VOCABULARY (25%):
- Score 1: Very basic vocabulary, repetitive language
- Score 2: Simple vocabulary with some variety
- Score 3: Good vocabulary choices for age group
- Score 4: Rich vocabulary with varied sentence structure
- Score 5: Sophisticated language use, exceptional for age

SPELLING, PUNCTUATION & GRAMMAR (20%):
- Score 1: Many errors, poor mechanics
- Score 2: Some errors but readable
- Score 3: Generally correct with minor errors
- Score 4: Very few errors, good mechanics
- Score 5: Excellent mechanics, error-free

Word count: ${essayText.split(/\s+/).length} words

BE STRICT: If this looks like copied instructions or very short content, give scores of 1-2. Only exceptional work gets 4-5.

Return only the JSON response with realistic strict scores.`;
}

// Create a realistic fallback response for when OpenAI fails
function createStrictFallback(essayText, textType) {
  const text = essayText.trim();
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  
  // STRICT scoring - start very low
  let ideasScore = 1;
  let structureScore = 1;
  let languageScore = 1;
  let spagScore = 1;
  
  // Only increase scores for substantial content
  if (wordCount >= 50 && sentences >= 3) ideasScore = 2;
  if (wordCount >= 100 && text.includes('"')) ideasScore = 3;
  if (wordCount >= 200 && paragraphs >= 2) ideasScore = 4;
  
  if (paragraphs >= 2) structureScore = 2;
  if (paragraphs >= 3 && sentences >= 5) structureScore = 3;
  if (paragraphs >= 3 && text.toLowerCase().includes('then')) structureScore = 4;
  
  if (wordCount >= 75) languageScore = 2;
  if (wordCount >= 150 && text.match(/[a-zA-Z]{7,}/g)) languageScore = 3;
  
  if (/^[A-Z]/.test(text) && /[.!?]/.test(text)) spagScore = 2;
  if (spagScore === 2 && /,/.test(text)) spagScore = 3;
  
  // Check if it looks like copied prompt
  const promptWords = ['describe', 'write', 'story', 'about', 'what', 'happens', 'adventure'];
  const isLikelyPrompt = promptWords.filter(word => text.toLowerCase().includes(word)).length >= 4;
  
  if (isLikelyPrompt || wordCount < 30) {
    ideasScore = 1;
    structureScore = 1;
    languageScore = 1;
    spagScore = 1;
  }
  
  const overallScore = Math.round((ideasScore * 30 + structureScore * 25 + languageScore * 25 + spagScore * 20) / 5);
  const safeEnd = Math.min(text.length, 30);
  
  return {
    overallScore,
    criteria: {
      ideasContent: {
        score: ideasScore,
        weight: 30,
        strengths: ideasScore >= 3 ? [{ text: "Shows some creative thinking", start: 0, end: safeEnd }] : [],
        improvements: [{
          issue: ideasScore === 1 ? "Needs original creative ideas" : "Needs more detailed development",
          evidence: { text: text.slice(0, safeEnd) || "text", start: 0, end: safeEnd },
          suggestion: ideasScore === 1 ? "Write your own creative story instead of copying prompts" : "Add more specific details and examples"
        }]
      },
      structureOrganization: {
        score: structureScore,
        weight: 25,
        strengths: structureScore >= 3 ? [{ text: "Shows some organization", start: 0, end: safeEnd }] : [],
        improvements: [{
          issue: structureScore === 1 ? "Needs clear structure" : "Could improve organization",
          evidence: { text: text.slice(0, safeEnd) || "text", start: 0, end: safeEnd },
          suggestion: structureScore === 1 ? "Organize into clear beginning, middle, and end" : "Use clear paragraphs and transitions"
        }]
      },
      languageVocab: {
        score: languageScore,
        weight: 25,
        strengths: languageScore >= 3 ? [{ text: "Uses appropriate vocabulary", start: 0, end: safeEnd }] : [],
        improvements: [{
          issue: languageScore === 1 ? "Needs more varied vocabulary" : "Could use richer language",
          evidence: { text: text.slice(0, safeEnd) || "text", start: 0, end: safeEnd },
          suggestion: languageScore === 1 ? "Use your own words and more descriptive language" : "Try using more interesting and varied words"
        }]
      },
      spellingPunctuationGrammar: {
        score: spagScore,
        weight: 20,
        strengths: spagScore >= 3 ? [{ text: "Generally correct mechanics", start: 0, end: safeEnd }] : [],
        improvements: [{
          issue: spagScore === 1 ? "Needs attention to basic mechanics" : "Could improve punctuation",
          evidence: { text: text.slice(0, safeEnd) || "text", start: 0, end: safeEnd },
          suggestion: spagScore === 1 ? "Check spelling, capitalization, and punctuation" : "Review sentence punctuation"
        }]
      }
    },
    grammarCorrections: [],
    vocabularyEnhancements: [],
    narrativeStructure: textType === "narrative" ? {
      orientationPresent: wordCount >= 30,
      complicationPresent: wordCount >= 75,
      climaxPresent: wordCount >= 150,
      resolutionPresent: paragraphs >= 2,
      notes: wordCount < 50 ? "Story needs significant development" : 
             wordCount < 100 ? "Story needs more development" :
             "Adequate narrative structure"
    } : undefined,
    timings: { modelLatencyMs: 1500 },
    modelVersion: "strict-fallback",
    id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`
  };
}

exports.handler = async (event) => {
  // Enhanced logging for debugging
  console.log("STRICT AI Feedback function called");
  console.log("Method:", event.httpMethod);
  
  try {
    // Validate request method
    if (event.httpMethod !== "POST") {
      console.log("Invalid method:", event.httpMethod);
      return { 
        statusCode: 405, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
      console.log("Request body parsed:", { essayLength: body.essayText?.length, textType: body.textType });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      };
    }

    // Validate required fields
    if (!body.essayText || typeof body.essayText !== 'string' || body.essayText.trim().length === 0) {
      console.log("Missing or empty essay text");
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Essay text is required" })
      };
    }

    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      
      // Return strict fallback instead of error
      const fallbackResponse = createStrictFallback(body.essayText, body.textType);
      console.log("Using strict fallback, scores:", {
        ideas: fallbackResponse.criteria.ideasContent.score,
        structure: fallbackResponse.criteria.structureOrganization.score,
        language: fallbackResponse.criteria.languageVocab.score,
        spag: fallbackResponse.criteria.spellingPunctuationGrammar.score
      });
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackResponse)
      };
    }

    // Initialize OpenAI client
    let client;
    try {
      client = new OpenAI({ apiKey });
      console.log("OpenAI client initialized successfully");
    } catch (clientError) {
      console.error("Failed to initialize OpenAI client:", clientError);
      const fallbackResponse = createStrictFallback(body.essayText, body.textType);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackResponse)
      };
    }

    // Make OpenAI API call with strict instructions
    const started = Date.now();
    let completion;
    
    try {
      console.log("Making STRICT OpenAI API call...");
      completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for more consistent strict scoring
        max_tokens: 2000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(body) }
        ]
      });
      console.log("OpenAI API call successful");
    } catch (apiError) {
      console.error("OpenAI API call failed:", apiError);
      
      // Return strict fallback instead of error
      const fallbackResponse = createStrictFallback(body.essayText, body.textType);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackResponse)
      };
    }

    // Parse AI response
    const content = completion.choices?.[0]?.message?.content || "{}";
    console.log("AI response length:", content.length);
    
    let parsed;
    try {
      parsed = JSON.parse(content);
      console.log("AI response parsed successfully");
      console.log("AI scores:", {
        ideas: parsed.criteria?.ideasContent?.score,
        structure: parsed.criteria?.structureOrganization?.score,
        language: parsed.criteria?.languageVocab?.score,
        spag: parsed.criteria?.spellingPunctuationGrammar?.score,
        overall: parsed.overallScore
      });
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      
      // Return strict fallback instead of error
      const fallbackResponse = createStrictFallback(body.essayText, body.textType);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackResponse)
      };
    }

    // Ensure required fields with safe defaults
    const response = {
      overallScore: parsed.overallScore || 20, // Low default
      criteria: {
        ideasContent: {
          score: parsed.criteria?.ideasContent?.score || 1,
          weight: 30,
          strengths: parsed.criteria?.ideasContent?.strengths || [],
          improvements: parsed.criteria?.ideasContent?.improvements || []
        },
        structureOrganization: {
          score: parsed.criteria?.structureOrganization?.score || 1,
          weight: 25,
          strengths: parsed.criteria?.structureOrganization?.strengths || [],
          improvements: parsed.criteria?.structureOrganization?.improvements || []
        },
        languageVocab: {
          score: parsed.criteria?.languageVocab?.score || 1,
          weight: 25,
          strengths: parsed.criteria?.languageVocab?.strengths || [],
          improvements: parsed.criteria?.languageVocab?.improvements || []
        },
        spellingPunctuationGrammar: {
          score: parsed.criteria?.spellingPunctuationGrammar?.score || 1,
          weight: 20,
          strengths: parsed.criteria?.spellingPunctuationGrammar?.strengths || [],
          improvements: parsed.criteria?.spellingPunctuationGrammar?.improvements || []
        }
      },
      grammarCorrections: parsed.grammarCorrections || [],
      vocabularyEnhancements: parsed.vocabularyEnhancements || [],
      narrativeStructure: parsed.narrativeStructure,
      timings: {
        modelLatencyMs: Date.now() - started
      },
      modelVersion: completion.model || "gpt-4o-mini",
      id: parsed.id || `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`
    };

    console.log("STRICT response prepared successfully");
    console.log("Final scores:", {
      overall: response.overallScore,
      ideas: response.criteria.ideasContent.score,
      structure: response.criteria.structureOrganization.score,
      language: response.criteria.languageVocab.score,
      spag: response.criteria.spellingPunctuationGrammar.score
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error("Unexpected error in strict ai-feedback function:", error);
    
    // Return strict fallback for any unexpected errors
    try {
      const body = JSON.parse(event.body || "{}");
      if (body.essayText) {
        const fallbackResponse = createStrictFallback(body.essayText, body.textType);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackResponse)
        };
      }
    } catch (fallbackError) {
      console.error("Strict fallback also failed:", fallbackError);
    }
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
