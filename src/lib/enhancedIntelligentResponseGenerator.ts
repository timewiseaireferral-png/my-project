/**
 * Enhanced Intelligent Response Generator
 *
 * Generates contextual, NSW-aligned coaching responses that integrate:
 * - Show-don't-tell feedback
 * - Character development guidance
 * - Figurative language suggestions
 * - Setting descriptions
 * - Rubric-aligned feedback
 * - Prompt-specific examples
 */

import { generateCoachFeedback, generateContextualExamples } from './contextualAICoach';
import { generateShowDontTellFeedback, analyzeShowDontTell } from './showDontTellAnalyzer';
import { getRubricForType } from './nswRubricCriteria';

export interface EnhancedCoachResponse {
  encouragement: string;
  nswFocus: string;
  suggestion: string;
  example: string;
  nextStep: string;
  contextualExamples?: {
    title: string;
    before: string;
    after: string;
    explanation: string;
  }[];
  showDontTell?: {
    issue: string;
    alternatives: string[];
  };
  rubricGuidance?: {
    criterion: string;
    currentLevel: string;
    targetIndicators: string[];
  };
}

/**
 * Enhanced response generator for narrative writing
 */
export class EnhancedNarrativeCoach {

  static generateResponse(content: string, prompt?: string): EnhancedCoachResponse {
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount === 0) {
      return this.getWelcomeMessage(prompt);
    }

    // Check for off-topic content first, regardless of word count (after initial welcome)
    const isOffTopic = this.isOffTopic(content, prompt);
    if (isOffTopic) {
      return this.getOffTopicWarning(content, prompt);
    }

    if (wordCount < 50) {
      return this.getOpeningGuidance(content, prompt);
    }

    if (wordCount < 100) {
      return this.getCharacterDevelopmentGuidance(content);
    }

    if (wordCount < 150) {
      return this.getShowDontTellGuidance(content);
    }

    if (wordCount < 200) {
      return this.getFigurativeLanguageGuidance(content);
    }
    return this.getAdvancedGuidance(content, prompt);
  }

  private static isOffTopic(content: string, prompt?: string): boolean {
    if (!prompt || content.length < 50) return false; // Not enough content to judge
    
    // Simple keyword check: check if the content contains any keywords from the prompt
    // and does not contain too many keywords from a completely different topic (e.g., science)
    const promptKeywords = ["diary", "attic", "past", "change", "family", "event", "rewrite", "power", "emotions", "conflict"];
    const offTopicKeywords = ["photosynthesis", "glucose", "chloroplasts", "thylakoid", "Calvin cycle", "stroma", "star", "planet", "orbit", "Jupiter", "Saturn"];

    const promptMatchCount = promptKeywords.filter(k => content.toLowerCase().includes(k)).length;
    const offTopicMatchCount = offTopicKeywords.filter(k => content.toLowerCase().includes(k)).length;

    // If the content is long enough, and has very few prompt keywords, but many off-topic keywords, it's likely off-topic.
    // Thresholds are arbitrary but should catch the extreme case (0 prompt matches, >3 off-topic matches)
    return (promptMatchCount < 2 && offTopicMatchCount > 3);
  }

  private static getOffTopicWarning(content: string, prompt?: string): EnhancedCoachResponse {
    return {
      encouragement: "Hold on a moment! 🛑",
      nswFocus: "Content and Ideas - Relevance to Prompt",
      suggestion: "Your writing appears to be completely off-topic. The prompt is about a **mysterious discovery in a familiar place** (a narrative), but your content seems to be an **expository piece** (e.g., a science report).",
      example: "NSW Selective Exam Rule: If your writing does not address the given topic, it will receive a minimal score for Ideas & Content (Band 1).",
      nextStep: `Please delete your current writing and start a new narrative that directly addresses the prompt: "${prompt || 'A mysterious discovery...'}"`,
      rubricGuidance: {
        criterion: "Content and Ideas",
        currentLevel: "Level 1 (Minimal)",
        targetIndicators: [
          "Directly address the prompt and text type",
          "Maintain focus on the central theme/idea",
          "Ensure all content is relevant to the task"
        ]
      }
    };
  }

  private static getAdvancedGuidance(content: string, prompt?: string): EnhancedCoachResponse {
  }

  private static getWelcomeMessage(prompt?: string): EnhancedCoachResponse {
    return {
      encouragement: "Welcome! Let's write an amazing narrative together! ✨",
      nswFocus: "Getting Started - Narrative Structure",
      suggestion: "A strong narrative needs: a compelling character, vivid setting, engaging plot, and emotional depth. Let's start with a powerful opening!",
      example: "Hook your reader immediately:\n\n❌ Weak: 'One day I went to my grandmother's house.'\n\n✅ Strong: 'The moment I stepped into grandmother's dusty attic, I knew something was different. The ancient key in my palm seemed to pulse with warmth, as if it were alive.'",
      nextStep: "Write your opening sentence. Introduce your main character or setting with vivid, specific details.",
      contextualExamples: [{
        title: "Opening Hook Techniques",
        before: "I found a key in the attic.",
        after: "Hidden beneath a pile of yellowed letters, I discovered a key unlike any I'd seen before—its surface etched with strange symbols that seemed to shimmer in the dim light.",
        explanation: "This opening creates mystery and intrigue through specific details and sensory information."
      }],
      rubricGuidance: {
        criterion: "Content and Ideas",
        currentLevel: "Starting",
        targetIndicators: [
          "Introduce main character with personality traits",
          "Establish setting with sensory details",
          "Create immediate intrigue or conflict",
          "Use 'show don't tell' from the start"
        ]
      }
    };
  }

  private static getOpeningGuidance(content: string, prompt?: string): EnhancedCoachResponse {
    const hasCharacter = /\b(I|he|she|they|character|boy|girl|person)\b/i.test(content);
    const hasSetting = /\b(in|at|place|attic|house|room|forest|school)\b/i.test(content);
    const hasDialogue = /"/.test(content);

    // Detect what's missing
    if (!hasCharacter) {
      return {
        encouragement: "Great start! Now let's introduce your character. 👤",
        nswFocus: "Character Development - Opening",
        suggestion: "Your reader needs to meet your main character. Show us who they are through their actions, thoughts, and appearance.",
        example: "Character Introduction:\n\n❌ Telling: 'Sarah was brave.'\n\n✅ Showing: 'Sarah took a deep breath, pushed aside her fear, and reached for the glowing key. Her hands trembled, but she refused to back away.'",
        nextStep: "Add 2-3 sentences introducing your main character. Show their personality through what they do, think, or say.",
        contextualExamples: [{
          title: "Character Introduction Techniques",
          before: "A girl found the key.",
          after: "Twelve-year-old Maya had always been curious—sometimes too curious, her mother would say. But as she held the ornate key up to the light, watching its strange symbols dance across the walls, she knew this discovery would change everything.",
          explanation: "This introduces age, personality trait (curious), a hint of conflict (mother's concern), and the key in one powerful moment."
        }],
        rubricGuidance: {
          criterion: "Content and Ideas - Character",
          currentLevel: "Level 2 (Basic)",
          targetIndicators: [
            "Character has clear personality traits",
            "Character's motivations are evident",
            "Physical or emotional details included",
            "Character feels real and relatable"
          ]
        }
      };
    }

    if (!hasSetting) {
      return {
        encouragement: "Good character introduction! Now paint the setting. 🎨",
        nswFocus: "Setting Description",
        suggestion: "Help your reader visualize WHERE your story takes place. Use all five senses: sight, sound, smell, touch, taste.",
        example: "Setting with Sensory Details:\n\n❌ Basic: 'The attic was old.'\n\n✅ Vivid: 'Dust motes danced in the single shaft of sunlight piercing the attic's gloom. The air hung heavy with the musty scent of forgotten memories, and every floorboard groaned beneath my feet as if whispering secrets from decades past.'",
        nextStep: "Describe your setting using at least 3 of the 5 senses. What does your character see, hear, smell, feel, or taste?",
        contextualExamples: [{
          title: "Multi-Sensory Setting",
          before: "The forest was dark and scary.",
          after: "Ancient trees loomed overhead, their twisted branches blocking out the stars. An owl's cry pierced the silence, making me jump. The air tasted of rain and earth, and every snap of a twig under my feet sounded like thunder in the oppressive quiet.",
          explanation: "Sight (trees, stars), sound (owl, twigs), taste (rain, earth), touch (air) create an immersive atmosphere."
        }],
        rubricGuidance: {
          criterion: "Language Features - Descriptive Language",
          currentLevel: "Level 2 (Basic)",
          targetIndicators: [
            "Uses multiple sensory details (3+ senses)",
            "Creates vivid mental images",
            "Setting affects mood/atmosphere",
            "Specific rather than general descriptions"
          ]
        }
      };
    }

    return {
      encouragement: "Excellent opening! Let's develop the conflict. ⚡",
      nswFocus: "Inciting Incident",
      suggestion: "Now introduce the problem or event that disrupts your character's normal world. This is what sets your story in motion!",
      example: "Inciting Incident:\n\n❌ Weak: 'Something happened.'\n\n✅ Strong: 'The moment I turned the key, the chest burst open with a flash of golden light. Inside lay not grandmother's old jewelry, but a glowing map that seemed to pulse with life—and it had my name written across it in shimmering letters.'",
      nextStep: "Introduce the main problem, discovery, or event that changes everything for your character.",
      contextualExamples: [{
        title: "Creating Compelling Conflict",
        before: "Then I found something strange.",
        after: "Without warning, the key grew scorching hot in my palm. I yelped and dropped it—but instead of falling, it hovered in mid-air, rotating slowly as ancient symbols began appearing on the walls around me, glowing with an eerie blue light.",
        explanation: "Physical sensation, unexpected action, visual spectacle, and growing mystery create immediate tension."
      }]
    };
  }

  private static getCharacterDevelopmentGuidance(content: string): EnhancedCoachResponse {
    const emotions = content.match(/\b(happy|sad|angry|scared|nervous|excited|worried)\b/gi) || [];
    const showingWords = content.match(/\b(trembled|grinned|whispered|gasped|clenched|pounded)\b/gi) || [];

    if (emotions.length > showingWords.length) {
      return {
        encouragement: "Good progress! Let's make emotions more vivid. 💪",
        nswFocus: "Character Emotions - Show Don't Tell",
        suggestion: "Instead of TELLING us how your character feels, SHOW us through their actions, body language, and physical reactions.",
        example: "Show Emotions Through Actions:\n\n❌ Telling: 'I was scared when I heard the noise.'\n\n✅ Showing: 'My heart hammered against my ribs. Cold sweat broke out across my forehead as I heard the slow, deliberate footsteps approaching. I pressed myself against the wall, hardly daring to breathe.'",
        nextStep: "Find a place where you name an emotion (happy, sad, scared) and replace it with physical reactions and actions.",
        contextualExamples: [{
          title: "Physical Reactions Replace Emotion Words",
          before: "Sarah was nervous about opening the chest.",
          after: "Sarah's hands shook as she reached for the chest's lid. Her mouth went dry, and she could hear her pulse thundering in her ears. Twice she pulled her hand back before finally forcing herself to grasp the ancient latch.",
          explanation: "Shaking hands, dry mouth, racing pulse, hesitation—all show nervousness without saying 'nervous.'"
        }],
        showDontTell: {
          issue: `Found ${emotions.length} telling words: ${emotions.slice(0, 3).join(', ')}`,
          alternatives: [
            "Replace 'scared' with: heart pounded, hands trembled, froze in place",
            "Replace 'happy' with: grinned widely, eyes lit up, bounced with excitement",
            "Replace 'sad' with: tears welled up, shoulders slumped, couldn't meet their eyes"
          ]
        },
        rubricGuidance: {
          criterion: "Language Features - Show Don't Tell",
          currentLevel: "Level 2 (Telling)",
          targetIndicators: [
            "Emotions shown through physical reactions",
            "Character actions reveal feelings",
            "Body language describes internal states",
            "No direct emotion naming (eliminate 'was happy/sad/scared')"
          ]
        }
      };
    }

    return {
      encouragement: "Great character development! Add dialogue. 💬",
      nswFocus: "Dialogue - Character Voice",
      suggestion: "Dialogue brings characters to life and moves the story forward. Use it to reveal personality and create tension.",
      example: "Effective Dialogue:\n\n❌ Weak: 'He said hello.'\n\n✅ Strong: '\"Don't touch that!\" The voice came from behind me, sharp and urgent. I spun around to see an old man standing in the attic doorway, his eyes fixed on the glowing key in my hand. \"You don't understand what you've awakened.\"'",
      nextStep: "Add a dialogue exchange that reveals character personality or advances the plot.",
      contextualExamples: [{
        title: "Dialogue That Reveals Character",
        before: "She told me to be careful.",
        after: "\"For heaven's sake, be careful with that!\" Grandmother's voice cracked with emotion. She gripped the doorframe, knuckles white. \"That key... I never wanted you to find it. It's been hidden for a reason.\"",
        explanation: "Dialogue shows grandmother's fear and creates mystery. Her physical actions (gripping doorframe, white knuckles) enhance the moment."
      }]
    };
  }

  private static getShowDontTellGuidance(content: string): EnhancedCoachResponse {
    const showTellAnalysis = generateShowDontTellFeedback(content);
    const issues = analyzeShowDontTell(content);

    if (issues.length > 0) {
      const firstIssue = issues[0];
      return {
        encouragement: "Let's refine your descriptive technique! 🎯",
        nswFocus: "Show Don't Tell - Advanced Technique",
        suggestion: `I noticed you used "${firstIssue.original}". Let's make this more vivid by showing the emotion through specific actions and physical details.`,
        example: `Transform Your Writing:\n\n❌ Before: ${firstIssue.example.before}\n\n✅ After: ${firstIssue.example.after}`,
        nextStep: "Revise one 'telling' phrase in your writing using physical reactions, actions, or dialogue.",
        showDontTell: {
          issue: `Found: "${firstIssue.original}"`,
          alternatives: firstIssue.showingSuggestions.slice(0, 3)
        },
        contextualExamples: [{
          title: "Show Don't Tell Mastery",
          before: firstIssue.example.before,
          after: firstIssue.example.after,
          explanation: firstIssue.explanation
        }],
        rubricGuidance: {
          criterion: "Language Features - Descriptive Writing",
          currentLevel: `Level 3 (${showTellAnalysis.ratio.assessment})`,
          targetIndicators: [
            "Show/Tell ratio above 3:1",
            "All emotions shown through actions",
            "Rich sensory and physical details",
            "No direct emotion naming"
          ]
        }
      };
    }

    return {
      encouragement: "Excellent showing technique! Add figurative language. ✨",
      nswFocus: "Figurative Language - Literary Devices",
      suggestion: "Enhance your narrative with similes, metaphors, and personification to create memorable imagery.",
      example: "Figurative Language:\n\n• Simile: 'The key glowed like a captured star in my palm.'\n• Metaphor: 'The attic was a treasure trove of forgotten dreams.'\n• Personification: 'The old chest groaned as I lifted its heavy lid, as if reluctant to reveal its secrets.'",
      nextStep: "Add at least one simile (using 'like' or 'as') or metaphor to enhance your description.",
      contextualExamples: [{
        title: "Powerful Figurative Language",
        before: "The map was old and mysterious.",
        after: "The map seemed alive, its lines shifting and rearranging themselves like serpents dancing beneath the yellowed parchment. Each marked location pulsed with light, calling to me like distant stars beckoning a lost traveler home.",
        explanation: "Simile (like serpents, like distant stars) and personification (calling to me, beckoning) create vivid, memorable imagery."
      }]
    };
  }

  private static getFigurativeLanguageGuidance(content: string): EnhancedCoachResponse {
    const hasSimile = /\blike\b|\bas .* as\b/i.test(content);
    const hasMetaphor = content.length > 100; // Simplified check

    if (!hasSimile) {
      return {
        encouragement: "Your story is developing well! Add similes. 🌟",
        nswFocus: "Figurative Language - Similes",
        suggestion: "Similes compare two things using 'like' or 'as...as' to create vivid mental images.",
        example: "Creating Effective Similes:\n\n❌ Basic: 'The chest was big.'\n✅ Simile: 'The chest was as large as a treasure trunk from a pirate ship.'\n\n❌ Basic: 'Light came from the key.'\n✅ Simile: 'Light poured from the key like liquid gold spilling from a broken vessel.'",
        nextStep: "Add 2-3 similes to enhance your descriptions. Use 'like' or 'as...as' to make comparisons.",
        contextualExamples: [{
          title: "Memorable Similes",
          before: "The symbols moved quickly on the wall.",
          after: "The symbols raced across the wall like fireflies darting through a summer night, each one leaving a trail of shimmering light in its wake.",
          explanation: "Comparing symbols to fireflies creates a visual image readers can easily imagine."
        }],
        rubricGuidance: {
          criterion: "Language Features - Figurative Language",
          currentLevel: "Level 3 (Basic)",
          targetIndicators: [
            "Multiple similes used effectively (3+)",
            "Metaphors create powerful imagery",
            "Personification adds depth",
            "Comparisons are original and appropriate"
          ]
        }
      };
    }

    return {
      encouragement: "Fantastic figurative language! Build to the climax. 🔥",
      nswFocus: "Plot Development - Rising Action & Climax",
      suggestion: "Your story needs to build tension toward a climactic moment. Increase stakes, add complications, create suspense.",
      example: "Building Tension:\n\n'As I followed the map's glowing path, the attic began to transform around me. Walls fell away into starlit voids. The floorboards beneath my feet turned to glass, revealing swirling galaxies below. And there, at the center of it all, stood a door that shouldn't exist—a door to grandmother's greatest secret.'",
      nextStep: "Build toward your story's most exciting moment. What's the biggest challenge or revelation?",
      contextualExamples: [{
        title: "Creating Climactic Moments",
        before: "I opened the door and saw something interesting.",
        after: "The moment my fingers touched the door handle, reality shattered. The world exploded into color and sound—grandmother's voice echoing from everywhere and nowhere, telling me the truth I'd never imagined: our family wasn't from this world at all.",
        explanation: "Powerful verbs (shattered, exploded), sensory overload, and shocking revelation create maximum impact."
      }]
    };
  }

  private static getAdvancedGuidance(content: string, prompt?: string): EnhancedCoachResponse {
    const wordCount = content.trim().split(/\s+/).length;

    if (wordCount < 250) {
      return {
        encouragement: "Excellent narrative development! Craft your resolution. 🎭",
        nswFocus: "Resolution & Character Growth",
        suggestion: "Bring your story to a satisfying close. Show how your character has changed or what they've learned.",
        example: "Powerful Resolution:\n\n'As I placed the key back in its resting place, I understood why grandmother had kept it hidden. Some secrets protect us until we're ready to protect them. I closed the chest gently, but I knew I'd never forget what I'd seen—or who I truly was.'",
        nextStep: "Write your ending. Show how the experience changed your character and resolve the main conflict.",
        contextualExamples: [{
          title: "Meaningful Endings",
          before: "Then I went home and everything was normal.",
          after: "I descended the attic stairs, but I wasn't the same person who'd climbed them. My reflection in grandmother's hallway mirror showed the same face, yet something in my eyes had changed—a knowing, a purpose. Some adventures don't end. They simply show you where the real journey begins.",
          explanation: "This ending shows character transformation, uses reflection as metaphor, and hints at future growth without being overly explicit."
        }],
        rubricGuidance: {
          criterion: "Text Structure - Resolution",
          currentLevel: "Level 4 (Good)",
          targetIndicators: [
            "Conflict fully resolved",
            "Character growth evident",
            "Satisfying emotional conclusion",
            "Circular structure or meaningful final image",
            "Leaves lasting impression"
          ]
        }
      };
    }

    return {
      encouragement: "Outstanding narrative! You've created something special! 🏆",
      nswFocus: "Final Polish - NSW Excellence",
      suggestion: "Your story is complete! Now review for: varied sentence structures, sophisticated vocabulary, consistent tense, and perfect punctuation.",
      example: "Level 5 Excellence Checklist:\n✓ Compelling, original plot\n✓ Well-developed characters\n✓ Rich figurative language\n✓ Show don't tell throughout\n✓ Strong opening and resolution\n✓ Minimal errors",
      nextStep: "Proofread carefully. Check for spelling, punctuation, and grammar. Ensure every word serves a purpose.",
      rubricGuidance: {
        criterion: "Overall - Level 5 Achievement",
        currentLevel: "Level 4-5 (Excellent)",
        targetIndicators: [
          "All NSW criteria met at highest level",
          "Sophisticated narrative techniques",
          "Virtually error-free conventions",
          "Distinctive voice and style",
          "Ready for submission"
        ]
      }
    };
  }
}

/**
 * Generate intelligent response based on text type
 */
export function generateIntelligentResponse(
  content: string,
  textType: string,
  prompt?: string
): EnhancedCoachResponse {

  if (textType === 'narrative') {
    return EnhancedNarrativeCoach.generateResponse(content, prompt);
  }

  // For other types, use basic response for now
  const feedback = generateCoachFeedback(content, textType, prompt);
  const examples = generateContextualExamples(content, textType, prompt);

  return {
    encouragement: "Keep writing! You're making great progress! ✨",
    nswFocus: `${textType.charAt(0).toUpperCase() + textType.slice(1)} Writing`,
    suggestion: feedback.overallFeedback,
    example: examples.length > 0 ? `${examples[0].beforeExample} → ${examples[0].afterExample}` : "Continue developing your ideas with specific details.",
    nextStep: feedback.nextSteps[0] || "Keep writing and building your piece!",
    contextualExamples: examples.slice(0, 2).map(ex => ({
      title: ex.category,
      before: ex.beforeExample,
      after: ex.afterExample,
      explanation: ex.explanation
    }))
  };
}