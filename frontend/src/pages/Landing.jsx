import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  BrainCircuit, 
  ShieldCheck, 
  Award, 
  Zap, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32">
        
        {/* Soft Radial Ambient Glow in Unique EduQuiz Sapphire & Amber Tones */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] blur-[140px] pointer-events-none transition-opacity duration-300 ${
          isDark
            ? 'bg-gradient-to-b from-blue-600/20 via-cyan-600/10 to-amber-500/10'
            : 'bg-gradient-to-b from-blue-400/25 via-cyan-300/15 to-amber-300/15'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Unique EduQuiz Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full badge-eduquiz mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
            <span className="font-semibold text-xs tracking-wide">
              Powered by Google Gemini 2.5 Flash & Live Socket.IO
            </span>
          </div>

          {/* Unique EduQuiz Headline: Crisp Solid Text + Electric Sapphire to Sunburst Amber Gradient */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.03em] max-w-5xl mx-auto leading-[1.08]">
            <span className="text-[var(--text-primary)]">Master Every Subject with </span>
            <br className="hidden sm:inline" />
            <span className="text-gradient-eduquiz">
              Smart Quizzes & Live Battles
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed font-normal">
            Synthesize practice exams on-demand with Google Gemini AI, join live synchronized multiplayer battles, and earn official verified certificates.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="btn-gradient-primary flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white text-sm shadow-xl hover:scale-105 transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <Link
              to="/competitions"
              className="btn-gradient-battle flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm shadow-xl hover:scale-105 transition-all"
            >
              <Flame className="w-4 h-4 text-amber-100 fill-amber-100 animate-pulse" />
              Live Battle Arena
            </Link>

            <Link
              to="/explore"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold glass-card text-xs sm:text-sm hover:border-blue-500/50 transition-all"
            >
              Explore Quizzes
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-500">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">2-Source Question Engine</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Synthesize unlimited on-demand questions with Google Gemini 2.5 Flash or upload custom faculty question banks.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Multiplayer Live Battles</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Host custom rooms with codes like <strong className="text-amber-500 font-mono">DBMS-7K29</strong> and compete with synchronized countdowns.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Anti-Cheating Guard</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Built-in tab-switch monitoring, randomized options, server-side timer validation, and automatic submission.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Verified Certificates</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Achieve passing scores to unlock official downloadable and verifiable digital achievement credentials.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] py-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] transition-colors duration-300">
        <p>© 2026 EduQuiz Platform. Dual-source Question Engine, Faculty Portals & Real-time Live Competition System.</p>
      </footer>
    </div>
  );
};

export default Landing;
