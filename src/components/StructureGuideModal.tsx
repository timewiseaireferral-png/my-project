import React from 'react';

interface StructureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  textType: string; // Add textType prop
}

// Define the correct structures for different writing types
// The keys are the internal text_type identifiers (e.g., 'narrative', 'persuasive')
const STRUCTURE_GUIDES: { [key: string]: { title: string; points: string[] } } = {
  // --- NSW Selective Writing Test Aligned Structures ---
  'narrative': {
    title: 'Narrative Writing (Story Arc Structure)',
    points: [
      'Orientation: Introduce character, setting, and time.',
      'Complication: The problem or conflict begins.',
      'Climax: The turning point or most exciting moment.',
      'Resolution: The conflict is resolved and the story concludes.',
    ],
  },
  'descriptive': {
    title: 'Descriptive Writing (Sensory Focus Structure)',
    points: [
      'Introduction: Establish the main subject and mood.',
      'Body Paragraphs: Focus on a single sense (Sight, Sound, Smell, Taste, Touch) or a specific area/aspect of the subject.',
      'Conclusion: Summarize the overall impression or feeling created.',
    ],
  },
  'imaginative': {
    title: 'Imaginative Writing (Flexible Structure)',
    points: [
      'Follows the Narrative Arc (Orientation, Complication, Climax, Resolution).',
      'Allows for non-linear elements (e.g., flashbacks, dream sequences).',
      'Strong focus on figurative language and originality.',
    ],
  },
  'recount': {
    title: 'Recount Writing (Chronological Structure)',
    points: [
      'Orientation: Who, what, where, when, why.',
      'Series of Events: Retell events in the order they happened (chronological order).',
      'Reorientation/Conclusion: Personal comment on the event or a concluding thought.',
    ],
  },
  'persuasive': {
    title: 'Persuasive Writing (Standard Persuasive Essay Structure)',
    points: [
      'Introduction: Hook, Background, Thesis Statement (clear position).',
      'Body Paragraphs (PEEL/TEEL): Point, Evidence/Example, Explanation, Link to Thesis.',
      'Conclusion: Restate Thesis, Summarize Main Points, Concluding Statement/Call to Action.',
    ],
  },
  'discursive': {
    title: 'Discursive Writing (Balanced Exploration Structure)',
    points: [
      'Introduction: Hook, Background, Statement of Intent (topic overview, not a thesis).',
      'Body Paragraphs: Explore one perspective/side per paragraph, using evidence and examples.',
      'Conclusion: Summarize the explored ideas, offer a final thought, and avoid a definitive conclusion.',
    ],
  },
  'discussion': {
    title: 'Discussion Writing (For and Against Structure)',
    points: [
      'Introduction: State the issue and the two sides of the debate.',
      'Arguments For: Present points supporting one side.',
      'Arguments Against: Present points supporting the opposing side.',
      'Conclusion: Summarize both sides and offer a balanced final judgment or personal opinion.',
    ],
  },
  'speech': {
    title: 'Speech (Rhetorical Structure)',
    points: [
      'Salutation/Greeting: Address the audience directly.',
      'Introduction: Hook, State the purpose/thesis clearly.',
      'Body: Use rhetorical devices (repetition, rule of three) and clear signposting.',
      'Conclusion: Summarize, Call to Action, Thank the audience.',
    ],
  },
  'expository': {
    title: 'Expository Writing (Informative Structure)',
    points: [
      'Introduction: Hook, Define the topic, State the scope of the essay.',
      'Body Paragraphs: Each paragraph explains one aspect of the topic with facts, examples, and analysis.',
      'Conclusion: Summarize the main points and provide a final insight into the topic.',
    ],
  },
  'reflective': {
    title: 'Reflective Writing (Personal Insight Structure)',
    points: [
      'Description: Describe the experience or event.',
      'Feelings: Explore the emotions and thoughts during the experience.',
      'Evaluation: Analyze what was good/bad about the experience.',
      'Analysis: Make sense of the experience (What did I learn?).',
      'Conclusion: What will I do differently next time?',
    ],
  },
  'advice_sheet': {
    title: 'Advice Sheet (Direct/Instructional Structure)',
    points: [
      'Title: Clear, action-oriented title (e.g., "How to...").',
      'Introduction: State the purpose and target audience.',
      'Numbered/Bulleted Steps: Clear, concise, and easy-to-follow instructions/tips.',
      'Conclusion: Encouragement or final summary.',
    ],
  },
  'guide': {
    title: 'Guide (Hierarchical/Sectional Structure)',
    points: [
      'Title/Introduction: Define the subject and what the guide will cover.',
      'Sections/Subheadings: Organize information logically with clear headings.',
      'Visual Aids: Use bullet points, bold text, and short paragraphs for readability.',
      'Conclusion: Summary and where to find more information.',
    ],
  },
  'diary_entry': {
    title: 'Diary Entry (Personal/Chronological Structure)',
    points: [
      'Date/Salutation: Date and a personal greeting (e.g., "Dear Diary").',
      'Opening: State the main event or feeling of the day.',
      'Body: Detail the events and personal reflections in chronological order.',
      'Closing: A final thought or sign-off.',
    ],
  },
  'letter': {
    title: 'Letter Writing (Formal/Informal Structure)',
    points: [
      'Sender/Recipient Details: (Formal) Addresses and Date.',
      'Salutation: (Dear Mr./Ms. or Dear [Name]).',
      'Introduction: State the purpose of the letter.',
      'Body: Detail the main points in separate paragraphs.',
      'Closing: (Yours sincerely/faithfully or Best regards), Signature.',
    ],
  },
  'news_report': {
    title: 'News Report (Inverted Pyramid Structure)',
    points: [
      'Headline: Catchy and informative.',
      'Lead Paragraph (The 5 W\'s): Summarize the Who, What, Where, When, Why.',
      'Body: Detail the facts, quotes, and background information in descending order of importance.',
      'Conclusion: Final comment or future outlook.',
    ],
  },
  // Fallback to General Essay structure for any unhandled type
  'default': {
    title: 'General Essay Structure',
    points: [
      'Introduction (Hook, Background, Thesis)',
      'Body Paragraph 1 (Topic Sentence, Evidence, Analysis)',
      'Body Paragraph 2 (Topic Sentence, Evidence, Analysis)',
      'Body Paragraph 3 (Topic Sentence, Evidence, Analysis)',
      'Conclusion (Restate Thesis, Summarize Points, Concluding Thought)',
    ],
  },
};

export const StructureGuideModal: React.FC<StructureGuideModalProps> = ({ isOpen, onClose, textType }) => {
  if (!isOpen) return null;
  // The textType prop is expected to be the internal identifier (e.g., 'narrative', 'persuasive').
  // We use .toLowerCase() just in case, but no complex normalization is needed.
  const structure = STRUCTURE_GUIDES[textType.toLowerCase()] || STRUCTURE_GUIDES.default;
  
  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Structure Guide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none font-semibold">&times;</button>
        </div>
        <div className="mt-2 text-gray-600 dark:text-gray-300">
          <p>This guide outlines the recommended structure for a **{textType}** piece of writing.</p>
          <h4 className="font-semibold mt-4 text-gray-900 dark:text-white">{structure.title}:</h4>
          <ul className="list-disc list-inside ml-4">
            {structure.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
          <p className="mt-4">You can expand this content with more detailed guides, examples, and interactive elements.</p>
        </div>
        <div className="items-center px-4 py-3">
          <button
            id="ok-btn"
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};