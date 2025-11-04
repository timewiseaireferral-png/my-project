/**
 * Contextual AI Coach System
 *
 * Provides genre-specific, contextual examples and feedback
 * that adapts to student's current writing and prompt
 */

import { getRubricForType, type GenreRubric } from './nswRubricCriteria';

export interface ContextualExample {
  category: string;
  suggestion: string;
  beforeExample: string;
  afterExample: string;
  explanation: string;
  relevanceToPrompt: string;
}

export interface CoachFeedback {
  overallFeedback: string;
  genreSpecificFeedback: string[];
  contextualExamples: ContextualExample[];
  rubricAlignment: {
    criterion: string;
    currentLevel: string;
    targetLevel: string;
    gaps: string[];
    actionItems: string[];
  }[];
  nextSteps: string[];
}

/**
 * Analyze text for specific genre elements
 */
function analyzeGenreElements(text: string, textType: string): {
  hasElement: boolean;
  element: string;
  quality: 'missing' | 'basic' | 'good' | 'excellent';
}[] {
  const lowerText = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).length;

  // Genre-specific analysis
  switch (textType) {
    case 'narrative':
      return [
        {
          element: 'Character description',
          hasElement: /\b(he|she|they|character|protagonist)\b/.test(lowerText),
          quality: hasDetailedDescription(text, 'character') ? 'good' : 'basic'
        },
        {
          element: 'Setting',
          hasElement: /\b(in|at|place|where|location)\b/.test(lowerText),
          quality: hasDetailedDescription(text, 'setting') ? 'good' : 'basic'
        },
        {
          element: 'Dialogue',
          hasElement: /"/.test(text) || /'/.test(text),
          quality: countDialogueInstances(text) > 2 ? 'good' : 'basic'
        },
        {
          element: 'Figurative language',
          hasElement: hasFigurativeLanguage(text),
          quality: countFigurativeDevices(text) > 3 ? 'excellent' : 'good'
        },
        {
          element: 'Show don\'t tell',
          hasElement: hasShowingLanguage(text),
          quality: assessShowDontTell(text)
        }
      ];

    case 'persuasive':
      return [
        {
          element: 'Clear thesis/position',
          hasElement: /\b(believe|think|argue|position|claim)\b/.test(lowerText),
          quality: hasStrongThesis(text) ? 'good' : 'basic'
        },
        {
          element: 'Arguments with evidence',
          hasElement: /\b(because|since|evidence|research|shows|proves)\b/.test(lowerText),
          quality: countArguments(text) >= 3 ? 'good' : 'basic'
        },
        {
          element: 'Rhetorical questions',
          hasElement: /\?/g.test(text) && hasRhetoricalQuestion(text),
          quality: 'good'
        },
        {
          element: 'Counter-argument',
          hasElement: /\b(however|although|some may argue|opponents|critics)\b/.test(lowerText),
          quality: hasFullCounterArgument(text) ? 'excellent' : 'basic'
        },
        {
          element: 'Persuasive language',
          hasElement: hasPersuasiveDevices(text),
          quality: countPersuasiveDevices(text) > 4 ? 'excellent' : 'good'
        }
      ];

    case 'expository':
    case 'informative':
      return [
        {
          element: 'Clear topic introduction',
          hasElement: wordCount > 20,
          quality: hasStrongIntro(text, 'expository') ? 'good' : 'basic'
        },
        {
          element: 'Factual information',
          hasElement: hasFactualLanguage(text),
          quality: 'good'
        },
        {
          element: 'Examples and evidence',
          hasElement: /\b(for example|such as|including|instance)\b/.test(lowerText),
          quality: countExamples(text) >= 3 ? 'good' : 'basic'
        },
        {
          element: 'Transitions',
          hasElement: hasTransitionWords(text),
          quality: countTransitions(text) >= 4 ? 'good' : 'basic'
        },
        {
          element: 'Objective language',
          hasElement: !hasSubjectiveLanguage(text),
          quality: 'good'
        }
      ];

    case 'descriptive':
      return [
        {
          element: 'Sensory details (5 senses)',
          hasElement: hasSensoryLanguage(text),
          quality: countSensoryDetails(text) >= 4 ? 'excellent' : 'good'
        },
        {
          element: 'Vivid adjectives',
          hasElement: hasVividAdjectives(text),
          quality: countVividAdjectives(text) > 5 ? 'good' : 'basic'
        },
        {
          element: 'Figurative language',
          hasElement: hasFigurativeLanguage(text),
          quality: countFigurativeDevices(text) > 3 ? 'excellent' : 'good'
        },
        {
          element: 'Specific details',
          hasElement: hasSpecificDetails(text),
          quality: 'good'
        },
        {
          element: 'Atmosphere/mood',
          hasElement: hasMoodLanguage(text),
          quality: 'good'
        }
      ];

    case 'reflective':
      return [
        {
          element: 'Personal experience described',
          hasElement: /\b(I|my|me|mine)\b/.test(text),
          quality: wordCount > 50 ? 'good' : 'basic'
        },
        {
          element: 'Reflection on learning',
          hasElement: /\b(learned|realized|discovered|understood|grew)\b/.test(lowerText),
          quality: hasDeepReflection(text) ? 'excellent' : 'good'
        },
        {
          element: 'Emotional honesty',
          hasElement: hasEmotionalLanguage(text),
          quality: 'good'
        },
        {
          element: 'Growth/change described',
          hasElement: /\b(changed|grew|developed|improved|transformed)\b/.test(lowerText),
          quality: 'good'
        },
        {
          element: 'Connection to broader meaning',
          hasElement: /\b(this shows|this means|this taught me|overall)\b/.test(lowerText),
          quality: 'good'
        }
      ];

    default:
      return [];
  }
}

// Helper functions for analysis
function hasDetailedDescription(text: string, type: 'character' | 'setting'): boolean {
  const adjectives = text.match(/\b(beautiful|tall|dark|mysterious|ancient|bright|cold|warm|small|large|red|blue|green)\b/gi);
  return (adjectives?.length || 0) >= 3;
}

function countDialogueInstances(text: string): number {
  return (text.match(/"/g) || []).length / 2;
}

function hasFigurativeLanguage(text: string): boolean {
  const patterns = [
    /like a/i,
    /as .* as/i,
    /metaphor/i,
    /seemed to/i,
    /appeared to/i
  ];
  return patterns.some(p => p.test(text));
}

function countFigurativeDevices(text: string): number {
  let count = 0;
  if (/like a|like an/i.test(text)) count++;
  if (/as .* as/i.test(text)) count++;
  if (/\b(whispered|screamed|danced|sang|cried)\b/i.test(text)) count++; // Personification hints
  return count;
}

function hasShowingLanguage(text: string): boolean {
  const showingWords = ['trembled', 'grinned', 'frowned', 'stammered', 'gasped', 'whispered', 'clenched'];
  return showingWords.some(word => text.toLowerCase().includes(word));
}

function assessShowDontTell(text: string): 'missing' | 'basic' | 'good' | 'excellent' {
  const tellingWords = ['felt', 'was happy', 'was sad', 'was angry', 'was scared'];
  const showingWords = ['trembled', 'grinned', 'frowned', 'stammered', 'gasped', 'heart pounded'];

  const tellingCount = tellingWords.filter(w => text.toLowerCase().includes(w)).length;
  const showingCount = showingWords.filter(w => text.toLowerCase().includes(w)).length;

  if (showingCount > tellingCount && showingCount >= 2) return 'excellent';
  if (showingCount > 0) return 'good';
  if (tellingCount > 0) return 'basic';
  return 'missing';
}

function hasStrongThesis(text: string): boolean {
  const thesisPatterns = [
    /I (strongly )?believe that/i,
    /It is (clear|evident|obvious) that/i,
    /We must|should|need to/i
  ];
  return thesisPatterns.some(p => p.test(text));
}

function countArguments(text: string): number {
  const argumentMarkers = ['firstly', 'secondly', 'thirdly', 'furthermore', 'additionally', 'moreover'];
  return argumentMarkers.filter(m => text.toLowerCase().includes(m)).length;
}

function hasRhetoricalQuestion(text: string): boolean {
  const questions = text.match(/[^.!?]*\?/g) || [];
  return questions.length > 0 && !questions.some(q => q.toLowerCase().includes('what is'));
}

function hasFullCounterArgument(text: string): boolean {
  const hasCounter = /\b(however|although|some may argue)\b/i.test(text);
  const hasRebuttal = /\b(but|yet|nevertheless|despite this)\b/i.test(text);
  return hasCounter && hasRebuttal;
}

function hasPersuasiveDevices(text: string): boolean {
  const devices = ['must', 'should', 'need', 'clearly', 'obviously', 'certainly'];
  return devices.some(d => text.toLowerCase().includes(d));
}

function countPersuasiveDevices(text: string): number {
  const devices = ['must', 'should', 'need', 'clearly', 'obviously', 'certainly', 'undoubtedly'];
  return devices.filter(d => text.toLowerCase().includes(d)).length;
}

function hasStrongIntro(text: string, type: string): boolean {
  const firstSentence = text.split(/[.!?]/)[0];
  return firstSentence.length > 30 && firstSentence.split(' ').length > 8;
}

function hasFactualLanguage(text: string): boolean {
  const factualMarkers = ['is', 'are', 'according to', 'research shows', 'studies indicate'];
  return factualMarkers.some(m => text.toLowerCase().includes(m));
}

function countExamples(text: string): number {
  const exampleMarkers = ['for example', 'such as', 'for instance', 'including'];
  return exampleMarkers.filter(m => text.toLowerCase().includes(m)).length;
}

function hasTransitionWords(text: string): boolean {
  const transitions = ['firstly', 'secondly', 'furthermore', 'however', 'therefore', 'consequently'];
  return transitions.some(t => text.toLowerCase().includes(t));
}

function countTransitions(text: string): number {
  const transitions = ['firstly', 'secondly', 'furthermore', 'however', 'therefore', 'consequently', 'moreover', 'additionally'];
  return transitions.filter(t => text.toLowerCase().includes(t)).length;
}

function hasSubjectiveLanguage(text: string): boolean {
  const subjective = ['I think', 'I feel', 'I believe', 'in my opinion'];
  return subjective.some(s => text.toLowerCase().includes(s));
}

function hasSensoryLanguage(text: string): boolean {
  const sensory = ['saw', 'heard', 'felt', 'smelled', 'tasted', 'touch', 'sound', 'sight', 'aroma'];
  return sensory.some(s => text.toLowerCase().includes(s));
}

function countSensoryDetails(text: string): number {
  const sensoryWords = {
    sight: ['saw', 'looked', 'appeared', 'bright', 'dark', 'colorful'],
    sound: ['heard', 'whispered', 'shouted', 'silent', 'loud', 'quiet'],
    touch: ['felt', 'rough', 'smooth', 'cold', 'warm', 'soft'],
    smell: ['smelled', 'aroma', 'scent', 'fragrant', 'musty'],
    taste: ['tasted', 'sweet', 'sour', 'bitter', 'delicious']
  };

  let count = 0;
  const lowerText = text.toLowerCase();
  Object.values(sensoryWords).forEach(words => {
    if (words.some(w => lowerText.includes(w))) count++;
  });
  return count;
}

function hasVividAdjectives(text: string): boolean {
  const vivid = ['magnificent', 'enormous', 'tiny', 'ancient', 'gleaming', 'mysterious', 'brilliant'];
  return vivid.some(v => text.toLowerCase().includes(v));
}

function countVividAdjectives(text: string): number {
  const adjectives = text.match(/\b(magnificent|enormous|tiny|ancient|gleaming|mysterious|brilliant|radiant|spectacular|stunning)\b/gi);
  return adjectives?.length || 0;
}

function hasSpecificDetails(text: string): boolean {
  // Numbers, specific names, specific measurements indicate specificity
  const hasNumbers = /\d+/.test(text);
  const hasCapitalizedNames = /\b[A-Z][a-z]+\b/.test(text);
  return hasNumbers || hasCapitalizedNames;
}

function hasMoodLanguage(text: string): boolean {
  const moodWords = ['eerie', 'peaceful', 'tense', 'joyful', 'somber', 'mysterious', 'cheerful'];
  return moodWords.some(m => text.toLowerCase().includes(m));
}

function hasEmotionalLanguage(text: string): boolean {
  const emotions = ['felt', 'realized', 'understood', 'struggled', 'overcame', 'learned'];
  return emotions.some(e => text.toLowerCase().includes(e));
}

function hasDeepReflection(text: string): boolean {
  const reflectiveMarkers = ['this taught me', 'I realized', 'I learned that', 'this experience showed'];
  return reflectiveMarkers.some(m => text.toLowerCase().includes(m));
}

/**
 * Generate contextual examples based on current text and prompt
 */
export function generateContextualExamples(
  text: string,
  textType: string,
  prompt?: string
): ContextualExample[] {
  const examples: ContextualExample[] = [];
  const analysis = analyzeGenreElements(text, textType);

  // Extract prompt keywords for context
  const promptKeywords = prompt ? extractKeywords(prompt) : [];

  // Generate examples based on missing or weak elements
  analysis.forEach(item => {
    if (item.quality === 'missing' || item.quality === 'basic') {
      const example = generateExampleForElement(item.element, textType, text, promptKeywords);
      if (example) examples.push(example);
    }
  });

  return examples.slice(0, 5); // Return top 5 most relevant
}

function extractKeywords(prompt: string): string[] {
  // Simple keyword extraction - can be enhanced
  const words = prompt.toLowerCase().split(/\W+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  return words.filter(w => w.length > 3 && !stopWords.includes(w)).slice(0, 10);
}

function generateExampleForElement(
  element: string,
  textType: string,
  currentText: string,
  promptKeywords: string[]
): ContextualExample | null {
  // Extract a relevant noun or subject from current text
  const contextWord = promptKeywords[0] || 'character';

  switch (element) {
    case 'Character description':
      return {
        category: 'Character Development',
        suggestion: 'Add more detailed character description with physical and personality traits',
        beforeExample: 'She was nice.',
        afterExample: 'Maya\'s warm brown eyes crinkled at the corners when she smiled, and her infectious laughter could brighten even the gloomiest day. Despite her small stature, she carried herself with quiet confidence.',
        explanation: 'Instead of just stating traits, show them through specific details and actions. This helps readers visualize and connect with your character.',
        relevanceToPrompt: `This technique will help bring your ${contextWord} to life in your story.`
      };

    case 'Setting':
      return {
        category: 'Setting Description',
        suggestion: 'Create a vivid sense of place using sensory details',
        beforeExample: 'They were in the forest.',
        afterExample: 'Ancient trees towered above them, their gnarled branches forming a canopy that filtered the sunlight into dancing golden patterns on the mossy ground. The air hung thick with the earthy scent of pine and damp leaves, while somewhere in the distance, a stream gurgled over smooth stones.',
        explanation: 'Use all five senses (sight, sound, smell, touch, taste) to immerse your reader in the setting. This makes the scene come alive.',
        relevanceToPrompt: `Strong setting details will enhance your ${contextWord} description.`
      };

    case 'Dialogue':
      return {
        category: 'Dialogue',
        suggestion: 'Add dialogue to reveal character and advance the plot',
        beforeExample: 'He told her about the problem.',
        afterExample: '"We don\'t have much time," Jake whispered urgently, glancing over his shoulder. "The storm will be here within the hour."\n\nSarah\'s eyes widened. "Then we need to move now. Are you sure about this?"',
        explanation: 'Dialogue reveals character personality, creates tension, and moves the story forward. Use dialogue tags that show how something is said, not just "said".',
        relevanceToPrompt: `Dialogue can reveal emotions and reactions related to ${promptKeywords.join(', ')}.`
      };

    case 'Show don\'t tell':
      return {
        category: 'Show Don\'t Tell',
        suggestion: 'Show emotions and states through actions and physical reactions',
        beforeExample: 'He was nervous.',
        afterExample: 'His hands trembled as he reached for the door handle. Sweat beaded on his forehead, and his heart hammered so loudly he was certain everyone could hear it.',
        explanation: 'Instead of naming emotions, show them through physical reactions, actions, and behaviors. This creates more vivid, engaging writing.',
        relevanceToPrompt: `Showing rather than telling will make your ${contextWord} moments more impactful.`
      };

    case 'Figurative language':
      return {
        category: 'Figurative Language',
        suggestion: 'Use similes, metaphors, and personification to create vivid imagery',
        beforeExample: 'The sunset was beautiful.',
        afterExample: 'The sunset painted the sky like a masterpiece, streaks of crimson and gold bleeding across the horizon as if an artist had dragged a brush through liquid fire.',
        explanation: 'Figurative language (similes with "like/as", metaphors, personification) helps readers visualize and creates memorable images.',
        relevanceToPrompt: `Figurative language can enhance descriptions of ${promptKeywords.slice(0, 2).join(' and ')}.`
      };

    case 'Clear thesis/position':
      return {
        category: 'Thesis Statement',
        suggestion: 'State your position clearly and confidently',
        beforeExample: 'I think uniforms might be good.',
        afterExample: 'School uniforms are essential for creating an equitable learning environment and should be mandatory in all public schools.',
        explanation: 'A strong thesis takes a clear position, uses confident language, and tells readers exactly what you\'ll argue.',
        relevanceToPrompt: `Your thesis should directly address the ${contextWord} issue in the prompt.`
      };

    case 'Arguments with evidence':
      return {
        category: 'Evidence & Support',
        suggestion: 'Support each argument with specific evidence or examples',
        beforeExample: 'Uniforms are good because they help students.',
        afterExample: 'School uniforms reduce bullying and social pressure. According to a 2020 study by the National Education Association, schools with uniform policies reported 35% fewer incidents of bullying related to clothing choices. When students wear the same attire, economic differences become less visible, creating a more inclusive environment.',
        explanation: 'Strong arguments include specific evidence (statistics, studies, expert opinions) and explain how the evidence supports your point.',
        relevanceToPrompt: `Use evidence to support your position on ${promptKeywords.join(', ')}.`
      };

    case 'Rhetorical questions':
      return {
        category: 'Rhetorical Questions',
        suggestion: 'Use rhetorical questions to engage readers and emphasize points',
        beforeExample: 'This is an important issue.',
        afterExample: 'Can we truly call ourselves a compassionate society if we ignore the needs of our most vulnerable citizens? Is it not our moral obligation to ensure every child has access to quality education?',
        explanation: 'Rhetorical questions make readers think and draw them into your argument. They should have obvious answers that support your position.',
        relevanceToPrompt: `Rhetorical questions can make readers consider the importance of ${contextWord}.`
      };

    case 'Counter-argument':
      return {
        category: 'Counter-Argument & Rebuttal',
        suggestion: 'Address opposing views and refute them',
        beforeExample: 'Some people disagree.',
        afterExample: 'Critics argue that uniforms limit self-expression and individuality. However, this concern is outweighed by the benefits of reduced bullying and increased focus on academics. Students can still express themselves through hairstyles, accessories, and achievements, while the uniform policy creates a more equitable environment for all.',
        explanation: 'Acknowledging and refuting counter-arguments shows you\'ve considered multiple perspectives and strengthens your credibility.',
        relevanceToPrompt: `Consider opposing views about ${contextWord} and explain why your position is stronger.`
      };

    case 'Sensory details (5 senses)':
      return {
        category: 'Sensory Description',
        suggestion: 'Engage all five senses for vivid, immersive descriptions',
        beforeExample: 'The beach was nice.',
        afterExample: 'The salty ocean breeze whipped through my hair as my toes sank into the warm, grainy sand. Seagulls cried overhead, their calls mixing with the rhythmic crash of waves. The air tasted of salt and summer, while the hot sun kissed my shoulders.',
        explanation: 'Using all five senses (sight, sound, smell, taste, touch) creates a complete, immersive picture that readers can almost experience themselves.',
        relevanceToPrompt: `Sensory details will help readers experience the ${contextWord} you\'re describing.`
      };

    case 'Clear topic introduction':
      return {
        category: 'Topic Introduction',
        suggestion: 'Start with a clear, engaging introduction that defines your topic',
        beforeExample: 'This essay is about climate change.',
        afterExample: 'Climate change represents one of the most pressing challenges of our generation, affecting everything from weather patterns to food security. Understanding its causes and consequences is essential for developing effective solutions.',
        explanation: 'A strong introduction hooks the reader, clearly defines the topic, and previews what the essay will cover.',
        relevanceToPrompt: `Your introduction should engage readers with the topic of ${contextWord}.`
      };

    case 'Transitions':
      return {
        category: 'Transitions',
        suggestion: 'Use transition words to connect ideas smoothly',
        beforeExample: 'This is one reason. This is another reason.',
        afterExample: 'Firstly, uniforms reduce economic pressure on families. Furthermore, they minimize distractions in the classroom. Additionally, they foster a sense of community and belonging.',
        explanation: 'Transition words (firstly, furthermore, however, therefore) guide readers through your ideas and show relationships between points.',
        relevanceToPrompt: `Transitions will help you organize your points about ${promptKeywords.join(', ')}.`
      };

    case 'Personal experience described':
      return {
        category: 'Personal Experience',
        suggestion: 'Describe your experience with specific, vivid details',
        beforeExample: 'I learned something important.',
        afterExample: 'The moment I stepped onto that stage, my carefully rehearsed lines vanished from my mind like morning mist. My hands shook, my voice wavered, but I pushed through. That terrifying experience taught me more about courage than any book ever could.',
        explanation: 'Reflective writing needs concrete details about what happened. Use sensory details and specific moments to bring your experience to life.',
        relevanceToPrompt: `Describe the ${contextWord} experience with vivid, specific details.`
      };

    case 'Reflection on learning':
      return {
        category: 'Reflection',
        suggestion: 'Explain what you learned and how it changed you',
        beforeExample: 'I learned that hard work is important.',
        afterExample: 'Through months of struggle and setback, I discovered that resilience isn\'t about never falling—it\'s about choosing to stand up each time you do. This realization transformed how I approach challenges, replacing my fear of failure with curiosity about growth.',
        explanation: 'Deep reflection connects your experience to broader insights. Explain not just what you learned, but how it changed your thinking or behavior.',
        relevanceToPrompt: `Reflect on how your ${contextWord} experience led to personal growth.`
      };

    default:
      return null;
  }
}

/**
 * Generate comprehensive AI coach feedback
 */
export function generateCoachFeedback(
  text: string,
  textType: string,
  prompt?: string
): CoachFeedback {
  const rubric = getRubricForType(textType);
  const analysis = analyzeGenreElements(text, textType);
  const examples = generateContextualExamples(text, textType, prompt);

  // Genre-specific feedback
  const genreSpecificFeedback = analysis
    .filter(a => a.quality !== 'excellent')
    .map(a => {
      if (a.quality === 'missing') {
        return `Add ${a.element.toLowerCase()} to strengthen your ${textType} writing.`;
      } else if (a.quality === 'basic') {
        return `Develop your ${a.element.toLowerCase()} further with more detail and sophistication.`;
      }
      return `Your ${a.element.toLowerCase()} is good, consider enhancing it further.`;
    });

  // Rubric alignment (simplified for now)
  const rubricAlignment = rubric ? [
    {
      criterion: 'Content and Ideas',
      currentLevel: 'Level 3',
      targetLevel: 'Level 4-5',
      gaps: analysis.filter(a => a.quality === 'missing' || a.quality === 'basic').map(a => a.element),
      actionItems: examples.map(e => e.suggestion)
    }
  ] : [];

  return {
    overallFeedback: generateOverallFeedback(text, textType, analysis),
    genreSpecificFeedback,
    contextualExamples: examples,
    rubricAlignment,
    nextSteps: generateNextSteps(analysis, textType)
  };
}

function generateOverallFeedback(text: string, textType: string, analysis: any[]): string {
  const wordCount = text.trim().split(/\s+/).length;
  const excellentElements = analysis.filter(a => a.quality === 'excellent').length;
  const goodElements = analysis.filter(a => a.quality === 'good').length;
  const missingElements = analysis.filter(a => a.quality === 'missing').length;

  if (wordCount < 30) {
    return `You've made a start! Keep writing to develop your ${textType} piece. Aim for at least 150-200 words to fully develop your ideas.`;
  }

  if (excellentElements >= 2) {
    return `Excellent work! Your ${textType} writing shows strong command of genre conventions. Focus on refining the remaining elements to achieve the highest level.`;
  }

  if (goodElements >= 2 && missingElements === 0) {
    return `Good progress! Your ${textType} writing includes most key elements. Take it to the next level by enhancing the sophistication of your techniques.`;
  }

  return `You're developing your ${textType} writing well. Focus on adding the missing elements to create a more complete and effective piece.`;
}

function generateNextSteps(analysis: any[], textType: string): string[] {
  const steps: string[] = [];
  const missing = analysis.filter(a => a.quality === 'missing');
  const basic = analysis.filter(a => a.quality === 'basic');

  if (missing.length > 0) {
    steps.push(`Add ${missing[0].element.toLowerCase()} to your writing`);
  }
  if (basic.length > 0) {
    steps.push(`Enhance your ${basic[0].element.toLowerCase()} with more detail`);
  }
  if (steps.length < 2) {
    steps.push(`Continue developing your ${textType} piece with strong examples`);
  }

  steps.push(`Review the NSW rubric criteria for ${textType} writing`);
  steps.push('Ask your coach for specific feedback on any section');

  return steps;
}
