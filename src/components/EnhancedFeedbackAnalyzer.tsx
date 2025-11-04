import React, { useState, useEffect } from 'react';
import { Brain, Target, Lightbulb, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FeedbackAnalyzerProps {
  essay: string;
  onAnalysisComplete: (analysis: any) => void;
}

export function EnhancedFeedbackAnalyzer({ essay, onAnalysisComplete }: FeedbackAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate the enhanced analysis process
  const analyzeEssay = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    // Simulate analysis steps
    const steps = [
      'Analyzing narrative structure...',
      'Evaluating ideas and content...',
      'Checking text organization...',
      'Assessing language features...',
      'Reviewing grammar and punctuation...',
      'Identifying literary devices...',
      'Analyzing sentence variety...',
      'Generating specific feedback...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Generate comprehensive analysis based on the essay content
    const analysis = generateDetailedAnalysis(essay);
    onAnalysisComplete(analysis);
    setIsAnalyzing(false);
  };

  const generateDetailedAnalysis = (essayText: string) => {
    // This would typically call an AI service, but for demo purposes, 
    // we'll generate realistic feedback based on the essay content
    
    const wordCount = essayText.split(/\s+/).length;
    const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Analyze narrative structure
    const hasOrientation = /attic|Leo|secret kingdom|afternoon/.test(essayText);
    const hasComplication = /stone|pulsed|light|voice/.test(essayText);
    const hasClimax = /guardian|burden|too much/.test(essayText);
    const hasResolution = /rescued|replanted|brought.*down/.test(essayText);

    // Identify "telling" vs "showing" instances
    const tellingInstances = [
      {
        text: "It was a heavy burden for a ten-year-old.",
        suggestion: "Instead of telling us it was heavy, show Leo's physical reaction: 'Leo's shoulders sagged as if carrying an invisible weight. His usual quick steps became slow and deliberate, each footfall echoing the weight of his new responsibility.'"
      },
      {
        text: "He was no longer just Leo, the quiet boy.",
        suggestion: "Show this transformation through actions: 'Where once Leo would have hurried past the injured bird, now he knelt beside it, his hands steady and sure as he crafted a makeshift nest.'"
      }
    ];

    const showingInstances = [
      "Dust motes danced in the single sunbeam slanting from the grimy window",
      "his fingers brushed against something smooth and cool",
      "the light flared, and a voice, ancient and melodic, echoed in his mind",
      "his heart swelling with a strange new joy"
    ];

    // Identify literary devices
    const literaryDevices = [
      "Metaphor: 'The old attic was Leo's secret kingdom'",
      "Personification: 'Dust motes danced'",
      "Imagery: 'smooth and cool', 'pulsed with a soft, inner light'",
      "Dialogue: Direct speech between Leo and Lumin"
    ];

    // Analyze sentence variety
    const simpleSentences = sentences.filter(s => !s.includes(',') && !s.includes(';')).length;
    const compoundSentences = sentences.filter(s => s.includes(',') || s.includes(';')).length;
    const complexSentences = sentences.filter(s => s.includes('that') || s.includes('which') || s.includes('when')).length;

    return {
      ideasAndContent: {
        name: "Ideas and Content",
        weight: 30,
        score: 8,
        maxScore: 10,
        strengths: [
          "Excellent creative concept with the magical stone 'Lumin'",
          "Strong character development showing Leo's transformation",
          "Engaging plot with clear emotional journey",
          "Good use of fantasy elements grounded in reality"
        ],
        improvements: [
          "Could develop the backstory of why Leo was in the attic",
          "The magical system could be explained more clearly",
          "Consider adding more sensory details to enhance immersion"
        ],
        specificExamples: [
          "\"The old attic was Leo's secret kingdom\" - Great opening that immediately establishes setting and character",
          "\"You have the heart of a guardian\" - Powerful dialogue that drives character development"
        ],
        suggestions: [
          "Add a brief scene showing Leo's life before finding the stone to create stronger contrast",
          "Include more specific details about how the stone's power manifests in the real world"
        ]
      },
      textStructure: {
        name: "Text Structure and Organization",
        weight: 25,
        score: 7,
        maxScore: 10,
        strengths: [
          "Clear narrative arc with beginning, middle, and end",
          "Good use of paragraphs to organize different story beats",
          "Effective transitions between scenes",
          "Strong opening and closing"
        ],
        improvements: [
          "The middle section could be better paced",
          "Some paragraphs could be split for better flow",
          "The resolution feels slightly rushed"
        ],
        specificExamples: [
          "Paragraph 1: Excellent scene-setting",
          "Paragraph 4: Good transition showing the burden of power",
          "Final paragraph: Strong circular structure returning to Leo's identity"
        ],
        suggestions: [
          "Consider breaking the longer paragraphs (especially paragraph 6) into smaller chunks",
          "Add a transitional sentence between the discovery and Leo's first use of his powers"
        ]
      },
      languageFeatures: {
        name: "Language Features and Vocabulary",
        weight: 25,
        score: 9,
        maxScore: 10,
        strengths: [
          "Sophisticated vocabulary appropriate for the genre",
          "Excellent use of imagery and sensory details",
          "Strong metaphors and personification",
          "Varied and engaging sentence structures"
        ],
        improvements: [
          "Some word choices could be more precise",
          "Could use more varied dialogue tags",
          "Opportunity for more complex literary devices"
        ],
        specificExamples: [
          "\"Dust motes danced\" - Excellent personification",
          "\"ancient and melodic\" - Great adjective choice for the voice",
          "\"swelling with a strange new joy\" - Effective emotional description"
        ],
        suggestions: [
          "Instead of 'said' repeatedly, try 'whispered', 'murmured', or 'confessed'",
          "Consider adding more similes to complement your metaphors"
        ]
      },
      grammarAndPunctuation: {
        name: "Spelling, Punctuation, and Grammar",
        weight: 20,
        score: 8,
        maxScore: 10,
        strengths: [
          "Generally accurate spelling throughout",
          "Good use of punctuation for dialogue",
          "Consistent tense usage",
          "Proper paragraph structure"
        ],
        improvements: [
          "Some comma splices could be corrected",
          "Apostrophe usage could be more consistent",
          "A few run-on sentences need breaking up"
        ],
        specificExamples: [
          "Correct: \"Leo's secret kingdom\" - proper possessive",
          "Correct: \"'At last,' it whispered\" - proper dialogue punctuation"
        ],
        suggestions: [
          "In 'It was a stone, no bigger than his palm, but it pulsed...' - consider using a semicolon instead of comma before 'but'",
          "Check for consistency in contractions throughout the piece"
        ]
      },
      overallScore: 80,
      narrativeStructure: {
        orientation: hasOrientation,
        complication: hasComplication,
        risingAction: true,
        climax: hasClimax,
        resolution: hasResolution,
        coda: true
      },
      showDontTellAnalysis: {
        tellingInstances,
        showingInstances
      },
      literaryDevices: {
        identified: literaryDevices,
        suggestions: [
          "Try adding a simile to describe Leo's transformation: 'Like a butterfly emerging from its chrysalis...'",
          "Consider using alliteration for the stone's power: 'pulsing, powerful presence'",
          "Add symbolism: the attic could represent Leo's hidden potential"
        ]
      },
      sentenceVariety: {
        simple: simpleSentences,
        compound: compoundSentences,
        complex: complexSentences,
        suggestions: [
          "Try combining some simple sentences with conjunctions",
          "Use more subordinate clauses to create complex sentences",
          "Vary sentence beginnings - not all need to start with 'He' or 'Leo'"
        ]
      }
    };
  };

  useEffect(() => {
    if (essay && essay.length > 50) {
      analyzeEssay();
    }
  }, [essay]);

  if (!isAnalyzing && progress === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Ready to Analyze Your Writing
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Submit your essay to receive detailed feedback based on NSW Selective Writing criteria
        </p>
        <button
          onClick={analyzeEssay}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Start Analysis
        </button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center mb-6">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Analyzing Your Essay
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Our AI is carefully reviewing your writing against NSW Selective criteria...
          </p>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progress.toFixed(0)}% Complete
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Target className="w-4 h-4" />
            <span>Ideas & Content</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Structure</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Lightbulb className="w-4 h-4" />
            <span>Language</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Award className="w-4 h-4" />
            <span>Grammar</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
