import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  Clock, 
  ShieldAlert, 
  Flag, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

const QuizScreen = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [attemptId, setAttemptId] = useState(null);
  const [quizMeta, setQuizMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User responses: { [questionId]: { selectedOptionIndex: number | null, isMarkedForReview: boolean } }
  const [answers, setAnswers] = useState({});

  // Countdown Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const timerRef = useRef(null);

  // Anti-cheating state
  const [violations, setViolations] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isResumed, setIsResumed] = useState(false);

  // Initialize Exam Attempt (Start new or Resume active session)
  useEffect(() => {
    const initExam = async () => {
      try {
        const res = await API.post(`/attempts/start/${quizId}`);
        const { attemptId: aId, quiz, questions: qs, savedAnswers, remainingSeconds } = res.data.data;

        if (res.data.resumed) {
          setIsResumed(true);
        }

        setAttemptId(aId);
        setQuizMeta(quiz);
        setQuestions(qs);

        // Enforce accurate server deadline countdown
        const initialSeconds = typeof remainingSeconds === 'number' 
          ? remainingSeconds 
          : (quiz.durationMinutes * 60);
        setTimeLeftSeconds(initialSeconds);

        // Pre-populate answers from server if resuming an active exam
        const initialAnswers = {};
        qs.forEach((q) => {
          const saved = savedAnswers && savedAnswers[q.questionId];
          initialAnswers[q.questionId] = {
            selectedOptionIndex: saved && saved.selectedOptionIndex !== undefined ? saved.selectedOptionIndex : null,
            isMarkedForReview: saved ? !!saved.isMarkedForReview : false,
          };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start quiz attempt.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [quizId]);

  // Timer Tick
  useEffect(() => {
    if (timeLeftSeconds <= 0 || loading || !attemptId) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(true); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeftSeconds, loading, attemptId]);

  // Anti-Cheating Listeners: Tab Switch Detection
  useEffect(() => {
    if (!attemptId || isSubmitting) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const res = await API.post(`/attempts/${attemptId}/violation`, {
            type: 'TAB_SWITCH',
            details: 'Tab switched or window lost focus',
          });

          const count = res.data.violationCount;
          setViolations(count);
          setViolationMessage(`Tab switch detected! Warning ${count}/3. Avoid switching tabs during the examination.`);
          setShowViolationModal(true);

          if (res.data.shouldAutoSubmit) {
            handleFinalSubmit(true);
          }
        } catch (e) {
          console.error('Error logging violation:', e);
        }
      }
    };

    const handleContextMenu = (e) => e.preventDefault(); // Disable right click
    const handleCopyPaste = (e) => e.preventDefault(); // Disable copy/paste

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [attemptId, isSubmitting]);

  // Option selection
  const handleSelectOption = (clientIndex) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const updated = {
      ...answers,
      [qId]: {
        ...answers[qId],
        selectedOptionIndex: clientIndex,
      },
    };
    setAnswers(updated);

    // Auto-save to server
    API.post(`/attempts/${attemptId}/save-answer`, {
      questionId: qId,
      selectedClientIndex: clientIndex,
      isMarkedForReview: answers[qId]?.isMarkedForReview || false,
    }).catch((err) => console.error('Save answer error:', err));
  };

  // Toggle mark for review
  const handleToggleReview = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const currentRev = !!answers[qId]?.isMarkedForReview;
    const updated = {
      ...answers,
      [qId]: {
        ...answers[qId],
        isMarkedForReview: !currentRev,
      },
    };
    setAnswers(updated);

    API.post(`/attempts/${attemptId}/save-answer`, {
      questionId: qId,
      selectedClientIndex: answers[qId]?.selectedOptionIndex,
      isMarkedForReview: !currentRev,
    }).catch((err) => console.error('Save review error:', err));
  };

  // Clear answer
  const handleClearAnswer = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.questionId;
    const updated = {
      ...answers,
      [qId]: {
        ...answers[qId],
        selectedOptionIndex: null,
      },
    };
    setAnswers(updated);

    API.post(`/attempts/${attemptId}/save-answer`, {
      questionId: qId,
      selectedClientIndex: null,
      isMarkedForReview: answers[qId]?.isMarkedForReview,
    }).catch((err) => console.error('Clear answer error:', err));
  };

  // Final Submit
  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const clientAnswersArray = Object.keys(answers).map((qId) => ({
        questionId: qId,
        selectedOptionIndex: answers[qId].selectedOptionIndex,
      }));

      const totalSpent = quizMeta ? quizMeta.durationMinutes * 60 - timeLeftSeconds : 0;

      const res = await API.post(`/attempts/${attemptId}/submit`, {
        timeTakenSeconds: totalSpent,
        clientAnswers: clientAnswersArray,
      });

      navigate(`/quiz/result/${attemptId}`);
    } catch (err) {
      console.error('Submit error:', err);
      setIsSubmitting(false);
      alert('Failed to submit exam. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Preparing exam environment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Exam Error</h3>
        <p className="text-sm text-gray-400 mt-2 mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const minutesLeft = Math.floor(timeLeftSeconds / 60);
  const secondsLeft = timeLeftSeconds % 60;
  const isTimeCritical = timeLeftSeconds < 120; // less than 2 mins

  const currentAnsState = currentQuestion ? answers[currentQuestion.questionId] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col flex-1 select-none">
      
      {/* Top Bar: Title, Active Question Count & Timer */}
      <div className="glass-panel px-6 py-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 mb-6 border border-[var(--border-card)] shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
              {quizMeta?.subject}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Q{currentIndex + 1} of {questions.length}
            </span>
            {isResumed && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Session Resumed
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5 line-clamp-1">{quizMeta?.title}</h2>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm tracking-wider ${
          isTimeCritical
            ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-cyan-400'
        }`}>
          <Clock className="w-4 h-4" />
          <span>
            {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Main Examination View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-1">
        
        {/* Left: Active Question Card & Controls */}
        <div className="lg:col-span-3 flex flex-col justify-between glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-card)] min-h-[520px]">
          <div>
            {/* Question Header & Marks */}
            <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                Question {currentIndex + 1}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  +{currentQuestion?.marks} Marks
                </span>
                {currentQuestion?.negativeMarks > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                    -{currentQuestion?.negativeMarks} Neg
                  </span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-medium text-[var(--text-primary)] leading-relaxed mb-8">
              {currentQuestion?.questionText}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion?.options.map((option, optIdx) => {
                const isSelected = currentAnsState?.selectedOptionIndex === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500 text-[var(--text-primary)] shadow-md ring-1 ring-blue-500/30'
                        : 'glass-panel border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-blue-400 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'btn-gradient-primary text-white'
                        : 'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                    }`}>
                      {letter}
                    </div>
                    <span className="text-sm sm:text-base font-normal">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAnswer}
                disabled={currentAnsState?.selectedOptionIndex === null}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Choice
              </button>

              <button
                type="button"
                onClick={handleToggleReview}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  currentAnsState?.isMarkedForReview
                    ? 'bg-purple-600/20 border-purple-500 text-purple-700 dark:text-purple-300'
                    : 'glass-panel border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {currentAnsState?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] glass-panel border border-[var(--border-subtle)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white btn-gradient-primary shadow-md transition-all cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white btn-gradient-battle shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Palette & Status */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-card)] flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Question Palette
            </h4>

            {/* 1..N Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.questionId];
                const isAnswered = ans && ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined;
                const isReview = ans && ans.isMarkedForReview;
                const isCurrent = currentIndex === idx;

                let bgClass = 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--border-subtle)]';
                if (isAnswered && isReview) {
                  bgClass = 'bg-amber-600 text-white border-amber-400';
                } else if (isReview) {
                  bgClass = 'bg-purple-600 text-white border-purple-400';
                } else if (isAnswered) {
                  bgClass = 'bg-emerald-600 text-white border-emerald-400';
                }

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center border transition-all cursor-pointer ${bgClass} ${
                      isCurrent ? 'ring-2 ring-blue-500 scale-105' : 'hover:opacity-85'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] space-y-2 text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Answered & Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-700" />
                <span>Unvisited / Unanswered</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="w-full mt-6 py-3 px-4 rounded-xl font-bold text-white btn-gradient-battle shadow-md text-xs transition-all cursor-pointer"
          >
            Finish & Submit Exam
          </button>
        </div>

      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-card)] shadow-2xl text-center">
            <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Submit Examination?</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 mb-6">
              You are about to complete your test. Once submitted, your answers will be evaluated immediately.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl glass-panel border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-xs hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl btn-gradient-primary text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                {isSubmitting ? 'Evaluating...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheating Breach Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/40 shadow-2xl text-center">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Security Violation Warning</h3>
            <p className="text-sm text-rose-500 dark:text-rose-300 mt-2 mb-6">{violationMessage}</p>
            <button
              type="button"
              onClick={() => setShowViolationModal(false)}
              className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors cursor-pointer"
            >
              I Understand & Return to Exam
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizScreen;
