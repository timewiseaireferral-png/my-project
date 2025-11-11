import React from 'react';
import { BookOpen, Sparkles, Lightbulb, Target, Zap, PenTool, MessageCircle, FileText, Heart, List, Mail, Newspaper, Calendar } from 'lucide-react';

interface StructureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  textType: string;
}

interface StructureStep {
  emoji: string;
  title: string;
  description: string;
  tip?: string;
}

interface StructureGuide {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  steps: StructureStep[];
  funFact?: string;
}

const STRUCTURE_GUIDES: { [key: string]: StructureGuide } = {
  'narrative': {
    title: 'Tell an Amazing Story!',
    subtitle: 'Every great story has 4 key parts',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'blue',
    steps: [
      {
        emoji: '🎬',
        title: 'Orientation',
        description: 'Set the scene! Introduce your characters, where they are, and when the story happens.',
        tip: 'Make your reader feel like they\'re right there with your character!'
      },
      {
        emoji: '⚡',
        title: 'Complication',
        description: 'Uh-oh! Something goes wrong or a challenge appears. This is where the real adventure begins!',
        tip: 'The bigger the problem, the more exciting your story!'
      },
      {
        emoji: '🎯',
        title: 'Climax',
        description: 'The most exciting moment! This is the turning point where everything changes.',
        tip: 'This should be the most intense part - make your reader hold their breath!'
      },
      {
        emoji: '✨',
        title: 'Resolution',
        description: 'Time to wrap it up! How does the problem get solved? What happens to your characters?',
        tip: 'Leave your reader feeling satisfied - they should care about how it ends!'
      }
    ],
    funFact: '💡 Pro tip: The best stories make you feel something - happy, scared, excited, or curious!'
  },

  'descriptive': {
    title: 'Paint a Picture with Words!',
    subtitle: 'Make your reader see, hear, smell, taste, and feel everything',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'purple',
    steps: [
      {
        emoji: '🎨',
        title: 'Introduction',
        description: 'Start strong! Tell what you\'re describing and set the mood.',
        tip: 'Hook your reader with your first sentence!'
      },
      {
        emoji: '👀',
        title: 'Sight Details',
        description: 'What does it look like? Colors, shapes, sizes, movements...',
      },
      {
        emoji: '👂',
        title: 'Sound Details',
        description: 'What can you hear? Loud, soft, musical, scary sounds...',
      },
      {
        emoji: '👃',
        title: 'Smell & Taste Details',
        description: 'How does it smell or taste? Sweet, bitter, fresh, smoky...',
      },
      {
        emoji: '✋',
        title: 'Touch & Feeling Details',
        description: 'How does it feel? Rough, smooth, hot, cold, slimy...',
      },
      {
        emoji: '🎭',
        title: 'Conclusion',
        description: 'Wrap it up! What overall feeling or impression do you want to leave?',
        tip: 'End with your strongest image or feeling!'
      }
    ],
    funFact: '💡 Pro tip: Use similes and metaphors - "as quiet as a mouse" or "the stars were diamonds in the sky"!'
  },

  'imaginative': {
    title: 'Unleash Your Creativity!',
    subtitle: 'Anything is possible in imaginative writing',
    icon: <Zap className="w-6 h-6" />,
    color: 'pink',
    steps: [
      {
        emoji: '🚀',
        title: 'Start Anywhere',
        description: 'Begin in the middle, at the end, or with a dream - be creative!',
        tip: 'Surprise your reader right from the start!'
      },
      {
        emoji: '🌈',
        title: 'Build Your World',
        description: 'Create magical places, impossible events, or unique characters.',
        tip: 'Make up your own rules - it\'s YOUR world!'
      },
      {
        emoji: '🎭',
        title: 'Add Twists',
        description: 'Include surprises, mysteries, or unexpected moments.',
        tip: 'Keep your reader guessing!'
      },
      {
        emoji: '✨',
        title: 'End with Impact',
        description: 'Leave your reader thinking "WOW!" or wanting more.',
        tip: 'A great ending makes the whole story memorable!'
      }
    ],
    funFact: '💡 Pro tip: Mix reality with fantasy - what if your school suddenly floated into space?'
  },

  'recount': {
    title: 'Share Your Experience!',
    subtitle: 'Tell what happened, step by step',
    icon: <Calendar className="w-6 h-6" />,
    color: 'green',
    steps: [
      {
        emoji: '📍',
        title: 'Orientation',
        description: 'Set the scene: WHO was there? WHAT happened? WHERE and WHEN did it happen? WHY was it important?',
        tip: 'Answer all the W questions!'
      },
      {
        emoji: '1️⃣',
        title: 'First Event',
        description: 'What happened first? Tell the events in the order they actually happened.',
      },
      {
        emoji: '2️⃣',
        title: 'Next Events',
        description: 'Then what? Keep going in order - use words like "then", "next", "after that".',
        tip: 'Time order words help your reader follow along!'
      },
      {
        emoji: '3️⃣',
        title: 'Final Event',
        description: 'How did it end? What was the last thing that happened?',
      },
      {
        emoji: '💭',
        title: 'Personal Comment',
        description: 'How did you feel? What did you learn? Would you do it again?',
        tip: 'Share your thoughts and feelings - make it personal!'
      }
    ],
    funFact: '💡 Pro tip: Include small details that make the event special - what you wore, what you ate, funny things people said!'
  },

  'persuasive': {
    title: 'Change Minds!',
    subtitle: 'Convince your reader to agree with you',
    icon: <Target className="w-6 h-6" />,
    color: 'red',
    steps: [
      {
        emoji: '🎣',
        title: 'Hook Your Reader',
        description: 'Start with a shocking fact, question, or bold statement to grab attention!',
        tip: 'Make them WANT to keep reading!'
      },
      {
        emoji: '📢',
        title: 'State Your Opinion',
        description: 'Tell them exactly what you believe and why it matters.',
        tip: 'Be clear and confident!'
      },
      {
        emoji: '💪',
        title: 'Reason 1',
        description: 'Give your strongest point with examples and evidence.',
        tip: 'Use facts, statistics, or real examples!'
      },
      {
        emoji: '🔥',
        title: 'Reason 2',
        description: 'Add another powerful reason. Stack up your evidence!',
      },
      {
        emoji: '⭐',
        title: 'Reason 3',
        description: 'One more strong point to seal the deal.',
        tip: 'Three reasons is the magic number!'
      },
      {
        emoji: '🎯',
        title: 'Call to Action',
        description: 'Tell them what to do or think now. End with power!',
        tip: 'Make them want to take action NOW!'
      }
    ],
    funFact: '💡 Pro tip: Use powerful words like "must", "should", "essential", and "crucial" to sound convincing!'
  },

  'discursive': {
    title: 'Explore Different Views!',
    subtitle: 'Look at all sides of a topic',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'indigo',
    steps: [
      {
        emoji: '🤔',
        title: 'Introduce the Topic',
        description: 'What are you exploring? Why is this topic interesting or important?',
        tip: 'Don\'t pick a side yet - stay neutral!'
      },
      {
        emoji: '👍',
        title: 'One Perspective',
        description: 'Explore one way of thinking about the topic. What are the good points?',
        tip: 'Use phrases like "Some people believe..." or "One view is..."'
      },
      {
        emoji: '👎',
        title: 'Another Perspective',
        description: 'Look at a different angle. What do other people think?',
        tip: 'Be fair to all viewpoints!'
      },
      {
        emoji: '🔍',
        title: 'More Perspectives',
        description: 'Are there other ways to look at this? Keep exploring!',
      },
      {
        emoji: '💭',
        title: 'Thoughtful Conclusion',
        description: 'Sum up the different views. What did you discover?',
        tip: 'You can hint at what you think, but don\'t be too strong!'
      }
    ],
    funFact: '💡 Pro tip: Show you understand both sides - this makes you sound really smart and fair!'
  },

  'discussion': {
    title: 'Debate Both Sides!',
    subtitle: 'Show arguments for AND against',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'orange',
    steps: [
      {
        emoji: '⚖️',
        title: 'Introduce the Issue',
        description: 'What\'s the debate? What are the two sides arguing about?',
        tip: 'Make it clear there are two different opinions!'
      },
      {
        emoji: '✅',
        title: 'Arguments FOR',
        description: 'What are all the reasons SUPPORTING this idea?',
        tip: 'Present each reason in its own paragraph!'
      },
      {
        emoji: '❌',
        title: 'Arguments AGAINST',
        description: 'What are all the reasons OPPOSING this idea?',
        tip: 'Be just as strong with these points!'
      },
      {
        emoji: '🎓',
        title: 'Balanced Conclusion',
        description: 'Which side is stronger? Or are both sides valid? Share your final thoughts.',
        tip: 'Show you\'ve thought carefully about both sides!'
      }
    ],
    funFact: '💡 Pro tip: Use linking words like "However", "On the other hand", and "In contrast" to show different sides!'
  },

  'speech': {
    title: 'Speak Up and Inspire!',
    subtitle: 'Write a speech that moves people',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'yellow',
    steps: [
      {
        emoji: '👋',
        title: 'Greet Your Audience',
        description: 'Start by saying hello! "Good morning everyone!" or "Dear friends..."',
        tip: 'Make them feel welcome!'
      },
      {
        emoji: '🎣',
        title: 'Hook Them In',
        description: 'Tell a story, ask a question, or share a shocking fact.',
        tip: 'Grab their attention in the first 10 seconds!'
      },
      {
        emoji: '🎯',
        title: 'State Your Message',
        description: 'What\'s your speech about? Tell them clearly!',
      },
      {
        emoji: '💪',
        title: 'Build Your Case',
        description: 'Share your main points. Use the rule of three - three strong reasons!',
        tip: 'Repeat key phrases for impact!'
      },
      {
        emoji: '🔥',
        title: 'Call to Action',
        description: 'What do you want them to do or think? End with power!',
        tip: 'Make them want to act NOW!'
      },
      {
        emoji: '🙏',
        title: 'Thank Them',
        description: 'Thank your audience for listening. End strong!',
      }
    ],
    funFact: '💡 Pro tip: Use questions like "Imagine if..." or "What would you do if..." to make your audience think!'
  },

  'expository': {
    title: 'Teach Something Cool!',
    subtitle: 'Explain and inform your reader',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'blue',
    steps: [
      {
        emoji: '📚',
        title: 'Introduction',
        description: 'What are you explaining? Why is it interesting or important?',
        tip: 'Make your reader curious to learn more!'
      },
      {
        emoji: '1️⃣',
        title: 'First Main Point',
        description: 'Explain the first important thing. Use facts and examples!',
        tip: 'One main idea per paragraph!'
      },
      {
        emoji: '2️⃣',
        title: 'Second Main Point',
        description: 'What\'s the next important thing to know?',
      },
      {
        emoji: '3️⃣',
        title: 'Third Main Point',
        description: 'Keep teaching! Add more facts and details.',
      },
      {
        emoji: '🎓',
        title: 'Conclusion',
        description: 'Sum up what you taught. What\'s the big takeaway?',
        tip: 'Leave them feeling smarter!'
      }
    ],
    funFact: '💡 Pro tip: Use headings, bullet points, and examples to make information easy to understand!'
  },

  'reflective': {
    title: 'Think Deep!',
    subtitle: 'Explore what you learned from an experience',
    icon: <Heart className="w-6 h-6" />,
    color: 'pink',
    steps: [
      {
        emoji: '📖',
        title: 'Describe the Experience',
        description: 'What happened? Tell the story of what you went through.',
        tip: 'Set the scene so readers understand!'
      },
      {
        emoji: '❤️',
        title: 'Share Your Feelings',
        description: 'How did you feel during this experience? Scared? Excited? Confused?',
        tip: 'Be honest about your emotions!'
      },
      {
        emoji: '🤔',
        title: 'Evaluate It',
        description: 'What was good about it? What was challenging or bad?',
      },
      {
        emoji: '💡',
        title: 'What Did You Learn?',
        description: 'What did this experience teach you? How did you grow?',
        tip: 'This is the most important part!'
      },
      {
        emoji: '🚀',
        title: 'Future Actions',
        description: 'What will you do differently next time? How will you use what you learned?',
        tip: 'Show how you\'ve changed!'
      }
    ],
    funFact: '💡 Pro tip: Reflective writing is personal - use "I" and share YOUR thoughts and feelings!'
  },

  'advice_sheet': {
    title: 'Help Someone Out!',
    subtitle: 'Share your knowledge and tips',
    icon: <List className="w-6 h-6" />,
    color: 'teal',
    steps: [
      {
        emoji: '🎯',
        title: 'Clear Title',
        description: 'Make it obvious what you\'re teaching! "How to...", "5 Tips for...", "The Ultimate Guide to..."',
        tip: 'Your title should make them want to read!'
      },
      {
        emoji: '👋',
        title: 'Introduction',
        description: 'Why is this advice important? Who needs it?',
      },
      {
        emoji: '📝',
        title: 'Step-by-Step Tips',
        description: 'List your advice clearly. Number your steps or use bullet points.',
        tip: 'Keep each tip short and simple!'
      },
      {
        emoji: '⚠️',
        title: 'Common Mistakes',
        description: 'What should people avoid? What could go wrong?',
      },
      {
        emoji: '🌟',
        title: 'Encouraging Ending',
        description: 'Give them confidence! "You can do this!" or "Now you\'re ready!"',
        tip: 'Leave them feeling motivated!'
      }
    ],
    funFact: '💡 Pro tip: Use action words like "Start", "Try", "Remember", and "Make sure" to sound helpful and confident!'
  },

  'guide': {
    title: 'Create the Ultimate Guide!',
    subtitle: 'Organize information like a pro',
    icon: <FileText className="w-6 h-6" />,
    color: 'blue',
    steps: [
      {
        emoji: '📋',
        title: 'Title & Overview',
        description: 'What\'s your guide about? What will people learn?',
        tip: 'Make it sound super useful!'
      },
      {
        emoji: '📑',
        title: 'Section 1',
        description: 'Break your information into clear sections with headings.',
        tip: 'Each section should cover one main topic!'
      },
      {
        emoji: '📑',
        title: 'Section 2',
        description: 'Keep organizing! Use bullet points, bold text, and short paragraphs.',
      },
      {
        emoji: '📑',
        title: 'More Sections',
        description: 'Continue breaking down the information into easy-to-read chunks.',
      },
      {
        emoji: '🎁',
        title: 'Helpful Conclusion',
        description: 'Sum up the key points. Where can they learn more?',
        tip: 'Include links or resources if helpful!'
      }
    ],
    funFact: '💡 Pro tip: Use lots of headings and white space - nobody likes big blocks of text!'
  },

  'diary_entry': {
    title: 'Write Your Personal Diary!',
    subtitle: 'Share your day and feelings',
    icon: <PenTool className="w-6 h-6" />,
    color: 'purple',
    steps: [
      {
        emoji: '📅',
        title: 'Date & Greeting',
        description: 'Start with the date and "Dear Diary," or "Hey Journal!"',
        tip: 'Make it personal - this is YOUR diary!'
      },
      {
        emoji: '⭐',
        title: 'Today\'s Highlight',
        description: 'What was the most important thing that happened today?',
        tip: 'Start with the big news!'
      },
      {
        emoji: '📖',
        title: 'Tell Your Day',
        description: 'Write about what happened in order. What did you do? Who did you see?',
      },
      {
        emoji: '💭',
        title: 'Share Your Feelings',
        description: 'How do you feel about what happened? Happy? Worried? Excited?',
        tip: 'Be honest - your diary is a safe space!'
      },
      {
        emoji: '✨',
        title: 'Sign Off',
        description: 'End with a thought or just say goodbye. "Until tomorrow!" or "Good night!"',
      }
    ],
    funFact: '💡 Pro tip: Your diary is private, so write like you\'re talking to your best friend!'
  },

  'letter': {
    title: 'Write a Fantastic Letter!',
    subtitle: 'Connect with someone through writing',
    icon: <Mail className="w-6 h-6" />,
    color: 'red',
    steps: [
      {
        emoji: '📍',
        title: 'Your Address & Date',
        description: 'Write your address at the top right, then add the date below it.',
        tip: 'For informal letters to friends, you can skip this!'
      },
      {
        emoji: '👋',
        title: 'Greeting',
        description: 'Dear [Name], - Formal letters: "Dear Mr./Ms. Smith," - Friendly letters: "Hi Sarah!" or "Dear Gran,"',
        tip: 'Match your greeting to who you\'re writing to!'
      },
      {
        emoji: '🎯',
        title: 'Opening',
        description: 'Why are you writing? Get to the point quickly!',
      },
      {
        emoji: '📝',
        title: 'Main Message',
        description: 'Share your news, ask questions, or explain what you need. Use paragraphs for different topics!',
        tip: 'Each paragraph should have one main point!'
      },
      {
        emoji: '👋',
        title: 'Closing',
        description: 'Wrap up nicely! - Formal: "Yours sincerely," - Friendly: "Love," or "Your friend,"',
      },
      {
        emoji: '✍️',
        title: 'Signature',
        description: 'Sign your name at the bottom!',
      }
    ],
    funFact: '💡 Pro tip: Formal letters = polite and proper. Friendly letters = relaxed and fun. Choose wisely!'
  },

  'news_report': {
    title: 'Break the News!',
    subtitle: 'Report like a real journalist',
    icon: <Newspaper className="w-6 h-6" />,
    color: 'gray',
    steps: [
      {
        emoji: '📰',
        title: 'Catchy Headline',
        description: 'Grab attention! Make it short, punchy, and informative.',
        tip: 'Use strong action words!'
      },
      {
        emoji: '🔥',
        title: 'Lead Paragraph',
        description: 'Answer the 5 W\'s right away: WHO, WHAT, WHERE, WHEN, WHY (and sometimes HOW).',
        tip: 'The most important info goes first!'
      },
      {
        emoji: '📊',
        title: 'Important Details',
        description: 'Add more facts, quotes from people involved, and background information.',
        tip: 'Use quotes to make it interesting!'
      },
      {
        emoji: '📝',
        title: 'Supporting Information',
        description: 'Include less critical details, expert opinions, and statistics.',
      },
      {
        emoji: '🔮',
        title: 'Conclusion',
        description: 'What happens next? What\'s the outlook for the future?',
        tip: 'End with a quote or a thought about what\'s coming!'
      }
    ],
    funFact: '💡 Pro tip: News reports are OBJECTIVE - report the facts without your personal opinions!'
  },

  'default': {
    title: 'General Essay Structure',
    subtitle: 'The classic essay format',
    icon: <FileText className="w-6 h-6" />,
    color: 'gray',
    steps: [
      {
        emoji: '📖',
        title: 'Introduction',
        description: 'Hook, background information, and thesis statement.',
      },
      {
        emoji: '📝',
        title: 'Body Paragraphs',
        description: 'Each paragraph should have: topic sentence, evidence, and analysis.',
        tip: 'Aim for 3-4 body paragraphs!'
      },
      {
        emoji: '🎯',
        title: 'Conclusion',
        description: 'Restate your thesis, summarize main points, and end with a final thought.',
      }
    ]
  }
};

const getColorClasses = (color: string) => {
  const colors: { [key: string]: { bg: string; border: string; text: string; badge: string } } = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600 dark:text-pink-400', badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-600 dark:text-green-400', badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' },
    gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-800', text: 'text-gray-600 dark:text-gray-400', badge: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300' },
  };
  return colors[color] || colors.gray;
};

export const StructureGuideModal: React.FC<StructureGuideModalProps> = ({ isOpen, onClose, textType }) => {
  if (!isOpen) return null;

  const structure = STRUCTURE_GUIDES[textType.toLowerCase()] || STRUCTURE_GUIDES.default;
  const colorClasses = getColorClasses(structure.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className={`sticky top-0 z-10 ${colorClasses.bg} border-b ${colorClasses.border} p-6 rounded-t-2xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${colorClasses.badge}`}>
                {structure.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {structure.title}
                </h2>
                <p className={`text-sm mt-1 ${colorClasses.text} font-medium`}>
                  {structure.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none font-light hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {structure.steps.map((step, index) => (
            <div
              key={index}
              className={`border-2 ${colorClasses.border} rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${colorClasses.bg}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-3xl flex-shrink-0">{step.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                  {step.tip && (
                    <div className={`mt-3 p-3 rounded-lg ${colorClasses.badge} border ${colorClasses.border}`}>
                      <p className="text-sm font-medium flex items-start">
                        <span className="mr-2">💡</span>
                        <span>{step.tip}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {structure.funFact && (
            <div className="mt-6 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {structure.funFact}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
          <button
            onClick={onClose}
            className={`w-full py-3 px-6 ${colorClasses.badge} hover:opacity-90 font-bold rounded-xl transition-all duration-200 transform hover:scale-105 text-lg`}
          >
            Got it! Let's write! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
