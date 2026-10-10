import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle, Printer, Download, Sparkles, ExternalLink, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState(null);
  const [tab, setTab] = useState('my'); // 'my' or 'students' (for teachers)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const endpoint =
          user?.role === 'teacher' && tab === 'students'
            ? '/certificates/teacher-student-certificates'
            : '/certificates/my-certificates';

        const res = await API.get(endpoint);
        setCertificates(res.data.data || []);
      } catch (err) {
        console.error('Failed to load certificates:', err);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCertificates();
    }
  }, [user?._id, tab]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <Award className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            {user?.role === 'teacher' && tab === 'students' ? 'Student Credentials Issued' : 'My Certificates'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {user?.role === 'teacher' && tab === 'students'
              ? 'Verifiable certificates earned by students qualifying in exams created by you'
              : 'Official digital credentials earned by achieving passing scores in EduQuiz examinations'}
          </p>
        </div>

        {/* Teacher Tab Switcher */}
        {user?.role === 'teacher' && (
          <div className="flex items-center gap-2 glass-panel p-1.5 rounded-2xl border border-[var(--border-subtle)]">
            <button
              onClick={() => setTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'my'
                  ? 'btn-gradient-primary text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              My Certificates
            </button>
            <button
              onClick={() => setTab('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tab === 'students'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Credentials
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="glass-card p-6 rounded-3xl border border-[var(--border-card)] flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {cert.certificateId}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>

                {/* Recipient Badge */}
                <div className="flex items-center gap-2 mb-3 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
                  <div className="w-6 h-6 rounded-lg btn-gradient-primary text-white font-bold text-xs flex items-center justify-center uppercase">
                    {(cert.recipientName || 'S').charAt(0)}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">
                    Awarded to: <strong className="text-[var(--text-primary)] font-bold">{cert.recipientName}</strong>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] line-clamp-1">{cert.quizTitle}</h3>
                <p className="text-xs text-blue-600 dark:text-cyan-400 font-semibold mt-1">{cert.subject}</p>

                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Score: <strong className="text-[var(--text-primary)]">{cert.score} marks ({cert.percentage}%)</strong></span>
                  <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCert(cert)}
                className="w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-white btn-gradient-primary shadow-md text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View & Print Certificate
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-3xl text-center border border-[var(--border-subtle)]">
          <Award className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {user?.role === 'teacher' && tab === 'students'
              ? 'No Student Certificates Yet'
              : 'No Certificates Earned Yet'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mt-2 mb-6">
            {user?.role === 'teacher' && tab === 'students'
              ? 'Students who pass your assigned exams with 40% or higher will have their earned credentials listed here.'
              : 'Pass any syllabus or teacher-assigned quiz with a score of 40% or higher to automatically generate and unlock your verifiable certificate.'}
          </p>
        </div>
      )}

      {/* CERTIFICATE PREVIEW MODAL */}
      {activeCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border-card)] shadow-2xl relative my-8">
            
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)] print:hidden">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Official Credential Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gradient-primary text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCert(null)}
                  className="px-3 py-2 rounded-xl glass-panel border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Certificate Template */}
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border-4 border-amber-500/40 text-center relative overflow-hidden shadow-2xl print:border-black print:bg-white print:text-black">
              {/* Decorative Corner Ornaments */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400/60" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400/60" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400/60" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400/60" />

              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Award className="w-8 h-8" />
              </div>

              <h4 className="text-xs font-bold tracking-[0.25em] text-amber-400 uppercase mb-1">
                EduQuiz Examination Board
              </h4>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-wide uppercase mt-2">
                Certificate of Achievement
              </h2>

              <p className="text-xs text-gray-400 mt-6 italic">This is proudly presented to</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-wide mt-2 underline decoration-amber-500/50 underline-offset-8">
                {activeCert.recipientName}
              </h3>

              <p className="text-sm text-gray-300 mt-6 max-w-lg mx-auto leading-relaxed">
                for successfully completing the examination in{' '}
                <strong className="text-white font-semibold">{activeCert.quizTitle}</strong> ({activeCert.subject}) with an overall performance grade of{' '}
                <strong className="text-emerald-400 font-bold">{activeCert.percentage}%</strong>.
              </p>

              <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 max-w-md mx-auto">
                <div className="text-left">
                  <span className="block font-mono text-white font-semibold">
                    {new Date(activeCert.issueDate).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-gray-500">Date of Issuance</span>
                </div>

                <div className="text-right">
                  <span className="block font-mono text-amber-400 font-bold">
                    {activeCert.certificateId}
                  </span>
                  <span className="text-[10px] text-gray-500">Verification ID</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CertificatesPage;
