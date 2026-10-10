import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  User, 
  Mail, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Flame, 
  Target, 
  TrendingUp 
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await API.put('/auth/profile', { name });
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <User className="w-8 h-8 text-indigo-400" />
          User Profile & Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your account details, security credentials, and review performance stats
        </p>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-gray-400 uppercase font-semibold">Exams Taken</span>
          <h3 className="text-2xl font-bold text-white mt-1">{user?.stats?.quizzesAttempted || 0}</h3>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-gray-400 uppercase font-semibold">Avg Score</span>
          <h3 className="text-2xl font-bold text-white mt-1">{user?.stats?.averageScore || 0}%</h3>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-gray-400 uppercase font-semibold">Battle Wins</span>
          <h3 className="text-2xl font-bold text-pink-400 mt-1">{user?.stats?.competitionsWon || 0}</h3>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs text-gray-400 uppercase font-semibold">Total Points</span>
          <h3 className="text-2xl font-bold text-amber-300 mt-1">{user?.stats?.totalPoints || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Account Information */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Profile Details
          </h3>

          {profileMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/40 border border-white/5 text-gray-400 text-xs cursor-not-allowed"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">Email address cannot be changed</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Account Role
              </label>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold capitalize">
                <Shield className="w-3.5 h-3.5" />
                {user?.role || 'Student'}
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full mt-4 py-2.5 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 text-xs transition-all disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Update Profile Name'}
            </button>
          </form>
        </div>

        {/* Card 2: Change Password */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-400" />
            Change Password
          </h3>

          {passwordMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {passwordMsg}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full mt-4 py-2.5 px-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 text-xs transition-all disabled:opacity-50"
            >
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default ProfilePage;
