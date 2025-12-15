
import { db, auth } from '../firebaseConfig';
import { 
  collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc, setDoc, Timestamp 
} from 'firebase/firestore';
import { 
  ClassGroup, SourceSet, LessonPack, Quiz, Attempt, Response, GradingResult, Source, StudentPoke, ParentInsight, ClassSettings 
} from '../types';

// Helper to handle dates
const now = () => new Date().toISOString();

export const firestoreService = {
  // --- Sources & Materials ---
  async getSourceSets(classId: string): Promise<SourceSet[]> {
    try {
      // MOCK for Demo
      const stored = localStorage.getItem(`edunexus_sources_${classId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Firestore getSourceSets error", e);
      return [];
    }
  },

  async createSourceSet(sourceSet: Omit<SourceSet, 'id'>): Promise<string> {
    try {
      const id = 'ss_' + Date.now();
      const newSet = { ...sourceSet, id };
      const current = await firestoreService.getSourceSets(sourceSet.classId);
      localStorage.setItem(`edunexus_sources_${sourceSet.classId}`, JSON.stringify([...current, newSet]));
      return id;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  async getLessonPacks(classId: string): Promise<LessonPack[]> {
    const stored = localStorage.getItem(`edunexus_lessons_${classId}`);
    return stored ? JSON.parse(stored) : [];
  },

  async saveLessonPack(pack: LessonPack): Promise<void> {
    const current = await firestoreService.getLessonPacks(pack.classId);
    const existing = current.findIndex(p => p.id === pack.id);
    if (existing >= 0) {
      current[existing] = pack;
    } else {
      current.push(pack);
    }
    localStorage.setItem(`edunexus_lessons_${pack.classId}`, JSON.stringify(current));
  },

  // --- Classes & Settings ---
  async updateClassSettings(classId: string, settings: ClassSettings): Promise<void> {
      // Mock saving settings
      localStorage.setItem(`edunexus_settings_${classId}`, JSON.stringify(settings));
      console.log(`Settings saved for ${classId}`, settings);
  },

  async getClassSettings(classId: string): Promise<ClassSettings | null> {
      const stored = localStorage.getItem(`edunexus_settings_${classId}`);
      return stored ? JSON.parse(stored) : null;
  },

  async getStudentClasses(studentId: string): Promise<{id: string, name: string}[]> {
      // Mock enrollment data
      return [
          { id: 'physics_101', name: 'Physics (Edexcel A-Level)' },
          { id: 'maths_pure', name: 'Pure Mathematics' },
          { id: 'chem_organic', name: 'Organic Chemistry' }
      ];
  },

  // --- Quizzes & Attempts ---
  async getQuizzes(classId: string): Promise<Quiz[]> {
    const stored = localStorage.getItem(`edunexus_quizzes_${classId}`);
    return stored ? JSON.parse(stored) : [];
  },

  async createQuiz(quiz: Quiz): Promise<void> {
    const current = await firestoreService.getQuizzes(quiz.classId || 'demo_class');
    localStorage.setItem(`edunexus_quizzes_${quiz.classId || 'demo_class'}`, JSON.stringify([...current, quiz]));
  },

  async getAttempts(classId: string): Promise<Attempt[]> {
    const stored = localStorage.getItem('edunexus_attempts');
    const allAttempts: Attempt[] = stored ? JSON.parse(stored) : [];
    return allAttempts;
  },

  async submitAttempt(attempt: Attempt, responses: Response[]): Promise<void> {
    const allAttempts = await firestoreService.getAttempts('');
    localStorage.setItem('edunexus_attempts', JSON.stringify([...allAttempts, attempt]));
    
    const storedRes = localStorage.getItem('edunexus_responses');
    const allRes = storedRes ? JSON.parse(storedRes) : [];
    localStorage.setItem('edunexus_responses', JSON.stringify([...allRes, ...responses]));
  },

  async getResponsesForReview(classId: string): Promise<{attempt: Attempt, response: Response}[]> {
    const allAttempts = await firestoreService.getAttempts(classId);
    const storedRes = localStorage.getItem('edunexus_responses');
    const allRes: Response[] = storedRes ? JSON.parse(storedRes) : [];
    
    const needsReview: {attempt: Attempt, response: Response}[] = [];
    allRes.forEach(r => {
      if (r.grading && (r.grading.confidence < 0.8 || r.grading.flags.length > 0)) {
        const attempt = allAttempts.find(a => a.id === r.attemptId);
        if (attempt) {
          needsReview.push({ attempt, response: r });
        }
      }
    });
    return needsReview;
  },

  // --- Student Pokes & Insights ---
  async sendStudentPoke(poke: StudentPoke): Promise<void> {
      const stored = localStorage.getItem('edunexus_pokes');
      const current = stored ? JSON.parse(stored) : [];
      localStorage.setItem('edunexus_pokes', JSON.stringify([...current, poke]));
  },

  async getPokesForTeacher(): Promise<StudentPoke[]> {
      const stored = localStorage.getItem('edunexus_pokes');
      return stored ? JSON.parse(stored) : [];
  },

  async getParentInsights(studentId: string): Promise<ParentInsight | null> {
      // Mock Data
      return {
          studentId,
          predictedGrade: 'A-',
          weakAreas: ['Thermodynamics', 'Integration'],
          teacherApproved: true,
          suggestedResources: ['Khan Academy: Entropy', 'Past Paper 2019 Q4'],
          lastUpdated: now()
      };
  }
};
