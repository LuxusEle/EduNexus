import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine } from 'recharts';
import { TrendingUp, AlertOctagon, Clock, RefreshCw } from 'lucide-react';
import { dataStore } from '../utils/dataStore';
import { QuizResult } from '../types';

const Analytics: React.FC = () => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [zScoreData, setZScoreData] = useState<any[]>([]);
  const [reviseTopics, setReviseTopics] = useState<string[]>([]);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    const data = dataStore.getResults();
    setResults(data);

    if (data.length > 0) {
      // Calculate Average Score
      const total = data.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0);
      setAvgScore(Math.round(total / data.length));

      // Prepare Z-Score Chart Data
      // We map the last 5 results to show trend
      const chartData = data.slice(-5).map(r => ({
        name: r.quizTitle.substring(0, 15) + '...',
        zScore: parseFloat(dataStore.getStudentZScore(r).toFixed(2)),
        score: Math.round((r.score / r.maxScore) * 100)
      }));
      setZScoreData(chartData);

      // Get Revision Topics
      setReviseTopics(dataStore.getTopicsToRevise());
    }
  }, []);

  const skillData = [
    { subject: 'Recall', A: 120, fullMark: 150 },
    { subject: 'Application', A: 98, fullMark: 150 },
    { subject: 'Analysis', A: 86, fullMark: 150 },
    { subject: 'Evaluation', A: 99, fullMark: 150 },
    { subject: 'Creation', A: 85, fullMark: 150 },
  ];

  if (results.length === 0) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <TrendingUp size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-600">No Analytics Available Yet</h2>
        <p>Complete some quizzes in the Assessment tab to generate data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Analytics: Demo User</h2>
          <p className="text-slate-500 mt-1">Real-time performance metrics derived from quiz submissions.</p>
        </div>
        <div className="text-right">
            <p className="text-sm text-slate-500">Average Grade</p>
            <p className="text-3xl font-bold text-indigo-600">{avgScore}%</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">Assessments Taken</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{results.length}</h3>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp size={12} /> Active Learner
                </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Clock size={20} />
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
             <div>
                <p className="text-sm font-medium text-slate-500">Weakest Topic</p>
                <h3 className="text-lg font-bold text-slate-900 mt-1 truncate max-w-[150px]">{reviseTopics[0] || "None"}</h3>
                <p className="text-xs text-red-500 mt-2">Requires immediate attention</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <AlertOctagon size={20} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
             <div>
                <p className="text-sm font-medium text-slate-500">Z-Score Trend</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{zScoreData[zScoreData.length-1]?.zScore || 0}</h3>
                <p className="text-xs text-slate-400 mt-2">Std. Deviations from Mean</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <TrendingUp size={20} />
            </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Performance Z-Score</h3>
            <p className="text-xs text-slate-500 mb-6">Comparison against class average (0 line = Average)</p>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zScoreData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis />
                        <Tooltip />
                        <ReferenceLine y={0} stroke="#000" />
                        <Bar dataKey="zScore" fill="#4f46e5" name="Z-Score" radius={[4, 4, 0, 0]}>
                          {zScoreData.map((entry, index) => (
                             <cell key={`cell-${index}`} fill={entry.zScore >= 0 ? '#4f46e5' : '#ef4444'} />
                          ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Cognitive Skill Breakdown</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis />
                        <Radar name="Student" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <RefreshCw size={20} /> 
            AI Recommended Revision Plan
        </h3>
        {reviseTopics.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
                {reviseTopics.map((topic, i) => (
                    <div key={i} className="bg-indigo-800/50 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-indigo-200 text-sm mb-1">Priority {i + 1}: {topic}</h4>
                            <p className="text-sm text-indigo-100">Consistent errors detected in this topic.</p>
                        </div>
                        <button className="px-4 py-2 bg-white text-indigo-900 text-xs font-bold rounded hover:bg-indigo-50 transition-colors">
                            Generate Practice Quiz
                        </button>
                    </div>
                ))}
            </div>
        ) : (
            <div className="p-4 bg-indigo-800/30 rounded-lg text-indigo-200 text-sm">
                Great job! No significant weak areas detected based on your current results.
            </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
