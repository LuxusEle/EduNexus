import React, { useState, useEffect } from 'react';
import { Upload, Youtube, FileText, CheckCircle, Loader2, Play, ArrowRight, X, FileQuestion, Send, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CourseMaterial, StudyPlan, AppView } from '../types';
import { generateStudyPlan, updateStudyPlan } from '../services/geminiService';
import { dataStore } from '../utils/dataStore';

interface IngestionProps {
  onNavigateToQuiz: (planId: string) => void;
}

const Ingestion: React.FC<IngestionProps> = ({ onNavigateToQuiz }) => {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [courseTopic, setCourseTopic] = useState("");
  
  // Presentation Mode State
  const [presentingPlan, setPresentingPlan] = useState<StudyPlan | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Editing State
  const [chatInput, setChatInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

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
        content: `File: ${file.name}. (Content extraction simulated)`,
        uploadDate: new Date().toLocaleDateString()
      };
      
      // If no topic is set, try to infer it from the first filename
      if (!courseTopic && materials.length === 0) {
         const name = file.name.split('.')[0];
         setCourseTopic(name.replace(/[-_]/g, ' '));
      }

      // Save to store
      dataStore.saveMaterial(newMaterial);
      setMaterials(prev => [...prev, newMaterial]);
    }
  };

  const handleGeneratePlan = async () => {
    if (materials.length === 0) return;
    setIsProcessing(true);
    
    // Construct context from user input and file metadata
    // This replaces the hardcoded Physics context
    const materialsContext = materials.map(m => `Material Source: ${m.name} (${m.type})`).join('\n');
    
    const fullContext = `
      Target Subject/Topic: ${courseTopic || "General Curriculum"}
      
      Available Source Materials:
      ${materialsContext}
      
      (Note: Detailed PDF extraction is simulated. Please generate a comprehensive academic study plan strictly based on the Target Subject '${courseTopic}' and the structure implied by the Material Source titles.)
    `;
    
    const plan = await generateStudyPlan(fullContext, courseTopic || "General Curriculum");
    if (plan) {
      dataStore.savePlan(plan);
      setPlans(prev => [...prev, plan]);
    }
    setIsProcessing(false);
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presentingPlan || !chatInput.trim()) return;

    setIsEditing(true);
    const updatedPlan = await updateStudyPlan(presentingPlan, chatInput);
    
    if (updatedPlan) {
      setPresentingPlan(updatedPlan);
      // Update in local store
      const updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
      setPlans(updatedPlans);
      updatedPlans.forEach(p => dataStore.savePlan(p)); // Naive resave
      setChatInput("");
    }
    setIsEditing(false);
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
           
           {/* Topic Input */}
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-2">Subject / Topic</label>
              <input 
                type="text"
                value={courseTopic}
                onChange={(e) => setCourseTopic(e.target.value)}
                placeholder="e.g. Organic Chemistry"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                The AI will use this subject to interpret your uploaded files.
              </p>
           </div>

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
               Upload files and set a topic to generate a study plan.
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {plans.map((plan) => (
                 <div key={plan.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{plan.title}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{plan.weeks.length} Weeks</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{plan.contextSummary}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                       <button 
                         onClick={() => openPresentation(plan)}
                         className="flex-1 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                       >
                         <Play size={14} /> View Slides
                       </button>
                       <button 
                          onClick={() => onNavigateToQuiz(plan.id)}
                          className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                       >
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
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden relative">
            
            {/* Slide Content (Left) */}
            <div className="flex-1 flex flex-col relative bg-slate-50">
                <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">{presentingPlan.title}</h2>
                        <p className="text-indigo-200 text-sm">Week {presentingPlan.weeks[currentSlide].weekNumber}</p>
                    </div>
                    <button onClick={() => setPresentingPlan(null)} className="text-white/80 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">
                         <h3 className="text-3xl font-bold text-slate-900">{presentingPlan.weeks[currentSlide].topic}</h3>
                         
                         {/* AI Image Generation */}
                         <div className="w-full h-64 bg-slate-200 rounded-xl overflow-hidden relative shadow-md">
                            <img 
                                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(presentingPlan.weeks[currentSlide].slideImagePrompt + " educational realistic diagram detailed")}`} 
                                alt="Slide Visual"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                                AI Generated
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">Objectives</h4>
                                <ul className="space-y-3">
                                    {presentingPlan.weeks[currentSlide].objectives.map((obj, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                        {obj}
                                    </li>
                                    ))}
                                </ul>
                             </div>
                             <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-4">Key Points</h4>
                                <ul className="space-y-3">
                                    {presentingPlan.weeks[currentSlide].keyPoints.map((pt, i) => (
                                    <li key={i} className="text-indigo-900 font-medium text-sm">
                                        "{pt}"
                                    </li>
                                    ))}
                                </ul>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
                    <span className="text-sm font-medium text-slate-500">Slide {currentSlide + 1} / {presentingPlan.weeks.length}</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                            disabled={currentSlide === 0}
                            className="px-4 py-2 rounded bg-slate-100 text-slate-700 disabled:opacity-50 text-sm font-medium hover:bg-slate-200"
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => setCurrentSlide(Math.min(presentingPlan.weeks.length - 1, currentSlide + 1))}
                            disabled={currentSlide === presentingPlan.weeks.length - 1}
                            className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-indigo-700"
                        >
                            Next <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Editor (Right) */}
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" />
                        AI Editor
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Chat to modify slides or add content.</p>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none text-sm text-slate-700">
                        Hello! I'm your co-pilot. Want to add more diagrams, simplify the text, or add a quiz section to this slide?
                    </div>
                </div>

                <form onSubmit={handleEditPlan} className="p-4 border-t border-slate-200">
                    <div className="relative">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="e.g., 'Add a point about gravity'..."
                            className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isEditing}
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || isEditing}
                            className="absolute right-2 top-2 p-1 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
                        >
                            {isEditing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Ingestion;