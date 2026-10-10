import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  BrainCircuit, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

const AnalyticsPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await API.get('/attempts/my-attempts');
        setAttempts(res.data.data);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate Metrics
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
  const avgPercentage =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalAttempts)
      : 0;

  // Score Trends Chart Data (Chronological)
  const scoreTrendData = [...attempts]
    .reverse()
    .map((a, idx) => ({
      attempt: `Test #${idx + 1}`,
      score: a.percentage,
      title: a.quizTitle,
    }));

  // Subject Performance Grouping
  const subjectMap = {};
  attempts.forEach((a) => {
    const sub = a.subject || 'General';
    if (!subjectMap[sub]) {
      subjectMap[sub] = { total: 0, sumPercent: 0, passed: 0 };
    }
    subjectMap[sub].total += 1;
    subjectMap[sub].sumPercent += a.percentage || 0;
    if (a.passed) subjectMap[sub].passed += 1;
  });

  const subjectChartData = Object.keys(subjectMap).map((sub) => ({
    subject: sub,
    avgScore: Math.round(subjectMap[sub].sumPercent / subjectMap[sub].total),
    attempts: subjectMap[sub].total,
  }));

  // Strong vs Weak subjects
  const sortedSubjects = [...subjectChartData].sort((a, b) => b.avgScore - a.avgScore);
  const strongSubject = sortedSubjects.length > 0 ? sortedSubjects[0] : null;
  const weakSubject = sortedSubjects.length > 1 ? sortedSubjects[sortedSubjects.length - 1] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <TrendingUp className="w-4 h-4" />
          Performance Intelligence
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Performance Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">
          Detailed metrics, score progression, subject strengths, and examination mastery
        </p>
      </div>

      {totalAttempts > 0 ? (
        <>
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            <div className="glass-card p-5 rounded-2xl">
              <span className="text-xs text-gray-400 font-semibold uppercase">Total Attempts</span>
              <h3 className="text-2xl font-bold text-white mt-1">{totalAttempts}</h3>
              <p className="text-[11px] text-indigo-400 mt-1">Exams Completed</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-xs text-gray-400 font-semibold uppercase">Average Score</span>
              <h3 className="text-2xl font-bold text-white mt-1">{avgPercentage}%</h3>
              <p className="text-[11px] text-purple-400 mt-1">Across All Subjects</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-xs text-gray-400 font-semibold uppercase">Pass Rate</span>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{passRate}%</h3>
              <p className="text-[11px] text-gray-400 mt-1">{passedAttempts} Passed / {totalAttempts}</p>
            </div>

            <div className="glass-card p-5 rounded-2xl">
              <span className="text-xs text-gray-400 font-semibold uppercase">Top Stronghold</span>
              <h3 className="text-2xl font-bold text-amber-300 mt-1 line-clamp-1">
                {strongSubject?.subject || 'N/A'}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">{strongSubject ? `${strongSubject.avgScore}% Avg Score` : 'Complete more tests'}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            
            {/* Chart 1: Score Trends Over Time */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Score Progression Trend (%)
              </h3>
              <p className="text-xs text-gray-400 mb-6">Exam percentage scores across chronological attempts</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="attempt" stroke="#6b7280" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score %"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#818cf8' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Subject-wise Performance */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                Subject Mastery Distribution (%)
              </h3>
              <p className="text-xs text-gray-400 mb-6">Average percentage score calculated per subject</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="subject" stroke="#6b7280" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="avgScore"
                      name="Avg %"
                      fill="#a855f7"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Strategic Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <CheckCircle2 className="w-5 h-5" />
                Strong Subject Focus
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                You have demonstrated outstanding performance in <strong className="text-white">{strongSubject?.subject}</strong> with an average score of <strong className="text-emerald-300">{strongSubject?.avgScore}%</strong>. Keep taking advanced mock tests to maintain your competitive edge.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                <AlertTriangle className="w-5 h-5" />
                Target for Improvement
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {weakSubject ? (
                  <>
                    Focus on reviewing foundational concepts in <strong className="text-white">{weakSubject?.subject}</strong> (currently at <strong className="text-amber-300">{weakSubject?.avgScore}%</strong>). Practice targeted quizzes in this subject to boost overall ranking.
                  </>
                ) : (
                  <>
                    Complete examinations across multiple subjects to receive personalized strength and weakness recommendations.
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center">
          <BrainCircuit className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">No Analytics Recorded Yet</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mt-2 mb-6">
            Attempt your first quiz to generate deep performance insights, trends, and subject distribution charts.
          </p>
        </div>
      )}

    </div>
  );
};

export default AnalyticsPage;
