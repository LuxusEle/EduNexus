
import React, { useEffect, useState } from 'react';
import { AppView, UserRole, StudentPoke, ParentInsight } from '../types';
import { ArrowRight, BookOpen, GraduationCap, Users, Layout, Zap, Bell, MessageCircle, AlertTriangle, TrendingUp, CheckCircle, Hand, Send, X } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView, role }) => {
  const [pokes, setPokes] = useState<StudentPoke[]>([]);
  const [parentData, setParentData] = useState<ParentInsight | null>(null);
  
  // Student State
  const [studentClasses, setStudentClasses] = useState<{id: string, name: string}[]>([]);
  const [isPoking, setIsPoking] = useState(false);
  const [pokeSubject, setPokeSubject] = useState("");
  const [pokeMessage, setPokeMessage] = useState("");

  useEffect(() => {
      if (role === 'TEACHER') {
          loadPokes();
      }
      if (role === 'PARENT') {
          loadParentData();
      }
      if (role === 'STUDENT') {
          loadStudentClasses();
      }
  }, [role]);

  const loadPokes = async () => {
      const data = await firestoreService.getPokesForTeacher();
      setPokes(data);
  };

  const loadParentData = async () => {
      const data = await firestoreService.getParentInsights('STD_DEMO');
      setParentData(data);
  };

  const loadStudentClasses = async () => {
      const classes = await firestoreService.getStudentClasses('STD_DEMO');
      setStudentClasses(classes);
      if(classes.length > 0) setPokeSubject(classes[0].name);
  };

  const submitPoke = async () => {
      if (!pokeMessage) return;
      await firestoreService.sendStudentPoke({
          id: Date.now().toString(),
          studentId: 'STD_DEMO',
          topic: pokeSubject, // Use subject name as topic for clustering
          message: pokeMessage,
          timestamp: new Date().toISOString(),
          status: 'PENDING'
      });
      setIsPoking(false);
      setPokeMessage("");
      alert("Teacher alerted! They will see this in their cluster view.");
  };
  
  const TeacherDashboard = () => {
    // Smart Clustering Logic
    const clusters: Record<string, number> = {};
    pokes.forEach(p => {
        // Simple grouping by topic/subject
        clusters[p.topic] = (clusters[p.topic] || 0) + 1;
    });

    return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Teacher Command Center</h1>
        <p className="text-slate-600">Overview of 1,200 Active Students</p>
      </div>
      
      {/* Smart Alerts / Clustering */}
      {pokes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} /> Smart Issue Clusters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(clusters).map(([topic, count]) => (
                      <div key={topic} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex justify-between items-center">
                          <div>
                              <div className="font-bold text-slate-800">{topic}</div>
                              <div className="text-xs text-slate-500">Student Inquiries</div>
                          </div>
                          <div className="text-2xl font-bold text-amber-600">{count}</div>
                      </div>
                  ))}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex justify-between items-center opacity-75">
                      <div>
                          <div className="font-bold text-slate-800">Newton's Laws</div>
                          <div className="text-xs text-slate-500">Topic Area</div>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">12</div>
                  </div>
              </div>
              <p className="text-xs text-amber-800 mt-4">Tip: Consider creating a supplementary video for high-volume topics.</p>
          </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Pending Marking</div>
           <div className="text-3xl font-bold text-indigo-600 mt-1">142</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Avg Mastery</div>
           <div className="text-3xl font-bold text-green-600 mt-1">78%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Time Saved (AI)</div>
           <div className="text-3xl font-bold text-purple-600 mt-1">12.5h</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-slate-500 text-xs font-bold uppercase">Student Pokes</div>
           <div className="text-3xl font-bold text-slate-900 mt-1">{pokes.length}</div>
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
  )};

  const StudentDashboard = () => (
    <div className="max-w-4xl mx-auto space-y-8 py-10 relative">
      {/* Poke Modal */}
      {isPoking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Hand size={20} className="text-indigo-600" /> Ask Teacher
                      </h3>
                      <button onClick={() => setIsPoking(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Select Class/Subject</label>
                          <select 
                             value={pokeSubject} 
                             onChange={e => setPokeSubject(e.target.value)}
                             className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                          >
                             {studentClasses.map(c => (
                                 <option key={c.id} value={c.name}>{c.name}</option>
                             ))}
                             {studentClasses.length === 0 && <option value="General">General</option>}
                          </select>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Your Question</label>
                          <textarea 
                              value={pokeMessage}
                              onChange={e => setPokeMessage(e.target.value)}
                              placeholder="I'm stuck on..."
                              className="w-full p-3 border border-slate-300 rounded-lg text-sm h-32 focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      
                      <button 
                          onClick={submitPoke}
                          disabled={!pokeMessage}
                          className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                          <Send size={16} /> Send Poke
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <div className="text-indigo-200 font-bold uppercase text-xs tracking-wider mb-2">Today's Focus</div>
            <h1 className="text-3xl font-bold mb-4">Good Morning, Alex</h1>
            <p className="text-indigo-100 max-w-lg mb-6">You have a quiz due tomorrow and a recommended practice set for "Thermodynamics".</p>
            <div className="flex gap-4">
                <button onClick={() => onChangeView(AppView.ASSESSMENTS)} className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
                Start Daily Practice
                </button>
                <button onClick={() => setIsPoking(true)} className="bg-indigo-700 text-white border border-indigo-500 px-6 py-2 rounded-lg font-bold hover:bg-indigo-800 transition-colors flex items-center gap-2">
                   <Hand size={18} /> Poke Teacher
                </button>
            </div>
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
           <div className="flex justify-between items-center">
             <p className="text-sm text-slate-500">Due in 2 days • 15 mins</p>
             <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
           </div>
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
      
      {/* Clickable Topics Widget */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4">Current Topics</h3>
           <div className="space-y-2">
               {['Thermodynamics', 'Organic Chemistry', 'Calculus III'].map(topic => (
                   <div key={topic} className="p-3 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer flex justify-between items-center group">
                       <span className="font-medium text-slate-700">{topic}</span>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setIsPoking(true); setPokeSubject(topic); }} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded text-slate-600 hover:text-indigo-600">Poke Teacher</button>
                           <ArrowRight size={16} className="text-slate-400" />
                       </div>
                   </div>
               ))}
           </div>
      </div>
    </div>
  );

  const ParentDashboard = () => (
      <div className="max-w-5xl mx-auto space-y-8 py-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900">Alex's Progress Report</h1>
                      <p className="text-slate-500">Live insights approved by Class Teacher.</p>
                  </div>
                  <div className="text-right">
                      <div className="text-sm font-bold text-slate-400 uppercase">Predicted Final Grade</div>
                      <div className="text-4xl font-bold text-indigo-600">{parentData?.predictedGrade || '--'}</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Weak Areas */}
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                      <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                          <AlertTriangle size={18} /> Areas for Improvement
                      </h3>
                      {parentData?.weakAreas.map(area => (
                          <div key={area} className="mb-2 flex items-center gap-2 text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                              {area}
                          </div>
                      ))}
                      <div className="mt-4 pt-4 border-t border-red-200">
                           <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Suggested Support</h4>
                           {parentData?.suggestedResources.map((res, i) => (
                               <div key={i} className="text-sm text-red-600 underline cursor-pointer mb-1">{res}</div>
                           ))}
                      </div>
                  </div>

                  {/* Teacher Approval Status */}
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                      <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                          <CheckCircle size={18} /> Teacher Validation
                      </h3>
                      <p className="text-green-700 mb-4">
                          These insights have been reviewed and approved by the class teacher. The AI assessment aligns with recent coursework performance.
                      </p>
                      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-green-200">
                          <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                          <div>
                              <div className="text-sm font-bold text-slate-900">Mr. Anderson</div>
                              <div className="text-xs text-slate-500">Approved {new Date().toLocaleDateString()}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  if (role === 'PARENT') return <ParentDashboard />;
  return role === 'TEACHER' ? <TeacherDashboard /> : <StudentDashboard />;
};

export default Dashboard;
