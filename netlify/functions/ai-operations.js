const { OpenAI } = require("openai");

// Initialize OpenAI with error handling
let openai = null;
try {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith("sk-")) {
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
} catch (error) {
  console.error("Failed to initialize OpenAI:", error);
}

// Helper function to create fallback response with NSW structure
function createFallbackResponse(content, textType) {
  const wordCount = content ? content.split(" ").length : 0;
  const sentences = content ? content.split(/[.!?]+/).filter((s) => s.trim().length > 0) : [];

  return {
    ideasAndContent: {
      name: "Ideas and Content",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 20))),
      maxScore: 9,
      strengths: [
        "Your story has a clear beginning",
        "You've included some interesting details",
      ],
      improvements: [
        "Add more descriptive details to make your story more engaging",
        "Develop your characters more fully",
      ],
      specificExamples: [
        content.substring(0, Math.min(50, content.length)) + "...",
      ],
      suggestions: [
        "Try using the five senses to describe scenes",
        "Show character emotions through actions rather than just telling",
      ],
    },
    textStructure: {
      name: "Text Structure and Organization",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 25))),
      maxScore: 9,
      strengths: ["Your story follows a logical sequence"],
      improvements: [
        "Use more varied sentence starters",
        "Add transition words to connect ideas better",
      ],
      specificExamples: [],
      suggestions: [
        "Try starting sentences with different words (Instead of 'I', try 'Suddenly', 'Meanwhile', etc.)",
        "Use paragraphs to organize different parts of your story",
      ],
    },
    languageFeatures: {
      name: "Language Features and Vocabulary",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 30))),
      maxScore: 9,
      strengths: ["You've used some descriptive words"],
      improvements: [
        "Use more sophisticated vocabulary",
        "Include literary devices like metaphors or similes",
      ],
      specificExamples: [],
      suggestions: [
        "Replace simple words with more interesting alternatives",
        "Try using similes (like/as comparisons) to make descriptions more vivid",
      ],
    },
    grammarAndPunctuation: {
      name: "Spelling, Punctuation and Grammar",
      weight: 25,
      score: Math.min(9, Math.max(3, Math.floor(wordCount / 15))),
      maxScore: 9,
      strengths: ["Most sentences are complete"],
      improvements: [
        "Check spelling of longer words",
        "Use more varied punctuation",
      ],
      specificExamples: [],
      suggestions: [
        "Read your work aloud to catch missing words",
        "Try using exclamation marks for exciting moments",
      ],
    },
    overallScore: Math.min(36, Math.max(12, Math.floor(wordCount / 15))),
    narrativeStructure: {
      orientation: wordCount > 20,
      complication: wordCount > 50,
      risingAction: wordCount > 80,
      climax: wordCount > 100,
      resolution: wordCount > 120,
      coda: wordCount > 150,
    },
    showDontTellAnalysis: {
      tellingInstances: [
        {
          text: "I was scared",
          suggestion: "Instead of saying 'I was scared', describe what fear feels like: 'My heart pounded and my hands trembled'",
        },
      ],
      showingInstances: [],
    },
    literaryDevices: {
      identified: [],
      suggestions: [
        "Try using a simile: 'The wind howled like a wild animal'",
        "Use personification: 'The trees danced in the breeze'",
      ],
    },
    sentenceVariety: {
      simple: Math.floor(sentences.length * 0.6),
      compound: Math.floor(sentences.length * 0.3),
      complex: Math.floor(sentences.length * 0.1),
      suggestions: [
        "Try combining short sentences with words like 'and', 'but', 'because'",
        "Start some sentences with describing words or phrases",
      ],
    },
  };
}

// Handle dynamic AI operations (examples, vocabulary, suggestions, etc.)
async function handleDynamicOperation(operation, requestBody, headers) {
  const { writingPrompt, currentContent, textType, wordCount, systemPrompt } = requestBody;

  console.log(`Handling dynamic operation: ${operation}`);

  // Validate systemPrompt
  if (!systemPrompt || typeof systemPrompt !== 'string') {
    console.error('Missing or invalid systemPrompt:', { operation, hasPrompt: !!systemPrompt });
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Invalid request: systemPrompt is required",
        operation
      }),
    };
  }

  // If OpenAI is not available, return appropriate fallback
  if (!openai) {
    console.log(`OpenAI not available for operation: ${operation}`);
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: "AI service temporarily unavailable",
        fallback: true
      }),
    };
  }

  try {
    console.log(`Calling OpenAI for ${operation}...`);

    // Execute AI request with the provided system prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate response for operation: ${operation}` }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    console.log(`OpenAI response received for ${operation}`);
    const aiResponse = JSON.parse(response.choices[0].message.content);

    // Return the AI response with appropriate wrapping based on operation
    let responseData;
    switch (operation) {
      case 'generate_examples':
        responseData = { examples: aiResponse.examples || [] };
        break;
      case 'generate_vocabulary':
        responseData = { vocabulary: aiResponse.vocabulary || [] };
        break;
      case 'generate_suggestions':
        responseData = { suggestion: aiResponse.suggestion || {} };
        break;
      case 'generate_step_guidance':
        responseData = { guidance: aiResponse.guidance || {} };
        break;
      case 'generate_quick_questions':
        responseData = { questions: aiResponse.questions || [] };
        break;
      default:
        responseData = aiResponse;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData),
    };

  } catch (error) {
    console.error(`Error in ${operation}:`, error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Failed to process ${operation}`,
        details: error.message
      }),
    };
  }
}

// Handle chat requests with contextual awareness
async function handleChatRequest(userMessage, textType, currentContent, wordCount, headers) {
  try {
    if (!openai) {
      // Fallback response when OpenAI is not available
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          response: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
        }),
      };
    }

    // Create contextual system prompt that includes the user's writing
    const systemPrompt = `You are an AI Writing Buddy for NSW Selective School exam preparation. You're helping a student with their ${textType} writing.\n\nCONTEXT:\n- Student is writing a ${textType} story\n- Current word count: ${wordCount || 0}\n- Student's current writing: "${(currentContent || '').slice(0, 500)}${(currentContent || '').length > 500 ? '...' : ''}"\n\nPERSONALITY:\n- Friendly, encouraging, and supportive\n- Use emojis occasionally to be engaging\n- Speak like a helpful friend, not a formal teacher\n- Keep responses concise but helpful (2-3 sentences max)\n\nFOCUS AREAS:\n- NSW Selective writing criteria\n- Story structure and plot development\n- Character development and emotions\n- Descriptive language and vocabulary\n- Grammar and sentence structure\n- Creative ideas and inspiration\n\nIMPORTANT: Always consider the student's current writing when providing advice. Reference their work specifically when possible.\n\nRespond to the student's question in a helpful, encouraging way.`;

    const userPrompt = `Student question: "${userMessage}"\n\nPlease provide a helpful, encouraging response that takes into account their current writing.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: aiResponse }),
    };
  } catch (error) {
    console.error("Chat request error:", error);

    // Return fallback response on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: "I'm having trouble connecting right now. Please try again in a moment! 🔄",
      }),
    };
  }
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const requestBody = JSON.parse(event.body || "{}");
    const { content, textType, assistanceLevel, userMessage, currentContent, wordCount, operation, writingPrompt, systemPrompt } = requestBody;

    // Handle new dynamic AI operations
    if (operation) {
      return await handleDynamicOperation(operation, requestBody, headers);
    }

    // Handle chat requests (when userMessage is provided)
    if (userMessage) {
      return await handleChatRequest(userMessage, textType, currentContent, wordCount, headers);
    }

    // Handle feedback requests (original functionality)
    if (!content || content.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Content is required" }),
      };
    }

    // If OpenAI is not available, return fallback response
    if (!openai) {
      console.log("OpenAI not available, returning fallback response");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(createFallbackResponse(content, textType)),
      };
    }

    // Create NSW-specific feedback using OpenAI
    const systemPrompt = `You are an expert NSW Selective School writing assessor. Analyze the following ${textType} writing sample and provide detailed feedback according to NSW Selective writing criteria.\n\nASSESSMENT CRITERIA (each scored 0-9):\n1. Ideas and Content (25% weight) - Creativity, relevance, development of ideas\n2. Text Structure and Organization (25% weight) - Logical flow, paragraphing, narrative structure\n3. Language Features and Vocabulary (25% weight) - Word choice, literary devices, sophistication\n4. Spelling, Punctuation and Grammar (25% weight) - Technical accuracy\n\nFor each criterion, provide:\n- A score out of 9 (be realistic - most students score 4-7)\n- 2-3 specific strengths with examples from the text\n- 2-3 areas for improvement\n- Specific examples from their writing (exact quotes)\n- 2-3 actionable suggestions for improvement\n\nAlso analyze:\n- Narrative structure elements (orientation, complication, rising action, climax, resolution, coda)\n- "Show don't tell" instances\n- Literary devices used and suggestions for more\n- Sentence variety (simple, compound, complex)\n\nReturn your response as a JSON object with this exact structure:\n{\n  "ideasAndContent": {\n    "name": "Ideas and Content",\n    "weight": 25,\n    "score": number,\n    "maxScore": 9,\n    "strengths": ["strength 1", "strength 2"],\n    "improvements": ["improvement 1", "improvement 2"],\n    "specificExamples": ["exact quote 1", "exact quote 2"],\n    "suggestions": ["suggestion 1", "suggestion 2"]\n  },\n  "textStructure": {\n    "name": "Text Structure and Organization", \n    "weight": 25,\n    "score": number,\n    "maxScore": 9,\n    "strengths": ["strength 1", "strength 2"],\n    "improvements": ["improvement 1", "improvement 2"],\n    "specificExamples": ["exact quote 1", "exact quote 2"],\n    "suggestions": ["suggestion 1", "suggestion 2"]\n  },\n  "languageFeatures": {\n    "name": "Language Features and Vocabulary",\n    "weight": 25,\n    "score": number,\n    "maxScore": 9,\n    "strengths": ["strength 1", "strength 2"],\n    "improvements": ["improvement 1", "improvement 2"],\n    "specificExamples": ["exact quote 1", "exact quote 2"],\n    "suggestions": ["suggestion 1", "suggestion 2"]\n  },\n  "grammarAndPunctuation": {\n    "name": "Spelling, Punctuation and Grammar",\n    "weight": 25,\n    "score": number,\n    "maxScore": 9,\n    "strengths": ["strength 1", "strength 2"],\n    "improvements": ["improvement 1", "improvement 2"],\n    "specificExamples": ["exact quote 1", "exact quote 2"],\n    "suggestions": ["suggestion 1", "suggestion 2"]\n  },\n  "overallScore": number,\n  "narrativeStructure": {\n    "orientation": boolean,\n    "complication": boolean,\n    "risingAction": boolean,\n    "climax": boolean,\n    "resolution": boolean,\n    "coda": boolean\n  },\n  "showDontTellAnalysis": {\n    "tellingInstances": [{"text": "exact quote", "suggestion": "how to show instead"}],\n    "showingInstances": ["good example 1", "good example 2"]\n  },\n  "literaryDevices": {\n    "identified": ["device 1", "device 2"],\n    "suggestions": ["try this device", "try that device"]\n  },\n  "sentenceVariety": {\n    "simple": number,\n    "compound": number,\n    "complex": number,\n    "suggestions": ["variety tip 1", "variety tip 2"]\n  }\n}\n\nBe encouraging but honest. Focus on specific, actionable feedback that helps students improve.`;

    const userPrompt = `Please analyze this ${textType} writing sample:\n\n${content}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    let feedbackData;
    try {
      feedbackData = JSON.parse(response.choices[0].message.content);

      // Ensure all required fields are present
      if (
        !feedbackData.ideasAndContent ||
        !feedbackData.textStructure ||
        !feedbackData.languageFeatures ||
        !feedbackData.grammarAndPunctuation
      ) {
        throw new Error("Missing required feedback fields");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError);
      feedbackData = createFallbackResponse(content, textType);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(feedbackData),
    };
  } catch (error) {
    console.error("Error in ai-feedback function:", error);

    // Return fallback response on error
    const fallbackData = createFallbackResponse(
      event.body ? JSON.parse(event.body).content || "" : "",
      event.body ? JSON.parse(event.body).textType || "narrative" : "narrative"
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackData),
    };
  }
};
