import React from 'react';
import { AppView, UserRole } from '../types';
import { ArrowRight, BookOpen, GraduationCap, Users, Layout, Zap } from 'lucide-react';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView, role }) => {
  
  const TeacherDashboard = () => (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Teacher Command Center</h1>
        <p className="text-slate-600">Overview of your class performance and pending actions.</p>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Pending Reviews</div>
           <div className="text-3xl font-bold text-amber-600 mt-1">3</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Active Students</div>
           <div className="text-3xl font-bold text-slate-900 mt-1">24</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Avg Mastery</div>
           <div className="text-3xl font-bold text-green-600 mt-1">78%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Time Saved</div>
           <div className="text-3xl font-bold text-indigo-600 mt-1">4.5h</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div 
            onClick={() => onChangeView(AppView.MATERIAL_FACTORY)}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <Layout size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Material Factory</h3>
            <p className="text-slate-500 mb-6">Create source notebooks and generate lesson packs with AI.</p>
            <span className="text-indigo-600 font-medium flex items-center gap-2">Manage <ArrowRight size={16} /></span>
        </div>

        <div 
            onClick={() => onChangeView(AppView.GRADING_QUEUE)}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Marking Factory</h3>
            <p className="text-slate-500 mb-6">Process assessments with confidence gating and review queue.</p>
            <span className="text-blue-600 font-medium flex items-center gap-2">Review <ArrowRight size={16} /></span>
        </div>

        <div 
            onClick={() => onChangeView(AppView.ANALYTICS)}
            className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Mastery Map</h3>
            <p className="text-slate-500 mb-6">View micro-skill mastery levels across your class.</p>
            <span className="text-purple-600 font-medium flex items-center gap-2">Analyze <ArrowRight size={16} /></span>
        </div>
      </div>
    </div>
  );

  const StudentDashboard = () => (
    <div className="max-w-4xl mx-auto space-y-8 py-10">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <div className="text-indigo-200 font-bold uppercase text-xs tracking-wider mb-2">Today's Focus</div>
            <h1 className="text-3xl font-bold mb-4">Good Morning, Alex</h1>
            <p className="text-indigo-100 max-w-lg mb-6">You have a quiz due tomorrow and a recommended practice set for "Thermodynamics".</p>
            <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
              Start Daily Practice
            </button>
         </div>
         <div className="absolute right-0 bottom-0 opacity-10">
            <Zap size={200} />
         </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900">Your Learning Path</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
            onClick={() => onChangeView(AppView.ASSESSMENTS)}
            className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-500 cursor-pointer transition-colors"
        >
           <div className="flex justify-between mb-4">
             <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Assignments</span>
             <ArrowRight size={16} className="text-slate-400" />
           </div>
           <h4 className="font-bold text-lg mb-1">Newton's Laws Quiz</h4>
           <p className="text-sm text-slate-500">Due in 2 days • 15 mins</p>
        </div>

        <div 
            onClick={() => onChangeView(AppView.ANALYTICS)}
            className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-500 cursor-pointer transition-colors"
        >
           <div className="flex justify-between mb-4">
             <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Progress</span>
             <ArrowRight size={16} className="text-slate-400" />
           </div>
           <h4 className="font-bold text-lg mb-1">Mastery Report</h4>
           <p className="text-sm text-slate-500">Physics: 78% • Chemistry: 82%</p>
        </div>
      </div>
    </div>
  );

  return role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard;
