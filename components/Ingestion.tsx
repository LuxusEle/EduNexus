import React, { useState, useEffect } from 'react';
import { Upload, Youtube, FileText, CheckCircle, Loader2, Play, ArrowRight, X, FileQuestion } from 'lucide-react';
import { CourseMaterial, StudyPlan } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { dataStore } from '../utils/dataStore';

const Ingestion: React.FC = () => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Presentation Mode State
  const [presentingPlan, setPresentingPlan] = useState<StudyPlan | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Load data from local store on mount
    setMaterials(dataStore.getMaterials());
    setPlans(dataStore.getPlans());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newMaterial: CourseMaterial = {
        id: Date.now().toString(),
        name: file.name,
        type: 'PDF',
        content: "Simulated extracted content from PDF...",
        uploadDate: new Date().toLocaleDateString()
      };
      // Save to store
      dataStore.saveMaterial(newMaterial);
      setMaterials(prev => [...prev, newMaterial]);
    }
  };

  const handleGeneratePlan = async () => {
    if (materials.length === 0) return;
    setIsProcessing(true);
    
    // Simulate context extraction
    const context = "Physics Syllabus: Thermodynamics, Laws of Motion, Kinematics. Key concepts include Newton's laws, energy conservation, and entropy.";
    
    const plan = await generateStudyPlan(context, "Physics Mastery");
    if (plan) {
      dataStore.savePlan(plan);
      setPlans(prev => [...prev, plan]);
    }
    setIsProcessing(false);
  };

  const openPresentation = (plan: StudyPlan) => {
    setPresentingPlan(plan);
    setCurrentSlide(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Knowledge Base & Planning</h2>
        <p className="text-slate-500 mt-1">Upload materials to generate structured study plans and presentations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload & Material List */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors cursor-pointer group relative">
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
            <div className="flex flex-col items-center justify-center py-4">
               <div className="p-3 rounded-full bg-slate-50 group-hover:bg-indigo-50 transition-colors mb-3">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-slate-900">Upload Source Material</p>
              <p className="text-xs text-slate-500">PDF, TXT, DOCX</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
             <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 text-sm">Indexed Materials</h3>
              <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{materials.length}</span>
            </div>
            <ul className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
               {materials.map((m) => (
                  <li key={m.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {m.type === 'PDF' ? <FileText size={16} className="text-indigo-600 shrink-0" /> : <Youtube size={16} className="text-red-600 shrink-0" />}
                      <span className="text-sm text-slate-700 truncate">{m.name}</span>
                    </div>
                  </li>
               ))}
               {materials.length === 0 && <li className="px-4 py-6 text-center text-slate-400 text-xs">No materials yet.</li>}
            </ul>
          </div>
          
           <button 
              onClick={handleGeneratePlan}
              disabled={isProcessing || materials.length === 0}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Generate New Study Plan'}
            </button>
        </div>

        {/* Study Plans List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <CheckCircle size={20} className="text-green-500" /> 
             Generated Plans
           </h3>
           
           {plans.length === 0 ? (
             <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
               Generate a study plan to see it here.
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {plans.map((plan) => (
                 <div key={plan.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 line-clamp-1">{plan.title}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{plan.weeks.length} Weeks</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{plan.contextSummary}</p>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={() => openPresentation(plan)}
                         className="flex-1 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                       >
                         <Play size={14} /> View Slides
                       </button>
                       <button className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                          <FileQuestion size={14} /> To Quiz
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Presentation Modal */}
      {presentingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl aspect-[16/9] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Slide Header */}
            <div className="bg-indigo-600 text-white p-6 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-2xl font-bold">{presentingPlan.title}</h2>
                 <p className="text-indigo-200">Week {presentingPlan.weeks[currentSlide].weekNumber}: {presentingPlan.weeks[currentSlide].topic}</p>
               </div>
               <button onClick={() => setPresentingPlan(null)} className="text-white/80 hover:text-white">
                 <X size={28} />
               </button>
            </div>

            {/* Slide Content */}
            <div className="flex-1 p-10 bg-gradient-to-br from-white to-slate-50 flex flex-col justify-center">
               <h3 className="text-3xl font-bold text-slate-800 mb-8">{presentingPlan.weeks[currentSlide].topic}</h3>
               
               <div className="grid grid-cols-2 gap-12">
                 <div>
                   <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Learning Objectives</h4>
                   <ul className="space-y-3">
                     {presentingPlan.weeks[currentSlide].objectives.map((obj, i) => (
                       <li key={i} className="flex items-start gap-3 text-slate-700 text-lg">
                         <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                         {obj}
                       </li>
                     ))}
                   </ul>
                 </div>
                 
                 <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Key Takeaways</h4>
                    <ul className="space-y-3">
                     {presentingPlan.weeks[currentSlide].keyPoints.map((pt, i) => (
                       <li key={i} className="text-slate-600 font-medium">
                         "{pt}"
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
            </div>

            {/* Slide Controls */}
            <div className="h-16 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-6 shrink-0">
              <span className="text-sm font-medium text-slate-500">
                Slide {currentSlide + 1} of {presentingPlan.weeks.length}
              </span>
              <div className="flex gap-2">
                 <button 
                   onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                   disabled={currentSlide === 0}
                   className="px-4 py-2 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-50"
                 >
                   Previous
                 </button>
                 <button 
                   onClick={() => setCurrentSlide(Math.min(presentingPlan.weeks.length - 1, currentSlide + 1))}
                   disabled={currentSlide === presentingPlan.weeks.length - 1}
                   className="px-4 py-2 rounded bg-indigo-600 text-white font-bold disabled:opacity-50 flex items-center gap-2"
                 >
                   Next <ArrowRight size={16} />
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Ingestion;
