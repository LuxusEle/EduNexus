import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Ingestion from './components/Ingestion';
import QuizGen from './components/QuizGen';
import Grading from './components/Grading';
import Analytics from './components/Analytics';
import { AppView, UserRole } from './types';
import { Menu, Users, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState<UserRole>('TEACHER'); 
  const [quizPlanId, setQuizPlanId] = useState<string | undefined>(undefined);

  const handleNavigateToQuiz = (planId: string) => {
    setQuizPlanId(planId);
    setCurrentView(AppView.ASSESSMENTS);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onChangeView={setCurrentView} role={role} />;
      
      // Teacher Views
      case AppView.MATERIAL_FACTORY:
        return role === 'TEACHER' ? <Ingestion /> : <div className="p-8">Access Denied</div>;
      case AppView.GRADING_QUEUE:
        return role === 'TEACHER' ? <Grading /> : <div className="p-8">Access Denied</div>;
      
      // Shared Views (Different Modes)
      case AppView.ASSESSMENTS:
        return <QuizGen initialPlanId={quizPlanId} role={role} />;
      case AppView.ANALYTICS:
        return <Analytics />;
      
      default:
        return <Dashboard onChangeView={setCurrentView} role={role} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        role={role}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-4 lg:hidden">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
                    <Menu size={24} />
                </button>
                <span className="text-lg font-bold text-indigo-600">EduNexus</span>
            </div>
            
            <div className="hidden lg:block"></div> 

            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => { setRole('TEACHER'); setCurrentView(AppView.DASHBOARD); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${role === 'TEACHER' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <GraduationCap size={16} /> Teacher
                </button>
                <button 
                    onClick={() => { setRole('STUDENT'); setCurrentView(AppView.DASHBOARD); }}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${role === 'STUDENT' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={16} /> Student
                </button>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
