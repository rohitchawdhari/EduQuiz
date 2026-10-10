import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

import { ThemeProvider } from './context/ThemeContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/solo/CreateQuiz';
import QuizExplore from './pages/solo/QuizExplore';
import QuizScreen from './pages/solo/QuizScreen';
import QuizResult from './pages/solo/QuizResult';
import AttemptsHistoryPage from './pages/AttemptsHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import CompetitionLobby from './pages/multiplayer/CompetitionLobby';
import CompetitionArena from './pages/multiplayer/CompetitionArena';
import QuestionBankPage from './pages/questionBank/QuestionBankPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CertificatesPage from './pages/CertificatesPage';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/explore" element={<QuizExplore />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />

                {/* Protected Routes (All Authenticated Users - Students, Teachers, Admins) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create-quiz" element={<CreateQuiz />} />
                  <Route path="/quiz/attempt/:quizId" element={<QuizScreen />} />
                  <Route path="/quiz/result/:attemptId" element={<QuizResult />} />
                  <Route path="/my-attempts" element={<AttemptsHistoryPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/competitions" element={<CompetitionLobby />} />
                  <Route path="/competition" element={<CompetitionLobby />} />
                  <Route path="/competitions/arena/:code" element={<CompetitionArena />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                </Route>

                {/* Teacher / Admin Only Question Bank Upload Routes */}
                <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
                  <Route path="/banks" element={<QuestionBankPage />} />
                  <Route path="/question-banks" element={<QuestionBankPage />} />
                </Route>

              {/* Admin Only Route */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
