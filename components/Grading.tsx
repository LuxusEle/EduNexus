import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { gradeStudentAnswer } from '../services/geminiService';
import { GradingResult } from '../types';

const Grading: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [grading, setGrading] = useState<boolean>(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGrade = async () => {
    if (!image) return;
    setGrading(true);
    // Extract base64 content
    const base64Data = image.split(',')[1];
    const gradingResult = await gradeStudentAnswer(base64Data, "Physics: Newton's Second Law");
    setResult(gradingResult);
    setGrading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vision Grading Engine</h2>
        <p className="text-slate-500 mt-1">Upload handwritten student answers for automated AI grading and feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Column */}
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
                  <Upload size={16} />
                  Upload Answer
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGrade}
                disabled={!image || grading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {grading ? 'Analyzing with Vision AI...' : 'Grade Submission'}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-800 mb-2">How it works</h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Upload a photo of handwritten work.</li>
              <li>AI extracts text using OCR.</li>
              <li>Logic is compared against the rubric.</li>
              <li>Scores and constructive feedback are generated.</li>
            </ol>
          </div>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
          {result ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Assessment Result</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Score:</span>
                    <span className={`text-xl font-bold ${result.score / result.maxScore > 0.7 ? 'text-green-600' : 'text-orange-600'}`}>
                        {result.score}/{result.maxScore}
                    </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Feedback</h4>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                        {result.feedback}
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Error Analysis</h4>
                    <div className="space-y-3">
                        {result.errorAnalysis.map((err, idx) => (
                            <div key={idx} className="flex gap-4 items-start p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className={`mt-1 p-1.5 rounded-full ${
                                    err.severity === 'High' ? 'bg-red-100 text-red-600' : 
                                    err.severity === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                                    'bg-yellow-100 text-yellow-600'
                                }`}>
                                    <AlertTriangle size={14} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{err.type}</p>
                                    <p className="text-sm text-slate-600">{err.description}</p>
                                </div>
                            </div>
                        ))}
                        {result.errorAnalysis.length === 0 && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                                <Check size={18} />
                                <span className="text-sm font-medium">No significant errors detected.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Topics</h4>
                    <div className="flex flex-wrap gap-2">
                        {result.topicTags.map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText size={48} className="mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-slate-500 mb-2">Ready to Grade</h3>
              <p className="text-sm max-w-xs">Upload a student's handwritten answer on the left to see detailed AI analytics here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Grading;
