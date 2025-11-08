// Text Type Prompt Library
// Centralized prompt management system for different text types

export interface TextTypePrompts {
  narrative: string[];
  persuasive: string[];
  expository: string[];
  descriptive: string[];
  reflective: string[];
  recount: string[];
  technical: string[];
  creative: string[];
}

export const TEXT_TYPE_PROMPTS: TextTypePrompts = {
  narrative: [
    "The Secret Door in the Library: During a rainy afternoon, you decide to explore the dusty old library in your town that you've never visited before. As you wander through the aisles, you discover a hidden door behind a bookshelf. It's slightly ajar, and a faint, warm light spills out from the crack. What happens when you push the door open? Describe the world you enter and the adventures that await you inside. Who do you meet, and what challenges do you face? How does this experience change you by the time you return to the library? Let your imagination run wild as you take your reader on a journey through this mysterious door!",
    "The Time Capsule: While cleaning out your grandmother's attic, you discover an old metal box buried under dusty blankets. Inside, you find photographs, letters, and objects from decades ago. As you examine each item, you realize they tell the story of a mystery that was never solved. Write a story about what you discover and how you decide to solve this decades-old mystery.",
    "The Last Day of School: It's the final day of the school year, and something extraordinary happens that changes everything. Write a story about this unexpected event and how it affects you and your classmates."
  ],
  
  persuasive: [
    "School Uniform Debate: Your school is considering implementing a mandatory school uniform policy. Write a persuasive essay arguing either for or against this policy. Use specific examples, logical reasoning, and evidence to support your position. Consider the perspectives of students, parents, and teachers in your argument.",
    "Technology in the Classroom: Some educators believe that students should have unlimited access to tablets and laptops during class, while others think traditional pen-and-paper methods are more effective for learning. Write a persuasive essay arguing for your position on technology use in the classroom.",
    "Environmental Action: Your local council is deciding whether to build a new shopping center or preserve a natural park area. Write a persuasive letter to the council arguing for your preferred choice, using evidence about environmental impact, community benefits, and long-term consequences."
  ],
  
  expository: [
    "How Social Media Affects Teenagers: Write an informative essay explaining the various ways social media impacts teenagers' daily lives, relationships, and mental health. Include both positive and negative effects, and support your explanations with examples and research.",
    "The Process of Photosynthesis: Explain how plants convert sunlight into energy through photosynthesis. Describe the steps involved, the materials needed, and why this process is essential for life on Earth. Use clear, scientific language that a younger student could understand.",
    "Climate Change Causes and Effects: Write an informative essay explaining what climate change is, what causes it, and how it affects our planet. Include specific examples of climate change impacts and explain the science behind global warming."
  ],
  
  descriptive: [
    "Your Perfect Day: Describe in vivid detail what your perfect day would look like from morning to night. Use sensory details to help your reader experience the sights, sounds, smells, tastes, and feelings of this ideal day. Make your reader feel as if they are living this perfect day alongside you.",
    "A Place That Matters: Think of a place that holds special meaning for you - it could be a room in your house, a spot in nature, or somewhere in your community. Describe this place in rich detail, explaining not just what it looks like, but why it's important to you and how it makes you feel.",
    "The Storm: Describe a powerful storm (thunderstorm, blizzard, or hurricane) as if you're experiencing it firsthand. Use vivid sensory details to convey the intensity, power, and atmosphere of the storm."
  ],
  
  reflective: [
    "A Lesson Learned: Think about a time when you made a mistake or faced a challenge that taught you something important about yourself or life. Reflect on what happened, how you felt at the time, what you learned from the experience, and how it has influenced your actions or thinking since then.",
    "Personal Growth: Reflect on how you have changed and grown over the past year. Consider your achievements, challenges you've overcome, new skills you've developed, and ways your perspective has shifted. What are you most proud of, and what goals do you have for continued growth?",
    "A Meaningful Relationship: Reflect on a relationship that has significantly impacted your life - this could be with a family member, friend, teacher, or mentor. Explore how this person has influenced you, what you've learned from them, and how the relationship has shaped who you are today."
  ],
  
  recount: [
    "An Unforgettable School Trip: Recount a memorable school excursion or field trip you've been on. Describe what happened in chronological order, including the preparation, the journey, the activities, and your return. Focus on the most interesting or surprising moments and explain why this trip was memorable.",
    "The Day Everything Went Wrong: Recount a day when nothing seemed to go according to plan. Describe the sequence of events that led to chaos, how you and others responded to each challenge, and what the outcome was. Include specific details about what happened and when.",
    "A Family Celebration: Recount a special family celebration, holiday, or tradition that you participated in. Describe the events in the order they happened, who was involved, what activities took place, and what made this celebration special or meaningful to you."
  ],
  
  technical: [
    "How to Create a Social Media Account Safely: Write a step-by-step guide explaining how to set up a social media account with proper privacy settings. Include instructions for creating strong passwords, adjusting privacy controls, and staying safe online.",
    "Building a Simple Robot: Provide detailed instructions for building a basic robot using common materials. Include a list of required materials, step-by-step assembly instructions, and troubleshooting tips for common problems.",
    "Setting Up a Study Schedule: Write a comprehensive guide on how to create an effective study schedule. Include steps for assessing workload, prioritizing subjects, allocating time, and maintaining the schedule throughout the term."
  ],
  
  creative: [
    "The Color That Doesn't Exist: Imagine you've discovered a completely new color that no one has ever seen before. Write a creative piece describing this color, how you found it, what it looks like, and how it affects the world around you. Let your imagination run wild with this impossible concept.",
    "If Objects Could Talk: Choose an everyday object in your room and imagine it could suddenly speak and tell its life story. Write a creative piece from the object's perspective, describing its experiences, the things it has witnessed, and its thoughts about the humans who use it.",
    "The Last Library on Earth: In a future world where all books have been digitized and physical libraries no longer exist, you discover the last remaining library hidden away. Write a creative piece about your exploration of this forgotten place and what you find there."
  ]
};

/**
 * Get a random prompt for a specific text type
 */
export function getRandomPromptForTextType(textType: string): string {
  if (!textType || typeof textType !== 'string') {
    return getDefaultPromptForTextType('narrative');
  }
  const normalizedType = textType.toLowerCase() as keyof TextTypePrompts;
  const prompts = TEXT_TYPE_PROMPTS[normalizedType];
  
  if (!prompts || prompts.length === 0) {
    return getDefaultPromptForTextType(textType);
  }
  
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
}

/**
 * Get a default fallback prompt for any text type
 */
export function getDefaultPromptForTextType(textType: string): string {
  if (!textType || typeof textType !== 'string') {
    textType = 'narrative';
  }
  const normalizedType = textType.toLowerCase();
  
  switch (normalizedType) {
    case 'narrative':
      return "Write an engaging story that captures your reader's imagination. Include interesting characters, a clear setting, and an exciting plot with a beginning, middle, and end.";
    
    case 'persuasive':
      return "Choose a topic you feel strongly about and write a persuasive essay to convince your reader to agree with your viewpoint. Use strong evidence, logical reasoning, and compelling examples to support your argument.";
    
    case 'expository':
      return "Choose a topic you know well and write an informative essay that explains it clearly to your reader. Use facts, examples, and clear explanations to help your reader understand the topic thoroughly.";
    
    case 'descriptive':
      return "Choose a person, place, object, or experience and describe it in vivid detail. Use sensory language and specific details to help your reader visualize and experience what you're describing.";
    
    case 'reflective':
      return "Think about a meaningful experience, lesson learned, or personal growth moment in your life. Reflect on what happened, how it affected you, and what insights you gained from the experience.";
    
    case 'recount':
      return "Think of an interesting event or experience from your life and recount what happened. Tell the story in chronological order, including important details about when, where, who was involved, and what occurred.";
    
    case 'technical':
      return "Choose a process, procedure, or skill that you know how to do well and write clear, step-by-step instructions that would help someone else learn to do it successfully.";
    
    case 'creative':
      return "Let your imagination run free and write a creative piece that explores an unusual idea, fantastical scenario, or unique perspective. Experiment with language, style, and creative expression.";
    
    default:
      return "Write a thoughtful and engaging piece that demonstrates your writing skills and creativity. Focus on clear communication and connecting with your reader.";
  }
}

/**
 * Get all available prompts for a specific text type
 */
export function getAllPromptsForTextType(textType: string): string[] {
  const normalizedType = textType.toLowerCase() as keyof TextTypePrompts;
  return TEXT_TYPE_PROMPTS[normalizedType] || [getDefaultPromptForTextType(textType)];
}
