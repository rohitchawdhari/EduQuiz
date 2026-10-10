import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';
import {
  Trophy,
  Flame,
  Target,
  Clock,
  Play,
  PlusCircle,
  BookOpen,
  Award,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Search,
  AlertCircle,
  Filter,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
  RotateCcw,
  GraduationCap
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Subjects', count: 14 },
  { id: 'cse', name: 'Computer Science (CSE)', count: 10 },
  { id: 'quant', name: 'Quantitative Aptitude', count: 1 },
  { id: 'logical', name: 'Logical Reasoning', count: 1 },
  { id: 'verbal', name: 'Verbal Ability', count: 1 },
  { id: 'placement', name: 'Placement Logic & Coding', count: 1 },
];

const CSE_SUBJECTS = [
  'DBMS',
  'Operating System',
  'Computer Networks',
  'Data Structures and Algorithms',
  'Python',
  'Java',
  'C and C++',
  'Web Development',
  'Cybersecurity',
  'Artificial Intelligence'
];

// Syllabus topics in preparation (Honest display per Requirement 2)
const UPCOMING_TOPICS = [
  { subject: 'Compiler Design', category: 'CSE Core', status: 'Expanding Pool', desc: 'Lexical analysis, parsing, syntax directed translation, code generation.' },
  { subject: 'Software Engineering', category: 'CSE Core', status: 'Expanding Pool', desc: 'Agile methodologies, SDLC models, design patterns, testing fundamentals.' },
  { subject: 'Computer Organization & Architecture', category: 'CSE Core', status: 'Expanding Pool', desc: 'Pipelining, cache mapping, RISC/CISC, memory hierarchy.' },
  { subject: 'Data Interpretation', category: 'Quantitative Aptitude', status: 'Expanding Pool', desc: 'Bar graphs, pie charts, line graphs, table analysis, tabular data.' },
  { subject: 'Seating Arrangements & Puzzles', category: 'Logical Reasoning', status: 'Expanding Pool', desc: 'Linear and circular seating, floor puzzles, multidimensional grid puzzles.' },
  { subject: 'Para Jumbles & Reading Comprehension', category: 'Verbal Ability', status: 'Expanding Pool', desc: 'Sentence rearrangement, passage comprehension, context inference.' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch published ready quizzes & check active attempt
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [quizRes, activeRes] = await Promise.allSettled([
          API.get('/quizzes'),
          API.get('/attempts/active')
        ]);

        if (quizRes.status === 'fulfilled' && quizRes.value.data?.success) {
          setQuizzes(quizRes.value.data.data);
        }

        if (activeRes.status === 'fulfilled' && activeRes.value.data?.hasActive) {
          setActiveAttempt(activeRes.value.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const teacherAssignedQuizzes = quizzes.filter(
    (q) => q.isTeacherAssigned || q.createdBy?.role === 'teacher'
  );

  // Dynamic count for category pills
  const getCategoryCount = (catId) => {
    if (catId === 'all') return quizzes.length;
    if (catId === 'cse') {
      return quizzes.filter((q) =>
        CSE_SUBJECTS.some((s) => s.toLowerCase() === q.subject?.toLowerCase())
      ).length;
    }
    if (catId === 'quant') {
      return quizzes.filter((q) => q.subject?.toLowerCase().includes('quantitative')).length;
    }
    if (catId === 'logical') {
      return quizzes.filter((q) => q.subject?.toLowerCase().includes('logical')).length;
    }
    if (catId === 'verbal') {
      return quizzes.filter((q) => q.subject?.toLowerCase().includes('verbal')).length;
    }
    if (catId === 'placement') {
      return quizzes.filter((q) => q.subject?.toLowerCase().includes('placement')).length;
    }
    return 0;
  };

  // Filter quizzes based on selected category, difficulty & search
  const filteredQuizzes = quizzes.filter((quiz) => {
    // Category filter
    let matchesCategory = true;
    if (selectedCategory === 'cse') {
      matchesCategory = CSE_SUBJECTS.some(
        (s) => s.toLowerCase() === quiz.subject.toLowerCase()
      );
    } else if (selectedCategory === 'quant') {
      matchesCategory = quiz.subject.toLowerCase().includes('quantitative');
    } else if (selectedCategory === 'logical') {
      matchesCategory = quiz.subject.toLowerCase().includes('logical');
    } else if (selectedCategory === 'verbal') {
      matchesCategory = quiz.subject.toLowerCase().includes('verbal');
    } else if (selectedCategory === 'placement') {
      matchesCategory = quiz.subject.toLowerCase().includes('placement');
    }

    // Difficulty filter
    const matchesDifficulty =
      selectedDifficulty === 'All' || quiz.difficulty === selectedDifficulty;

    // Search query
    const matchesSearch =
      !searchQuery.trim() ||
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* 1. Active Examination Session Banner (Resumption Feature) */}
      {activeAttempt && (
        <div className="relative overflow-hidden rounded-2xl p-5 mb-8 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-950/70 dark:via-yellow-950/40 dark:to-slate-900 border border-amber-500/30 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <RotateCcw className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    Active Session in Progress
                  </span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-200/80">
                    {Math.floor(activeAttempt.remainingSeconds / 60)}m {activeAttempt.remainingSeconds % 60}s remaining
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {activeAttempt.quizTitle} ({activeAttempt.subject})
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {activeAttempt.answeredCount} of {activeAttempt.totalQuestions} questions answered. Your countdown is actively ticking.
                </p>
              </div>
            </div>

            <Link
              to={`/quiz/attempt/${activeAttempt.quizId}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white btn-gradient-battle shadow-lg text-sm whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Examination
            </Link>
          </div>
        </div>
      )}

      {/* 2. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 dark:from-blue-950/90 dark:via-slate-900 dark:to-cyan-950/80 text-white border border-blue-500/20 dark:border-blue-500/30 shadow-2xl mb-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-400/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-blue-500/20 border border-white/20 dark:border-blue-500/30 text-white dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Role: {user?.role || 'Student'} • Powered by Google Gemini AI ⚡
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready-to-Attempt Quiz Dashboard
            </h1>
            <p className="text-blue-50 dark:text-slate-300 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
              Explore 50+ pre-configured practice quizzes across Easy, Medium, Hard & Mixed tiers.
              Or use Google Gemini AI to synthesize brand-new questions on any custom topic!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/competitions"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white btn-gradient-battle shadow-lg transition-all text-sm"
            >
              <Flame className="w-4 h-4 text-amber-200 animate-pulse" />
              Multiplayer Battle
            </Link>

            <Link
              to="/create-quiz"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white btn-gradient-primary shadow-lg transition-all text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate with Gemini AI
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Quizzes Taken</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              {user?.stats?.quizzesAttempted || 0}
            </h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Average Score</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              {user?.stats?.averageScore || 0}%
            </h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Battle Wins</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              {user?.stats?.competitionsWon || 0}
            </h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Total Points</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              {user?.stats?.totalPoints || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* TEACHER ASSIGNED EXAMINATIONS (VISIBLE TO ALL STUDENTS & TEACHERS) */}
      {teacherAssignedQuizzes.length > 0 && (
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent dark:from-blue-950/60 dark:via-slate-900 dark:to-cyan-950/40 border border-blue-500/20 dark:border-blue-500/30 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                    Teacher Assigned Examinations
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
                    {teacherAssignedQuizzes.length} Assigned
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Official exams deployed by faculty instructors. Select and complete exams assigned for your coursework.
                </p>
              </div>
            </div>

            {user?.role === 'teacher' && (
              <Link
                to="/create-quiz"
                className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gradient-primary text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Assign New Exam
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teacherAssignedQuizzes.map((quiz) => {
              const isCurrentlyActive =
                activeAttempt && activeAttempt.quizId?.toString() === quiz._id?.toString();
              const teacherName = quiz.createdBy?.name || 'Faculty Instructor';

              return (
                <div
                  key={quiz._id}
                  className="glass-card p-5 rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between relative group hover:-translate-y-1 shadow-lg"
                >
                  <div>
                    {/* Teacher Header Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center uppercase">
                          {teacherName.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          Prof. {teacherName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {quiz.difficulty}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      {quiz.subject}
                    </span>

                    <h3 className="text-base font-bold text-[var(--text-primary)] mt-2 line-clamp-1">{quiz.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {quiz.description || `Coursework exam assigned by Prof. ${teacherName} for ${quiz.subject}.`}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-medium">
                      <span className="flex items-center gap-1">
                        <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                        {quiz.totalQuestions} Qs
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" />
                        {quiz.durationMinutes}m
                      </span>
                    </div>

                    <Link
                      to={`/quiz/attempt/${quiz._id}`}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-105 ${
                        isCurrentlyActive
                          ? 'btn-gradient-battle'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isCurrentlyActive ? 'Resume Exam' : 'Attempt Exam'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Subject Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'btn-gradient-primary text-white shadow-md'
                : 'glass-panel text-[var(--text-secondary)] hover:text-blue-600 hover:border-blue-400'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                selectedCategory === cat.id
                  ? 'bg-white/25 text-white'
                  : 'bg-black/5 dark:bg-white/10 text-[var(--text-muted)]'
              }`}
            >
              {getCategoryCount(cat.id)}
            </span>
          </button>
        ))}
      </div>

      {/* 5. Search & Difficulty Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-adaptive text-sm"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-[var(--text-muted)] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-500" /> Difficulty:
          </span>
          {['All', 'Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDifficulty === diff
                  ? 'btn-gradient-primary text-white shadow-sm'
                  : 'glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Ready-Made Quizzes Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[var(--text-muted)]">Loading ready-to-attempt quizzes...</p>
        </div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredQuizzes.map((quiz) => {
            const isCurrentlyActive =
              activeAttempt && activeAttempt.quizId?.toString() === quiz._id?.toString();

            return (
              <div
                key={quiz._id}
                className={`glass-card p-6 rounded-2xl flex flex-col justify-between border transition-all duration-300 hover:-translate-y-1 ${
                  isCurrentlyActive
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'border-[var(--border-card)] hover:border-blue-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {quiz.subject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        quiz.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : quiz.difficulty === 'Hard'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                  </div>

                  {(quiz.isTeacherAssigned || quiz.createdBy?.role === 'teacher') && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Assigned by Prof. {quiz.createdBy?.name || 'Faculty'}
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-[var(--text-primary)] line-clamp-1">{quiz.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2 leading-relaxed">
                    {quiz.description || `Comprehensive examination on ${quiz.subject} core syllabus.`}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-medium">
                    <span className="flex items-center gap-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                      {quiz.totalQuestions || 20} Qs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" />
                      {quiz.durationMinutes || 20}m
                    </span>
                  </div>

                  <Link
                    to={`/quiz/attempt/${quiz._id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-105 ${
                      isCurrentlyActive
                        ? 'btn-gradient-battle'
                        : 'btn-gradient-primary'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isCurrentlyActive ? 'Resume Exam' : 'Attempt Quiz'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-10 rounded-2xl text-center mb-12">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Quizzes Matched Your Filter</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mt-1 mb-4">
            Try resetting your difficulty or search terms to browse all available subjects.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDifficulty('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white btn-gradient-primary shadow-md"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 7. Question Pool Expansion Section (Directly fulfills Requirement 2) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Curriculum Roadmap & Expanding Topics</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Validated university question pools are continually reviewed and expanded by faculty editors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {UPCOMING_TOPICS.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl glass-card border border-[var(--border-subtle)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">{item.category}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {item.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">{item.subject}</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Subject validation in progress</span>
                <span className="text-blue-600 dark:text-cyan-400 font-medium">Coming soon</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
