// Real-time story structure tracking
// Only analyzes after 50 words to avoid distraction

export interface StoryStage {
  name: string;
  progress: number; // 0-100
  description: string;
  tips: string[];
  isCurrentStage: boolean;
}

export interface StoryStructureAnalysis {
  currentStage: StoryStage;
  allStages: StoryStage[];
  overallProgress: number; // 0-100
  wordCount: number;
  targetWordCount: number;
  nextMilestone: {
    stage: string;
    wordsNeeded: number;
    description: string;
  };
  feedback: string;
}

// Story structure stages based on word count
const NARRATIVE_STAGES = {
  opening: {
    name: 'Opening',
    range: [0, 50],
    description: 'Setting the scene and introducing characters',
    tips: [
      'Hook your reader with an interesting first sentence',
      'Introduce your main character and setting',
      'Create curiosity about what will happen'
    ]
  },
  risingAction: {
    name: 'Rising Action',
    range: [50, 150],
    description: 'Building tension and developing the story',
    tips: [
      'Add details and descriptions',
      'Develop your characters through actions and dialogue',
      'Build towards a problem or challenge'
    ]
  },
  climax: {
    name: 'Climax',
    range: [150, 200],
    description: 'The most exciting or important moment',
    tips: [
      'This is the turning point of your story',
      'Show the character facing their biggest challenge',
      'Use vivid language to create impact'
    ]
  },
  fallingAction: {
    name: 'Falling Action',
    range: [200, 230],
    description: 'Resolving the main conflict',
    tips: [
      'Show the results of the climax',
      'Begin wrapping up loose ends',
      'Lead naturally toward your conclusion'
    ]
  },
  conclusion: {
    name: 'Conclusion',
    range: [230, 300],
    description: 'Ending your story with impact',
    tips: [
      'Provide a satisfying resolution',
      'Show how characters changed',
      'Leave the reader with a final thought or feeling'
    ]
  }
};

const PERSUASIVE_STAGES = {
  introduction: {
    name: 'Introduction',
    range: [0, 50],
    description: 'Stating your position clearly',
    tips: [
      'Start with a hook to grab attention',
      'Clearly state your opinion',
      'Preview your main arguments'
    ]
  },
  argument1: {
    name: 'First Argument',
    range: [50, 120],
    description: 'Presenting your strongest point',
    tips: [
      'State your point clearly',
      'Provide evidence or examples',
      'Explain why this matters'
    ]
  },
  argument2: {
    name: 'Second Argument',
    range: [120, 190],
    description: 'Supporting with additional reasons',
    tips: [
      'Introduce your second point',
      'Use different evidence from your first argument',
      'Connect back to your main position'
    ]
  },
  counterargument: {
    name: 'Counter-Argument',
    range: [190, 230],
    description: 'Addressing opposing views',
    tips: [
      'Acknowledge what others might think',
      'Respectfully explain why your view is stronger',
      'Strengthen your position'
    ]
  },
  conclusion: {
    name: 'Conclusion',
    range: [230, 300],
    description: 'Reinforcing your position',
    tips: [
      'Summarize your main points',
      'Restate your position powerfully',
      'End with a call to action or final thought'
    ]
  }
};

function determineCurrentStage(wordCount: number, stages: any): { stageName: string; stage: any } {
  for (const [key, stage] of Object.entries(stages)) {
    const [min, max] = (stage as any).range;
    if (wordCount >= min && wordCount < max) {
      return { stageName: key, stage };
    }
  }
  // If beyond all stages, return last stage
  const entries = Object.entries(stages);
  const lastEntry = entries[entries.length - 1];
  return { stageName: lastEntry[0], stage: lastEntry[1] };
}

export function analyzeStoryStructureRealtime(
  text: string,
  textType: string = 'narrative'
): StoryStructureAnalysis {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const targetWordCount = 250; // NSW standard

  // If less than 50 words, return minimal analysis
  if (wordCount < 50) {
    return {
      currentStage: {
        name: 'Getting Started',
        progress: (wordCount / 50) * 100,
        description: 'Begin your opening',
        tips: ['Start writing to track your story structure!'],
        isCurrentStage: true
      },
      allStages: [],
      overallProgress: (wordCount / targetWordCount) * 100,
      wordCount,
      targetWordCount,
      nextMilestone: {
        stage: 'Opening Complete',
        wordsNeeded: 50 - wordCount,
        description: 'Reach 50 words to complete your opening'
      },
      feedback: `Keep writing! ${50 - wordCount} more words to unlock structure tracking.`
    };
  }

  // Choose stages based on text type
  const stages = textType === 'persuasive' ? PERSUASIVE_STAGES : NARRATIVE_STAGES;

  // Determine current stage
  const { stageName, stage } = determineCurrentStage(wordCount, stages);
  const [stageMin, stageMax] = stage.range;
  const stageProgress = Math.min(100, ((wordCount - stageMin) / (stageMax - stageMin)) * 100);

  // Build all stages with progress
  const allStages: StoryStage[] = Object.entries(stages).map(([key, s]: [string, any]) => {
    const [min, max] = s.range;
    const isCurrentStage = key === stageName;
    const isPastStage = wordCount > max;

    return {
      name: s.name,
      progress: isPastStage ? 100 : isCurrentStage ? stageProgress : 0,
      description: s.description,
      tips: s.tips,
      isCurrentStage
    };
  });

  // Calculate overall progress
  const overallProgress = Math.min(100, (wordCount / targetWordCount) * 100);

  // Determine next milestone
  let nextMilestone = {
    stage: 'Complete',
    wordsNeeded: 0,
    description: 'Great work! You\'ve reached the target length.'
  };

  const stageEntries = Object.entries(stages);
  const currentIndex = stageEntries.findIndex(([key]) => key === stageName);

  if (currentIndex < stageEntries.length - 1 && wordCount < stageMax) {
    // Still in current stage
    nextMilestone = {
      stage: stage.name,
      wordsNeeded: stageMax - wordCount,
      description: `Complete your ${stage.name.toLowerCase()}`
    };
  } else if (currentIndex < stageEntries.length - 1) {
    // Move to next stage
    const nextStage = stageEntries[currentIndex + 1][1] as any;
    nextMilestone = {
      stage: nextStage.name,
      wordsNeeded: nextStage.range[0] - wordCount,
      description: `Begin your ${nextStage.name.toLowerCase()}`
    };
  } else if (wordCount < targetWordCount) {
    // In final stage but not at target
    nextMilestone = {
      stage: 'Target Length',
      wordsNeeded: targetWordCount - wordCount,
      description: 'Reach the target word count of 250'
    };
  }

  // Generate feedback
  let feedback = '';
  const progressPercent = Math.round(overallProgress);

  if (progressPercent < 30) {
    feedback = `📖 You're ${progressPercent}% through. Focus on ${stage.name.toLowerCase()}.`;
  } else if (progressPercent < 60) {
    feedback = `⚡ Halfway there! Continue developing your ${stage.name.toLowerCase()}.`;
  } else if (progressPercent < 90) {
    feedback = `🎯 Almost done! ${progressPercent}% complete. Finish strong!`;
  } else if (progressPercent < 100) {
    feedback = `🌟 Excellent! Just ${targetWordCount - wordCount} more words to reach your target.`;
  } else {
    feedback = `✅ You've reached your target! Polish and perfect your writing.`;
  }

  return {
    currentStage: {
      name: stage.name,
      progress: Math.round(stageProgress),
      description: stage.description,
      tips: stage.tips,
      isCurrentStage: true
    },
    allStages,
    overallProgress: Math.round(overallProgress),
    wordCount,
    targetWordCount,
    nextMilestone,
    feedback
  };
}
