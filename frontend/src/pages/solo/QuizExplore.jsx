import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  BrainCircuit, 
  Clock, 
  Play, 
  Filter, 
  Sparkles,
  BookOpen,
  GraduationCap 
} from 'lucide-react';

const subjects = [
  'All',
  'DBMS',
  'Operating System',
  'Computer Networks',
  'Data Structures and Algorithms',
  'Python',
  'Java',
  'C and C++',
  'Web Development',
  'Cybersecurity',
  'Artificial Intelligence',
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Placement Programming Logic'
];
const difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Mixed'];

const QuizExplore = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSubject !== 'All') params.subject = selectedSubject;
      if (selectedDifficulty !== 'All') params.difficulty = selectedDifficulty;
      if (search) params.search = search;

      const res = await API.get('/quizzes', { params });
      setQuizzes(res.data.data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [selectedSubject, selectedDifficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Explore Quizzes</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Browse public examination sets, mock tests, and subject drills
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quiz by title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl input-adaptive text-sm"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="flex items-center gap-1.5 mr-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <Filter className="w-3.5 h-3.5 text-blue-500" /> Subject:
        </div>
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedSubject === sub
                ? 'btn-gradient-primary text-white shadow-sm'
                : 'glass-panel border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {sub}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Difficulty:
        </div>
        {difficulties.map((diff) => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedDifficulty === diff
                ? 'btn-gradient-primary text-white shadow-sm'
                : 'glass-panel border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {diff}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-[var(--border-card)]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
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
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {quiz.description || `Assessment containing ${quiz.totalQuestions} questions.`}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
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

                {user?.role !== 'teacher' ? (
                  <Link
                    to={`/quiz/attempt/${quiz._id}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white btn-gradient-primary shadow-sm transition-all hover:scale-105"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Attempt
                  </Link>
                ) : (
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    Curriculum
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center border border-[var(--border-subtle)]">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Quizzes Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-6">
            Try adjusting your search criteria or create a new quiz right now.
          </p>
          <Link
            to="/create-quiz"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white btn-gradient-primary transition-colors text-sm"
          >
            Create Custom Quiz
          </Link>
        </div>
      )}

    </div>
  );
};

export default QuizExplore;
