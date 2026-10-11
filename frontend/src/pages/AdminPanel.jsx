import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Target, 
  Flame, 
  TrendingUp, 
  Trash2, 
  AlertCircle,
  Search,
  Filter,
  Ban,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  ChevronRight,
  UserCheck,
  UserX,
  RefreshCw,
  ExternalLink,
  Shield,
  Eye,
  X,
  FileText
} from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'quizzes' | 'activity'

  // Users Filter & Search
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'teacher' | 'admin' | 'blocked'

  // User Detail Modal
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Block Modal
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [blockReason, setBlockReason] = useState('Violation of platform policy');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/quizzes'),
        API.get('/admin/attempts'),
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data.data);
      if (results[1].status === 'fulfilled') setUsers(results[1].value.data.data || []);
      if (results[2].status === 'fulfilled') setQuizzes(results[2].value.data.data || []);
      if (results[3].status === 'fulfilled') setAttempts(results[3].value.data.data || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  // View User Details (What quizzes they took, created, stats)
  const handleOpenUserDetail = async (userId) => {
    setModalLoading(true);
    try {
      const res = await API.get(`/admin/users/${userId}`);
      setSelectedUserDetail(res.data.data);
    } catch (err) {
      alert('Failed to load user details: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle Block User
  const handleToggleBlock = async () => {
    if (!blockUserTarget) return;
    try {
      const res = await API.put(`/admin/users/${blockUserTarget._id}/block`, {
        reason: blockReason,
      });
      // Update local state
      setUsers(users.map((u) => 
        u._id === blockUserTarget._id ? { ...u, isBlocked: res.data.data.isBlocked, blockedReason: res.data.data.blockedReason } : u
      ));
      if (selectedUserDetail && selectedUserDetail.user._id === blockUserTarget._id) {
        setSelectedUserDetail({
          ...selectedUserDetail,
          user: { ...selectedUserDetail.user, isBlocked: res.data.data.isBlocked, blockedReason: res.data.data.blockedReason },
        });
      }
      setBlockUserTarget(null);
      alert(res.data.message);
    } catch (err) {
      alert('Error updating user status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Change User Role
  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    try {
      const res = await API.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: res.data.data.role } : u)));
      if (selectedUserDetail && selectedUserDetail.user._id === userId) {
        setSelectedUserDetail({
          ...selectedUserDetail,
          user: { ...selectedUserDetail.user, role: res.data.data.role },
        });
      }
      alert(res.data.message);
    } catch (err) {
      alert('Failed to change role: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ PERMANENT ACTION:\nAre you sure you want to remove ${userName} from the platform completely? All their attempts will be deleted.`)) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      if (selectedUserDetail && selectedUserDetail.user._id === userId) {
        setSelectedUserDetail(null);
      }
      alert(`User ${userName} successfully removed.`);
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to remove the quiz "${quizTitle}"?`)) return;
    try {
      await API.delete(`/admin/quizzes/${quizId}`);
      setQuizzes(quizzes.filter((q) => q._id !== quizId));
      alert(`Quiz "${quizTitle}" removed.`);
    } catch (err) {
      alert('Failed to delete quiz: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      !searchUser.trim() ||
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u._id?.toLowerCase().includes(searchUser.toLowerCase());

    let matchesRole = true;
    if (roleFilter === 'student') matchesRole = u.role === 'student' && !u.isBlocked;
    else if (roleFilter === 'teacher') matchesRole = u.role === 'teacher' && !u.isBlocked;
    else if (roleFilter === 'admin') matchesRole = u.role === 'admin';
    else if (roleFilter === 'blocked') matchesRole = !!u.isBlocked;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[var(--text-muted)]">Loading Admin Command Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Top Banner / Master Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            Master Administration Command Center
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">System Control Panel</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Complete platform oversight: user identities, quiz attempt histories, blocking/suspending, and content moderation
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-bold hover:border-blue-500/40 shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Sync Live Data'}
        </button>
      </div>

      {/* Analytics Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="glass-card p-5 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-2">{stats.totalUsers}</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 flex flex-wrap gap-1">
              <span className="text-blue-500 font-semibold">{stats.totalStudents} Students</span> • 
              <span className="text-purple-500 font-semibold">{stats.totalTeachers} Teachers</span>
              {stats.totalBlocked > 0 && (
                <span className="text-rose-500 font-bold">• {stats.totalBlocked} Suspended</span>
              )}
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Quizzes</span>
              <BookOpen className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-2">{stats.totalQuizzes}</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              {stats.totalBanks} Question Banks • {stats.totalQuestions} Questions
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Exams Taken</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-2">{stats.totalAttempts}</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              <span className="text-emerald-500 font-bold">{stats.platformAvgScore}%</span> Platform Avg Score
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Battle Arena</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-2">{stats.totalCompetitions}</h3>
            <p className="text-[11px] text-amber-500 font-medium mt-1">Live Multiplayer Matches</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] mb-6 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-blue-500 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Users className="w-4 h-4" />
          Users Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'quizzes'
              ? 'border-blue-500 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Quizzes Oversight ({quizzes.length})
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'activity'
              ? 'border-blue-500 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Platform Live Audit Feed ({attempts.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: USERS DIRECTORY & CONTROL */}
      {/* ============================================================== */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-5 sm:p-7 shadow-xl">
          
          {/* Controls: Search and Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Role Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'student', label: 'Students' },
                { id: 'teacher', label: 'Teachers' },
                { id: 'admin', label: 'Admins' },
                { id: 'blocked', label: 'Suspended' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    roleFilter === rf.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3 px-4">User Name & ID</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Exams Attempted</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-sm text-[var(--text-muted)]">
                      No users match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 shadow">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block leading-tight">{u.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono select-all">
                              ID: {u._id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                        {u.email}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : u.role === 'teacher'
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                        {u.stats?.quizzesAttempted || 0}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-[var(--text-muted)]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. View User Quizzes & History */}
                          <button
                            type="button"
                            onClick={() => handleOpenUserDetail(u._id)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                            title="View exams taken & quiz history"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Change Role */}
                          {u.role !== 'admin' && (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u._id, e.target.value)}
                              className="text-[10px] font-bold bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-md px-1.5 py-1 focus:outline-none cursor-pointer"
                              title="Change user role"
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}

                          {/* 3. Block / Unblock */}
                          {u.role !== 'admin' && (
                            u.isBlocked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setBlockUserTarget(u);
                                  handleToggleBlock();
                                }}
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                title="Unblock / Reactivate user"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setBlockUserTarget(u);
                                  setBlockReason('Violation of platform policy');
                                }}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                                title="Suspend / Block user"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )
                          )}

                          {/* 4. Delete User Permanently */}
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete user from platform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: QUIZZES OVERSIGHT & MODERATION */}
      {/* ============================================================== */}
      {activeTab === 'quizzes' && (
        <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-5 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">All Platform Quizzes ({quizzes.length})</h3>
              <p className="text-xs text-[var(--text-secondary)]">Review all quizzes created by teachers or AI, and remove inappropriate content.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3 px-4">Quiz Title & Subject</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Passing %</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {quizzes.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[var(--text-primary)] block">{q.title}</span>
                      <span className="text-[10px] text-blue-500 font-semibold">{q.subject}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-[var(--text-primary)] block">
                        {q.createdBy?.name || 'AI Generator / System'}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {q.createdBy?.email || 'System'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {q.totalQuestions || 0}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.difficulty === 'Hard'
                          ? 'bg-rose-500/20 text-rose-500'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {q.passingPercentage || 40}%
                    </td>

                    <td className="py-3 px-4 font-bold text-blue-500">
                      {q.totalAttempts || 0}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteQuiz(q._id, q.title)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PLATFORM AUDIT FEED / RECENT ATTEMPTS */}
      {/* ============================================================== */}
      {activeTab === 'activity' && (
        <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-5 sm:p-7 shadow-xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Live Platform Submissions & Audit Log</h3>
            <p className="text-xs text-[var(--text-secondary)]">Real-time log of students attempting and submitting exams across the platform.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Exam / Quiz</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-[var(--text-muted)]">
                      No exam submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-slate-200/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-[var(--text-primary)] block">
                          {att.userId?.name || 'Anonymous User'}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {att.userId?.email || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[var(--text-primary)] block">
                          {att.quizId?.title || 'Custom AI Exam'}
                        </span>
                        <span className="text-[10px] text-blue-500 font-semibold">
                          {att.quizId?.subject || 'Practice'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                        {att.score} / {att.totalPoints} pts
                      </td>

                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                        {Math.round(att.percentage || 0)}%
                      </td>

                      <td className="py-3 px-4">
                        {att.isPassed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            PASSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                            FAILED
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right text-[11px] text-[var(--text-muted)]">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: DETAILED USER DRILLDOWN (WHAT QUIZZES THEY TOOK) */}
      {/* ============================================================== */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center uppercase shadow">
                  {selectedUserDetail.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedUserDetail.user.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{selectedUserDetail.user.email} • ID: {selectedUserDetail.user._id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Account Quick Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Role</span>
                  <p className="text-sm font-bold text-[var(--text-primary)] capitalize mt-0.5">{selectedUserDetail.user.role}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Account Status</span>
                  <p className={`text-sm font-bold mt-0.5 ${selectedUserDetail.user.isBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedUserDetail.user.isBlocked ? 'Suspended' : 'Active'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Battle Wins</span>
                  <p className="text-sm font-bold text-amber-500 mt-0.5">{selectedUserDetail.user.stats?.competitionsWon || 0}</p>
                </div>
              </div>

              {/* All Exam Attempts Taken By This User */}
              <div>
                <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  All Exam Attempts Taken ({selectedUserDetail.attempts.length})
                </h4>

                {selectedUserDetail.attempts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                    This user has not taken any quizzes yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {selectedUserDetail.attempts.map((att) => (
                      <div
                        key={att._id}
                        className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[var(--text-primary)] block">
                            {att.quizId?.title || 'Subject Exam'}
                          </span>
                          <span className="text-[10px] text-blue-500 font-semibold">
                            {att.quizId?.subject || 'Quiz'} • {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[var(--text-primary)]">
                            {Math.round(att.percentage || 0)}%
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.isPassed
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/20 text-rose-500'
                          }`}>
                            {att.isPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quizzes Created (If Teacher) */}
              {selectedUserDetail.quizzesCreated?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    Quizzes Authored ({selectedUserDetail.quizzesCreated.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedUserDetail.quizzesCreated.map((qz) => (
                      <div
                        key={qz._id}
                        className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-[var(--text-primary)]">{qz.title}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{qz.subject} • {qz.totalQuestions} Questions</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)] flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] hover:border-blue-500/40 cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: SUSPEND / BLOCK USER REASON */}
      {/* ============================================================== */}
      {blockUserTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <Ban className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Suspend User Account</h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Are you sure you want to suspend access for <strong className="text-[var(--text-primary)]">{blockUserTarget.name}</strong> ({blockUserTarget.email})? 
              They will be locked out immediately and unable to log in.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">
                Reason for Suspension
              </label>
              <textarea
                rows="3"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter suspension reason..."
                className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBlockUserTarget(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleBlock}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
