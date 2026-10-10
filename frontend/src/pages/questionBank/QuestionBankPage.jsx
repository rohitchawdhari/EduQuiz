import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  BookOpen, 
  Upload, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FolderPlus,
  Download
} from 'lucide-react';

const subjectsList = [
  'Python',
  'DBMS',
  'Computer Networks',
  'Operating System',
  'Data Structures',
  'Java',
  'C++',
];

const QuestionBankPage = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBank, setActiveBank] = useState(null);
  const [bankQuestions, setBankQuestions] = useState([]);

  // Modals
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // New Bank form
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Python');
  const [newDesc, setNewDesc] = useState('');

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Manual Question state
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [difficulty, setDifficulty] = useState('Easy');
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState('');

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await API.get('/banks');
      setBanks(res.data.data);
      if (res.data.data.length > 0 && !activeBank) {
        selectBank(res.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const selectBank = async (bank) => {
    setActiveBank(bank);
    try {
      const res = await API.get(`/banks/${bank._id}`);
      setBankQuestions(res.data.data.questions);
    } catch (err) {
      console.error('Failed to load bank questions:', err);
    }
  };

  // Create Bank Handler
  const handleCreateBank = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/banks', {
        title: newTitle,
        subject: newSubject,
        description: newDesc,
      });
      setShowCreateBankModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchBanks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating question bank');
    }
  };

  // Upload Excel / CSV Handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !activeBank) return;

    setUploadLoading(true);
    setUploadError('');
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await API.post(`/banks/${activeBank._id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMessage(res.data.message);
      setUploadFile(null);
      selectBank(activeBank);
      fetchBanks();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  // Add Question Manually
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!activeBank) return;

    const options = [
      { text: optA, isCorrect: correctOpt === 'A' },
      { text: optB, isCorrect: correctOpt === 'B' },
      { text: optC, isCorrect: correctOpt === 'C' },
      { text: optD, isCorrect: correctOpt === 'D' },
    ];

    try {
      await API.post(`/banks/${activeBank._id}/questions`, {
        questionText: qText,
        options,
        difficulty,
        marks: Number(marks),
        explanation,
      });

      setShowAddQuestionModal(false);
      setQText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setExplanation('');
      selectBank(activeBank);
      fetchBanks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding question');
    }
  };

  // Download Sample CSV Helper
  const downloadSampleCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Question,Option A,Option B,Option C,Option D,Answer,Difficulty,Marks,Explanation\n' +
      'What keyword defines a function in Python?,function,def,define,fun,B,Easy,2,def is used in Python\n' +
      'What data structure follows FIFO?,Stack,Queue,Tree,Graph,B,Easy,2,Queue is First In First Out\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'EduQuiz_Question_Bank_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Question Banks</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage custom repositories, upload CSV/Excel spreadsheets, and add manual questions
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateBankModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 text-xs transition-all hover:scale-105"
        >
          <FolderPlus className="w-4 h-4" />
          Create Question Bank
        </button>
      </div>

      {/* Main Grid: Banks List & Questions Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Banks List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Your Question Banks ({banks.length})
          </h3>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : banks.length > 0 ? (
            banks.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() => selectBank(b)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  activeBank?._id === b._id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-gray-900/60 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                    {b.subject}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {b.totalQuestions} Questions
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">{b.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {b.description || 'No description provided'}
                </p>
              </button>
            ))
          ) : (
            <div className="p-6 rounded-2xl glass-panel text-center text-xs text-gray-500">
              No question banks created yet. Click "Create Question Bank" above.
            </div>
          )}
        </div>

        {/* Right: Active Bank Questions & Actions */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between min-h-[500px]">
          {activeBank ? (
            <div>
              {/* Header Info & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                      {activeBank.subject}
                    </span>
                    <span className="text-xs text-gray-400">
                      {bankQuestions.length} Total Questions
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{activeBank.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Upload
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddQuestionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Q
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete bank "${activeBank.title}" and all its questions?`)) return;
                      try {
                        await API.delete(`/banks/${activeBank._id}`);
                        setActiveBank(null);
                        fetchBanks();
                      } catch (e) {
                        alert('Failed to delete question bank');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all"
                    title="Delete Bank"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Bank
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {bankQuestions.length > 0 ? (
                  bankQuestions.map((q, idx) => (
                    <div
                      key={q._id}
                      className="p-4 rounded-2xl bg-gray-900/60 border border-white/5 hover:border-white/10 transition-colors relative group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                          Q{idx + 1} • {q.difficulty}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            +{q.marks} Marks
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('Delete this question?')) return;
                              try {
                                await API.delete(`/banks/questions/${q._id}`);
                                selectBank(activeBank);
                                fetchBanks();
                              } catch (e) {
                                alert('Failed to delete question');
                              }
                            }}
                            className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold text-white mb-3 leading-snug">
                        {q.questionText}
                      </h4>

                      {/* Options preview */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border flex items-center gap-2 ${
                              opt.isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                                : 'bg-gray-800/40 border-white/5 text-gray-400'
                            }`}
                          >
                            <span className="font-mono text-[10px]">{String.fromCharCode(65 + i)}.</span>
                            <span className="line-clamp-1">{opt.text}</span>
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-[11px] text-gray-500 mt-2 italic">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-gray-400">No questions in this bank yet</p>
                    <p className="text-xs mt-1">Upload a spreadsheet or add questions manually.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto text-gray-500">
              <BookOpen className="w-12 h-12 mb-2 opacity-40" />
              <p className="text-sm font-semibold">Select a Question Bank on the left</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: CREATE BANK */}
      {showCreateBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Question Bank</h3>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Bank Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Python Semester Questions"
                  required
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Subject
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs"
                >
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Unit 1 to 5 mid-term questions..."
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBankModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Save Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD CSV / EXCEL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                Upload Spreadsheet (.xlsx / .csv)
              </h3>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Sample CSV
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Columns supported: <strong>Question, Option A, Option B, Option C, Option D, Answer (A/B/C/D), Difficulty, Marks, Explanation</strong>
            </p>

            {uploadMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {uploadMessage}
              </div>
            )}
            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-purple-500/50 transition-colors">
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                  className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {uploadLoading ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD QUESTION MANUALLY */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-white mb-4">Add Single Question</h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Question Text
                </label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Which keyword defines a function in Python?"
                  required
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-white/10 text-white text-xs h-18"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const val = letter === 'A' ? optA : letter === 'B' ? optB : letter === 'C' ? optC : optD;
                  const setVal = letter === 'A' ? setOptA : letter === 'B' ? setOptB : letter === 'C' ? setOptC : setOptD;

                  return (
                    <div key={letter}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-gray-400">Option {letter}</label>
                        <label className="flex items-center gap-1 text-[10px] text-emerald-400 cursor-pointer">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={correctOpt === letter}
                            onChange={() => setCorrectOpt(letter)}
                            className="text-emerald-500"
                          />
                          Correct
                        </label>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">Marks</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">Explanation (Optional)</label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Why this answer is correct..."
                  className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionBankPage;
