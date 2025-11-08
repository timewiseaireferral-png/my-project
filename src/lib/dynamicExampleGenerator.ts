/**
 * Dynamic Example Generator
 *
 * Generates contextually relevant writing examples based on the user's
 * active prompt and selected writing type.
 */

export interface DynamicExample {
  text: string;
  description?: string;
}

/**
 * Extracts key elements from a writing prompt
 */
function extractPromptElements(prompt: string): {
  subject: string;
  keywords: string[];
  objects: string[];
  settings: string[];
  characters: string[];
  actions: string[];
  emotions: string[];
} {
  const lowerPrompt = prompt.toLowerCase();

  // Object keywords
  const objectKeywords = ['key', 'chest', 'door', 'book', 'letter', 'box', 'treasure', 'map', 'photograph', 'diary', 'ring', 'necklace'];
  const settingKeywords = ['attic', 'library', 'school', 'forest', 'beach', 'house', 'garden', 'cave', 'mountain', 'city', 'village', 'room'];
  const characterKeywords = ['grandmother', 'grandfather', 'mother', 'father', 'friend', 'teacher', 'stranger', 'child', 'person'];
  const actionKeywords = ['found', 'discover', 'explore', 'open', 'unlock', 'search', 'investigate', 'notice', 'reveal', 'uncover'];
  const emotionKeywords = ['mysterious', 'scary', 'exciting', 'surprising', 'magical', 'ancient', 'strange', 'hidden', 'secret', 'forgotten'];

  // Extract all relevant elements
  const objects = objectKeywords.filter(keyword => lowerPrompt.includes(keyword));
  const settings = settingKeywords.filter(keyword => lowerPrompt.includes(keyword));
  const characters = characterKeywords.filter(keyword => lowerPrompt.includes(keyword));
  const actions = actionKeywords.filter(keyword => lowerPrompt.includes(keyword));
  const emotions = emotionKeywords.filter(keyword => lowerPrompt.includes(keyword));

  return {
    subject: prompt.slice(0, 150),
    keywords: [...objects, ...settings, ...characters, ...actions, ...emotions],
    objects,
    settings,
    characters,
    actions,
    emotions
  };
}

/**
 * Generate narrative examples with deep prompt analysis
 */
function generateNarrativeExamples(prompt: string, wordCount: number): DynamicExample[] {
  const elements = extractPromptElements(prompt);
  const examples: DynamicExample[] = [];

  // Get primary elements
  const mainObject = elements.objects[0];
  const mainSetting = elements.settings[0];
  const mainCharacter = elements.characters[0];
  const mainEmotion = elements.emotions[0];

  if (wordCount === 0) {
    // Opening sentence examples - highly specific to prompt
    if (mainSetting && mainObject) {
      // Setting + Object combination
      examples.push({
        text: `The ${mainSetting} was silent except for the creaking floorboards as I noticed the ${mainObject} gleaming in a shaft of dusty light.`,
        description: "Combine setting and object discovery"
      });
    }

    if (mainObject && mainEmotion) {
      // Object + Emotion combination
      examples.push({
        text: `The ${mainEmotion} ${mainObject} seemed to pulse with an energy I couldn't explain, drawing me closer despite my hesitation.`,
        description: "Build intrigue with sensory details"
      });
    }

    if (mainCharacter && mainObject) {
      // Character + Object combination
      examples.push({
        text: `"Never touch that ${mainObject}," my ${mainCharacter} had warned me countless times, but now I understood why.`,
        description: "Create backstory and tension"
      });
    }

    // Fallback examples if no specific elements
    if (examples.length === 0) {
      examples.push({
        text: `Everything changed the moment I discovered what had been hidden all these years.`,
        description: "Hook readers with mystery"
      });
    }
  } else if (wordCount < 100) {
    // Development examples - build on prompt elements
    if (mainObject && elements.actions[0]) {
      examples.push({
        text: `My fingers traced the edge of the ${mainObject}, and suddenly I understood what I had to do next.`,
        description: "Show character interaction and progression"
      });
    }

    if (mainSetting) {
      examples.push({
        text: `The ${mainSetting} seemed different now—shadows moved in corners I'd never noticed before, and the air hummed with possibility.`,
        description: "Develop atmosphere as story progresses"
      });
    }

    examples.push({
      text: `My heart hammered as I reached forward, knowing that once I took this step, there would be no going back.`,
      description: "Build tension through physical reactions"
    });
  } else if (wordCount < 200) {
    // Climax examples
    if (mainObject) {
      examples.push({
        text: `The ${mainObject} revealed its true purpose in a flash of understanding that took my breath away.`,
        description: "Create the revelation moment"
      });
    }

    examples.push({
      text: `Time seemed to slow as everything I'd discovered came together in one stunning moment of clarity.`,
      description: "Heighten the climactic moment"
    });
  } else {
    // Conclusion examples
    if (mainCharacter) {
      examples.push({
        text: `As I left the ${mainSetting || 'room'}, I carried with me not just the ${mainObject || 'discovery'}, but a new understanding of my ${mainCharacter}'s legacy.`,
        description: "Tie together discovery and personal growth"
      });
    }

    examples.push({
      text: `Some secrets, I realized, are meant to be found—they're just waiting for the right person at the right time.`,
      description: "Reflect on the deeper meaning"
    });
  }

  return examples.slice(0, 3); // Return up to 3 examples
}

/**
 * Generate persuasive examples
 */
function generatePersuasiveExamples(prompt: string, wordCount: number): DynamicExample[] {
  const elements = extractPromptElements(prompt);
  const examples: DynamicExample[] = [];
  const promptLower = prompt.toLowerCase();

  // Extract topic from prompt
  let topic = 'this change';
  if (promptLower.includes('school')) topic = 'schools';
  if (promptLower.includes('environment')) topic = 'our environment';
  if (promptLower.includes('technology')) topic = 'technology';
  if (promptLower.includes('uniform')) topic = 'school uniforms';
  if (promptLower.includes('homework')) topic = 'homework policies';
  if (promptLower.includes('sport')) topic = 'sports programs';

  if (wordCount === 0) {
    examples.push({
      text: `Imagine the impact we could make if we took action on ${topic} today—the benefits would transform our community for generations to come.`,
      description: "Open with a powerful vision statement"
    });
    examples.push({
      text: `The question isn't whether we should address ${topic}, but rather how quickly we can begin making a difference.`,
      description: "Frame the issue as urgent and necessary"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: `Research consistently demonstrates that communities investing in ${topic} see measurable improvements in both short-term results and long-term outcomes.`,
      description: "Support with evidence and data"
    });
    examples.push({
      text: `Consider the alternative: if we ignore ${topic}, we risk falling behind while others move forward with innovation and progress.`,
      description: "Highlight consequences of inaction"
    });
  } else {
    examples.push({
      text: `The path forward is clear: by embracing ${topic} now, we position ourselves to lead rather than follow, to innovate rather than imitate.`,
      description: "Build to a strong conclusion"
    });
    examples.push({
      text: `The time for debate has passed—now is the moment for action, and together we can make ${topic} a reality that benefits everyone.`,
      description: "End with a compelling call to action"
    });
  }

  return examples.slice(0, 3);
}

/**
 * Generate expository examples
 */
function generateExpositoryExamples(prompt: string, wordCount: number): DynamicExample[] {
  const examples: DynamicExample[] = [];
  const promptLower = prompt.toLowerCase();

  // Identify the topic
  let topic = 'this process';
  let verb = 'works';
  if (promptLower.includes('how')) {
    topic = 'the process';
    verb = 'functions';
  }
  if (promptLower.includes('why')) {
    topic = 'this phenomenon';
    verb = 'occurs';
  }
  if (promptLower.includes('explain')) {
    topic = 'this concept';
    verb = 'operates';
  }

  if (wordCount === 0) {
    examples.push({
      text: `To fully understand ${topic}, we must examine its key components, their relationships, and how they interact to create the overall effect.`,
      description: "Introduce topic with clear roadmap"
    });
    examples.push({
      text: `${topic.charAt(0).toUpperCase() + topic.slice(1)} ${verb} through a series of interconnected steps, each building upon the previous one.`,
      description: "Establish the process or mechanism"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: `For instance, consider how each element contributes to the whole: first by establishing the foundation, then by adding layers of complexity, and finally by creating the complete system.`,
      description: "Use specific examples to illustrate"
    });
    examples.push({
      text: `The relationship between these components becomes clear when we examine them individually and then observe how they work together in practice.`,
      description: "Explain connections and relationships"
    });
  } else {
    examples.push({
      text: `In summary, ${topic} represents a complex interplay of factors that, when understood together, reveal a clear and logical pattern.`,
      description: "Synthesize information clearly"
    });
    examples.push({
      text: `Understanding ${topic} not only explains what we observe but also helps us predict and potentially influence future outcomes.`,
      description: "Connect to broader implications"
    });
  }

  return examples.slice(0, 3);
}

/**
 * Generate reflective examples
 */
function generateReflectiveExamples(prompt: string, wordCount: number): DynamicExample[] {
  const examples: DynamicExample[] = [];
  const elements = extractPromptElements(prompt);
  const promptLower = prompt.toLowerCase();

  // Identify the type of experience
  let experience = 'that experience';
  if (elements.settings[0]) experience = `my time in the ${elements.settings[0]}`;
  if (promptLower.includes('learned')) experience = 'that lesson';
  if (promptLower.includes('changed')) experience = 'that transformation';

  if (wordCount === 0) {
    examples.push({
      text: `Looking back on ${experience}, I can now see how profoundly it shaped my understanding of myself and the world around me.`,
      description: "Open with reflective perspective"
    });
    examples.push({
      text: `At the time, I didn't realize how significant ${experience} would become, but now the lessons seem crystal clear.`,
      description: "Contrast past and present understanding"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: `The emotions I felt then—confusion, excitement, uncertainty—taught me more about resilience than any book ever could.`,
      description: "Explore emotional journey and growth"
    });
    examples.push({
      text: `What surprised me most wasn't the experience itself, but rather how I responded to it and what that revealed about my character.`,
      description: "Reflect on personal discovery"
    });
  } else {
    examples.push({
      text: `Now I understand that ${experience} wasn't just about what happened, but about who I became in the process of living through it.`,
      description: "Synthesize learning and growth"
    });
    examples.push({
      text: `If I could go back, I wouldn't change a thing—every challenge was necessary for the growth that followed, shaping me into who I am today.`,
      description: "Express mature perspective on experience"
    });
  }

  return examples.slice(0, 3);
}

/**
 * Generate recount examples
 */
function generateRecountExamples(prompt: string, wordCount: number): DynamicExample[] {
  const examples: DynamicExample[] = [];
  const elements = extractPromptElements(prompt);
  const promptLower = prompt.toLowerCase();

  // Identify the event type
  let event = 'the event';
  let location = 'there';
  if (elements.settings[0]) {
    location = `the ${elements.settings[0]}`;
    event = `our visit to the ${elements.settings[0]}`;
  }
  if (promptLower.includes('excursion')) event = 'the excursion';
  if (promptLower.includes('trip')) event = 'the trip';
  if (promptLower.includes('day')) event = 'that memorable day';

  if (wordCount === 0) {
    examples.push({
      text: `It was early morning when ${event} began, and none of us could have predicted how extraordinary it would turn out to be.`,
      description: "Set the scene with time and context"
    });
    examples.push({
      text: `As we arrived at ${location}, the excitement was palpable—everyone eager to see what awaited us.`,
      description: "Orient reader and establish atmosphere"
    });
  } else if (wordCount < 100) {
    examples.push({
      text: `Shortly after that, we discovered something unexpected that changed the entire direction of our visit.`,
      description: "Use temporal connectives to sequence"
    });
    examples.push({
      text: `Following the initial discovery, we moved through a series of experiences, each more fascinating than the last.`,
      description: "Build chronological progression"
    });
  } else {
    examples.push({
      text: `As ${event} drew to a close, we realized we had gained far more than we'd anticipated—not just knowledge, but lasting memories.`,
      description: "Conclude with reflection on significance"
    });
    examples.push({
      text: `Looking back on ${event}, every moment stands out as part of an unforgettable experience that we'll carry with us always.`,
      description: "End with personal reflection"
    });
  }

  return examples.slice(0, 3);
}

/**
 * Main function to generate dynamic examples
 */
export function generateDynamicExamples(
  prompt: string,
  writingType: string,
  currentWordCount: number
): DynamicExample[] {
  if (!writingType || typeof writingType !== 'string') {
    return generateNarrativeExamples(prompt, currentWordCount);
  }
  const normalizedType = writingType.toLowerCase();

  if (normalizedType.includes('narrative')) {
    return generateNarrativeExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('persuasive')) {
    return generatePersuasiveExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('expository') || normalizedType.includes('exposition')) {
    return generateExpositoryExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('reflective')) {
    return generateReflectiveExamples(prompt, currentWordCount);
  } else if (normalizedType.includes('recount')) {
    return generateRecountExamples(prompt, currentWordCount);
  } else {
    // Default to narrative
    return generateNarrativeExamples(prompt, currentWordCount);
  }
}

/**
 * Format examples for display
 */
export function formatExamplesForDisplay(examples: DynamicExample[]): string {
  if (examples.length === 0) {
    return "Start writing to receive personalized examples!";
  }

  if (examples.length === 1) {
    return examples[0].text;
  }

  return examples.map((ex, idx) => {
    if (ex.description) {
      return `${idx + 1}. "${ex.text}"\n   💡 ${ex.description}`;
    }
    return `${idx + 1}. "${ex.text}"`;
  }).join('\n\n');
}
