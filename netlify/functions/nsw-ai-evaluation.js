// netlify/functions/nsw-ai-evaluation.js
// AI-POWERED NSW Selective School Writing Evaluation
// UPGRADED: Now uses hybrid approach with GPT-4 + LanguageTool

const { validateProSubscription, unauthorizedResponse } = require("./lib/subscriptionMiddleware");
const { generateHybridEvaluation } = require("./lib/hybridEvaluationService");

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

    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "OpenAI API key not configured",
          details: { apiKeyConfigured: false }
        })
      };
    }

    if (!apiKey.startsWith("sk-")) {
      console.error('OPENAI_API_KEY does not start with sk-');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "OpenAI API key is invalid",
          details: { apiKeyConfigured: false }
        })
      };
    }

    // Call HYBRID evaluation (GPT-4 + LanguageTool)
    console.log(`🚀 Evaluating ${textType} essay with HYBRID system...`);

    try {
      const feedback = await generateHybridEvaluation(
        essayContent,
        textType,
        prompt,
        apiKey
      );

      console.log('✅ Hybrid evaluation successful!');
      console.log(`   Score: ${feedback.totalScore}/30`);
      console.log(`   Grammar issues: ${feedback.grammarCorrections?.length || 0}`);
      console.log(`   Vocabulary enhancements: ${feedback.vocabularyEnhancements?.length || 0}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(feedback)
      };
    } catch (evalError) {
      console.error("❌ Hybrid evaluation error:", evalError);

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
