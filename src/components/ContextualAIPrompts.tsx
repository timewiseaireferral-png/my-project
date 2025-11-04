import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Lightbulb, Target, Star, Sparkles, BookOpen, Wand2, Heart, Zap, Gift, HelpCircle, ChevronRight, RefreshCw, Send, Bot } from 'lucide-react';
import { generateChatResponse } from '../lib/openai';

interface ContextualPrompt {
  id: string;
  category: 'content' | 'structure' | 'vocabulary' | 'character' | 'setting' | 'emotion' | 'nsw-specific';
  question: string;
  explanation: string;
  priority: number;
  ageAppropriate: boolean;
  icon: React.ReactNode;
  color: string;
}

interface ContextualAIPromptsProps {
  content: string;
  textType: string;
  wordCount: number;
  onPromptSelected: (prompt: string) => void;
  assistanceLevel: 'minimal' | 'moderate' | 'comprehensive';
  isVisible: boolean;
}

export function ContextualAIPrompts({
  content,
  textType,
  wordCount,
  onPromptSelected,
  assistanceLevel,
  isVisible
}: ContextualAIPromptsProps) {
  const [contextualPrompts, setContextualPrompts] = useState<ContextualPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');

  // Age-appropriate prompt templates for 10-12 year olds
  const promptTemplates = {
    content: [
      "What unexpected thing could happen next in your story?",
      "How can you make your main character more interesting?",
      "What details could you add to make this scene more exciting?",
      "What problem could your character face that readers wouldn't expect?",
      "How can you show what your character is thinking without just telling us?"
    ],
    structure: [
      "How could you make your opening sentence grab the reader's attention?",
      "What would be a surprising way to end this paragraph?",
      "How can you connect this idea to what you wrote before?",
      "What would happen if you started your story in the middle of the action?",
      "How can you make your conclusion more satisfying?"
    ],
    vocabulary: [
      "What's a more exciting word you could use instead of '{word}'?",
      "How can you describe this feeling without using the word '{emotion}'?",
      "What sounds, smells, or textures could you add to this scene?",
      "How would a character your age describe this situation?",
      "What's another way to show movement besides 'walked' or 'ran'?"
    ],
    character: [
      "What makes your character different from other kids their age?",
      "What secret might your character be hiding?",
      "How does your character feel about the situation they're in?",
      "What would your character do that surprises everyone?",
      "What does your character want more than anything?"
    ],
    setting: [
      "What makes this place special or unusual?",
      "What can you see, hear, or smell in this setting?",
      "How does the weather or time of day affect the mood?",
      "What details about this place would a kid your age notice first?",
      "How could the setting create a problem for your character?"
    ],
    emotion: [
      "How can you show this emotion through actions instead of just saying it?",
      "What would your character's face look like when feeling this way?",
      "How might this emotion change your character's voice or movements?",
      "What thoughts might race through your character's mind right now?",
      "How could other characters tell what your character is feeling?"
    ],
    'nsw-specific': [
      "How does your story show creativity that would impress selective school teachers?",
      "What sophisticated vocabulary can you use that shows your reading level?",
      "How can you demonstrate clear story structure with beginning, middle, and end?",
      "What complex sentence structures can you use to show advanced writing skills?",
      "How can you make your ideas original and thought-provoking?"
    ]
  };

  // Generate contextual prompts based on content analysis
  const generateContextualPrompts = useCallback(async (text: string) => {
    if (!text || text.length < 20 || text === lastAnalyzedContent) return;
    
    setIsGenerating(true);
    
    try {
      // Analyze content to determine what prompts would be most helpful
      const analysis = await analyzeContentForPrompts(text, textType);
      
      // Generate dynamic prompts based on analysis
      const dynamicPrompts = await generateDynamicPrompts(text, textType, analysis);
      
      // Combine with template-based prompts
      const templatePrompts = generateTemplatePrompts(text, analysis);
      
      // Merge and prioritize prompts
      const allPrompts = [...dynamicPrompts, ...templatePrompts]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 8); // Show top 8 most relevant prompts
      
      setContextualPrompts(allPrompts);
      setLastAnalyzedContent(text);
    } catch (error) {
      console.error('Error generating contextual prompts:', error);
      // Fallback to template prompts
      const fallbackPrompts = generateTemplatePrompts(text, {});
      setContextualPrompts(fallbackPrompts.slice(0, 6));
    } finally {
      setIsGenerating(false);
    }
  }, [textType, lastAnalyzedContent]);

  // Analyze content to determine what kind of prompts would be most helpful
  const analyzeContentForPrompts = async (text: string, textType: string) => {
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Simple analysis for prompt generation
    const analysis = {
      wordCount,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      hasDialogue: text.includes('"') || text.includes("'"),
      hasDescription: /\b(looked|seemed|appeared|felt|smelled|sounded)\b/i.test(text),
      hasAction: /\b(ran|jumped|climbed|threw|grabbed|pushed)\b/i.test(text),
      hasEmotion: /\b(happy|sad|angry|excited|scared|worried|surprised)\b/i.test(text),
      repetitiveWords: findRepetitiveWords(text),
      simpleWords: findSimpleWords(text),
      needsMoreDetail: wordCount < 100,
      needsStructure: paragraphs.length < 2 && wordCount > 50,
      needsConclusion: !text.toLowerCase().includes('end') && !text.toLowerCase().includes('finally') && wordCount > 100
    };
    
    return analysis;
  };

  // Generate dynamic prompts using AI
  const generateDynamicPrompts = async (text: string, textType: string, analysis: any): Promise<ContextualPrompt[]> => {
    try {
      const prompt = `Analyze this ${textType} writing by a 10-12 year old preparing for NSW Selective School test. Generate 4 specific, encouraging questions that would help them improve their writing right now.

Current writing: "${text}"

Analysis: ${JSON.stringify(analysis)}

Generate questions that:
1. Are specific to their current writing (not generic)
2. Use encouraging, supportive language appropriate for 10-12 year olds
3. Focus on NSW Selective test criteria (creative ideas, fluent language, clear structure)
4. Help them take the next step in their writing

Format each question as:
CATEGORY|QUESTION|EXPLANATION|PRIORITY

Categories: content, structure, vocabulary, character, setting, emotion, nsw-specific
Priority: 1-10 (10 being most important)`;

      const response = await generateChatResponse({
        userMessage: prompt,
        textType,
        currentContent: text,
        wordCount: analysis.wordCount,
        context: 'Generating contextual prompts for NSW Selective test preparation'
      });

      return parseDynamicPrompts(response);
    } catch (error) {
      console.error('Error generating dynamic prompts:', error);
      return [];
    }
  };

  // Parse AI response into prompt objects
  const parseDynamicPrompts = (response: string): ContextualPrompt[] => {
    const prompts: ContextualPrompt[] = [];
    const lines = response.split('\n').filter(line => line.includes('|'));
    
    lines.forEach((line, index) => {
      const parts = line.split('|');
      if (parts.length >= 4) {
        const [category, question, explanation, priorityStr] = parts;
        
        prompts.push({
          id: `dynamic-${index}`,
          category: category.toLowerCase() as any,
          question: question.trim(),
          explanation: explanation.trim(),
          priority: parseInt(priorityStr) || 5,
          ageAppropriate: true,
          icon: getCategoryIcon(category.toLowerCase()),
          color: getCategoryColor(category.toLowerCase())
        });
      }
    });
    
    return prompts;
  };

  // Generate template-based prompts
  const generateTemplatePrompts = (text: string, analysis: any): ContextualPrompt[] => {
    const prompts: ContextualPrompt[] = [];
    
    // Content prompts
    if (analysis.needsMoreDetail || (analysis.wordCount && analysis.wordCount < 150)) {
      prompts.push({
        id: 'template-content-1',
        category: 'content',
        question: "What exciting details could you add to make your reader feel like they're right there with your character?",
        explanation: "Adding sensory details and specific descriptions helps readers connect with your story.",
        priority: 8,
        ageAppropriate: true,
        icon: <Star className="w-4 h-4" />,
        color: 'purple'
      });
    }

    // Structure prompts
    if (analysis.needsStructure) {
      prompts.push({
        id: 'template-structure-1',
        category: 'structure',
        question: "How could you break your writing into paragraphs to make it easier to read?",
        explanation: "Good paragraphs help organize your ideas and make your writing flow better.",
        priority: 7,
        ageAppropriate: true,
        icon: <Target className="w-4 h-4" />,
        color: 'green'
      });
    }

    // Vocabulary prompts
    if (analysis.simpleWords && analysis.simpleWords.length > 0) {
      const word = analysis.simpleWords[0];
      prompts.push({
        id: 'template-vocab-1',
        category: 'vocabulary',
        question: `What's a more sophisticated word you could use instead of "${word}"?`,
        explanation: "Using varied vocabulary shows your reading level and makes your writing more interesting.",
        priority: 6,
        ageAppropriate: true,
        icon: <BookOpen className="w-4 h-4" />,
        color: 'blue'
      });
    }

    // Character prompts for narrative writing
    if (textType.includes('narrative') && !analysis.hasEmotion) {
      prompts.push({
        id: 'template-character-1',
        category: 'character',
        question: "How is your character feeling right now, and how can you show this through their actions?",
        explanation: "Showing character emotions through actions is more engaging than just telling us how they feel.",
        priority: 7,
        ageAppropriate: true,
        icon: <Heart className="w-4 h-4" />,
        color: 'pink'
      });
    }

    // NSW-specific prompts
    if (analysis.wordCount > 100) {
      prompts.push({
        id: 'template-nsw-1',
        category: 'nsw-specific',
        question: "What makes your story unique and creative compared to what other students might write?",
        explanation: "Originality and creativity are key criteria for NSW Selective School writing assessment.",
        priority: 9,
        ageAppropriate: true,
        icon: <Sparkles className="w-4 h-4" />,
        color: 'gold'
      });
    }

    return prompts;
  };

  // Helper functions
  const findRepetitiveWords = (text: string): string[] => {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount: { [key: string]: number } = {};
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    return Object.keys(wordCount).filter(word => wordCount[word] > 2);
  };

  const findSimpleWords = (text: string): string[] => {
    const simpleWords = ['good', 'bad', 'nice', 'big', 'small', 'said', 'went', 'got', 'put'];
    const words = text.toLowerCase().split(/\s+/);
    
    return simpleWords.filter(simpleWord => 
      words.some(word => word.replace(/[^\w]/g, '') === simpleWord)
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content': return <Star className="w-4 h-4" />;
      case 'structure': return <Target className="w-4 h-4" />;
      case 'vocabulary': return <BookOpen className="w-4 h-4" />;
      case 'character': return <Heart className="w-4 h-4" />;
      case 'setting': return <Wand2 className="w-4 h-4" />;
      case 'emotion': return <Heart className="w-4 h-4" />;
      case 'nsw-specific': return <Sparkles className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content': return 'purple';
      case 'structure': return 'green';
      case 'vocabulary': return 'blue';
      case 'character': return 'pink';
      case 'setting': return 'indigo';
      case 'emotion': return 'red';
      case 'nsw-specific': return 'yellow';
      default: return 'gray';
    }
  };

  // Generate prompts when content changes
  useEffect(() => {
    if (isVisible && content.length > 10) {
      const timer = setTimeout(() => {
        generateContextualPrompts(content);
      }, 2000); // Wait 2 seconds after user stops typing
      
      return () => clearTimeout(timer);
    }
  }, [content, isVisible, generateContextualPrompts]);

  // Filter prompts by category
  const filteredPrompts = selectedCategory === 'all' 
    ? contextualPrompts 
    : contextualPrompts.filter(p => p.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Suggestions', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'content', label: 'Ideas', icon: <Star className="w-4 h-4" /> },
    { id: 'structure', label: 'Structure', icon: <Target className="w-4 h-4" /> },
    { id: 'vocabulary', label: 'Words', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'character', label: 'Characters', icon: <Heart className="w-4 h-4" /> },
    { id: 'nsw-specific', label: 'NSW Tips', icon: <Sparkles className="w-4 h-4" /> }
  ];

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Smart Writing Questions</h3>
          {isGenerating && (
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          )}
        </div>
        <button
          onClick={() => generateContextualPrompts(content)}
          disabled={isGenerating}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Contextual prompts */}
      <div className="space-y-3">
        {filteredPrompts.length === 0 && !isGenerating ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Keep writing to get personalized suggestions!</p>
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`p-3 rounded-lg border-l-4 border-${prompt.color}-400 bg-${prompt.color}-50 hover:bg-${prompt.color}-100 transition-colors cursor-pointer group`}
              onClick={() => onPromptSelected(prompt.question)}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 bg-${prompt.color}-100 rounded-lg text-${prompt.color}-600 group-hover:bg-${prompt.color}-200 transition-colors`}>
                  {prompt.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-${prompt.color}-800 mb-1 group-hover:text-${prompt.color}-900`}>
                    {prompt.question}
                  </p>
                  <p className={`text-xs text-${prompt.color}-600 leading-relaxed`}>
                    {prompt.explanation}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 text-${prompt.color}-400 group-hover:text-${prompt.color}-600 transition-colors`} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick action buttons */}
      {filteredPrompts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>💡 Click any question to ask your AI Writing Buddy</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {filteredPrompts.length} suggestion{filteredPrompts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
