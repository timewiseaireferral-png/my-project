import React, { useState } from 'react';
import { ArrowLeft, Clock, Award, BookOpen, CheckCircle, Lock, Play, AlertCircle } from 'lucide-react';
import { useLearning } from '../contexts/LearningContext';

interface LessonDetailProps {
  lessonId: number;
  onBack: () => void;
  onStartLesson: () => void;
}

interface Lesson {
  id: number;
  title: string;
  category: string;
  prerequisites: number[];
  duration: string;
  difficulty: string;
  points: number;
  description: string;
}

// NOTE: This data is a subset of the full lessons.json for demonstration purposes.
// In a real application, you would fetch the full lesson content dynamically.
const LESSONS_DATA: { [key: number]: Lesson } = {
  1: {
    id: 1,
    title: "NSW Selective Assessment Criteria",
    category: "Foundations",
    prerequisites: [],
    duration: "15 min",
    difficulty: "Beginner",
    points: 50,
    description: "Understanding the marking criteria and what examiners look for in your essays."
  },
  2: {
    id: 2,
    title: "Sentence Structure Mastery",
    category: "Grammar & Style",
    prerequisites: [],
    duration: "20 min",
    difficulty: "Beginner",
    points: 75,
    description: "Learn to craft varied and sophisticated sentence structures that impress examiners."
  },
  3: {
    id: 3,
    title: "Paragraph Building Techniques",
    category: "Structure",
    prerequisites: [],
    duration: "25 min",
    difficulty: "Beginner",
    points: 100,
    description: "Master the art of constructing coherent, well-developed paragraphs."
  },
  4: {
    id: 4,
    title: "Advanced Punctuation",
    category: "Grammar & Style",
    prerequisites: [2],
    duration: "18 min",
    difficulty: "Intermediate",
    points: 85,
    description: "Use punctuation strategically to enhance your writing style and clarity."
  },
  5: {
    id: 5,
    title: "Descriptive Language Techniques",
    category: "Creative Writing",
    prerequisites: [3],
    duration: "30 min",
    difficulty: "Intermediate",
    points: 120,
    description: "Create vivid imagery and engage readers with powerful descriptive writing."
  },
  6: {
    id: 6,
    title: "Narrative Structure & Plot",
    category: "Creative Writing",
    prerequisites: [3, 5],
    duration: "35 min",
    difficulty: "Intermediate",
    points: 150,
    description: "Learn to structure compelling narratives with strong plot development."
  },
  7: {
    id: 7,
    title: "Character Development",
    category: "Creative Writing",
    prerequisites: [6],
    duration: "28 min",
    difficulty: "Intermediate",
    points: 130,
    description: "Create memorable, three-dimensional characters that drive your narrative."
  },
  8: {
    id: 8,
    title: "Setting Description",
    category: "Creative Writing",
    prerequisites: [5],
    duration: "22 min",
    difficulty: "Intermediate",
    points: 95,
    description: "Techniques for creating immersive and atmospheric settings."
  },
  9: {
    id: 9,
    title: "Dialogue Writing",
    category: "Creative Writing",
    prerequisites: [4, 7],
    duration: "20 min",
    difficulty: "Intermediate",
    points: 110,
    description: "Craft natural and purposeful dialogue that reveals character and advances plot."
  },
  10: {
    id: 10,
    title: "Plot Development",
    category: "Creative Writing",
    prerequisites: [6, 7],
    duration: "25 min",
    difficulty: "Intermediate",
    points: 140,
    description: "Deep dive into plot arcs, conflict, and pacing."
  },
  11: {
    id: 11,
    title: "Show Don't Tell",
    category: "Creative Writing",
    prerequisites: [8, 9],
    duration: "18 min",
    difficulty: "Advanced",
    points: 160,
    description: "Master the fundamental principle of showing action and emotion instead of simply telling."
  },
  12: {
    id: 12,
    title: "Persuasive Writing Fundamentals",
    category: "Persuasive Writing",
    prerequisites: [3],
    duration: "25 min",
    difficulty: "Intermediate",
    points: 110,
    description: "Master the basics of persuasive writing and argumentation."
  },
  13: {
    id: 13,
    title: "Persuasive Techniques",
    category: "Persuasive Writing",
    prerequisites: [12],
    duration: "20 min",
    difficulty: "Intermediate",
    points: 130,
    description: "Explore rhetorical devices, appeals to emotion, and logical fallacies."
  },
  14: {
    id: 14,
    title: "Persuasive Essay Structure",
    category: "Persuasive Writing",
    prerequisites: [12, 13],
    duration: "30 min",
    difficulty: "Intermediate",
    points: 150,
    description: "Structuring a compelling essay using PEEEL, introduction, and conclusion techniques."
  },
  15: {
    id: 15,
    title: "Persuasive Practice",
    category: "Persuasive Writing",
    prerequisites: [14],
    duration: "40 min",
    difficulty: "Advanced",
    points: 200,
    description: "Timed practice session applying all persuasive writing skills."
  },
  16: {
    id: 16,
    title: "Descriptive Basics",
    category: "Creative Writing",
    prerequisites: [5],
    duration: "20 min",
    difficulty: "Intermediate",
    points: 90,
    description: "Revisiting the core elements of strong descriptive writing."
  },
  17: {
    id: 17,
    title: "Setting Description",
    category: "Creative Writing",
    prerequisites: [16],
    duration: "25 min",
    difficulty: "Intermediate",
    points: 110,
    description: "Advanced techniques for creating immersive and atmospheric settings."
  },
  18: {
    id: 18,
    title: "Character Description",
    category: "Creative Writing",
    prerequisites: [16],
    duration: "25 min",
    difficulty: "Intermediate",
    points: 110,
    description: "Developing vivid and memorable character portraits."
  },
  19: {
    id: 19,
    title: "Sensory Details",
    category: "Creative Writing",
    prerequisites: [17, 18],
    duration: "15 min",
    difficulty: "Advanced",
    points: 130,
    description: "Engaging all five senses to bring writing to life."
  },
  20: {
    id: 20,
    title: "Advanced Imagery",
    category: "Creative Writing",
    prerequisites: [19],
    duration: "20 min",
    difficulty: "Advanced",
    points: 150,
    description: "Using sophisticated language to paint mental pictures."
  },
  21: {
    id: 21,
    title: "Metaphors & Similes",
    category: "Creative Writing",
    prerequisites: [20],
    duration: "18 min",
    difficulty: "Advanced",
    points: 140,
    description: "Mastering the use of figurative language for impact."
  },
  22: {
    id: 22,
    title: "Personification",
    category: "Creative Writing",
    prerequisites: [20],
    duration: "18 min",
    difficulty: "Advanced",
    points: 140,
    description: "Giving human qualities to inanimate objects."
  },
  23: {
    id: 23,
    title: "Mood & Tone",
    category: "Creative Writing",
    prerequisites: [21, 22],
    duration: "20 min",
    difficulty: "Advanced",
    points: 160,
    description: "Controlling the emotional atmosphere of your writing."
  },
  24: {
    id: 24,
    title: "Descriptive Practice Exam",
    category: "Creative Writing",
    prerequisites: [23],
    duration: "45 min",
    difficulty: "Expert",
    points: 250,
    description: "Timed practice session applying all descriptive and figurative language skills."
  },
  25: {
    id: 25,
    title: "Rhetorical Questions",
    category: "Persuasive Writing",
    prerequisites: [13],
    duration: "15 min",
    difficulty: "Advanced",
    points: 100,
    description: "Using questions for persuasive effect."
  },
  26: {
    id: 26,
    title: "Counter-Arguments",
    category: "Persuasive Writing",
    prerequisites: [14, 25],
    duration: "25 min",
    difficulty: "Advanced",
    points: 170,
    description: "Techniques for acknowledging and refuting opposing viewpoints."
  },
  27: {
    id: 27,
    title: "Persuasive Language",
    category: "Persuasive Writing",
    prerequisites: [25],
    duration: "20 min",
    difficulty: "Advanced",
    points: 150,
    description: "Selecting high-impact vocabulary for maximum persuasive power."
  },
  28: {
    id: 28,
    title: "Formal vs Informal",
    category: "Persuasive Writing",
    prerequisites: [27],
    duration: "15 min",
    difficulty: "Advanced",
    points: 120,
    description: "Understanding and applying appropriate tone and register for different audiences."
  },
  29: {
    id: 29,
    title: "Persuasive Speech",
    category: "Persuasive Writing",
    prerequisites: [28],
    duration: "30 min",
    difficulty: "Expert",
    points: 180,
    description: "Structuring and delivering a compelling persuasive speech."
  },
  30: {
    id: 30,
    title: "Final Practice Exam",
    category: "All",
    prerequisites: [26, 29],
    duration: "60 min",
    difficulty: "Expert",
    points: 300,
    description: "Comprehensive timed practice session covering all writing types and skills."
  }
};

const LESSON_CONTENT: { [key: number]: { sections: Array<{ title: string; content: string }> } } = {
  1: {
    sections: [
      {
        title: "What Examiners Look For",
        content: "NSW Selective examiners evaluate your writing based on specific criteria:\n\n• Vocabulary: Use of sophisticated and varied vocabulary appropriate to the text type\n• Grammar & Spelling: Correct use of grammar, spelling, and punctuation\n• Structure: Clear organization with effective paragraphing\n• Technique: Use of literary and persuasive techniques\n• Ideas: Original and well-developed ideas\n• Engagement: Ability to engage and hold the reader's interest"
      },
      {
        title: "Marking Bands",
        content: "Band 1 (Excellent): Sophisticated vocabulary, complex sentence structures, compelling ideas\nBand 2 (Good): Varied vocabulary, good sentence variety, well-developed ideas\nBand 3 (Satisfactory): Adequate vocabulary, some variety, clear ideas\nBand 4 (Needs Improvement): Limited vocabulary, simple structures, basic ideas"
      }
    ]
  },
  2: {
    sections: [
      {
        title: "Types of Sentences",
        content: "1. Simple Sentences: One independent clause\n   Example: 'The cat sat on the mat.'\n\n2. Compound Sentences: Two independent clauses joined by a conjunction\n   Example: 'The cat sat on the mat, and the dog lay beside it.'\n\n3. Complex Sentences: Independent clause with one or more dependent clauses\n   Example: 'While the cat sat on the mat, the dog lay beside it.'\n\n4. Compound-Complex: Multiple independent and dependent clauses\n   Example: 'While the cat sat on the mat, the dog lay beside it, and the birds sang overhead.'"
      },
      {
        title: "Sentence Variety Tips",
        content: "• Vary sentence length: Mix short, punchy sentences with longer, complex ones\n• Vary sentence openings: Start sentences differently to maintain reader interest\n• Use transitional phrases: Connect ideas smoothly between sentences\n• Avoid repetition: Don't start every sentence with the same word or structure"
      }
    ]
  },
  3: {
    sections: [
      {
        title: "Paragraph Structure",
        content: "A well-developed paragraph contains:\n\n1. Topic Sentence: Introduces the main idea\n2. Supporting Sentences: Provide evidence and explanation\n3. Concluding Sentence: Summarizes or transitions to next paragraph\n4. Unity: All sentences relate to the main idea\n5. Coherence: Ideas flow logically from one to the next"
      },
      {
        title: "Paragraph Development Techniques",
        content: "• Examples: Use specific examples to support your point\n• Explanation: Explain why your examples matter\n• Evidence: Use quotes or data to strengthen arguments\n• Analysis: Discuss the significance of your evidence\n• Elaboration: Expand on your ideas with additional details"
      }
    ]
  },
  4: {
    sections: [
      {
        title: "Advanced Punctuation: Semicolons",
        content: "Use a semicolon to join two closely related independent clauses (complete sentences) without a coordinating conjunction (and, but, or, etc.).\n\nExample: 'The sun was setting; the sky was a brilliant orange.'\n\nAlso use semicolons to separate items in a list when those items already contain commas.\n\nExample: 'I visited Paris, France; Rome, Italy; and Berlin, Germany.'"
      },
      {
        title: "Advanced Punctuation: Colons",
        content: "Use a colon to introduce a list, an explanation, or a quotation.\n\nExample: 'I have three favorite colors: blue, green, and purple.'\n\nEnsure the text before the colon is a complete sentence."
      }
    ]
  },
  5: {
    sections: [
      {
        title: "Figurative Language: Simile and Metaphor",
        content: "Simile: A comparison using 'like' or 'as'.\nExample: 'The moon was like a silver coin.'\n\nMetaphor: A direct comparison, stating one thing is another.\nExample: 'The moon was a silver coin in the velvet sky.'"
      },
      {
        title: "Sensory Details",
        content: "Engage the reader's five senses:\n\n• Sight: The emerald green of the forest canopy.\n• Sound: The crunch of dry leaves underfoot.\n• Smell: The sharp, metallic scent of rain.\n• Taste: The bitter tang of burnt sugar.\n• Touch: The rough bark of the ancient tree."
      }
    ]
  },
  6: {
    sections: [
      {
        title: "Story Mountain Framework",
        content: "The Story Mountain helps structure narrative writing:\n\n1. Exposition: Introduce characters, setting, and situation\n2. Rising Action: Build tension through events\n3. Climax: The turning point or most intense moment\n4. Falling Action: Events after the climax\n5. Resolution: How the story ends\n\nThis structure keeps your narrative engaging and well-paced."
      },
      {
        title: "Plot Development Techniques",
        content: "• Foreshadowing: Hint at future events\n• Pacing: Control the speed of your narrative\n• Tension: Create suspense and conflict\n• Turning Points: Include moments that change the story\n• Subplots: Add secondary storylines for depth"
      }
    ]
  },
  7: {
    sections: [
      {
        title: "Internal and External Traits",
        content: "Internal Traits: Personality, motivations, fears (e.g., brave, fearful, ambitious).\n\nExternal Traits: Appearance, mannerisms, clothing (e.g., tall, wears a worn leather jacket, has a nervous twitch)."
      },
      {
        title: "Showing Character, Not Telling",
        content: "Instead of: 'He was angry.'\n\nShow: 'His jaw clenched, and his knuckles turned white as he gripped the steering wheel.'"
      }
    ]
  },
  8: {
    sections: [
      {
        title: "Creating Atmosphere",
        content: "Use descriptive language to evoke a specific mood or feeling (e.g., eerie, cozy, oppressive).\n\nExample: 'The air hung thick and heavy, smelling of damp earth and forgotten things, a silence so profound it felt like a scream held back.'"
      },
      {
        title: "Setting as a Character",
        content: "Describe the setting so that it reflects the mood or personality of the characters or the plot.\n\nExample: A dark, stormy forest for a scene of conflict; a bright, open meadow for a scene of peace."
      }
    ]
  },
  9: {
    sections: [
      {
        title: "Dialogue Tags and Action",
        content: "Use varied dialogue tags (said, whispered, shouted) and actions to break up long speeches and show character interaction.\n\nExample: 'I don't know what you mean,' she whispered, her eyes darting to the closed door."
      },
      {
        title: "Purposeful Dialogue",
        content: "Every line of dialogue should:\n\n• Advance the plot\n• Reveal character\n• Provide necessary information\n\nAvoid small talk that doesn't serve a purpose."
      }
    ]
  },
  10: {
    sections: [
      {
        title: "Conflict Types",
        content: "Man vs. Man (External)\nMan vs. Nature (External)\nMan vs. Society (External)\nMan vs. Self (Internal)"
      },
      {
        title: "Pacing and Tension",
        content: "Fast Pacing: Use short sentences, quick dialogue, and focus on action (e.g., a chase scene).\n\nSlow Pacing: Use longer sentences, detailed descriptions, and internal monologue (e.g., a moment of reflection)."
      }
    ]
  },
  11: {
    sections: [
      {
        title: "The Golden Rule of Writing",
        content: "Telling: 'She was sad.' (Weak)\n\nShowing: 'A single tear traced a path through the dust on her cheek, and her shoulders slumped as if carrying a great weight.' (Strong)"
      },
      {
        title: "Techniques for Showing",
        content: "• Action: What the character does.\n• Dialogue: What the character says.\n• Sensory Details: What the character sees, hears, smells, tastes, and touches.\n• Internal Thoughts: What the character thinks."
      }
    ]
  },
  12: {
    sections: [
      {
        title: "PEEEL Structure",
        content: "Structure your persuasive writing with PEEEL:\n\nP - Point: State your main argument\nE - Evidence: Provide facts, statistics, or examples\nE - Explanation: Explain how the evidence supports your point\nE - Example: Give a specific example\nL - Link: Connect back to your main argument"
      },
      {
        title: "Persuasive Techniques",
        content: "• Rhetorical Questions: Questions that don't require answers\n• Repetition: Repeating key phrases for emphasis\n• Emotive Language: Words that appeal to emotions\n• Statistics: Using numbers to support arguments\n• Expert Opinion: Citing authorities on the subject\n• Analogies: Comparing to similar situations"
      }
    ]
  },
  13: {
    sections: [
      {
        title: "Ethos, Pathos, Logos",
        content: "Ethos (Credibility): Appeal to the audience's sense of right and wrong or the speaker's authority.\n\nPathos (Emotion): Appeal to the audience's emotions (fear, joy, anger).\n\nLogos (Logic): Appeal to the audience's sense of reason and logic (facts, statistics)."
      },
      {
        title: "Repetition and Anaphora",
        content: "Repetition: Repeating a word or phrase for emphasis.\n\nAnaphora: Repeating a word or phrase at the beginning of successive clauses (e.g., 'I have a dream... I have a dream...')"
      }
    ]
  },
  14: {
    sections: [
      {
        title: "Introduction Structure",
        content: "1. Hook: Grab the reader's attention (e.g., anecdote, startling fact).\n2. Background: Provide context on the issue.\n3. Thesis Statement: Clearly state your position (the main argument)."
      },
      {
        title: "Conclusion Structure",
        content: "1. Restate Thesis: Rephrase your main argument.\n2. Summarize Main Points: Briefly review your strongest evidence.\n3. Call to Action/Final Thought: Leave the reader with a powerful, lasting impression."
      }
    ]
  },
  15: {
    sections: [
      {
        title: "Timed Practice Strategy",
        content: "• 5 minutes: Plan your essay (PEEEL structure, main points).\n• 30 minutes: Write the body paragraphs, focusing on evidence and explanation.\n• 5 minutes: Write the introduction and conclusion.\n• 5 minutes: Proofread for grammar, spelling, and punctuation errors."
      },
      {
        title: "Self-Correction Checklist",
        content: "✓ Is my thesis clear?\n✓ Does each body paragraph have a clear Point?\n✓ Have I used strong Evidence and Explanation?\n✓ Is my tone appropriate for a persuasive essay?\n✓ Are there any spelling or grammar errors?"
      }
    ]
  },
  16: {
    sections: [
      {
        title: "The Power of Adjectives and Adverbs",
        content: "Choose strong, specific adjectives and adverbs over weak, generic ones.\n\nWeak: 'The dog ran quickly.' -> Strong: 'The terrier darted across the lawn.'"
      },
      {
        title: "Focus on Specificity",
        content: "Avoid general terms. Instead of 'a flower,' write 'a vibrant crimson rose with dew-kissed petals.'"
      }
    ]
  },
  17: {
    sections: [
      {
        title: "Establishing Time and Place",
        content: "Use details to ground the reader in the setting's time (e.g., 'The gas lamps flickered...') and place (e.g., 'The cobblestone street was slick with rain...')."
      },
      {
        title: "Setting as a Character",
        content: "Describe the setting so that it reflects the mood or personality of the characters or the plot.\n\nExample: A dark, stormy forest for a scene of conflict; a bright, open meadow for a scene of peace."
      }
    ]
  },
  18: {
    sections: [
      {
        title: "Physical Description",
        content: "Focus on a few striking details rather than a long list of features. What makes the character unique?\n\nExample: 'His eyes, the color of faded denim, held a permanent squint, as if he were always looking into the sun.'"
      },
      {
        title: "Character Through Action",
        content: "Describe how a character moves, speaks, and interacts with objects to reveal their personality."
      }
    ]
  },
  19: {
    sections: [
      {
        title: "Sight and Sound",
        content: "Sight: Colors, shapes, light, shadow.\nSound: Loud, soft, rhythmic, jarring, silence."
      },
      {
        title: "Smell, Taste, and Touch",
        content: "Smell: Earthy, metallic, sweet, acrid.\nTaste: Bitter, sweet, salty, sour, umami.\nTouch: Rough, smooth, cold, hot, sticky."
      }
    ]
  },
  20: {
    sections: [
      {
        title: "Imagery and Emotion",
        content: "Use imagery to convey emotion without naming it.\n\nTo show sadness: 'The sky wept a cold, gray rain.'"
      },
      {
        title: "Synaesthesia",
        content: "Blending senses (e.g., 'a loud color,' 'a sweet sound')."
      }
    ]
  },
  21: {
    sections: [
      {
        title: "Effective Similes",
        content: "Similes should be original and insightful, not clichés.\n\nCliché: 'As white as snow.'\nOriginal: 'The snow was a blanket of powdered sugar, untouched and inviting.'"
      },
      {
        title: "Sustained Metaphor",
        content: "Extending a metaphor over several sentences or a whole paragraph."
      }
    ]
  },
  22: {
    sections: [
      {
        title: "Giving Life to the Inanimate",
        content: "Personification makes abstract concepts or objects more relatable.\n\nExample: 'The wind howled its mournful song through the empty corridors.'\n\nExample: 'Time, the relentless thief, stole her youth.'"
      }
    ]
  },
  23: {
    sections: [
      {
        title: "Creating Mood",
        content: "Mood is the atmosphere of the piece, created by setting, word choice, and imagery.\n\nExample: A dark, stormy setting creates a mood of suspense or dread."
      },
      {
        title: "Establishing Tone",
        content: "Tone is the author's attitude toward the subject (e.g., serious, humorous, sarcastic, formal). Tone is conveyed through word choice and sentence structure."
      }
    ]
  },
  24: {
    sections: [
      {
        title: "Descriptive Exam Focus",
        content: "In a descriptive exam, your focus should be 80% on sensory details, figurative language, and creating a strong atmosphere, and 20% on plot."
      },
      {
        title: "Checklist for Descriptive Writing",
        content: "✓ Did I use at least one simile and one metaphor?\n✓ Did I appeal to at least three of the five senses?\n✓ Is the atmosphere clear and consistent?\n✓ Did I use strong, specific verbs and adjectives?"
      }
    ]
  },
  25: {
    sections: [
      {
        title: "Rhetorical Questions for Impact",
        content: "Use rhetorical questions to:\n\n• Engage the audience directly.\n• Emphasize a point.\n• Introduce a new topic.\n\nExample: 'Can we truly stand by and watch this injustice continue?'"
      },
      {
        title: "Placement of Rhetorical Questions",
        content: "Rhetorical questions are most effective at the beginning of a paragraph (as a topic sentence) or in the conclusion (as a final thought)."
      }
    ]
  },
  26: {
    sections: [
      {
        title: "Acknowledging the Opposition",
        content: "Start by fairly stating the opposing viewpoint (e.g., 'Some may argue that...'). This shows you are reasonable and strengthens your credibility (Ethos)."
      },
      {
        title: "Refuting the Counter-Argument",
        content: "Use strong evidence and logical reasoning (Logos) to dismantle the opposing argument. Use transition words like 'However,' 'Nevertheless,' or 'While this is true, it fails to consider...'"
      }
    ]
  },
  27: {
    sections: [
      {
        title: "High-Impact Vocabulary",
        content: "Replace weak words with powerful, persuasive alternatives.\n\nWeak: 'bad problem' -> Strong: 'dire predicament'\nWeak: 'very important' -> Strong: 'paramount, crucial'"
      },
      {
        title: "Emotive Language",
        content: "Use words that trigger a strong emotional response (Pathos).\n\nExample: 'The suffering of the innocent children' vs. 'The situation of the children.'"
      }
    ]
  },
  28: {
    sections: [
      {
        title: "Formal Register",
        content: "Use for essays, reports, and official documents.\n\nCharacteristics: No contractions (don't -> do not), complex sentences, objective tone, specialized vocabulary."
      },
      {
        title: "Informal Register",
        content: "Use for personal letters, diary entries, and casual dialogue.\n\nCharacteristics: Contractions allowed, simple sentences, subjective tone, slang/colloquialisms."
      }
    ]
  },
  29: {
    sections: [
      {
        title: "Speech Structure",
        content: "1. Salutation (e.g., 'Friends, colleagues, fellow citizens...').\n2. Introduction (Hook, Thesis).\n3. Body (Main arguments, PEEEL).\n4. Conclusion (Summary, Call to Action).\n5. Thank the audience."
      },
      {
        title: "Delivery Techniques",
        content: "• Pause for emphasis.\n• Vary your pace and volume.\n• Use rhetorical devices (repetition, anaphora) to make the speech memorable."
      }
    ]
  },
  30: {
    sections: [
      {
        title: "Exam Strategy",
        content: "• Read the prompt carefully: Identify the text type, audience, and purpose.\n• Time Management: Allocate time for planning, writing, and proofreading.\n• Choose your best text type: Select the one you are most confident in."
      },
      {
        title: "Final Checklist",
        content: "✓ Did I meet the requirements of the prompt?\n✓ Is my writing technically correct (grammar, spelling, punctuation)?\n✓ Did I use sophisticated techniques appropriate for the text type?\n✓ Is my message clear and engaging?"
      }
    ]
  }
};

export function LessonDetail({ lessonId, onBack, onStartLesson }: LessonDetailProps) {
  const { progress } = useLearning();
  const lesson = LESSONS_DATA[lessonId];
  const content = LESSON_CONTENT[lessonId];
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Lesson not found</p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Lessons
        </button>
      </div>
    );
  }

  const isCompleted = progress.completedLessons.includes(lessonId);
  const prerequisitesMet = lesson.prerequisites.length === 0 || 
    lesson.prerequisites.every(prereq => progress.completedLessons.includes(prereq));
  const isLocked = !prerequisitesMet && !isCompleted;

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
      >
        <ArrowLeft size={20} />
        Back to Lessons
      </button>

      {/* Lesson Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 mb-6 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg">
              <CheckCircle size={20} />
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lesson.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(lesson.difficulty)}`}>
              {lesson.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={20} className="text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lesson.points} pts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
              <p className="font-semibold text-gray-900 dark:text-white">{lesson.category}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      {lesson.prerequisites.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg border ${
          prerequisitesMet 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start gap-3">
            {prerequisitesMet ? (
              <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Prerequisites</p>
              <p className={prerequisitesMet ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                {prerequisitesMet 
                  ? '✓ All prerequisites completed!' 
                  : 'Complete the required lessons to unlock this one.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Content */}
      {content && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lesson Content</h2>
            <div className="space-y-4">
              {content.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                    className="w-full p-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center justify-between transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white text-left">{section.title}</h3>
                    <span className="text-gray-600 dark:text-gray-400">
                      {expandedSection === index ? '−' : '+'}
                    </span>
                  </button>
                  {expandedSection === index && (
                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!isLocked && !isCompleted && (
          <button
            onClick={onStartLesson}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Play size={20} />
            Start Lesson
          </button>
        )}
        {isLocked && (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed"
          >
            <Lock size={20} />
            Locked - Complete Prerequisites
          </button>
        )}
        {isCompleted && (
          <button
            onClick={onStartLesson}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            <Play size={20} />
            Review Lesson
          </button>
        )}
      </div>
    </div>
  );
}