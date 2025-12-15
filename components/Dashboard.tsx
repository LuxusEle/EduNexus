import React from 'react';
import { AppView } from '../types';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="text-center py-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to EduNexus AI</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          The next-generation tuition management system powered by Generative AI. 
          Automate grading, generate curriculum, and get deep insights instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div 
            onClick={() => onChangeView(AppView.INGESTION)}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={100} className="text-indigo-600" />
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Knowledge Base</h3>
            <p className="text-slate-500 mb-6">Ingest PDFs, Videos, and Syllabus text to create a custom RAG index for your course.</p>
            <span className="text-indigo-600 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                Manage Content <ArrowRight size={16} />
            </span>
        </div>

        <div 
            onClick={() => onChangeView(AppView.ASSESSMENT)}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer relative overflow-hidden"
        >
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={100} className="text-purple-600" />
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Quiz Generator</h3>
            <p className="text-slate-500 mb-6">Generate infinite unique quizzes based on your specific curriculum difficulty and topics.</p>
            <span className="text-purple-600 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                Create Assessment <ArrowRight size={16} />
            </span>
        </div>

        <div 
            onClick={() => onChangeView(AppView.GRADING)}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
        >
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <GraduationCap size={100} className="text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Vision Grading</h3>
            <p className="text-slate-500 mb-6">Upload photos of handwritten answers. AI grades them against the rubric and spots errors.</p>
            <span className="text-blue-600 font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                Start Grading <ArrowRight size={16} />
            </span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
