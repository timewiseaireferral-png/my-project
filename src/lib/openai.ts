// src/lib/openai.ts - FIXED VERSION that calls backend functions
// This file handles all OpenAI-related functionality by calling Netlify functions

interface ChatRequest {
  userMessage: string;
  textType: string;
  currentContent: string;
  wordCount: number;
  context?: string;
}

interface DetailedFeedback {
  overallScore: number;
  criteriaScores: {
    ideasAndContent: number;
    textStructureAndOrganization: number;
    languageFeaturesAndVocabulary: number;
    spellingPunctuationAndGrammar: number;
  };
  feedbackCategories: any[]; // Adjust as per actual structure
  grammarCorrections: any[];
  vocabularyEnhancements: any[];
}

// FIXED: Main function to generate chat responses via backend
export async function generateChatResponse(request: ChatRequest): Promise<string> {
  try {
    console.log("Sending chat request to backend:", {
      messageLength: request.userMessage.length,
      textType: request.textType,
      contentLength: request.currentContent?.length || 0,
      wordCount: request.wordCount
    });

    const res = await fetch("/.netlify/functions/chat-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: request.userMessage,
        textType: request.textType,
        currentContent: request.currentContent || '',
        wordCount: request.wordCount || 0,
        context: request.context
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Chat response API error:", res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const result = await res.json();
    console.log("Chat response received successfully");
    
    if (!result.response) {
      throw new Error("No response field in API result");
    }

    return result.response;

  } catch (error) {
    console.error("Chat response failed:", error);
    
    // Enhanced fallback responses with context awareness
    return getEnhancedFallbackResponse(request);
  }
}

// Enhanced fallback response function with context awareness
function getEnhancedFallbackResponse(request: ChatRequest): string {
  const { userMessage, currentContent, wordCount, textType } = request;
  const message = userMessage.toLowerCase();
  const hasContent = currentContent && currentContent.trim().length > 0;
  
  if (message.includes("introduction") || message.includes("opening") || message.includes("start")) {
    if (hasContent) {
      return `I can see you've started with "${currentContent.slice(0, 30)}..." That's a good beginning! Try adding more specific details to hook your reader. What happens next in your story? 😊`;
    } else {
      return "Great question about openings! Try starting with dialogue, action, or an interesting detail. For example: 'The door creaked open, revealing...' What's your story going to be about?";
    }
  } else if (message.includes("vocabulary") || message.includes("word") || message.includes("synonym")) {
    if (hasContent) {
      // Try to find a simple word in their content to improve
      const simpleWords = ['said', 'big', 'small', 'good', 'bad', 'nice', 'went', 'got'];
      const foundWord = simpleWords.find(word => currentContent.toLowerCase().includes(word));
      if (foundWord) {
        const suggestions = {
          'said': 'whispered, exclaimed, muttered',
          'big': 'enormous, massive, gigantic',
          'small': 'tiny, miniature, petite',
          'good': 'excellent, wonderful, fantastic',
          'bad': 'terrible, awful, dreadful',
          'nice': 'delightful, pleasant, charming',
          'went': 'rushed, strolled, wandered',
          'got': 'received, obtained, discovered'
        };
        return `I noticed you used "${foundWord}" in your writing. Try replacing it with: ${suggestions[foundWord]}. Which one fits your story best?`;
      }
    }
    return "For better vocabulary, try replacing simple words with more descriptive ones. Instead of 'big', try 'enormous' or 'massive'. What specific word would you like help with?";
  } else if (message.includes("character") || message.includes("people")) {
    if (hasContent && /\b(he|she|they|character|person|boy|girl|man|woman|i)\b/i.test(currentContent)) {
      return "I can see you have characters in your story! To make them more interesting, show their personality through their actions and words. What does your main character want or fear?";
    } else {
      return "To create interesting characters, give them unique traits, goals, and problems. What kind of character is in your story? Tell me about them! 😊";
    }
  } else if (message.includes("dialogue") || message.includes("talking") || message.includes("conversation")) {
    if (hasContent && /["']/.test(currentContent)) {
      return "I see you're already using dialogue - that's great! Remember to start a new line each time someone different speaks, and use action to show how they're feeling. What are your characters discussing?";
    } else if (hasContent) {
      return "Adding dialogue can make your story come alive! Try having your characters speak to each other. For example: 'Where are we going?' asked Sarah nervously. What might your characters say?";
    } else {
      return "Dialogue makes stories exciting! When characters talk, it shows their personality and moves the story forward. What conversation could happen in your story?";
    }
  } else if (message.includes("description") || message.includes("describe") || message.includes("details")) {
    if (hasContent) {
      return "Great question! Look at this part of your story and add more details. Instead of just saying what happened, describe how it looked, sounded, or felt. What details would help readers picture the scene?";
    } else {
      return "Description helps readers picture your story! Use your five senses - what does your character see, hear, smell, taste, or touch? Start with one scene and describe it in detail.";
    }
  } else if (message.includes("conclusion") || message.includes("ending") || message.includes("finish")) {
    if (hasContent && wordCount > 100) {
      return "For your ending, think about how your character has changed from the beginning. Look back at how you started - can you connect your ending to that opening? What's the main message of your story?";
    } else if (hasContent) {
      return "You're building a good story! For the ending, think about what your character learns or how they solve their problem. How do you want your reader to feel when they finish?";
    } else {
      return "For a strong conclusion, show how your character has changed or learned something. What's the most important thing that happens in your story?";
    }
  } else {
    if (hasContent) {
      const stage = wordCount < 50 ? "getting started" : wordCount < 150 ? "developing your ideas" : "expanding your story";
      return `I can see you're ${stage} with ${wordCount} words. That's great progress! What specific part would you like help with? 😊`;
    } else {
      return "I'm here to help with your writing! Start by telling me what you want to write about, or ask me about any part of writing you'd like help with. 😊";
    }
  }
}

// FIXED: Connection test that calls backend
export async function checkOpenAIConnectionStatus(): Promise<boolean> {
  try {
    console.log('Testing OpenAI connection...');
    
    const res = await fetch("/.netlify/functions/chat-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: "test",
        textType: "narrative",
        currentContent: "",
        wordCount: 0
      })
    });

    console.log('Response received:', res.status);
    
    if (res.ok) {
      const result = await res.json();
      console.log('Connection test successful:', result.response ? 'OK' : 'No response');
      return true;
    } else {
      console.log('Connection test failed:', res.status);
      return false;
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Generate writing prompts via backend
export async function generatePrompt(textType: string, topic?: string): Promise<string> {
  try {
    const res = await fetch("/.netlify/functions/generate-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textType, topic })
    });

    if (res.ok) {
      const result = await res.json();
      return result.prompt;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error('Error generating prompt:', error);
    return getFallbackPrompt(textType, topic);
  }
}

// Fallback prompts when AI is unavailable
function getFallbackPrompt(textType: string, topic?: string): string {
  const fallbackPrompts = {
    narrative: [
      "Write a story about a character who discovers a mysterious door in their school that leads to an unexpected place.",
      "Tell the story of a day when everything that could go wrong, did go wrong, but it led to something wonderful.",
      "Write about a character who finds an old diary and discovers it belongs to someone from 100 years ago."
    ],
    persuasive: [
      "Should students be allowed to choose their own school subjects? Write a persuasive piece arguing your position.",
      "Convince your school principal to introduce a new subject that you think would benefit all students.",
      "Should mobile phones be allowed in schools? Present your argument with strong evidence."
    ],
    expository: [
      "Explain how social media has changed the way young people communicate and form friendships.",
      "Describe the process of how a book becomes a bestseller, from writing to publication.",
      "Explain why some people are naturally good at sports while others excel in academics."
    ],
    descriptive: [
      "Describe your perfect day from morning to night, using all five senses to bring it to life.",
      "Paint a picture with words of the most beautiful place you've ever seen or imagined.",
      "Describe the feeling of achieving something you've worked really hard for."
    ],
    creative: [
      "Write a piece that begins with: 'The last person on Earth sat alone in a room. There was a knock on the door...'",
      "Create a story told entirely through text messages between two characters.",
      "Write about a world where colors have personalities and can talk to humans."
    ]
  };

  const typePrompts = fallbackPrompts[textType.toLowerCase()] || fallbackPrompts.narrative;
  const randomPrompt = typePrompts[Math.floor(Math.random() * typePrompts.length)];
  return topic ? `${randomPrompt} (Focus on: ${topic})` : randomPrompt;
}

// Evaluate essay content via backend
export async function evaluateEssay(content: string, textType: string, isPractice: boolean = false): Promise<any> {
  if (!content.trim()) {
    return "Please write some content first, then I can provide you with detailed feedback!";
  }

  try {
    const apiEndpoint = isPractice ? "/.netlify/functions/nsw-ai-evaluation" : "/.netlify/functions/ai-feedback";
    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isPractice ? { essayContent: content, textType, prompt: localStorage.getItem("generatedPrompt") || "" } : { content, textType })
    });

    if (res.ok) {
      const result = await res.json();
      return result.feedback || result || "Feedback generated successfully!";
    } else {
      const errorData = await res.json();
      throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
    }
  } catch (error) {
    console.error('Error evaluating essay:', error);
    return getFallbackEvaluation(content, textType);
  }
}

// Fallback evaluation when AI is unavailable
function getFallbackEvaluation(content: string, textType: string): string {
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  
  let feedback = `Great work on your ${textType} writing! Here's some feedback:\n\n`;
  
  if (wordCount < 50) {
    feedback += "• Try to develop your ideas more fully with additional details and examples.\n";
  } else if (wordCount > 300) {
    feedback += "• Excellent length! You've developed your ideas well.\n";
  } else {
    feedback += "• Good length for your piece. Consider adding more descriptive details.\n";
  }
  
  feedback += "• Focus on using varied sentence structures to make your writing more engaging.\n";
  feedback += "• Remember to show rather than tell - use actions and dialogue to convey emotions.\n";
  feedback += "• Check your spelling and punctuation before submitting.\n\n";
  feedback += "Keep up the great work! Writing improves with practice. 🌟";
  
  return feedback;
}

// Get NSW Selective specific feedback via backend
export async function getNSWSelectiveFeedback(content: string, textType: string, assistanceLevel: string): Promise<DetailedFeedback> {
  try {
    const response = await fetch("/.netlify/functions/ai-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        textType,
        assistanceLevel,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API Error:", response.status, errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data: DetailedFeedback = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching NSW feedback from backend:", error);
    // Fallback to a basic error message or simplified feedback structure
    return {
      overallScore: 0,
      criteriaScores: {
        ideasAndContent: 0,
        textStructureAndOrganization: 0,
        languageFeaturesAndVocabulary: 0,
        spellingPunctuationAndGrammar: 0,
      },
      feedbackCategories: [],
      grammarCorrections: [],
      vocabularyEnhancements: [],
    };
  }
}

// Get writing structure guidance
export async function getWritingStructure(textType: string): Promise<string> {
  try {
    const res = await fetch("/.netlify/functions/writing-structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textType })
    });

    if (res.ok) {
      const result = await res.json();
      return result.structure;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error('Error getting structure guidance:', error);
    return getFallbackStructure(textType);
  }
}

// Fallback structure guidance
function getFallbackStructure(textType: string): string {
  const structures = {
    narrative: `Narrative Structure:\n• Opening: Hook the reader\n• Rising Action: Build tension\n• Climax: Turning point\n• Falling Action: Resolve conflict\n• Resolution: Satisfying conclusion`,
    persuasive: `Persuasive Structure:\n• Introduction: State your position\n• Body: Arguments with evidence\n• Counter-argument: Address opposing views\n• Conclusion: Reinforce position`,
    expository: `Expository Structure:\n• Introduction: Introduce topic\n• Body: Main points with examples\n• Conclusion: Summarize key points`,
    descriptive: `Descriptive Structure:\n• Introduction: Set the scene\n• Body: Sensory details\n• Conclusion: Lasting impression`,
    creative: `Creative Structure:\n• Hook: Intriguing start\n• Development: Build concept\n• Climax: Key moment\n• Resolution: Satisfying end`
  };
  return structures[textType.toLowerCase()] || structures.narrative;
}

// Get synonyms for words
export async function getSynonyms(word: string): Promise<string[]> {
  try {
    const res = await fetch("/.netlify/functions/get-synonyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word })
    });

    if (res.ok) {
      const result = await res.json();
      return result.synonyms || getFallbackSynonyms(word);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error('Error getting synonyms:', error);
    return getFallbackSynonyms(word);
  }
}

// Fallback synonyms for common words
function getFallbackSynonyms(word: string): string[] {
  const synonymMap = {
    'said': ['whispered', 'exclaimed', 'muttered', 'declared', 'announced'],
    'big': ['enormous', 'massive', 'gigantic', 'colossal', 'immense'],
    'small': ['tiny', 'miniature', 'petite', 'minuscule', 'compact'],
    'good': ['excellent', 'outstanding', 'remarkable', 'exceptional', 'superb'],
    'bad': ['terrible', 'awful', 'dreadful', 'horrible', 'atrocious'],
    'happy': ['delighted', 'ecstatic', 'joyful', 'elated', 'cheerful'],
    'sad': ['melancholy', 'sorrowful', 'dejected', 'despondent', 'mournful'],
    'fast': ['swift', 'rapid', 'speedy', 'quick', 'hasty'],
    'slow': ['sluggish', 'leisurely', 'gradual', 'unhurried', 'deliberate'],
    'beautiful': ['gorgeous', 'stunning', 'magnificent', 'breathtaking', 'exquisite']
  };
  return synonymMap[word.toLowerCase()] || ['sophisticated', 'enhanced', 'improved', 'refined', 'elevated'];
}

// Rephrase sentences for better vocabulary
export async function rephraseSentence(sentence: string): Promise<string> {
  try {
    const res = await fetch("/.netlify/functions/rephrase-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence })
    });

    if (res.ok) {
      const result = await res.json();
      return result.rephrased;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error('Error rephrasing sentence:', error);
    return `Try using more specific verbs and descriptive adjectives in: "${sentence}"`;
  }
}

// Identify common mistakes
export async function identifyCommonMistakes(content: string): Promise<string[]> {
  try {
    const res = await fetch("/.netlify/functions/identify-mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      const result = await res.json();
      return result.mistakes || ["Check for subject-verb agreement issues.", "Ensure consistent tense usage.", "Review punctuation, especially commas and apostrophes."];
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error('Error identifying common mistakes:', error);
    return ["Check for subject-verb agreement issues.", "Ensure consistent tense usage.", "Review punctuation, especially commas and apostrophes."];
  }
}

// Get vocabulary suggestions for specific text types
export async function getTextTypeVocabulary(textType: string): Promise<string[]> {
  try {
    const res = await fetch("/.netlify/functions/text-type-vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textType })
    });

    if (res.ok) {
      const result = await res.json();
      return result.vocabulary || getFallbackVocabulary(textType);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (error) {
    console.error('Error getting text type vocabulary:', error);
    return getFallbackVocabulary(textType);
  }
}

// Fallback vocabulary for different text types
function getFallbackVocabulary(textType: string): string[] {
  const vocabularyMap = {
    narrative: ["captivating", "mesmerizing", "extraordinary", "bewildering", "exhilarating", "profound", "eloquent", "vivid", "compelling", "intricate"],
    persuasive: ["compelling", "unequivocal", "substantiate", "advocate", "imperative", "irrefutable", "galvanize", "articulate", "resonate", "underscore"],
    expository: ["elucidate", "comprehend", "delineate", "corroborate", "disseminate", "paradigm", "ubiquitous", "pertinent", "conjecture", "nuance"],
    descriptive: ["ethereal", "serene", "luminous", "ephemeral", "cacophony", "mellifluous", "panoramic", "verdant", "opulent", "resplendent"],
    creative: ["whimsical", "surreal", "enigmatic", "transcendent", "kaleidoscopic", "juxtaposition", "benevolent", "malevolent", "epiphany", "soliloquy"]
  };
  return vocabularyMap[textType.toLowerCase()] || vocabularyMap.narrative;
}
