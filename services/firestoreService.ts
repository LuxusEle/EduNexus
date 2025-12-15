import { db, auth } from '../firebaseConfig';
import { 
  collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc, setDoc, Timestamp 
} from 'firebase/firestore';
import { 
  ClassGroup, SourceSet, LessonPack, Quiz, Attempt, Response, GradingResult, Source 
} from '../types';

// Helper to handle dates
const now = () => new Date().toISOString();

export const firestoreService = {
  // --- Sources & Materials ---
  async getSourceSets(classId: string): Promise<SourceSet[]> {
    try {
      // PROD: const q = query(collection(db, 'sourceSets'), where('classId', '==', classId));
      // PROD: const snapshot = await getDocs(q);
      // PROD: return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SourceSet));
      
      // MOCK for Demo (Simulating Firestore Latency)
      const stored = localStorage.getItem(`edunexus_sources_${classId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Firestore getSourceSets error", e);
      return [];
    }
  },

  async createSourceSet(sourceSet: Omit<SourceSet, 'id'>): Promise<string> {
    try {
      // PROD: const docRef = await addDoc(collection(db, 'sourceSets'), sourceSet);
      // PROD: return docRef.id;
      
      // MOCK
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

  // --- Quizzes & Attempts ---
  async getQuizzes(classId: string): Promise<Quiz[]> {
    const stored = localStorage.getItem(`edunexus_quizzes_${classId}`);
    return stored ? JSON.parse(stored) : [];
  },

  async createQuiz(quiz: Quiz): Promise<void> {
    const current = await firestoreService.getQuizzes(quiz.classId);
    localStorage.setItem(`edunexus_quizzes_${quiz.classId}`, JSON.stringify([...current, quiz]));
  },

  async getAttempts(classId: string): Promise<Attempt[]> {
    // In real app, query by class via quiz relation
    const stored = localStorage.getItem('edunexus_attempts');
    const allAttempts: Attempt[] = stored ? JSON.parse(stored) : [];
    // Filter logic would go here
    return allAttempts;
  },

  async submitAttempt(attempt: Attempt, responses: Response[]): Promise<void> {
    // Save Attempt
    const allAttempts = await firestoreService.getAttempts('');
    localStorage.setItem('edunexus_attempts', JSON.stringify([...allAttempts, attempt]));
    
    // Save Responses
    const storedRes = localStorage.getItem('edunexus_responses');
    const allRes = storedRes ? JSON.parse(storedRes) : [];
    localStorage.setItem('edunexus_responses', JSON.stringify([...allRes, ...responses]));
  },

  async getResponsesForReview(classId: string): Promise<{attempt: Attempt, response: Response}[]> {
    const allAttempts = await firestoreService.getAttempts(classId);
    const storedRes = localStorage.getItem('edunexus_responses');
    const allRes: Response[] = storedRes ? JSON.parse(storedRes) : [];
    
    // Join logic: find responses where grading confidence is low or flagged
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

  async updateGrading(responseId: string, grading: GradingResult): Promise<void> {
    const storedRes = localStorage.getItem('edunexus_responses');
    let allRes: Response[] = storedRes ? JSON.parse(storedRes) : [];
    allRes = allRes.map(r => r.id === responseId ? { ...r, grading } : r);
    localStorage.setItem('edunexus_responses', JSON.stringify(allRes));
  }
};
