// Subjects a student can add an exam for.
//
// This used to hold a hardcoded question bank and the check thresholds too.
// Both now live on the backend: questions are generated per attempt from the
// student's own syllabus, and the server owns every scoring decision. What is
// left is the subject picker, plus the topic lists used as a fallback syllabus
// when a student has not got their syllabus sheet to hand.

export type Subject = {
  name: string;
  chapters: number;
  /** Stand-in syllabus when the student provides neither text nor a file. */
  topics: string[];
};

export const CATALOG: Subject[] = [
  { name: 'Maths', chapters: 9, topics: ['Fractions', 'Decimals', 'Ratio & Proportion', 'Perimeter & Area', 'Data Handling'] },
  { name: 'Science', chapters: 8, topics: ['Light', 'Living things', 'Motion', 'Materials', 'Our environment'] },
  { name: 'English', chapters: 7, topics: ['Tenses', 'Comprehension', 'Vocabulary', 'Writing', 'Grammar'] },
  { name: 'Social Science', chapters: 10, topics: ['Maps', 'Civics', 'Medieval India', 'Resources', 'Government'] },
  { name: 'Hindi', chapters: 8, topics: ['व्याकरण', 'गद्य', 'पद्य', 'लेखन', 'मुहावरे'] },
  { name: 'Computer', chapters: 6, topics: ['Hardware', 'Spreadsheets', 'Internet safety', 'Coding basics', 'Typing'] },
  { name: 'Sanskrit', chapters: 5, topics: ['शब्दरूप', 'धातुरूप', 'संख्या', 'अनुवाद', 'सुभाषित'] },
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

