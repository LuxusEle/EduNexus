
import React, { useState, useEffect } from 'react';
import { Upload, Book, FileText, Loader2, Play, Plus, BrainCircuit, Layers, ArrowRight } from 'lucide-react';
import { SourceSet, Source, LessonPack } from '../types';
import { firestoreService } from '../services/firestoreService';
import { aiRouter } from '../services/aiRouter';

const Ingestion: React.FC = () => {
  const [sourceSets, setSourceSets] = useState<SourceSet[]>([]);
  const [lessonPacks, setLessonPacks] = useState<LessonPack[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  
  // Creation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newObjectives, setNewObjectives] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sets = await firestoreService.getSourceSets('demo_class');
    const packs = await firestoreService.getLessonPacks('demo_class');
    setSourceSets(sets);
    setLessonPacks(packs);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a simulated source set if none exists
      let targetSetId = activeSetId;
      if (!targetSetId && sourceSets.length === 0) {
        targetSetId = await firestoreService.createSourceSet({
          classId: 'demo_class',
          name: 'General Course Materials',
          sources: [],
          rules: { allowWebSearch: false, strictness: 'HIGH' }
        });
        setActiveSetId(targetSetId);
      } else if (!targetSetId) {
        targetSetId = sourceSets[0].id;
      }

      // Add source to set (Logic simplified for demo)
      // In real app: Upload to Storage -> Backend processes text -> Updates Firestore
      const newSource: Source = {
        id: `src_${Date.now()}`,
        type: 'PDF',
        title: file.name,
        status: 'READY',
        content: `Simulated content for ${file.name}`
      };

      // Mock update to local state/store
      const sets = await firestoreService.getSourceSets('demo_class');
      const set = sets.find(s => s.id === targetSetId);
      if (set) {
         // This is a hack because firestoreService mocks don't have updateSourceSet yet
         // In prod, call API to add source
         set.sources.push(newSource); 
         localStorage.setItem('edunexus_sources_demo_class', JSON.stringify(sets));
         setSourceSets([...sets]);
      }
    }
  };

  const handleGeneratePack = async () => {
    if (!newTopic || !activeSetId) return;
    setIsProcessing(true);

    const set = sourceSets.find(s => s.id === activeSetId);
    if (set) {
      const objectives = newObjectives.split(',').map(s => s.trim());
      const pack = await aiRouter.generateLessonPack(newTopic, set, objectives);
      
      if (pack) {
        await firestoreService.saveLessonPack(pack);
        setLessonPacks(prev => [...prev, pack]);
        setNewTopic("");
        setNewObjectives("");
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Material Factory</h2>
          <p className="text-slate-500 mt-1">Orchestrate source sets and generate comprehensive lesson packs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Source Sets (Truth) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Book size={20} className="text-indigo-600" /> Source Notebooks
            </h3>
            
            <div className="space-y-4 mb-6">
              {sourceSets.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No notebooks created.</p>
              ) : (
                sourceSets.map(set => (
                  <div 
                    key={set.id} 
                    onClick={() => setActiveSetId(set.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeSetId === set.id ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                  >
                    <div className="font-medium text-slate-800 text-sm">{set.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{set.sources.length} sources</div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
               <label className="block w-full text-center py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 cursor-pointer transition-colors">
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                  <Upload size={16} className="inline mr-2" /> Add Source Material
               </label>
            </div>
          </div>
        </div>

        {/* Right: Lesson Pack Generator */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <BrainCircuit size={20} className="text-purple-600" /> AI Generator
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                 <input 
                   value={newTopic}
                   onChange={e => setNewTopic(e.target.value)}
                   className="w-full p-2 border border-slate-300 rounded text-sm"
                   placeholder="e.g. Thermodynamics"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Objectives (comma sep)</label>
                 <input 
                   value={newObjectives}
                   onChange={e => setNewObjectives(e.target.value)}
                   className="w-full p-2 border border-slate-300 rounded text-sm"
                   placeholder="e.g. Laws, Entropy, Cycles"
                 />
               </div>
             </div>

             <button 
               onClick={handleGeneratePack}
               disabled={isProcessing || !activeSetId}
               className="w-full py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
               Generate Lesson Pack
             </button>
           </div>

           <div className="space-y-4">
             <h3 className="font-bold text-slate-800">Generated Packs</h3>
             {lessonPacks.map(pack => (
               <div key={pack.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                 <div>
                   <h4 className="font-bold text-slate-900">{pack.title}</h4>
                   <div className="flex gap-2 mt-1">
                     <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{pack.modules.slides.length} Slides</span>
                     <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{pack.modules.worksheet.length} Questions</span>
                   </div>
                 </div>
                 <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1">
                   View <ArrowRight size={16} />
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for icon
const Sparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export default Ingestion;
