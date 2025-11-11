// Grammar and Spelling Checker Utility
// This utility provides real-time grammar, spelling, and language error detection

export interface GrammarError {
  start: number;
  end: number;
  message: string;
  type: 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'word-choice' | 'style';
  suggestions: string[];
  severity: 'low' | 'medium' | 'high';
  rule?: string;
}

export interface SpellingError {
  start: number;
  end: number;
  word: string;
  suggestions: string[];
  type: 'spelling';
}

// Common grammar rules and patterns
const GRAMMAR_RULES = {
  // Subject-verb agreement
  subjectVerbAgreement: [
    {
      pattern: /\b(he|she|it)\s+(are|were)\b/gi,
      message: "Subject-verb disagreement. Use 'is' or 'was' with singular subjects.",
      suggestions: (match: string) => [
        match.replace(/are/gi, 'is').replace(/were/gi, 'was')
      ]
    },
    {
      pattern: /\b(they|we|you)\s+(is|was)\b/gi,
      message: "Subject-verb disagreement. Use 'are' or 'were' with plural subjects.",
      suggestions: (match: string) => [
        match.replace(/is/gi, 'are').replace(/was/gi, 'were')
      ]
    }
  ],

  // Common word confusions
  wordChoice: [
    {
      pattern: /\bthere\s+(is|are)\s+a\s+lot\s+of\b/gi,
      message: "Consider using 'many' or 'much' instead of 'a lot of' for more formal writing.",
      suggestions: ['there are many', 'there is much']
    },
    {
      pattern: /\byour\s+(going|coming|doing)\b/gi,
      message: "Did you mean 'you\'re' (you are)?",
      suggestions: (match: string) => [match.replace('your', "you\'re")]
    },
    {
      pattern: /\bits\s+(going|coming|doing)\b/gi,
      message: "Did you mean 'it\'s' (it is)?",
      suggestions: (match: string) => [match.replace('its', "it\'s")]
    }
  ],

  // Punctuation rules
  punctuation: [
    {
      pattern: /\s+,/g,
      message: "Remove space before comma.",
      suggestions: [',']
    },
    {
      pattern: /,(?!\s)/g,
      message: "Add space after comma.",
      suggestions: [', ']
    },
    {
      pattern: /\s+\./g,
      message: "Remove space before period.",
      suggestions: ['.']
    },
    {
      pattern: /\.(?!\s|$)/g,
      message: "Add space after period.",
      suggestions: ['. ']
    }
  ],

  // Capitalization rules
  capitalization: [
    {
      pattern: /^\s*[a-z]/gm,
      message: "Capitalize the first letter of each sentence.",
      suggestions: (match: string) => [match.toUpperCase()]
    },
    {
      pattern: /\.\s+[a-z]/g,
      message: "Capitalize the first letter after a period.",
      suggestions: (match: string) => [match.replace(/([.]\s+)([a-z])/, '$1$2'.toUpperCase())]
    }
  ],

  // Style improvements
  style: [
    {
      pattern: /\bvery\s+happy\b/gi,
      message: "Consider using a stronger adjective instead of 'very happy'.",
      suggestions: ['joyful', 'elated', 'delighted', 'thrilled', 'ecstatic']
    },
    {
      pattern: /\bvery\s+sad\b/gi,
      message: "Consider using a stronger adjective instead of 'very sad'.",
      suggestions: ['miserable', 'heartbroken', 'devastated', 'sorrowful', 'melancholy']
    },
    {
      pattern: /\bvery\s+good\b/gi,
      message: "Consider using a stronger adjective instead of 'very good'.",
      suggestions: ['excellent', 'superb', 'outstanding', 'exceptional', 'remarkable']
    },
    {
      pattern: /\bvery\s+bad\b/gi,
      message: "Consider using a stronger adjective instead of 'very bad'.",
      suggestions: ['terrible', 'awful', 'dreadful', 'atrocious', 'appalling']
    },
    {
      pattern: /\bvery\s+big\b/gi,
      message: "Consider using a stronger adjective instead of 'very big'.",
      suggestions: ['enormous', 'massive', 'gigantic', 'colossal', 'immense']
    },
    {
      pattern: /\bvery\s+small\b/gi,
      message: "Consider using a stronger adjective instead of 'very small'.",
      suggestions: ['tiny', 'minuscule', 'minute', 'microscopic']
    },
    {
      pattern: /\bvery\s+(nice|pretty)\b/gi,
      message: "Consider using a stronger adjective instead of 'very nice/pretty'.",
      suggestions: ['beautiful', 'lovely', 'gorgeous', 'stunning', 'magnificent']
    },
    {
      pattern: /\bvery\s+ugly\b/gi,
      message: "Consider using a stronger adjective instead of 'very ugly'.",
      suggestions: ['hideous', 'grotesque', 'repulsive', 'ghastly']
    },
    {
      pattern: /\bthing\b/gi,
      message: "Consider using a more specific noun instead of 'thing'.",
      suggestions: ['item', 'object', 'matter', 'issue', 'concept']
    }
  ],

  // More granular punctuation rules
  morePunctuation: [
    {
      pattern: /([a-zA-Z0-9])([.,!?;:])(?!\s)/g,
      message: "Missing space after punctuation mark.",
      suggestions: (match: string) => [match.replace(/([.,!?;:])/, '$1 ')]
    },
    {
      pattern: /\s{2,}[.,!?;:]/g,
      message: "Excessive space before punctuation mark.",
      suggestions: (match: string) => [match.trimLeft()]
    },
    {
      pattern: /([a-zA-Z])([,.;:])([a-zA-Z])/g,
      message: "Missing space after punctuation mark.",
      suggestions: (match: string) => [match.replace(/([,.;:])/, '$1 ')]
    },
    {
      pattern: /\b(i)\b/g,
      message: "The pronoun 'I' should always be capitalized.",
      suggestions: (match: string) => [match.toUpperCase()]
    }
  ],

  // Common grammar errors (removed generic to/too/two rule - now context-aware)
  commonGrammar: [
    {
      pattern: /\b(lose|loose)\b/gi,
      message: "Check if you\'re using 'lose' (verb) or 'loose' (adjective).",
      suggestions: ["lose", "loose"]
    }
  ],

  // Context-aware than/then rules
  thenThanRules: [
    {
      pattern: /\b(better|worse|more|less|greater|smaller|higher|lower|faster|slower|bigger|smaller|older|younger|taller|shorter|stronger|weaker|richer|poorer|happier|sadder|easier|harder)\s+then\b/gi,
      message: "Did you mean 'than' (for comparison)? 'Then' refers to time.",
      suggestions: (match: string) => [match.replace(/then/gi, 'than')]
    },
    {
      pattern: /\b(rather|other)\s+then\b/gi,
      message: "Did you mean 'than' (for comparison)? 'Then' refers to time.",
      suggestions: (match: string) => [match.replace(/then/gi, 'than')]
    },
    {
      pattern: /\b(more|less)\s+\w+\s+then\b/gi,
      message: "Did you mean 'than' (for comparison)? 'Then' refers to time.",
      suggestions: (match: string) => [match.replace(/then/gi, 'than')]
    },
    {
      pattern: /\b(first|next|and)\s+than\b/gi,
      message: "Did you mean 'then' (for time sequence)? 'Than' is used for comparisons.",
      suggestions: (match: string) => [match.replace(/than/gi, 'then')]
    },
    {
      pattern: /\b(since|back|until|now)\s+than\b/gi,
      message: "Did you mean 'then' (for time)? 'Than' is used for comparisons.",
      suggestions: (match: string) => [match.replace(/than/gi, 'then')]
    }
  ],

  // Context-aware to/too/two rules
  contextualToToo: [
    {
      pattern: /\b(is|was|am|are)\s+to\s+(late|early|fast|slow|big|small|much|many|little|hot|cold|difficult|easy|hard|simple|good|bad)\b/gi,
      message: "Did you mean 'too' (excessively)? 'To' is a preposition.",
      suggestions: (match: string) => [match.replace(/\s+to\s+/gi, ' too ')]
    },
    {
      pattern: /\b(it\'s|its|very)\s+to\s+(late|early|fast|slow|big|small|much|many|little|hot|cold|difficult|easy|hard|simple|good|bad)\b/gi,
      message: "Did you mean 'too' (excessively)? 'To' is a preposition.",
      suggestions: (match: string) => [match.replace(/\s+to\s+/gi, ' too ')]
    }
  ]
};

// Common misspellings dictionary
const COMMON_MISSPELLINGS: { [key: string]: string[] } = {
  'recieve': ['receive'],
  'seperate': ['separate'],
  'definately': ['definitely'],
  'occured': ['occurred'],
  'begining': ['beginning'],
  'writting': ['writing'],
  'grammer': ['grammar'],
  'speach': ['speech'],
  'acheive': ['achieve'],
  'beleive': ['believe'],
  'freind': ['friend'],
  'wierd': ['weird'],
  'neccessary': ['necessary'],
  'accomodate': ['accommodate'],
  'embarass': ['embarrass'],
  'existance': ['existence'],
  'maintainance': ['maintenance'],
  'occassion': ['occasion'],
  'priviledge': ['privilege'],
  'recomend': ['recommend'],
  'rythm': ['rhythm'],
  'tommorrow': ['tomorrow'],
  'untill': ['until'],
  'wether': ['whether'],
  'alot': ['a lot'],
  'cant': ["can't"],
  'dont': ["don't"],
  'wont': ["won't"],
  'shouldnt': ["shouldn't"],
  'couldnt': ["couldn't"],
  'wouldnt': ["wouldn't"],
  'isnt': ["isn't"],
  'arent': ["aren't"],
  'wasnt': ["wasn't"],
  'werent': ["weren't"],
  'hasnt': ["hasn't"],
  'havent': ["haven't"],
  'hadnt': ["hadn't"],
  'didnt': ["didn't"],
  'doesnt': ["doesn't"]
};

export class GrammarSpellingChecker {
  private customDictionary: Set<string> = new Set();
  private ignoredWords: Set<string> = new Set();
  private dictionary: Set<string> = new Set();

  constructor() {
    // Initialize with common words that might be flagged incorrectly
    this.customDictionary.add('ok');
    this.customDictionary.add('okay');
    this.customDictionary.add('yeah');
    this.customDictionary.add('yep');

    // Comprehensive dictionary of common English words (1000+ words)
    const commonWords = [
      // Most common 100 words
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
      'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
      'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
      'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
      'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
      'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
      'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
      'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',

      // Common verbs (100 words)
      'am', 'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'did', 'does', 'done',
      'go', 'goes', 'went', 'gone', 'going', 'make', 'makes', 'made', 'making', 'take', 'takes', 'took', 'taken', 'taking',
      'see', 'sees', 'saw', 'seen', 'seeing', 'come', 'comes', 'came', 'coming', 'give', 'gives', 'gave', 'given', 'giving',
      'tell', 'tells', 'told', 'telling', 'find', 'finds', 'found', 'finding', 'think', 'thinks', 'thought', 'thinking',
      'know', 'knows', 'knew', 'known', 'knowing', 'call', 'calls', 'called', 'calling', 'try', 'tries', 'tried', 'trying',
      'ask', 'asks', 'asked', 'asking', 'need', 'needs', 'needed', 'needing', 'feel', 'feels', 'felt', 'feeling',
      'become', 'becomes', 'became', 'becoming', 'leave', 'leaves', 'left', 'leaving', 'put', 'puts', 'putting',
      'mean', 'means', 'meant', 'meaning', 'keep', 'keeps', 'kept', 'keeping', 'let', 'lets', 'letting',
      'begin', 'begins', 'began', 'begun', 'beginning', 'seem', 'seems', 'seemed', 'seeming', 'help', 'helps', 'helped', 'helping',
      'show', 'shows', 'showed', 'shown', 'showing', 'hear', 'hears', 'heard', 'hearing', 'play', 'plays', 'played', 'playing',
      'run', 'runs', 'ran', 'running', 'move', 'moves', 'moved', 'moving', 'live', 'lives', 'lived', 'living',
      'believe', 'believes', 'believed', 'believing', 'bring', 'brings', 'brought', 'bringing', 'happen', 'happens', 'happened', 'happening',
      'write', 'writes', 'wrote', 'written', 'writing', 'sit', 'sits', 'sat', 'sitting', 'stand', 'stands', 'stood', 'standing',
      'lose', 'loses', 'lost', 'losing', 'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting',
      'include', 'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing', 'set', 'sets', 'setting',
      'learn', 'learns', 'learned', 'learning', 'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading',

      // Common nouns (200 words)
      'dog', 'dogs', 'cat', 'cats', 'man', 'men', 'woman', 'women', 'child', 'children', 'person', 'people',
      'hand', 'hands', 'eye', 'eyes', 'face', 'faces', 'place', 'places', 'door', 'doors', 'room', 'rooms',
      'home', 'house', 'houses', 'school', 'schools', 'mother', 'father', 'family', 'families', 'friend', 'friends',
      'water', 'food', 'car', 'cars', 'book', 'books', 'story', 'stories', 'fact', 'facts', 'month', 'months',
      'world', 'life', 'lives', 'head', 'heads', 'part', 'parts', 'case', 'cases', 'point', 'points',
      'question', 'questions', 'problem', 'problems', 'number', 'numbers', 'night', 'nights', 'week', 'weeks',
      'company', 'companies', 'system', 'systems', 'group', 'groups', 'state', 'states', 'area', 'areas',
      'word', 'words', 'idea', 'ideas', 'body', 'bodies', 'information', 'name', 'names', 'money',
      'side', 'sides', 'power', 'line', 'lines', 'end', 'ends', 'boy', 'boys', 'girl', 'girls',
      'city', 'cities', 'country', 'countries', 'street', 'streets', 'office', 'offices', 'town', 'towns',
      'table', 'tables', 'voice', 'voices', 'air', 'minute', 'minutes', 'hour', 'hours', 'kind', 'kinds',
      'wall', 'walls', 'mind', 'reason', 'reasons', 'son', 'age', 'sound', 'sounds', 'result', 'results',
      'morning', 'light', 'morning', 'ground', 'interest', 'job', 'jobs', 'window', 'windows', 'door', 'doors',
      'party', 'parties', 'member', 'members', 'fire', 'service', 'services', 'half', 'type', 'types',
      'road', 'roads', 'form', 'forms', 'study', 'studies', 'effect', 'effects', 'heart', 'president',
      'level', 'levels', 'moment', 'moments', 'eye', 'eyes', 'center', 'centers', 'arm', 'arms',
      'business', 'business', 'matter', 'matters', 'law', 'laws', 'church', 'churches', 'subject', 'subjects',
      'letter', 'letters', 'report', 'reports', 'decision', 'decisions', 'wife', 'husband', 'class', 'classes',
      'control', 'field', 'fields', 'development', 'action', 'actions', 'age', 'right', 'rights',
      'war', 'history', 'change', 'changes', 'reason', 'game', 'games', 'page', 'pages',

      // Common adjectives (100 words)
      'other', 'new', 'old', 'great', 'high', 'small', 'large', 'big', 'little', 'own', 'different',
      'such', 'good', 'long', 'right', 'young', 'few', 'public', 'bad', 'same', 'able', 'early',
      'important', 'possible', 'best', 'better', 'sure', 'free', 'real', 'true', 'simple', 'certain',
      'clear', 'recent', 'late', 'hard', 'full', 'whole', 'white', 'black', 'red', 'blue', 'green',
      'hot', 'cold', 'strong', 'special', 'particular', 'open', 'happy', 'sad', 'beautiful', 'nice',
      'fine', 'ready', 'quick', 'slow', 'easy', 'difficult', 'serious', 'common', 'single', 'similar',
      'next', 'following', 'past', 'future', 'main', 'general', 'natural', 'human', 'military', 'political',
      'social', 'economic', 'medical', 'personal', 'private', 'local', 'national', 'international', 'individual',
      'current', 'available', 'low', 'wide', 'dark', 'light', 'deep', 'short', 'top', 'bottom',

      // Common adverbs (50 words)
      'very', 'too', 'much', 'more', 'most', 'quite', 'really', 'still', 'already', 'always',
      'never', 'often', 'usually', 'sometimes', 'perhaps', 'maybe', 'probably', 'almost', 'nearly',
      'rather', 'quite', 'too', 'ago', 'away', 'however', 'though', 'although', 'therefore', 'thus',
      'otherwise', 'instead', 'indeed', 'finally', 'recently', 'tonight', 'today', 'yesterday', 'tomorrow',
      'here', 'there', 'where', 'everywhere', 'nowhere', 'somewhere', 'anywhere', 'nowhere', 'yes', 'no',

      // Prepositions and conjunctions (50 words)
      'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'between', 'under', 'since', 'without', 'within',
      'along', 'behind', 'beyond', 'plus', 'except', 'but', 'or', 'yet', 'so', 'nor', 'and',
      'because', 'while', 'if', 'unless', 'until', 'although', 'though', 'whether', 'than', 'that',

      // Pronouns (30 words)
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
      'this', 'that', 'these', 'those', 'who', 'which', 'what', 'whose', 'whom', 'myself', 'yourself',
      'himself', 'herself', 'itself', 'ourselves', 'themselves', 'each', 'every', 'either', 'neither',
      'another', 'both', 'few', 'many', 'several', 'all', 'some', 'any', 'none',

      // Additional common words for spelling accuracy (200+ words)
      'about', 'above', 'across', 'add', 'against', 'almost', 'alone', 'along', 'already', 'also',
      'although', 'always', 'among', 'amount', 'another', 'answer', 'appear', 'around', 'ask', 'away',
      'ball', 'base', 'beautiful', 'became', 'become', 'bed', 'behind', 'believe', 'below', 'best',
      'between', 'beyond', 'bird', 'blue', 'board', 'boat', 'both', 'bottom', 'box', 'boy',
      'break', 'bright', 'bring', 'build', 'built', 'busy', 'call', 'came', 'cannot', 'care',
      'carry', 'caught', 'cause', 'center', 'certain', 'chair', 'chance', 'check', 'children', 'choose',
      'circle', 'city', 'class', 'clean', 'clear', 'climb', 'close', 'clothes', 'cold', 'color',
      'complete', 'cool', 'corner', 'correct', 'cost', 'cover', 'cross', 'cry', 'cut', 'dark',
      'daughter', 'dead', 'deal', 'dear', 'decide', 'decided', 'deep', 'decide', 'difference', 'different',
      'difficult', 'dinner', 'direct', 'discover', 'distance', 'divide', 'doctor', 'dollar', 'done', 'draw',
      'dream', 'dress', 'drink', 'drive', 'drop', 'dry', 'during', 'each', 'early', 'earth',
      'east', 'eat', 'edge', 'education', 'effect', 'effort', 'eight', 'either', 'else', 'energy',
      'enjoy', 'enough', 'enter', 'entire', 'especially', 'evening', 'event', 'ever', 'every', 'everyone',
      'everything', 'exactly', 'example', 'except', 'experience', 'explain', 'express', 'face', 'fact', 'fall',
      'family', 'far', 'farm', 'fast', 'father', 'fear', 'feed', 'feel', 'feet', 'fell',
      'felt', 'field', 'figure', 'fill', 'final', 'finally', 'fine', 'finger', 'finish', 'fire',
      'fish', 'five', 'floor', 'flow', 'flower', 'fly', 'follow', 'foot', 'force', 'forest',
      'forget', 'form', 'forward', 'four', 'free', 'friend', 'front', 'full', 'fun', 'further',
      'game', 'garden', 'gave', 'general', 'gentle', 'girl', 'glass', 'gold', 'gone', 'grass',
      'great', 'green', 'grew', 'grow', 'guard', 'guess', 'gun', 'hair', 'half', 'hall',
      'happen', 'happy', 'hard', 'hat', 'hate', 'heard', 'heart', 'heat', 'heavy', 'held',
      'help', 'herself', 'high', 'hill', 'himself', 'history', 'hit', 'hold', 'hole', 'hope',
      'horse', 'hot', 'hotel', 'hour', 'house', 'huge', 'human', 'hundred', 'hungry', 'hunt',
      'hurry', 'hurt', 'ice', 'idea', 'imagine', 'important', 'inch', 'include', 'increase', 'indeed',
      'industry', 'inside', 'instead', 'interest', 'island', 'job', 'join', 'journey', 'joy', 'judge',
      'jump', 'keep', 'key', 'kill', 'king', 'kitchen', 'knee', 'knife', 'lady', 'laid',
      'lake', 'land', 'language', 'large', 'last', 'late', 'later', 'laugh', 'law', 'lay',
      'lead', 'leader', 'learn', 'least', 'left', 'leg', 'length', 'less', 'lesson', 'lie',
      'life', 'lift', 'list', 'listen', 'lived', 'load', 'local', 'lock', 'london', 'lonely',
      'lose', 'lost', 'lot', 'loud', 'love', 'low', 'lower', 'luck', 'machine', 'main',
      'major', 'march', 'mark', 'market', 'master', 'match', 'material', 'matter', 'meant', 'measure',
      'meat', 'meet', 'member', 'memory', 'metal', 'method', 'middle', 'might', 'mile', 'milk',
      'million', 'mine', 'minute', 'miss', 'modern', 'moment', 'month', 'moon', 'mountain', 'mouth',
      'music', 'near', 'neck', 'need', 'neighbor', 'neither', 'newspaper', 'noise', 'none', 'nose',
      'note', 'notice', 'ocean', 'offer', 'office', 'oil', 'once', 'order', 'original', 'ought',
      'outside', 'page', 'pain', 'paint', 'pair', 'paper', 'parent', 'park', 'pass', 'past',
      'path', 'pattern', 'peace', 'people', 'perfect', 'period', 'pick', 'picture', 'piece', 'plan',
      'plane', 'plant', 'play', 'please', 'plenty', 'poem', 'point', 'poor', 'popular', 'position',
      'positive', 'possible', 'pound', 'practice', 'prepare', 'present', 'press', 'pretty', 'prevent', 'price',
      'prince', 'print', 'probably', 'process', 'produce', 'product', 'program', 'promise', 'proper', 'protect',
      'prove', 'provide', 'pull', 'purpose', 'push', 'quality', 'quarter', 'queen', 'quick', 'quiet',
      'quite', 'race', 'radio', 'rail', 'rain', 'raise', 'range', 'reach', 'read', 'ready',
      'realize', 'reason', 'receive', 'record', 'reduce', 'refer', 'refuse', 'regard', 'region', 'relate',
      'remain', 'remember', 'remove', 'repeat', 'replace', 'reply', 'report', 'represent', 'require', 'rest',
      'result', 'return', 'rich', 'ride', 'ring', 'rise', 'river', 'rock', 'roll', 'roof',
      'rose', 'rough', 'round', 'rule', 'rush', 'safe', 'sail', 'salt', 'sand', 'save',
      'scale', 'scene', 'scheme', 'science', 'score', 'search', 'season', 'seat', 'second', 'secret',
      'section', 'seed', 'seek', 'select', 'sell', 'send', 'sense', 'sent', 'separate', 'serious',
      'serve', 'settle', 'seven', 'several', 'shadow', 'shake', 'shall', 'shape', 'share', 'sharp',
      'sheet', 'shell', 'shine', 'ship', 'shirt', 'shoe', 'shoot', 'shop', 'shore', 'shot',
      'shoulder', 'shout', 'sick', 'sight', 'sign', 'silence', 'silver', 'simple', 'sing', 'singer',
      'sister', 'size', 'skill', 'skin', 'sleep', 'slip', 'smile', 'smoke', 'snow', 'soft',
      'soldier', 'solve', 'song', 'soon', 'sorry', 'soul', 'space', 'speak', 'special', 'speech',
      'speed', 'spell', 'spend', 'spirit', 'spoke', 'spot', 'spread', 'spring', 'square', 'stage',
      'stair', 'star', 'start', 'station', 'stay', 'steal', 'step', 'stick', 'stone', 'stop',
      'store', 'storm', 'straight', 'strange', 'stream', 'strength', 'stretch', 'strike', 'string', 'student',
      'subject', 'substance', 'succeed', 'success', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer',
      'support', 'suppose', 'surface', 'surprise', 'sweet', 'swim', 'symbol', 'system', 'tail', 'talk',
      'tall', 'teach', 'teacher', 'team', 'tear', 'telephone', 'temperature', 'tend', 'terrible', 'test',
      'thank', 'theater', 'thick', 'thin', 'thousand', 'thread', 'three', 'throat', 'throw', 'thumb',
      'thunder', 'ticket', 'tight', 'tire', 'title', 'tool', 'tooth', 'total', 'touch', 'toward',
      'track', 'trade', 'train', 'travel', 'treasure', 'treat', 'tree', 'tribe', 'trick', 'trip',
      'trouble', 'truck', 'trust', 'truth', 'tune', 'turn', 'twelve', 'twenty', 'twice', 'type',
      'uncle', 'understand', 'union', 'unit', 'unless', 'usual', 'valley', 'value', 'various', 'view',
      'village', 'visit', 'visitor', 'voice', 'vote', 'wage', 'wait', 'walk', 'watch', 'wave',
      'weak', 'wealth', 'wear', 'weather', 'wedding', 'weight', 'welcome', 'west', 'wheel', 'whenever',
      'while', 'white', 'wide', 'wife', 'wild', 'wind', 'winter', 'wire', 'wise', 'wish',
      'within', 'without', 'woman', 'wonder', 'wood', 'wool', 'wore', 'worth', 'would', 'wound',
      'wrap', 'yesterday', 'young', 'youth', 'atmosphere', 'yawning', 'decided', 'together', 'towards'
    ];
    this.dictionary = new Set(commonWords);
  }

  // Add word to custom dictionary
  addToCustomDictionary(word: string): void {
    this.customDictionary.add(word.toLowerCase());
  }

  // Add word to ignore list
  ignoreWord(word: string): void {
    this.ignoredWords.add(word.toLowerCase());
  }

  // Levenshtein distance function
  private levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Check for spelling errors
  checkSpelling(text: string): SpellingError[] {
    const errors: SpellingError[] = [];
    const words = text.match(/\b[a-zA-Z]+\b/g) || [];
    let currentIndex = 0;

    words.forEach(word => {
      const wordIndex = text.indexOf(word, currentIndex);
      const lowerWord = word.toLowerCase();

      // Skip if word is in custom dictionary or ignore list
      if (this.customDictionary.has(lowerWord) || this.ignoredWords.has(lowerWord) || this.dictionary.has(lowerWord)) {
        currentIndex = wordIndex + word.length;
        return;
      }

      // Check against common misspellings
      if (COMMON_MISSPELLINGS[lowerWord]) {
        errors.push({
          start: wordIndex,
          end: wordIndex + word.length,
          word: word,
          suggestions: COMMON_MISSPELLINGS[lowerWord],
          type: 'spelling'
        });
      } else {
        const suggestions = this.generateSpellingSuggestions(word);
        if (suggestions.length > 0) {
          errors.push({
            start: wordIndex,
            end: wordIndex + word.length,
            word: word,
            suggestions: suggestions,
            type: 'spelling'
          });
        }
      }

      currentIndex = wordIndex + word.length;
    });

    return errors;
  }

  // Generate spelling suggestions using Levenshtein distance with intelligent filtering
  private generateSpellingSuggestions(word: string): string[] {
    const lowerWord = word.toLowerCase();
    const firstLetter = lowerWord.charAt(0);
    const suggestions: { word: string; distance: number; score: number }[] = [];

    for (const dictWord of this.dictionary) {
      const distance = this.levenshteinDistance(lowerWord, dictWord);

      // Only consider suggestions with distance 1-2 for better accuracy
      if (distance >= 1 && distance <= 2) {
        let score = 0;

        // Prioritize words that start with the same letter (highest priority)
        if (dictWord.charAt(0) === firstLetter) {
          score += 100;
        }

        // Prioritize words with distance of 1 over distance of 2
        score += (3 - distance) * 50;

        // Prioritize words of similar length
        const lengthDiff = Math.abs(dictWord.length - lowerWord.length);
        if (lengthDiff <= 1) {
          score += 30;
        }

        // Prioritize words that share more characters in sequence
        let commonChars = 0;
        const minLength = Math.min(lowerWord.length, dictWord.length);
        for (let i = 0; i < minLength; i++) {
          if (lowerWord[i] === dictWord[i]) {
            commonChars++;
          }
        }
        score += commonChars * 10;

        suggestions.push({ word: dictWord, distance, score });
      }
    }

    // Sort suggestions by score (highest first), then by distance (lowest first)
    suggestions.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.distance - b.distance;
    });

    // Return top 3 suggestions, filtering out irrelevant ones
    return suggestions
      .slice(0, 5)
      .filter(s => s.score > 50) // Only return high-quality suggestions
      .slice(0, 3)
      .map(s => s.word);
  }

  // Check for grammar errors
  checkGrammar(text: string): GrammarError[] {
    const errors: GrammarError[] = [];

    // Check all grammar rule categories
    Object.entries(GRAMMAR_RULES).forEach(([category, rules]) => {
      (rules as any[]).forEach(rule => {
        let match;
        const regex = new RegExp(rule.pattern);
        
        while ((match = regex.exec(text)) !== null) {
          const suggestions = typeof rule.suggestions === 'function' 
            ? rule.suggestions(match[0])
            : rule.suggestions;

          errors.push({
            start: match.index,
            end: match.index + match[0].length,
            message: rule.message,
            type: this.getCategoryType(category),
            suggestions: suggestions,
            severity: this.getSeverityForCategory(category),
            rule: category
          });

          // Prevent infinite loop for global regex
          if (!rule.pattern.global) break;
        }
      });
    });

    return errors;
  }

  // Comprehensive check combining grammar and spelling
  checkText(text: string): GrammarError[] {
    const grammarErrors = this.checkGrammar(text);
    const spellingErrors = this.checkSpelling(text);

    // Convert spelling errors to grammar error format
    const convertedSpellingErrors: GrammarError[] = spellingErrors.map(error => ({
      start: error.start,
      end: error.end,
      message: `Possible spelling error: "${error.word}"`,
      type: 'spelling' as const,
      suggestions: error.suggestions,
      severity: 'high' as const,
      rule: 'spelling'
    }));

    // Combine and sort by position
    const allErrors = [...grammarErrors, ...convertedSpellingErrors];
    return allErrors.sort((a, b) => a.start - b.start);
  }

  // Get error type based on category
  private getCategoryType(category: string): 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'word-choice' | 'style' {
    switch (category) {
      case 'subjectVerbAgreement': return 'grammar';
      case 'wordChoice': return 'word-choice';
      case 'punctuation': return 'punctuation';
      case 'capitalization': return 'capitalization';
      case 'style': return 'style';
      case 'morePunctuation': return 'punctuation'; // Map new category to existing type
      case 'commonGrammar': return 'grammar'; // Map new category to existing type
      default: return 'grammar';
    }
  }

  // Get severity based on category
  private getSeverityForCategory(category: string): 'low' | 'medium' | 'high' {
    switch (category) {
      case 'subjectVerbAgreement':
      case 'punctuation':
      case 'capitalization':
      case 'morePunctuation': // Assign severity for new category
      case 'commonGrammar': // Assign severity for new category
        return 'high';
      case 'wordChoice':
        return 'medium';
      case 'style':
        return 'low';
      default:
        return 'medium';
    }
  }
}

// Export singleton instance
export const grammarSpellingChecker = new GrammarSpellingChecker();

// Utility function for real-time checking with debouncing
export const createDebouncedChecker = (
  checker: GrammarSpellingChecker,
  delay: number = 1000
) => {
  let timeoutId: any;
  
  return (text: string, callback: (errors: GrammarError[]) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const errors = checker.checkText(text);
      callback(errors);
    }, delay);
  };
};


import { ShowDontTellMeter } from './showDontTellMeter';
import { LiteraryDevicesDetector } from './literaryDevicesDetector';
import { SentenceVarietyAnalyzer } from './sentenceVarietyAnalyzer';



export class EnhancedWritingAnalyzer {
  private grammarSpellingChecker = new GrammarSpellingChecker();
  private showDontTellMeter = new ShowDontTellMeter();
  private literaryDevicesDetector = new LiteraryDevicesDetector();
  private sentenceVarietyAnalyzer = new SentenceVarietyAnalyzer();

  analyze(text: string) {
    const grammarErrors = this.grammarSpellingChecker.checkText(text);
    const showDontTell = this.showDontTellMeter.analyze(text);
    const literaryDevices = this.literaryDevicesDetector.detect(text);
    const sentenceVariety = this.sentenceVarietyAnalyzer.analyze(text);

    return {
      grammarErrors,
      showDontTell,
      literaryDevices,
      sentenceVariety,
    };
  }
}