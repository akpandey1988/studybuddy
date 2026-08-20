// Ported 1:1 from StudyBuddy Prototype.dc.html's <script> CATALOG / constants.

export type Question = {
  topic: string;
  q: string;
  opts: string[];
  answer: number;
};

export type Subject = {
  name: string;
  chapters: number;
  topics: string[];
  qs: Question[];
};

export const CATALOG: Subject[] = [
  {
    name: 'Maths', chapters: 9,
    topics: ['Fractions', 'Decimals', 'Ratio & Proportion', 'Perimeter & Area', 'Data Handling'],
    qs: [
      { topic: 'Fractions', q: 'Which is larger: 3/5 or 5/8?', opts: ['3/5', '5/8', 'They are equal', 'Not sure yet'], answer: 1 },
      { topic: 'Decimals', q: 'Which is smallest: 0.7, 0.07 or 0.75?', opts: ['0.7', '0.07', '0.75', 'Not sure yet'], answer: 1 },
      { topic: 'Ratio & Proportion', q: 'If 4 pens cost ₹36, what do 7 pens cost?', opts: ['₹54', '₹63', '₹72', 'Not sure yet'], answer: 1 },
      { topic: 'Perimeter & Area', q: 'A rectangle is 8 cm by 5 cm. Its area?', opts: ['26 cm²', '40 cm²', '13 cm²', 'Not sure yet'], answer: 1 },
    ],
  },
  {
    name: 'Science', chapters: 8,
    topics: ['Light', 'Living things', 'Motion', 'Materials', 'Our environment'],
    qs: [
      { topic: 'Light', q: 'A shadow forms because light…', opts: ['bends around objects', 'travels in straight lines', 'speeds up', 'Not sure yet'], answer: 1 },
      { topic: 'Living things', q: 'Which part of a plant makes food?', opts: ['Root', 'Leaf', 'Stem', 'Not sure yet'], answer: 1 },
      { topic: 'Motion', q: 'Speed is distance divided by…', opts: ['mass', 'time', 'force', 'Not sure yet'], answer: 1 },
      { topic: 'Materials', q: 'Which one is a good conductor?', opts: ['Rubber', 'Copper', 'Wood', 'Not sure yet'], answer: 1 },
    ],
  },
  {
    name: 'English', chapters: 7,
    topics: ['Tenses', 'Comprehension', 'Vocabulary', 'Writing', 'Grammar'],
    qs: [
      { topic: 'Tenses', q: 'Pick the past tense: "She ___ to school."', opts: ['goes', 'went', 'going', 'Not sure yet'], answer: 1 },
      { topic: 'Vocabulary', q: 'A word meaning "very tired":', opts: ['eager', 'weary', 'lively', 'Not sure yet'], answer: 1 },
      { topic: 'Grammar', q: 'Which is an adverb?', opts: ['quick', 'quickly', 'quickness', 'Not sure yet'], answer: 1 },
      { topic: 'Writing', q: 'A letter to a friend is…', opts: ['formal', 'informal', 'a notice', 'Not sure yet'], answer: 1 },
    ],
  },
  {
    name: 'Social Science', chapters: 10,
    topics: ['Maps', 'Civics', 'Medieval India', 'Resources', 'Government'],
    qs: [
      { topic: 'Maps', q: 'Lines showing distance north of the equator:', opts: ['Longitudes', 'Latitudes', 'Contours', 'Not sure yet'], answer: 1 },
      { topic: 'Civics', q: 'India’s Parliament has how many houses?', opts: ['One', 'Two', 'Three', 'Not sure yet'], answer: 1 },
      { topic: 'Resources', q: 'Which is a renewable resource?', opts: ['Coal', 'Sunlight', 'Petrol', 'Not sure yet'], answer: 1 },
      { topic: 'Medieval India', q: 'The Qutb Minar is in…', opts: ['Agra', 'Delhi', 'Jaipur', 'Not sure yet'], answer: 1 },
    ],
  },
  {
    name: 'Hindi', chapters: 8,
    topics: ['व्याकरण', 'गद्य', 'पद्य', 'लेखन', 'मुहावरे'],
    qs: [
      { topic: 'व्याकरण', q: '"पुस्तक" का बहुवर्न रूप?', opts: ['पुस्तक', 'पुस्तकें', 'पुस्तकों', 'Not sure yet'], answer: 1 },
      { topic: 'मुहावरे', q: '"नाक रगड़ना" का अर्थ?', opts: ['गुस्सा होना', 'विनती करना', 'दौड़ना', 'Not sure yet'], answer: 1 },
      { topic: 'लेखन', q: 'औपनारिक पत्र किसे लिखा जाता है?', opts: ['प्रधानाल्य', 'मित्र', 'सम्पादक', 'Not sure yet'], answer: 1 },
      { topic: 'पद्य', q: 'कविता की पंक्ति को क्या कहते हैं?', opts: ['गद्य', 'छंद', 'लेख', 'Not sure yet'], answer: 1 },
    ],
  },
  {
    name: 'Computer', chapters: 6,
    topics: ['Hardware', 'Spreadsheets', 'Internet safety', 'Coding basics', 'Typing'],
    qs: [
      { topic: 'Hardware', q: 'Which one is an input device?', opts: ['Monitor', 'Keyboard', 'Printer', 'Not sure yet'], answer: 1 },
      { topic: 'Spreadsheets', q: 'A cell reference looks like…', opts: ['12B', 'B12', 'B-12', 'Not sure yet'], answer: 1 },
      { topic: 'Internet safety', q: 'A strong password should be…', opts: ['your birthday', 'long and mixed', 'your name', 'Not sure yet'], answer: 1 },
      { topic: 'Coding basics', q: 'A loop is used to…', opts: ['stop a program', 'repeat steps', 'name a variable', 'Not sure yet'], answer: 1 },
    ],
  },
  {
    name: 'Sanskrit', chapters: 5,
    topics: ['शब्दरूप', 'धातुरूप', 'संख्या', 'अनुवाद', 'सुभाषित'],
    qs: [
      { topic: 'शब्दरूप', q: '"बालक" का द्विवचन?', opts: ['बालकः', 'बालकौ', 'बालकम्', 'Not sure yet'], answer: 1 },
      { topic: 'संख्या', q: '"सप्त" का अर्थ?', opts: ['पांच', 'सात', 'नौ', 'Not sure yet'], answer: 1 },
      { topic: 'धातुरूप', q: '"पठ्" लट् लकार, प्रथम पुरुष?', opts: ['पठामि', 'पठति', 'पठसि', 'Not sure yet'], answer: 1 },
      { topic: 'अनुवाद', q: '"जलम्" का अर्थ?', opts: ['अग्नि', 'जल', 'वायु', 'Not sure yet'], answer: 1 },
    ],
  },
];

export const MAX_EXAMS = 8;
export const FREE_EXAMS = 1;
export const PRIME_PRICE = '₹999';
export const DAY_CHOICES = [7, 14, 21, 30, 45];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dateLabel(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.getDate() + ' ' + MONTHS[d.getMonth()];
}

export function catFor(name: string): Subject {
  return CATALOG.find((c) => c.name === name) || CATALOG[0];
}
