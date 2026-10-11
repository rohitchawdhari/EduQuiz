import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Trophy, 
  Flame, 
  PlusCircle, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  LogOut, 
  Compass, 
  Sparkles,
  LayoutDashboard,
  Sun,
  Moon,
  Zap,
  Rocket
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-navbar)] backdrop-blur-xl border-b border-[var(--border-subtle)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo with Unique EduQuiz Sapphire & Amber Palette */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white transform -rotate-12 group-hover:rotate-0 transition-transform" />
          </div>
          <div className="flex items-center text-lg sm:text-xl font-extrabold tracking-tight">
            <span className="text-[var(--text-primary)]">Edu</span>
            <span className="text-gradient-eduquiz font-black">Quiz</span>
          </div>
        </Link>

        {/* Navigation Links (Visible when logged in, or minimal when guest) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/dashboard') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isActive('/admin') 
                    ? 'bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/50' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Admin Panel
              </Link>
            )}

            <Link
              to="/explore"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/explore') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Explore
            </Link>

            <Link
              to="/competitions"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                isActive('/competitions') 
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Live Battle
              <span className="flex h-2 w-2 relative -ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </Link>

            <Link
              to="/create-quiz"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/create-quiz') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              {user?.role === 'student' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Practice Lab
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                  Create Exam
                </>
              )}
            </Link>

            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <Link
                to="/banks"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/banks') 
                    ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Question Banks
              </Link>
            )}

            <Link
              to="/my-attempts"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/my-attempts') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              History
            </Link>

            <Link
              to="/analytics"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/analytics') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              Analytics
            </Link>

            <Link
              to="/leaderboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/leaderboard') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Leaderboard
            </Link>

            <Link
              to="/certificates"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/certificates') 
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              Certificates
            </Link>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/explore" className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Explore Quizzes
            </Link>
            <Link to="/competitions" className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Live Arena
            </Link>
          </div>
        )}

        {/* User Profile / Auth Actions & Theme Switcher */}
        <div className="flex items-center gap-2.5">
          
          {/* DARK / LIGHT MODE TOGGLE BUTTON */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/40 shadow-sm transition-all cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme Mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/profile"
                title="View Profile & Settings"
                className="flex items-center gap-2.5 bg-[var(--bg-card)] hover:border-blue-500/40 border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 transition-colors shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-blue-500 font-bold capitalize">
                    {user.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 text-[var(--text-muted)] hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 transition-colors"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="btn-gradient-primary px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
