import { OpenAI } from 'openai';

// --- Mock/Placeholder for missing functions (assuming they are in other files) ---
// In a real scenario, these would be imported from their respective files.
// We are adding them here to make the function runnable and prevent the 502 error.
function getEnhancedFallbackResponse(userMessage, currentContent, wordCount, textType) {
    // A simple, safe fallback response
    return "I'm sorry, the AI service is currently unavailable. Please try again later. (Fallback)";
}

function getBaseContext(currentContent, wordCount, textType) {
    // A simple context string for the prompt
    return `Current Writing Context:
- Text Type: ${textType}
- Word Count: ${wordCount}
- Content Snippet: "${currentContent.substring(0, 100)}..."`;
}
// --- End of Mock/Placeholder ---

const client = new OpenAI();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  try {
    if (!event.body) {
      throw new Error("Request body is missing.");
    }
    
    const { userMessage, currentContent, wordCount, textType, supportLevel } = JSON.parse(event.body);

    // Check for missing parameters and provide a clean 400 error
    if (!userMessage || !currentContent || !textType || !supportLevel) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Missing required parameters: userMessage, currentContent, wordCount, textType, supportLevel" })
        };
    }

    const getTieredSystemPrompt = () => {
      const baseContext = getBaseContext(currentContent, wordCount, textType);

      if (supportLevel === 'high') {
        // High Support
        return `You are a highly supportive and encouraging AI Writing Buddy for 10-12 year old students preparing for the NSW Selective Writing Test. You provide HIGH SUPPORT with clear, direct guidance.

PERSONALITY & TONE:
- Extremely encouraging and positive 😊
- Use emojis frequently
- Speak like a friendly tutor
- Give direct answers and clear steps
- Focus on building confidence

HIGH SUPPORT FEATURES:
1. DIRECT ANSWERS - Give clear, concise solutions
2. SIMPLE EXAMPLES - Easy-to-understand demonstrations
3. GRAMMAR & SPELLING FIXES - Focus on correctness
4. BASIC STRUCTURE GUIDANCE - PEEEL, Story Mountain
5. VOCABULARY DEFINITIONS - Explain complex words
6. SHORT, ACTIONABLE STEPS - Keep it simple

${baseContext}

RESPONSE FORMAT:
1. Enthusiastic greeting (1 sentence)
2. Direct answer to their question
3. Simple, clear example
4. One easy, actionable next step (4-6 sentences total)

FOCUS: Clarity and confidence building.`;
      } else if (supportLevel === 'low') {
        // Low Support
        return `You are a challenging and sophisticated AI Writing Coach for advanced 10-12 year old students preparing for the NSW Selective Writing Test. You provide LOW SUPPORT, focusing on critical thinking and refinement.

PERSONALITY & TONE:
- Intellectually challenging and respectful of their abilities
- Use minimal emojis (if at all)
- Speak like a peer mentor or writing coach
- Ask probing questions rather than giving direct answers
- Assume they can handle sophisticated feedback

LOW SUPPORT FEATURES:
1. HIGHER-ORDER THINKING PROMPTS - Challenge them deeply
2. SUBTLE SUGGESTIONS - Hint, don't tell
3. ADVANCED VOCABULARY & STYLE - Sophisticated language focus
4. SELF-REFLECTION PROMPTS - Build metacognition
5. EXAM STRATEGY TIPS - Advanced test-taking approaches
6. HOLISTIC FEEDBACK - Big picture analysis
7. LITERARY TECHNIQUE FOCUS - Advanced devices

${baseContext}

RESPONSE FORMAT:
1. Brief acknowledgment of their work's sophistication
2. Holistic observation about strengths (1-2 sentences)
3. One probing question about a deeper aspect
4. Subtle suggestion for improvement (not directive)
5. Advanced literary or strategic consideration
6. Challenge them with a sophisticated next step (4-6 sentences total)

ASSUME COMPETENCE: They're capable writers who can handle nuanced, sophisticated feedback.`;
      } else {
        // Medium Support (default)
        return `You are a supportive and knowledgeable AI Writing Buddy for 10-12 year old students preparing for the NSW Selective Writing Test. You provide MEDIUM SUPPORT with balanced guidance.

PERSONALITY & TONE:
- Encouraging but also challenging them to think deeper
- Use emojis occasionally to be engaging 😊
- Speak like a helpful mentor
- Balance giving answers with asking questions
- Build independence while providing support

MEDIUM SUPPORT FEATURES:
1. TARGETED SUGGESTIONS - Focus on specific improvement areas
2. BEFORE & AFTER EXAMPLES - Show improvement possibilities
3. DETAILED ERROR EXPLANATIONS - Teach the rules
4. CRITICAL THINKING PROMPTS - Encourage deeper thinking
5. NSW CRITERIA ALIGNMENT - Connect to test standards
6. VOCABULARY ENHANCEMENT - Context-appropriate suggestions
7. SENTENCE STRUCTURE VARIETY - Encourage complexity

${baseContext}

RESPONSE FORMAT:
1. Acknowledge their effort with specific praise
2. Identify 1-2 strengths with brief examples
3. Provide 1-2 improvement suggestions with explanations
4. Give before/after example or demonstration
5. Ask one thought-provoking question
6. End with clear next step (5-7 sentences total)

BALANCE: Give them guidance but also space to develop their own ideas.`;
      }
    };

    const systemPrompt = getTieredSystemPrompt();

    const userPrompt = `Student question: "${userMessage}"

Please provide a helpful, encouraging response that addresses their specific question at the ${supportLevel} level.`;

    try {
      console.log("Making OpenAI API call...");
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const response = completion.choices?.[0]?.message?.content?.trim();
      
      if (!response) {
        throw new Error("Empty response from OpenAI");
      }

      console.log("OpenAI response generated successfully");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response })
      };

    } catch (apiError) {
      console.error("OpenAI API call failed:", apiError);
      
      // Use enhanced fallback response on API error
      const fallbackResponse = getEnhancedFallbackResponse(userMessage, currentContent, wordCount, textType);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: fallbackResponse })
      };
    }

  } catch (error) {
    console.error("Chat response function error:", error);
    
    // Return a safe fallback response
    return {
      statusCode: 502, // Changed to 502 to match the expected Bad Gateway error from the client
      headers,
      body: JSON.stringify({ 
        error: "Internal Server Error: Could not process request.",
        response: "I'm having trouble right now, but I'm here to help! Can you try asking your question again? 😊" 
      })
    };
  }
};