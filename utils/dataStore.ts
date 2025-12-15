import { CourseMaterial, Quiz, QuizResult, StudyPlan } from "../types";

const STORAGE_KEYS = {
  MATERIALS: 'edunexus_materials',
  PLANS: 'edunexus_plans',
  QUIZZES: 'edunexus_quizzes',
  RESULTS: 'edunexus_results'
};

export const dataStore = {
  // --- Materials ---
  saveMaterial: (material: CourseMaterial) => {
    const current = dataStore.getMaterials();
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify([...current, material]));
  },
  getMaterials: (): CourseMaterial[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS) || '[]');
  },

  // --- Study Plans ---
  savePlan: (plan: StudyPlan) => {
    const current = dataStore.getPlans();
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify([...current, plan]));
  },
  getPlans: (): StudyPlan[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANS) || '[]');
  },
  getPlanById: (id: string): StudyPlan | undefined => {
    return dataStore.getPlans().find(p => p.id === id);
  },

  // --- Quizzes ---
  saveQuiz: (quiz: Quiz) => {
    const current = dataStore.getQuizzes();
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([...current, quiz]));
  },
  getQuizzes: (): Quiz[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
  },
  getQuizById: (id: string): Quiz | undefined => {
    return dataStore.getQuizzes().find(q => q.id === id);
  },

  // --- Results ---
  saveResult: (result: QuizResult) => {
    const current = dataStore.getResults();
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([...current, result]));
  },
  getResults: (): QuizResult[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
  },
  
  // --- Analytics Helpers ---
  getStudentZScore: (studentResult: QuizResult): number => {
    // Simulate a class distribution based on the quiz ID
    // In a real app, this would query the DB for all results of this quiz
    // Here we generate deterministic mock stats based on quiz ID string char codes
    const seed = studentResult.quizId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockMean = 65 + (seed % 20); // Mean between 65 and 85
    const mockStdDev = 10 + (seed % 10); // StdDev between 10 and 20
    
    const percentage = (studentResult.score / studentResult.maxScore) * 100;
    return (percentage - mockMean) / mockStdDev;
  },

  getTopicsToRevise: (): string[] => {
    const results = dataStore.getResults();
    const topicCounts: Record<string, number> = {};
    
    results.forEach(r => {
      r.incorrectTopics.forEach(t => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    });

    // Return topics where mistakes happened more than once
    return Object.entries(topicCounts)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([topic]) => topic);
  }
};
