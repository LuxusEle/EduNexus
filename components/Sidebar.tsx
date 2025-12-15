import React from 'react';
import { LayoutDashboard, BookOpen, FileQuestion, GraduationCap, BarChart3, X } from 'lucide-react';
import { AppView, UserRole } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen, role }) => {
  const allMenuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: ['TEACHER', 'STUDENT'] },
    { id: AppView.INGESTION, label: 'Ingestion Engine', icon: BookOpen, roles: ['TEACHER'] },
    { id: AppView.ASSESSMENT, label: role === 'TEACHER' ? 'Quiz Generator' : 'Assignments', icon: FileQuestion, roles: ['TEACHER', 'STUDENT'] },
    { id: AppView.GRADING, label: 'Vision Grading', icon: GraduationCap, roles: ['TEACHER'] },
    { id: AppView.ANALYTICS, label: role === 'TEACHER' ? 'Class Analytics' : 'My Progress', icon: BarChart3, roles: ['TEACHER', 'STUDENT'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            EduNexus AI
          </span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Portal</div>
             <div className="bg-slate-800 rounded px-3 py-1 text-sm font-medium text-indigo-300 border border-slate-700">
                {role === 'TEACHER' ? 'Teacher Admin' : 'Student Portal'}
             </div>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id as AppView);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div>
              <p className="text-sm font-medium text-white">System Status</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
