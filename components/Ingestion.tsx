
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Book, Loader2, BrainCircuit, Play, ArrowRight, Settings, Download, PenTool, ExternalLink, RefreshCw, X, Check, Save, ListChecks, ScanSearch, FileText, ChevronRight, Maximize2, MonitorPlay } from 'lucide-react';
import { SourceSet, Source, LessonPack, ClassSettings, Slide, AnalysisResult } from '../types';
import { firestoreService } from '../services/firestoreService';
import { aiRouter } from '../services/aiRouter';

const Ingestion: React.FC = () => {
  const [sourceSets, setSourceSets] = useState<SourceSet[]>([]);
  const [lessonPacks, setLessonPacks] = useState<LessonPack[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Creation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  
  // Persistence: Store selections as a set of unique IDs "topicIndex-objectiveIndex"
  const [selectedObjectives, setSelectedObjectives] = useState<Set<string>>(new Set());
  
  // Settings State
  const [settings, setSettings] = useState<ClassSettings>({
      educationSystem: 'SRI_LANKA_LOCAL',
      language: 'ENGLISH',
      gradeLevel: '12',
      aiMarkingEnabled: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Editor State
  const [editingPack, setEditingPack] = useState<LessonPack | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModifying, setIsModifying] = useState(false);

  // Presentation Mode State
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sets = await firestoreService.getSourceSets('demo_class');
    const packs = await firestoreService.getLessonPacks('demo_class');
    const savedSettings = await firestoreService.getClassSettings('demo_class');
    
    setSourceSets(sets);
    setLessonPacks(packs);
    if (savedSettings) setSettings(savedSettings);
  };

  const getSimulatedContent = (filename: string) => {
      const lower = filename.toLowerCase();
      if (lower.includes('phys')) return `PHYSICS SYLLABUS... (Simulated Content)`;
      if (lower.includes('chem')) return `CHEMISTRY SYLLABUS... (Simulated Content)`;
      if (lower.includes('math')) return `MATH SYLLABUS... (Simulated Content)`;
      return `GENERAL SYLLABUS... (Simulated Content)`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

      const newSource: Source = {
        id: `src_${Date.now()}`,
        type: 'PDF',
        title: file.name,
        status: 'READY',
        content: getSimulatedContent(file.name)
      };

      const sets = await firestoreService.getSourceSets('demo_class');
      const set = sets.find(s => s.id === targetSetId);
      if (set) {
         set.sources.push(newSource); 
         const updatedSets = sets.map(s => s.id === targetSetId ? set : s);
         localStorage.setItem('edunexus_sources_demo_class', JSON.stringify(updatedSets));
         setSourceSets(updatedSets);
      }
    }
  };

  const handleTriggerUpload = () => {
      fileInputRef.current?.click();
  };

  const handleSaveSettings = async () => {
      setIsSavingSettings(true);
      await firestoreService.updateClassSettings('demo_class', settings);
      await new Promise(resolve => setTimeout(resolve, 600));
      setIsSavingSettings(false);
      setShowSettings(false);
  };

  const handleAnalyzeSource = async () => {
      if (!activeSetId) return;
      setIsAnalyzing(true);
      const set = sourceSets.find(s => s.id === activeSetId);
      if (set) {
          const results = await aiRouter.extractMetadata(set);
          if (results) {
              setAnalysisResults(results);
              setSelectedTopicIndex(null); // Start at map view
              setSelectedObjectives(new Set()); // Clear old selections on new analysis
          }
      }
      setIsAnalyzing(false);
  };

  // Selection Logic with Persistent Keys
  const getUniqueKey = (topicIdx: number, objIdx: number) => `${topicIdx}-${objIdx}`;

  const toggleObjective = (topicIdx: number, objIdx: number) => {
      const key = getUniqueKey(topicIdx, objIdx);
      const next = new Set(selectedObjectives);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setSelectedObjectives(next);
  };

  const toggleAllInTopic = (topicIdx: number) => {
      const topic = analysisResults[topicIdx];
      const allKeys = topic.objectives.map((_, i) => getUniqueKey(topicIdx, i));
      const allSelected = allKeys.every(k => selectedObjectives.has(k));
      
      const next = new Set(selectedObjectives);
      allKeys.forEach(k => {
          if (allSelected) next.delete(k);
          else next.add(k);
      });
      setSelectedObjectives(next);
  };

  const handleGeneratePack = async () => {
    if (selectedTopicIndex === null || !activeSetId) return;
    
    // Aggregate all selected objective texts from the CURRENT topic
    // (Or could be global if we wanted multi-topic packs, but sticking to 1 topic per pack for now)
    const topicData = analysisResults[selectedTopicIndex];
    const relevantKeys = topicData.objectives
        .map((_, i) => ({ key: getUniqueKey(selectedTopicIndex, i), text: _, index: i }))
        .filter(item => selectedObjectives.has(item.key));

    if (relevantKeys.length === 0) {
        alert("Please select at least one learning objective.");
        return;
    }

    setIsGenerating(true);
    const set = sourceSets.find(s => s.id === activeSetId);
    if (set) {
      // Flatten hierarchical objectives for the prompt
      const objectives = relevantKeys.map(k => {
          const obj = topicData.objectives[k.index];
          return `${obj.main} (Details: ${obj.subPoints.join(', ')})`;
      });

      const pack = await aiRouter.generateLessonPack(topicData.topic, set, objectives, settings);
      
      if (pack) {
        await firestoreService.saveLessonPack(pack);
        setLessonPacks(prev => [...prev, pack]);
        setAnalysisResults([]);
        setSelectedTopicIndex(null);
        setSelectedObjectives(new Set());
      }
    }
    setIsGenerating(false);
  };

  // --- Visual Editor Logic ---
  const startDrawing = (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
  };

  const draw = (e: React.MouseEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
  };

  const handleModifySlide = async () => {
      if (!editingPack) return;
      if (!editingPack.modules?.slides?.[activeSlideIndex]) return;

      setIsModifying(true);
      
      let imageBase64: string | undefined = undefined;
      const canvas = canvasRef.current;
      if (canvas) {
          imageBase64 = canvas.toDataURL('image/png').split(',')[1];
      }

      const currentSlide = editingPack.modules.slides[activeSlideIndex];
      const updatedSlide = await aiRouter.modifySlide(
          JSON.stringify(currentSlide), 
          editInstruction, 
          imageBase64
      );

      if (updatedSlide) {
          const updatedPack = { ...editingPack };
          if (updatedPack.modules && updatedPack.modules.slides) {
            updatedPack.modules.slides[activeSlideIndex] = updatedSlide;
            setEditingPack(updatedPack);
            await firestoreService.saveLessonPack(updatedPack);
            clearCanvas();
            setEditInstruction("");
          }
      }
      setIsModifying(false);
  };

  const simulateDownload = (pack: LessonPack) => {
      alert(`Downloading "${pack.title}" as PDF... (Optimized for ${settings.educationSystem})`);
  };

  // --- Sub-Components ---

  // Presentation Mode Overlay
  if (isPresenting && editingPack) {
      const slides = editingPack.modules?.slides || [];
      // Safe check for index bounds
      const safeIndex = Math.min(activeSlideIndex, Math.max(0, slides.length - 1));
      const slide = slides[safeIndex];
      const total = slides.length;

      if (!slide) {
        return (
          <div className="fixed inset-0 z-[100] bg-black text-white flex items-center justify-center">
             <div className="text-center">
                <p className="mb-4 text-red-400">No slides available.</p>
                <button onClick={() => setIsPresenting(false)} className="px-4 py-2 bg-gray-800 rounded">Close</button>
             </div>
          </div>
        );
      }

      const nextSlide = () => setActiveSlideIndex(Math.min(total - 1, safeIndex + 1));
      const prevSlide = () => setActiveSlideIndex(Math.max(0, safeIndex - 1));

      return (
          <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
              <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800">
                  <div className="font-bold text-gray-400">{editingPack.title} <span className="text-gray-600 mx-2">|</span> {slide.topic}</div>
                  <button onClick={() => setIsPresenting(false)} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 flex items-center justify-center p-12 bg-black overflow-hidden relative" onClick={nextSlide}>
                  <div className="max-w-5xl w-full space-y-8">
                       <h1 className="text-5xl font-bold text-white mb-8">{slide.topic}</h1>
                       <div className="space-y-6">
                           {slide.content.map((pt, i) => (
                               <div key={i} className="text-2xl text-gray-200 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{animationDelay: `${i*150}ms`}}>
                                   <span className="text-indigo-500">•</span>
                                   {pt}
                               </div>
                           ))}
                       </div>
                       {slide.equations && (
                           <div className="mt-8 bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                               {slide.equations.map((eq, i) => (
                                   <div key={i} className="font-mono text-3xl text-green-400 py-2 text-center">{eq}</div>
                               ))}
                           </div>
                       )}
                  </div>
              </div>
              <div className="p-6 bg-gray-900 flex justify-center gap-4 items-center">
                  <button onClick={prevSlide} disabled={safeIndex===0} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 disabled:opacity-30"><ArrowRight className="rotate-180"/></button>
                  <span className="text-xl font-bold text-gray-400">{safeIndex + 1} / {total}</span>
                  <button onClick={nextSlide} disabled={safeIndex===total-1} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 disabled:opacity-30"><ArrowRight/></button>
              </div>
          </div>
      );
  }

  // Visual Editor (Main Render when editing)
  if (editingPack) {
      const slides = editingPack.modules?.slides || [];
      const safeIndex = Math.min(activeSlideIndex, Math.max(0, slides.length - 1));
      const slide = slides[safeIndex];
      
      if (!slide) {
        return (
          <div className="fixed inset-0 z-50 bg-slate-100 flex items-center justify-center flex-col">
             <h2 className="text-xl font-bold text-slate-800">No Slides Found</h2>
             <p className="text-slate-500 mb-4">This lesson pack appears to be empty or malformed.</p>
             <button onClick={() => setEditingPack(null)} className="px-4 py-2 bg-indigo-600 text-white rounded">Go Back</button>
          </div>
        );
      }

      return (
          <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
              {/* Toolbar */}
              <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setEditingPack(null)} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180" /></button>
                      <div>
                          <h2 className="font-bold text-slate-900">{editingPack.title}</h2>
                          <p className="text-xs text-slate-500">Slide {safeIndex + 1} of {slides.length}</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                       <button onClick={() => setIsPresenting(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm border border-indigo-500">
                           <MonitorPlay size={16} /> Present Slide Show
                       </button>
                       <button onClick={() => simulateDownload(editingPack)} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-900">
                           <Download size={16} /> Download
                       </button>
                  </div>
              </div>

              <div className="flex-1 overflow-hidden flex">
                  {/* Slide View (Main) */}
                  <div className="flex-1 p-8 overflow-y-auto bg-slate-200 flex justify-center relative">
                       <div className="w-[800px] min-h-[600px] bg-white shadow-2xl rounded-lg p-12 relative flex flex-col">
                            {/* Visual Editor Overlay */}
                            <canvas 
                                ref={canvasRef}
                                width={800}
                                height={600}
                                className="absolute inset-0 z-10 cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                            
                            {/* Slide Content */}
                            <div className="border-b-4 border-indigo-600 pb-4 mb-8">
                                <h1 className="text-4xl font-bold text-slate-900">{slide.topic}</h1>
                                <p className="text-slate-400 mt-2 font-mono text-sm">{settings.educationSystem} - {settings.gradeLevel}</p>
                            </div>
                            
                            <div className="flex-1 space-y-6">
                                <div className="space-y-4">
                                    {slide.content.map((pt, i) => (
                                        <div key={i} className="flex gap-3 text-lg text-slate-800">
                                            <span className="text-indigo-500 font-bold">•</span>
                                            {pt}
                                        </div>
                                    ))}
                                </div>

                                {slide.equations && slide.equations.length > 0 && (
                                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 my-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Key Equations</h4>
                                        {slide.equations.map((eq, i) => (
                                            <div key={i} className="font-mono text-xl text-indigo-800 py-1">{eq}</div>
                                        ))}
                                    </div>
                                )}

                                {/* Diagram Placeholder */}
                                <div className="w-full h-64 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group">
                                     <img 
                                        src={`https://image.pollinations.ai/prompt/${encodeURIComponent(slide.diagramDescription + " educational schematic technical diagram white background")}`} 
                                        className="w-full h-full object-contain"
                                        alt="Diagram"
                                     />
                                     <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">AI Diagram</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                                <span>EduNexus Generated Content</span>
                                <span>{safeIndex + 1}</span>
                            </div>
                       </div>
                  </div>

                  {/* Sidebar (Editor Controls & Refs) */}
                  <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
                       {/* Web Suggestions */}
                       <div className="p-4 border-b border-slate-200 bg-slate-50">
                           <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                               <ExternalLink size={16} className="text-blue-500" /> Web Resources
                           </h3>
                           <div className="space-y-2">
                               {slide.webResources?.map((res, i) => (
                                   <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white rounded border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all">
                                       <div className="text-sm font-medium text-blue-700 truncate">{res.title}</div>
                                       <div className="text-xs text-slate-400 mt-1 truncate">{res.url}</div>
                                   </a>
                               )) || <span className="text-xs text-slate-400">No links suggested.</span>}
                           </div>
                       </div>

                       {/* Editor Input */}
                       <div className="flex-1 p-4 flex flex-col">
                           <div className="flex items-center justify-between mb-2">
                               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                   <PenTool size={16} className="text-red-500" /> Corrections
                               </h3>
                               <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-red-600">Clear Marks</button>
                           </div>
                           <p className="text-xs text-slate-500 mb-3">Circle areas on the slide to change, then describe the fix.</p>
                           
                           <textarea 
                               value={editInstruction}
                               onChange={(e) => setEditInstruction(e.target.value)}
                               placeholder="e.g. 'Change this equation to Newton's Second Law'..."
                               className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500"
                           />
                           
                           <button 
                               onClick={handleModifySlide}
                               disabled={isModifying || (!editInstruction && !isDrawing)}
                               className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                           >
                               {isModifying ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                               Update Slide
                           </button>
                       </div>

                       {/* Navigation */}
                       <div className="p-4 border-t border-slate-200 grid grid-cols-2 gap-2">
                           <button 
                               onClick={() => { setActiveSlideIndex(Math.max(0, safeIndex - 1)); clearCanvas(); }}
                               disabled={safeIndex === 0}
                               className="py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm disabled:opacity-50"
                           >
                               Previous
                           </button>
                           <button 
                               onClick={() => { setActiveSlideIndex(Math.min(slides.length - 1, safeIndex + 1)); clearCanvas(); }}
                               disabled={safeIndex === slides.length - 1}
                               className="py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm disabled:opacity-50"
                           >
                               Next
                           </button>
                       </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- Main Render (Syllabus Map & Selection) ---

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Settings Toggle */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Material Factory</h2>
          <p className="text-slate-500 mt-1">Orchestrate source sets and generate detailed lesson packs.</p>
        </div>
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition-colors ${showSettings ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
        >
            <Settings size={16} /> Teacher Settings
        </button>
      </div>

      {showSettings && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 relative">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Education System</label>
                        <select 
                                value={settings.educationSystem}
                                onChange={e => setSettings({...settings, educationSystem: e.target.value as any})}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                            >
                            <option value="SRI_LANKA_LOCAL">Sri Lanka (Local)</option>
                            <option value="EDEXCEL">Edexcel</option>
                            <option value="CAMBRIDGE">Cambridge</option>
                            <option value="IB">International Baccalaureate</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Language</label>
                        <select 
                                value={settings.language}
                                onChange={e => setSettings({...settings, language: e.target.value as any})}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                            >
                            <option value="ENGLISH">English</option>
                            <option value="SINHALA">Sinhala</option>
                            <option value="TAMIL">Tamil</option>
                            <option value="HYBRID">Hybrid (Eng/Sin)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Grade Level</label>
                        <select 
                                value={settings.gradeLevel}
                                onChange={e => setSettings({...settings, gradeLevel: e.target.value as any})}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                            >
                            <option value="10">Grade 10</option>
                            <option value="11">Grade 11 (O/L)</option>
                            <option value="12">Grade 12 (A/L)</option>
                            <option value="13">Grade 13 (A/L)</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="w-full py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSavingSettings ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Configuration
                        </button>
                    </div>
               </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Source Sets */}
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
            <div className="border-t border-slate-100 pt-4 text-center">
               <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="application/pdf" />
               <button 
                 onClick={handleTriggerUpload}
                 className="text-sm text-indigo-600 font-bold hover:underline flex items-center justify-center gap-2 w-full"
               >
                 <Upload size={16} /> Add Source PDF
               </button>
            </div>
          </div>
        </div>

        {/* Right: Learning Map & Objective Selection */}
        <div className="lg:col-span-2 space-y-6">
           {analysisResults.length === 0 ? (
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center py-12">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4 text-purple-600">
                       <ScanSearch size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">Step 1: Build Syllabus Map</h3>
                   <p className="text-slate-500 max-w-md mx-auto mb-6">
                       AI will analyze your content to build a weighted Learning Map of all topics and objectives.
                   </p>
                   <button 
                       onClick={handleAnalyzeSource}
                       disabled={isAnalyzing || !activeSetId}
                       className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                   >
                       {isAnalyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit size={18} />}
                       Analyze Notebook
                   </button>
                   {!activeSetId && <p className="text-xs text-red-400 mt-2">Please select a notebook on the left first.</p>}
               </div>
           ) : (
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <ListChecks size={20} className="text-green-600" /> Syllabus Learning Map
                       </h3>
                       <button onClick={() => setAnalysisResults([])} className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                           <X size={14} /> Clear Map
                       </button>
                   </div>
                   
                   {/* Layout: Map vs Detail */}
                   <div className="flex flex-col md:flex-row gap-6">
                       
                       {/* Left: Syllabus Map (Zoom Navigation) */}
                       <div className="w-full md:w-1/3 space-y-3">
                           <h4 className="text-xs font-bold text-slate-500 uppercase">Topics (Zoom In)</h4>
                           {analysisResults.map((res, i) => (
                               <div 
                                   key={i}
                                   onClick={() => setSelectedTopicIndex(i)}
                                   className={`relative p-3 rounded-lg border cursor-pointer transition-all overflow-hidden group ${selectedTopicIndex === i ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                               >
                                   <div className="relative z-10 flex justify-between items-center">
                                       <span className={`font-medium text-sm ${selectedTopicIndex === i ? 'text-indigo-900' : 'text-slate-700'}`}>{res.topic}</span>
                                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${res.weight === 'High' ? 'bg-red-100 text-red-700' : res.weight === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                           {res.weight}
                                       </span>
                                   </div>
                                   {/* Progress bar visual for 'weight' */}
                                   <div className={`absolute bottom-0 left-0 h-1 ${res.weight === 'High' ? 'bg-red-400 w-3/4' : res.weight === 'Medium' ? 'bg-amber-400 w-1/2' : 'bg-green-400 w-1/4'} opacity-30`}></div>
                                   
                                   {selectedTopicIndex === i && <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 opacity-20" size={40} />}
                               </div>
                           ))}
                       </div>

                       {/* Right: Granular Objectives */}
                       <div className="w-full md:w-2/3 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
                           {selectedTopicIndex !== null ? (
                               <>
                                   <div className="flex justify-between items-center mb-3">
                                       <h4 className="text-xs font-bold text-slate-500 uppercase">Deep-Dive Objectives</h4>
                                       <div className="flex gap-2">
                                           <button onClick={() => toggleAllInTopic(selectedTopicIndex)} className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded text-slate-600 hover:bg-slate-100">Toggle All</button>
                                       </div>
                                   </div>
                                   <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                                       {analysisResults[selectedTopicIndex].objectives.map((obj, i) => {
                                           const uniqueKey = getUniqueKey(selectedTopicIndex, i);
                                           const isSelected = selectedObjectives.has(uniqueKey);
                                           return (
                                               <div 
                                                    key={uniqueKey} 
                                                    onClick={() => toggleObjective(selectedTopicIndex, i)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-white border-green-500 shadow-sm' : 'bg-slate-100 border-transparent hover:bg-white hover:border-slate-300'}`}
                                               >
                                                   <div className="flex items-start gap-3">
                                                       <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-green-500 border-green-500' : 'bg-white border-slate-400'}`}>
                                                           {isSelected && <Check size={10} className="text-white" />}
                                                       </div>
                                                       <div>
                                                           <p className={`text-sm font-medium ${isSelected ? 'text-green-900' : 'text-slate-700'}`}>{obj.main}</p>
                                                           {/* Indepth Subpoints */}
                                                           <ul className="mt-2 space-y-1 pl-4 border-l-2 border-slate-200">
                                                               {obj.subPoints.map((sub, idx) => (
                                                                   <li key={idx} className="text-xs text-slate-500 leading-relaxed">• {sub}</li>
                                                               ))}
                                                           </ul>
                                                       </div>
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                                   
                                   <div className="mt-4 pt-4 border-t border-slate-200">
                                       <button 
                                           onClick={handleGeneratePack}
                                           disabled={isGenerating}
                                           className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                       >
                                           {isGenerating ? <Loader2 className="animate-spin" /> : <Play size={16} />}
                                           Generate Lesson Pack
                                       </button>
                                       <p className="text-xs text-center text-slate-400 mt-2">Selections are saved across topics.</p>
                                   </div>
                               </>
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic opacity-60">
                                   <ScanSearch size={48} className="mb-2"/>
                                   <p>Select a topic from the Learning Map</p>
                                   <p>to zoom into specific objectives.</p>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}

           <div className="space-y-4">
             <h3 className="font-bold text-slate-800">Generated Packs</h3>
             {lessonPacks.map(pack => (
               <div key={pack.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                 <div>
                   <h4 className="font-bold text-slate-900">{pack.title}</h4>
                   <div className="flex gap-2 mt-1">
                     <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{pack.modules?.slides?.length || 0} Slides</span>
                     <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{pack.modules?.worksheet?.length || 0} Questions</span>
                   </div>
                 </div>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => { setEditingPack(pack); setActiveSlideIndex(0); setIsPresenting(true); }}
                        className="text-green-600 hover:text-green-800 text-sm font-bold flex items-center gap-1 px-3 py-2 bg-green-50 rounded-lg"
                     >
                       <Play size={14} /> Present
                     </button>
                     <button 
                        onClick={() => { setEditingPack(pack); setActiveSlideIndex(0); }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 px-3 py-2 bg-indigo-50 rounded-lg"
                     >
                       Edit <ArrowRight size={14} />
                     </button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Ingestion;
