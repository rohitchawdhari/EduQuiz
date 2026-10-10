import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Award, 
  History, 
  BrainCircuit, 
  Sparkles 
} from 'lucide-react';

const AttemptsHistoryPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await API.get('/attempts/my-attempts');
        setAttempts(res.data.data);
      } catch (err) {
        console.error('Failed to load attempt history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <History className="w-4 h-4" />
          Examination Records
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Attempts History</h1>
        <p className="text-sm text-gray-400 mt-1">
          Review all your completed examinations, scorecard breakdowns, and detailed answer keys
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : attempts.length > 0 ? (
        <div className="space-y-4">
          {attempts.map((att) => {
            const minutes = Math.floor((att.timeTakenSeconds || 0) / 60);
            const seconds = (att.timeTakenSeconds || 0) % 60;

            return (
              <div
                key={att._id}
                className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      att.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {att.passed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {att.subject}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          att.passed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">{att.quizTitle}</h3>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 font-mono">
                      <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {minutes}m {seconds}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-left sm:text-right">
                    <span className="text-lg font-black text-white font-mono">
                      {att.score} <span className="text-xs text-gray-400 font-normal">/ {att.maxScore}</span>
                    </span>
                    <p className={`text-xs font-bold ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {att.percentage}% Score
                    </p>
                  </div>

                  <Link
                    to={`/quiz/result/${att._id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
                  >
                    View Result
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">No Attempt History Found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mt-2 mb-6">
            You haven't completed any quizzes yet. Explore our subject quizzes and test your skills today.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-xs shadow-md transition-all"
          >
            Explore Quizzes
          </Link>
        </div>
      )}

    </div>
  );
};

export default AttemptsHistoryPage;
