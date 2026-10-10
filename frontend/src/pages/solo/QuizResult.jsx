import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  RotateCcw, 
  Sparkles,
  HelpCircle 
} from 'lucide-react';

const QuizResult = () => {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await API.get(`/attempts/${attemptId}/result`);
        setData(res.data.data);

        // Confetti celebration if passed!
        if (res.data.data.attempt.passed) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        setError('Failed to load attempt result.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-2xl text-center">
        <h3 className="text-lg font-bold text-white">Result Not Found</h3>
        <p className="text-sm text-gray-400 mt-2 mb-6">{error || 'Could not find attempt details.'}</p>
        <Link to="/explore" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
          Browse Quizzes
        </Link>
      </div>
    );
  }

  const { attempt, reviews } = data;
  const minutes = Math.floor(attempt.timeTakenSeconds / 60);
  const seconds = attempt.timeTakenSeconds % 60;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Scorecard Hero Banner */}
      <div className={`p-8 sm:p-10 rounded-3xl border shadow-2xl relative overflow-hidden mb-10 text-center ${
        attempt.passed
          ? 'bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 dark:from-emerald-950/40 dark:to-slate-900 border-emerald-500/30'
          : 'bg-gradient-to-b from-rose-500/15 to-rose-500/5 dark:from-rose-950/40 dark:to-slate-900 border-rose-500/30'
      }`}>
        <div className="relative z-10 flex flex-col items-center">
          
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl ${
            attempt.passed
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}>
            <Trophy className="w-8 h-8" />
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
            attempt.passed
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
          }`}>
            Status: {attempt.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
          </span>

          <h1 className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            {attempt.score} <span className="text-2xl text-[var(--text-muted)] font-normal">/ {attempt.maxScore}</span>
          </h1>

          <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
            {attempt.percentage}% Overall Score
          </p>

          <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md">
            Exam: <strong className="text-[var(--text-primary)]">{attempt.quizTitle}</strong> ({attempt.subject})
          </p>

          {/* Certificate Badge & Link */}
          {attempt.certificateId && (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/certificates"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white btn-gradient-battle shadow-lg transition-all hover:scale-105"
              >
                <Award className="w-4 h-4" />
                Claim Certificate ({attempt.certificateId})
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Correct</p>
            <h4 className="text-xl font-bold text-[var(--text-primary)]">{attempt.correctCount}</h4>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Wrong</p>
            <h4 className="text-xl font-bold text-[var(--text-primary)]">{attempt.wrongCount}</h4>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center">
            <MinusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Skipped</p>
            <h4 className="text-xl font-bold text-[var(--text-primary)]">{attempt.skippedCount}</h4>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Time Taken</p>
            <h4 className="text-xl font-bold text-[var(--text-primary)] font-mono">
              {minutes}m {seconds}s
            </h4>
          </div>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Detailed Question Analysis</h2>
        
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.questionNumber}
              className={`glass-panel p-6 rounded-2xl border transition-all ${
                rev.isCorrect
                  ? 'border-emerald-500/30'
                  : rev.selectedOption === 'Not Answered'
                  ? 'border-[var(--border-subtle)]'
                  : 'border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  Question {rev.questionNumber} • {rev.topic}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                  rev.isCorrect
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}>
                  {rev.isCorrect ? `+${rev.marksAwarded} Marks` : '0 Marks'}
                </span>
              </div>

              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                {rev.questionText}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                <div className="p-3 rounded-xl glass-card border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block mb-1">Your Selection:</span>
                  <span className={`font-semibold ${rev.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {rev.selectedOption}
                  </span>
                </div>

                <div className="p-3 rounded-xl glass-card border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block mb-1">Correct Answer:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {rev.correctOption}
                  </span>
                </div>
              </div>

              {rev.explanation && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--text-secondary)]">
                  <strong className="text-blue-600 dark:text-cyan-400 block mb-0.5">Explanation:</strong>
                  {rev.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-[var(--border-subtle)]">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-xs transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Dashboard
        </Link>

        <Link
          to="/explore"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl btn-gradient-primary text-white font-bold text-xs shadow-md transition-all hover:scale-105"
        >
          Explore More Quizzes
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};

export default QuizResult;
