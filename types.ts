
export type UserRole = 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface UserProfile {
  id: string;
  tenantId: string;
  role: UserRole;
  displayName: string;
  email: string;
  masteryMap?: Record<string, MasteryRecord>; // skillCode -> record
}

export interface MasteryRecord {
  level: number; // 0..1
  confidence: number;
  lastUpdated: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface ClassSettings {
  educationSystem: 'EDEXCEL' | 'CAMBRIDGE' | 'SRI_LANKA_LOCAL' | 'IB';
  language: 'ENGLISH' | 'SINHALA' | 'TAMIL' | 'HYBRID';
  gradeLevel: string; // "10", "11", "12", "A-Level"
  aiMarkingEnabled: boolean;
}

export interface ClassGroup {
  id: string;
  tenantId: string;
  name: string;
  teacherIds: string[];
  settings: ClassSettings;
}

export interface SourceSet {
  id: string;
  classId: string;
  name: string;
  sources: Source[];
  rules: {
    allowWebSearch: boolean;
    strictness: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface Source {
  id: string;
  type: 'PDF' | 'IMAGE' | 'TEXT' | 'YOUTUBE';
  title: string;
  url?: string;
  content?: string; // For text/extracted content
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
}

export type CourseMaterial = Source;

export interface LessonPack {
  id: string;
  classId: string;
  sourceSetId: string;
  title: string;
  objectives: string[];
  status: 'DRAFT' | 'PUBLISHED';
  modules: {
    slides: Slide[];
    worksheet: WorksheetQuestion[];
    quizId?: string;
  };
}

export interface Slide {
  id: string;
  topic: string;
  content: string[]; // Detailed bullet points, can contain LaTeX
  equations?: string[]; // LaTeX strings
  diagramDescription: string; // For AI generation
  webResources?: { title: string; url: string }[]; // AI suggested links
  teacherNotes?: string;
}

export interface StudyPlan {
  id: string;
  generatedDate: string;
  title: string;
  contextSummary: string;
  weeks: StudyWeek[];
}

export interface StudyWeek {
  weekNumber: number;
  topic: string;
  objectives: string[];
  keyPoints: string[];
  slideImagePrompt: string;
}

export interface WorksheetQuestion {
  id: string;
  question: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface Quiz {
  id: string;
  classId?: string;
  title: string;
  questions: QuizQuestion[];
  rubricId?: string;
  dueDate?: string;
  generatedDate: string;
  deliveryMode: 'DIGITAL' | 'HYBRID_UPLOAD' | 'PAPER';
}

export interface QuizQuestion {
  id: number | string;
  question: string;
  type?: 'MCQ' | 'LONG_ANSWER' | 'DRAWING';
  options: string[]; // For MCQ
  correctAnswer?: string;
  explanation?: string;
  topic: string;
  difficulty?: string;
  maxMarks?: number;
  skillCodes?: string[];
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
  timeTakenSeconds?: number;
}

export interface Rubric {
  id: string;
  classId: string;
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  description: string;
  maxMarks: number;
  commonMistakes: {
    description: string;
    deduction: number;
  }[];
}

export interface Attempt {
  id: string;
  quizId: string;
  studentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'NEEDS_REVIEW';
  score?: number;
  maxScore?: number;
  submittedAt: string;
}

export interface Response {
  id: string;
  attemptId: string;
  questionId: string;
  studentId: string;
  input: {
    text?: string;
    imageUrls?: string[];
  };
  grading?: GradingResult; // The canonical grading JSON
}

export interface GradingResult {
  awardedMarks: number;
  maxMarks: number;
  confidence: number; // 0..1
  flags: ('ILLEGIBLE' | 'UNCERTAIN' | 'SUSPECTED_CHEATING')[];
  feedback: {
    summary: string;
    corrections: { issue: string; fix: string }[];
    nextPractice: { skillCode: string; suggestion: string }[];
  };
  safeForStudent: boolean;
}

export interface StudentPoke {
  id: string;
  studentId: string;
  topic: string;
  message: string;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface ParentInsight {
  studentId: string;
  predictedGrade: string;
  weakAreas: string[];
  teacherApproved: boolean;
  suggestedResources: string[];
  lastUpdated: string;
}

// New Interface for hierarchical analysis
export interface AnalysisResult {
  topic: string;
  weight: 'High' | 'Medium' | 'Low'; // For Learning Map visualization
  objectives: {
      id: string;
      main: string;
      subPoints: string[]; // Indepth details
  }[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MATERIAL_FACTORY = 'MATERIAL_FACTORY', // Was Ingestion
  ASSESSMENTS = 'ASSESSMENTS',
  GRADING_QUEUE = 'GRADING_QUEUE',
  STUDENT_HOME = 'STUDENT_HOME',
  ANALYTICS = 'ANALYTICS'
}
