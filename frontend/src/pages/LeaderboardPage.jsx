import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Trophy, Flame, Target, Award, Sparkles, Filter } from 'lucide-react';

const subjects = ['Python', 'DBMS', 'Computer Networks', 'Operating System', 'Data Structures'];

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'subject' | 'multiplayer'
  const [selectedSubject, setSelectedSubject] = useState('Python');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let endpoint = '/leaderboard/global';
      if (activeTab === 'subject') {
        endpoint = `/leaderboard/subject/${selectedSubject}`;
      } else if (activeTab === 'multiplayer') {
        endpoint = '/leaderboard/competitions';
      }

      const res = await API.get(endpoint);
      setLeaderboardData(res.data.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, selectedSubject]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30">
          <Trophy className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Hall of Fame
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Top performers across examinations, subjects, and live multiplayer battles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="p-1 rounded-2xl glass-panel border border-white/10 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'global'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Global Overall
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subject')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'subject'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Subject Drill
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('multiplayer')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'multiplayer'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Battle Champions
          </button>
        </div>
      </div>

      {/* Subject selector if on subject tab */}
      {activeTab === 'subject' && (
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedSubject === sub
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-900/60 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboardData.length > 0 ? (
          <div className="divide-y divide-white/5">
            {leaderboardData.map((entry, idx) => {
              const rank = entry.rank || idx + 1;

              return (
                <div
                  key={entry.id || entry.userId || idx}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                    rank === 1
                      ? 'bg-amber-500/10'
                      : rank === 2
                      ? 'bg-slate-500/5'
                      : rank === 3
                      ? 'bg-amber-900/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Rank Number / Medal */}
                    <div className="w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center uppercase flex-shrink-0">
                      {entry.name.charAt(0)}
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                        {entry.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {activeTab === 'global' && `${entry.quizzesAttempted} Quizzes Completed`}
                        {activeTab === 'subject' && `${entry.totalAttempts} Attempts in ${selectedSubject}`}
                        {activeTab === 'multiplayer' && `${entry.competitionsPlayed} Battles Played`}
                      </p>
                    </div>
                  </div>

                  {/* Score & Points */}
                  <div className="text-right flex-shrink-0">
                    {activeTab === 'global' && (
                      <div>
                        <span className="font-mono text-base sm:text-lg font-bold text-amber-300">
                          {entry.totalPoints} pts
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {entry.averageScore}% Avg
                        </p>
                      </div>
                    )}

                    {activeTab === 'subject' && (
                      <div>
                        <span className="font-mono text-base sm:text-lg font-bold text-purple-300">
                          {entry.averageScore}%
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium">
                          Best: {entry.bestScore} marks
                        </p>
                      </div>
                    )}

                    {activeTab === 'multiplayer' && (
                      <div>
                        <span className="font-mono text-base sm:text-lg font-bold text-pink-400">
                          {entry.competitionsWon} Wins
                        </span>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {entry.winRate}% Win Rate
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">
            No leaderboard rankings recorded yet. Take a quiz or win a multiplayer battle to get featured!
          </div>
        )}
      </div>

    </div>
  );
};

export default LeaderboardPage;
