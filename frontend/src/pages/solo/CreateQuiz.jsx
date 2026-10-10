import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  BookOpen, 
  Sliders, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Shuffle, 
  ArrowRight,
  Copy,
  Check,
  CheckCircle,
  Users,
  GraduationCap
} from 'lucide-react';

const subjectsList = [
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
  'Placement Programming Logic',
];

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  // Form State: 'AI', 'ONLINE', or 'BANK'
  const [sourceType, setSourceType] = useState('AI');
  const [bankId, setBankId] = useState('');
  const [availableBanks, setAvailableBanks] = useState([]);
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Python');
  const [topic, setTopic] = useState('All Topics');
  const [aiCustomTopic, setAiCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Mixed'); // 'Easy', 'Medium', 'Hard', 'Mixed'
  
  // Mixed Difficulty breakdown
  const [easyCount, setEasyCount] = useState(5);
  const [mediumCount, setMediumCount] = useState(3);
  const [hardCount, setHardCount] = useState(2);

  const [questionType, setQuestionType] = useState('MCQ');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0.5);

  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  // Post creation modal state (Teacher success dialog)
  const [createdQuiz, setCreatedQuiz] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch available custom banks if teacher
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await API.get('/banks');
        if (res.data?.data) {
          setAvailableBanks(res.data.data);
          if (res.data.data.length > 0) {
            setBankId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Could not load banks:', err);
      }
    };
    if (isTeacher) {
      fetchBanks();
    }
  }, [isTeacher]);

  // Sync title dynamically
  useEffect(() => {
    if (!title) {
      if (isTeacher) {
        setTitle(`${subject} Class Examination`);
      } else {
        setTitle(`${subject} ${difficulty} AI Practice Test`);
      }
    }
  }, [subject, difficulty, isTeacher]);

  // Handle breakdown total sync
  useEffect(() => {
    if (difficulty === 'Mixed') {
      const sum = Number(easyCount) + Number(mediumCount) + Number(hardCount);
      if (sum > 0) {
        setTotalQuestions(sum);
      }
    }
  }, [easyCount, mediumCount, hardCount, difficulty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setLoading(true);

    try {
      const selectedTopic = sourceType === 'AI' && aiCustomTopic.trim() ? aiCustomTopic.trim() : topic;
      const payload = {
        title: title || `${subject} Practice Drill`,
        sourceType,
        bankId: sourceType === 'BANK' ? bankId : null,
        subject,
        topic: selectedTopic,
        difficulty,
        difficultyDistribution:
          difficulty === 'Mixed'
            ? {
                easy: Number(easyCount),
                medium: Number(mediumCount),
                hard: Number(hardCount),
              }
            : null,
        totalQuestions: Number(totalQuestions),
        durationMinutes: Number(durationMinutes),
        marksPerQuestion: Number(marksPerQuestion),
        negativeMarks: Number(negativeMarks),
        shuffleQuestions,
        shuffleOptions,
      };

      const res = await API.post('/quizzes/create', payload);

      if (res.data.warning) {
        setWarning(res.data.warning);
      }

      const newQuiz = res.data.data;

      if (isTeacher) {
        // Teacher workflow: DO NOT FORCE TEACHER INTO EXAM! Show deployment confirmation modal!
        setCreatedQuiz(newQuiz);
      } else {
        // Student workflow: Redirect straight into practice attempt
        setTimeout(() => {
          navigate(`/quiz/attempt/${newQuiz._id}`);
        }, 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate quiz. Please check parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdQuiz) return;
    const studentUrl = `${window.location.origin}/quiz/attempt/${createdQuiz._id}`;
    navigator.clipboard.writeText(studentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border-card)] shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl btn-gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/30">
            {isTeacher ? <GraduationCap className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
            {isTeacher ? 'Create & Assign Exam for Students' : 'Student AI Practice Lab'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl mx-auto">
            {isTeacher
              ? 'Deploy comprehensive examinations for your students using Google Gemini AI, verified syllabus pools, or custom question banks.'
              : 'Generate on-demand practice questions for any syllabus topic using Google Gemini 2.5 Flash to test your knowledge.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {warning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. QUESTION SOURCE */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              1. Question Source
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option A: Google Gemini AI */}
              <button
                type="button"
                onClick={() => setSourceType('AI')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  sourceType === 'AI'
                    ? 'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500 text-[var(--text-primary)] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/40'
                    : 'glass-panel border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      Google Gemini
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Gemini AI Generator</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {isTeacher
                      ? 'Synthesizes fresh exam questions on any topic using Gemini 2.5 Flash.'
                      : 'Generates on-demand practice questions tailored to your syllabus chapters.'}
                  </p>
                </div>
              </button>

              {/* Option B: Standard Online Bank */}
              <button
                type="button"
                onClick={() => setSourceType('ONLINE')}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  sourceType === 'ONLINE'
                    ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-cyan-500 text-[var(--text-primary)] shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/40'
                    : 'glass-panel border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                      Curated
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Syllabus Question Bank</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Pulls from 346+ verified university and placement examination problems.
                  </p>
                </div>
              </button>

              {/* Option C: Custom Question Bank */}
              <button
                type="button"
                onClick={() => {
                  if (isTeacher) setSourceType('BANK');
                }}
                disabled={!isTeacher}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  !isTeacher
                    ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5 border-[var(--border-subtle)] text-[var(--text-muted)]'
                    : sourceType === 'BANK'
                    ? 'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500 text-[var(--text-primary)] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/40'
                    : 'glass-panel border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                      {isTeacher ? 'Custom' : 'Faculty Only'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">My Question Bank</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {isTeacher
                      ? 'Pick from uploaded custom question banks or Excel/CSV sheets.'
                      : 'Faculty can upload custom spreadsheet files. Students use Gemini AI or Curated Banks.'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Gemini AI Custom Prompt Input (Visible when AI is selected) */}
          {sourceType === 'AI' && (
            <div className="p-5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/30 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-blue-700 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Gemini AI Custom Topic / Syllabus Chapter
                </label>
                <span className="text-[10px] text-[var(--text-muted)] font-mono bg-blue-500/10 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                  Model: gemini-2.5-flash
                </span>
              </div>
              <input
                type="text"
                value={aiCustomTopic}
                onChange={(e) => setAiCustomTopic(e.target.value)}
                placeholder="e.g. Normalization and B-Trees, Dynamic Programming, TCP Congestion Control, Probability..."
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-2">
                Google Gemini will synthesize fresh, verified questions for this topic with 4 options and detailed academic explanations.
              </p>
            </div>
          )}

          {/* Custom Bank Selection (Visible when BANK is selected) */}
          {sourceType === 'BANK' && (
            <div className="p-5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/30 animate-fadeIn">
              <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                Select Your Uploaded Question Bank
              </label>
              {availableBanks.length > 0 ? (
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
                >
                  {availableBanks.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title} ({b.subject}) - {b.totalQuestions} Questions
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No question banks found. Please go to the Question Banks tab to create or upload one first.
                </p>
              )}
            </div>
          )}

          {/* 2. QUIZ DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
              >
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. DIFFICULTY CONFIGURATION */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Difficulty Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    difficulty === diff
                      ? 'btn-gradient-primary text-white shadow-md'
                      : 'glass-panel text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Mixed Breakdown Slider/Inputs */}
          {difficulty === 'Mixed' && (
            <div className="p-4 rounded-2xl glass-card border border-[var(--border-subtle)] space-y-3">
              <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                Difficulty Breakdown (Total: {easyCount + mediumCount + hardCount} Questions)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mb-1">Easy</label>
                  <input
                    type="number"
                    min="0"
                    value={easyCount}
                    onChange={(e) => setEasyCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg input-adaptive text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-600 dark:text-amber-400 font-bold mb-1">Medium</label>
                  <input
                    type="number"
                    min="0"
                    value={mediumCount}
                    onChange={(e) => setMediumCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg input-adaptive text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-rose-600 dark:text-rose-400 font-bold mb-1">Hard</label>
                  <input
                    type="number"
                    min="0"
                    value={hardCount}
                    onChange={(e) => setHardCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg input-adaptive text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. EXAM PARAMETERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Total Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalQuestions}
                disabled={difficulty === 'Mixed'}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Marks / Question
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
              />
            </div>
          </div>

          {/* Negative Marking & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Negative Marks
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl input-adaptive text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                Random Questions Order
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                Random Options Order
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white btn-gradient-primary shadow-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            {loading
              ? 'Generating Questions via AI...'
              : isTeacher
              ? 'Create & Publish Exam for Students'
              : 'Generate AI Practice Drill'}
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </form>

      </div>

      {/* TEACHER EXAM CREATED SUCCESS MODAL */}
      {createdQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-card)] shadow-2xl relative text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-9 h-9" />
            </div>

            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Published for Students
            </span>

            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mt-3">
              Exam Created & Assigned!
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Your exam has been successfully published. Every student will now see this under{' '}
              <strong className="text-blue-600 dark:text-cyan-400">"Teacher Assigned Examinations"</strong> on their dashboard.
            </p>

            {/* Exam Overview Card */}
            <div className="my-6 p-4 rounded-2xl glass-card border border-[var(--border-subtle)] text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Title:</span>
                <strong className="text-[var(--text-primary)] font-semibold">{createdQuiz.title}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Subject:</span>
                <span className="text-blue-600 dark:text-cyan-400 font-semibold">{createdQuiz.subject}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Questions / Duration:</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {createdQuiz.totalQuestions} Questions • {createdQuiz.durationMinutes} Mins
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                <span>Assigned By:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Prof. {user?.name}</span>
              </div>
            </div>

            {/* Student Exam Sharable Link */}
            <div className="mb-6">
              <label className="block text-xs text-[var(--text-secondary)] font-semibold mb-1 text-left">
                Shareable Student Exam Link:
              </label>
              <div className="flex items-center gap-2 bg-[var(--bg-subtle)] p-2 rounded-xl border border-[var(--border-subtle)]">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/quiz/attempt/${createdQuiz._id}`}
                  className="bg-transparent text-xs text-[var(--text-primary)] flex-1 px-2 focus:outline-none select-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg btn-gradient-primary text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="py-2.5 px-4 rounded-xl btn-gradient-primary text-white font-bold text-xs transition-all shadow-md"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedQuiz(null);
                  setTitle('');
                  setAiCustomTopic('');
                }}
                className="py-2.5 px-4 rounded-xl glass-panel border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-xs transition-all hover:border-blue-400"
              >
                Assign Another Exam
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CreateQuiz;
