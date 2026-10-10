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
  AlertCircle 
} from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          Master Administration
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Control Panel</h1>
        <p className="text-sm text-gray-400 mt-1">Platform health, real-time activity metrics, and user management</p>
      </div>

      {/* Analytics Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold uppercase">Total Users</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</h3>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.totalStudents} Students • {stats.totalTeachers} Teachers
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold uppercase">Total Quizzes</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalQuizzes}</h3>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.totalBanks} Question Banks
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold uppercase">Exams Taken</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalAttempts}</h3>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.platformAvgScore}% Platform Avg
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-gray-400 font-semibold uppercase">Live Battles</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalCompetitions}</h3>
            <p className="text-[11px] text-pink-400 font-medium mt-1">Multiplayer Rooms</p>
          </div>
        </div>
      )}

      {/* Users Management Table */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          Registered Users ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/60 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Quizzes</th>
                <th className="py-3 px-4">Battles Won</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : u.role === 'teacher'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{u.email}</td>
                  <td className="py-3 px-4">{u.stats?.quizzesAttempted || 0}</td>
                  <td className="py-3 px-4">{u.stats?.competitionsWon || 0}</td>
                  <td className="py-3 px-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;
