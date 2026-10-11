import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      // Demo accounts or auto-register helper
      const demoEmail = `${role}@eduquiz.com`;
      const demoPassword = 'password123';
      let userData;
      try {
        userData = await login(demoEmail, demoPassword);
      } catch (e) {
        // If not created yet, try register demo
        userData = await register(`Demo ${role.toUpperCase()}`, demoEmail, demoPassword, role);
      }
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Unable to load demo account. Please signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-[var(--border-card)] shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl btn-gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to your EduQuiz account</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="rohit@example.com"
              className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white btn-gradient-primary shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Test Demo Buttons */}
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center">
          <p className="text-xs text-[var(--text-muted)] mb-3 font-medium">Quick Demo Accounts:</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { setEmail('student@eduquiz.com'); setPassword('password123'); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg glass-panel text-blue-600 dark:text-cyan-400 hover:border-blue-400 transition-colors border border-[var(--border-subtle)] cursor-pointer"
            >
              Fill Student
            </button>
            <button
              onClick={() => { setEmail('teacher@eduquiz.com'); setPassword('password123'); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg glass-panel text-purple-600 dark:text-purple-400 hover:border-purple-400 transition-colors border border-[var(--border-subtle)] cursor-pointer"
            >
              Fill Teacher
            </button>
            <button
              onClick={() => { setEmail('admin@eduquiz.com'); setPassword('password123'); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg glass-panel text-amber-600 dark:text-amber-400 hover:border-amber-400 transition-colors border border-[var(--border-subtle)] cursor-pointer"
            >
              Fill Admin
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
