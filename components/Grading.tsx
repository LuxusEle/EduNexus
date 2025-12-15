import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, AlertTriangle, FileText, ChevronRight, AlertOctagon } from 'lucide-react';
import { aiRouter } from '../services/aiRouter';
import { GradingResult, Attempt, Response } from '../types';
import { firestoreService } from '../services/firestoreService';

const Grading: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'QUEUE'>('UPLOAD');
  const [image, setImage] = useState<string | null>(null);
  const [grading, setGrading] = useState<boolean>(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [reviewQueue, setReviewQueue] = useState<{attempt: Attempt, response: Response}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const queue = await firestoreService.getResponsesForReview('demo_class');
    setReviewQueue(queue);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGrade = async () => {
    if (!image) return;
    setGrading(true);
    const base64Data = image.split(',')[1];
    
    // In prod, pass the actual rubric ID
    const gradingResult = await aiRouter.gradeResponse(base64Data, undefined, "Rubric: Evaluate Newton's Laws correctness.");
    
    if (gradingResult) {
       setResult(gradingResult);
       // Mock saving attempt
       const attempt: Attempt = {
         id: `att_${Date.now()}`,
         quizId: 'quiz_demo',
         studentId: 'stud_demo',
         status: gradingResult.confidence > 0.8 ? 'GRADED' : 'NEEDS_REVIEW',
         submittedAt: new Date().toISOString()
       };
       const response: Response = {
         id: `resp_${Date.now()}`,
         attemptId: attempt.id,
         questionId: 'q1',
         studentId: 'stud_demo',
         input: { imageUrls: ['mock_url'] },
         grading: gradingResult
       };
       await firestoreService.submitAttempt(attempt, [response]);
       loadQueue(); // Refresh queue
    }
    setGrading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Marking Factory</h2>
           <p className="text-slate-500 mt-1">Automated vision grading with teacher confidence loops.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('UPLOAD')}
             className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'UPLOAD' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
           >
             Live Grading
           </button>
           <button 
             onClick={() => setActiveTab('QUEUE')}
             className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'QUEUE' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
           >
             Review Queue ({reviewQueue.length})
           </button>
        </div>
      </div>

      {activeTab === 'UPLOAD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-dashed border-slate-300">
                {image ? (
                  <img src={image} alt="Student answer" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center p-6">
                    <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No image selected</p>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} /> Upload
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGrade}
                  disabled={!image || grading}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {grading ? 'Analyzing...' : 'Grade Submission'}
                </button>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-6">
            {result ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className={`px-6 py-4 border-b border-slate-200 flex justify-between items-center ${result.confidence < 0.8 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                     <h3 className="font-bold text-slate-800">Result</h3>
                     {result.confidence < 0.8 && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded font-bold">Low Confidence</span>}
                  </div>
                  <span className="text-xl font-bold text-slate-900">{result.awardedMarks}/{result.maxMarks}</span>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Feedback Summary</h4>
                    <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded">{result.feedback.summary}</p>
                  </div>
                  
                  {result.flags.length > 0 && (
                    <div className="bg-red-50 p-3 rounded border border-red-100">
                      <h4 className="text-xs font-bold text-red-600 uppercase mb-1">Flags</h4>
                      <div className="flex gap-2">
                        {result.flags.map(f => (
                          <span key={f} className="text-xs text-red-700 font-bold px-2 py-0.5 bg-red-100 rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Corrections</h4>
                     {result.feedback.corrections.map((c, i) => (
                       <div key={i} className="text-sm mb-2 border-l-2 border-indigo-200 pl-3">
                         <span className="text-red-500 font-medium block">Issue: {c.issue}</span>
                         <span className="text-green-600 block">Fix: {c.fix}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <FileText size={48} className="mb-4 opacity-50" />
                <p className="text-sm">Result will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
           {reviewQueue.length === 0 ? (
             <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
               <Check size={40} className="mx-auto mb-4 text-green-500" />
               <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
               <p>No marking tasks require your review right now.</p>
             </div>
           ) : (
             reviewQueue.map((item, idx) => (
               <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                  <div className="w-32 h-32 bg-slate-100 rounded-lg shrink-0">
                     {/* Placeholder for actual image URL */}
                     <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Snapshot</div>
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900">Attempt {item.attempt.id}</h4>
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">Needs Review</span>
                     </div>
                     <p className="text-sm text-slate-500 mt-1">AI Confidence: {(item.response.grading!.confidence * 100).toFixed(0)}%</p>
                     
                     <div className="mt-4 flex gap-2">
                        <button className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200">Approve AI Grade</button>
                        <button className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200">Override</button>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      )}
    </div>
  );
};

export default Grading;
