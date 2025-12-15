export type UserRole = 'TEACHER' | 'STUDENT';

export interface CourseMaterial {
  id: string;
  name: string;
  type: 'PDF' | 'YOUTUBE' | 'TEXT';
  content: string;
  uploadDate: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  generatedDate: string;
  sourceId?: string; // Link to a study plan or material
}

export interface StudyWeek {
  weekNumber: number;
  topic: string;
  objectives: string[];
  keyPoints: string[]; // For presentation slides
  slideImagePrompt: string; // Description for AI image generation
}

export interface StudyPlan {
  id: string;
  title: string;
  weeks: StudyWeek[];
  generatedDate: string;
  contextSummary: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  score: number;
  maxScore: number;
  dateTaken: string;
  incorrectTopics: string[];
  timeTakenSeconds: number;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  errorAnalysis: {
    type: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High';
  }[];
  topicTags: string[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INGESTION = 'INGESTION',
  ASSESSMENT = 'ASSESSMENT',
  GRADING = 'GRADING',
  ANALYTICS = 'ANALYTICS'
}
