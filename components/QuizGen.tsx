import React, { useState, useEffect } from 'react';
import { Loader2, BrainCircuit, BookOpen, Play, Trophy, Save } from 'lucide-react';
import { generateQuiz } from '../services/geminiService';
import { Quiz, QuizResult, StudyPlan, UserRole } from '../types';
import { dataStore } from '../utils/dataStore';

interface QuizGenProps {
  initialPlanId?: string;
  role: UserRole;
}

const QuizGen: React.FC<QuizGenProps> = ({ initialPlanId, role }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'take'>('generate');
  
  // Generation State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [savedPlans, setSavedPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Taking Quiz State
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submissionResult, setSubmissionResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    setSavedPlans(dataStore.getPlans());
    setAvailableQuizzes(dataStore.getQuizzes());

    if (role === 'STUDENT') {
        setActiveTab('take');
    }
    
    // Handle Navigation from Ingestion
    if (initialPlanId) {
        setActiveTab('generate');
        setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic && !selectedPlanId) return;
    
    setLoading(true);
    setPreviewQuiz(null);
    
    // Determine context
    let queryTopic = topic;
    if (selectedPlanId) {
      const plan = savedPlans.find(p => p.id === selectedPlanId);
      if (plan) queryTopic = `${plan.title}: ${plan.weeks.map(w => w.topic).join(', ')}`;
    }

    const result = await generateQuiz(queryTopic, difficulty);
    setPreviewQuiz(result);
    setLoading(false);
  };

  const saveToLibrary = () => {
    if (previewQuiz) {
      dataStore.saveQuiz(previewQuiz);
      setAvailableQuizzes(dataStore.getQuizzes());
      setPreviewQuiz(null);
      setTopic('');
      if (role === 'STUDENT') setActiveTab('take');
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setSubmissionResult(null);
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    
    let score = 0;
    const incorrectTopics: string[] = [];

    activeQuiz.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      } else {
        incorrectTopics.push(q.topic);
      }
    });

    const result: QuizResult = {
      id: Date.now().toString(),
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      studentId: 'STD_DEMO',
      score: score,
      maxScore: activeQuiz.questions.length,
      dateTaken: new Date().toISOString(),
      incorrectTopics,
      timeTakenSeconds: 300 // Mock time
    };

    dataStore.saveResult(result);
    setSubmissionResult(result);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Assessment Engine</h2>
          <p className="text-slate-500 mt-1">
             {role === 'TEACHER' ? 'Generate AI quizzes for your class.' : 'Take quizzes to track your progress.'}
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {role === 'TEACHER' && (
              <button 
                onClick={() => setActiveTab('generate')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'generate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Generator
              </button>
          )}
          <button 
             onClick={() => setActiveTab('take')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'take' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Quiz Library
          </button>
        </div>
      </div>

      {activeTab === 'generate' && role === 'TEACHER' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
               <h3 className="font-bold text-slate-800 mb-2">Configure Assessment</h3>
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Source Material</label>
                 <select 
                    value={selectedPlanId}
                    onChange={(e) => {
                      setSelectedPlanId(e.target.value);
                      if(e.target.value) setTopic('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-2"
                 >
                   <option value="">Manual Topic Entry</option>
                   {savedPlans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                 </select>
                 
                 <input 
                   type="text" 
                   value={topic}
                   onChange={(e) => {
                     setTopic(e.target.value);
                     setSelectedPlanId('');
                   }}
                   placeholder="Or type topic manually..."
                   className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${selectedPlanId ? 'bg-slate-50 opacity-50' : ''}`}
                   disabled={!!selectedPlanId}
                 />
               </div>
               
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <button 
                onClick={handleCreate}
                disabled={loading || (!topic && !selectedPlanId)}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                {loading ? 'Generating...' : 'Generate Preview'}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            {previewQuiz ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                  <h3 className="font-bold text-indigo-900">{previewQuiz.title}</h3>
                  <button onClick={saveToLibrary} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                    <Save size={16} /> Save to Library
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {previewQuiz.questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="font-medium text-slate-800 mb-2">{idx + 1}. {q.question}</p>
                      <div className="text-sm text-green-700">Answer: {q.correctAnswer}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                <BookOpen size={48} className="mb-4 opacity-50" />
                <p>Configure and generate to preview quiz content</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'take' && !activeQuiz && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableQuizzes.length === 0 ? (
             <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
               No quizzes available. {role === 'TEACHER' ? 'Go to the generator tab to create one.' : 'Ask your teacher to assign one.'}
             </div>
          ) : (
            availableQuizzes.map(quiz => (
              <div key={quiz.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 mb-2">{quiz.title}</h3>
                <div className="flex gap-2 mb-6">
                   <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{quiz.questions.length} Questions</span>
                   <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{new Date(quiz.generatedDate).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => handleStartQuiz(quiz)}
                  className="mt-auto w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} /> Start Quiz
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'take' && activeQuiz && (
        <div className="max-w-3xl mx-auto">
          {submissionResult ? (
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center space-y-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mx-auto">
                <Trophy size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{submissionResult.score} / {submissionResult.maxScore}</h2>
                <p className="text-slate-500">You completed {submissionResult.quizTitle}</p>
              </div>
              <div className="flex gap-4 justify-center">
                 <button onClick={() => setActiveQuiz(null)} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                   Back to List
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 sticky top-0 z-10 shadow-sm">
                 <h3 className="font-bold text-slate-800">{activeQuiz.title}</h3>
                 <button onClick={handleSubmitQuiz} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
                   Submit Answers
                 </button>
               </div>

               <div className="space-y-6">
                 {activeQuiz.questions.map((q, idx) => (
                   <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <p className="font-medium text-lg text-slate-900 mb-4 flex gap-3">
                       <span className="text-slate-400 font-bold">{idx + 1}.</span> 
                       {q.question}
                     </p>
                     <div className="space-y-3 pl-8">
                       {q.options.map((opt, i) => (
                         <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                           <input 
                             type="radio" 
                             name={`q-${q.id}`} 
                             value={opt}
                             checked={answers[q.id] === opt}
                             onChange={() => setAnswers(prev => ({...prev, [q.id]: opt}))}
                             className="text-indigo-600 focus:ring-indigo-500"
                           />
                           <span className="text-slate-700">{opt}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizGen;
