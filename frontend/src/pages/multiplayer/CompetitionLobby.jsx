import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Flame, 
  Users, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

const subjects = [
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
  'Placement Programming Logic'
];

const CompetitionLobby = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'host'
  const [roomCodeInput, setRoomCodeInput] = useState('');
  
  // Host Form State
  const [title, setTitle] = useState('DBMS Speed Battle');
  const [subject, setSubject] = useState('DBMS');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [perQuestionTimeSeconds, setPerQuestionTimeSeconds] = useState(20);
  const [maxPlayers, setMaxPlayers] = useState(10);

  const [activeRooms, setActiveRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch active competitions
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await API.get('/competitions');
        setActiveRooms(res.data.data);
      } catch (err) {
        console.error('Failed to load active rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  // Join Room via Code
  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    const cleanCode = roomCodeInput.trim().toUpperCase();
    navigate(`/competitions/arena/${cleanCode}`);
  };

  // Host New Competition
  const handleHost = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/competitions/create', {
        title,
        subject,
        totalQuestions: Number(totalQuestions),
        perQuestionTimeSeconds: Number(perQuestionTimeSeconds),
        maxPlayers: Number(maxPlayers),
      });

      const code = res.data.data.roomCode;
      navigate(`/competitions/arena/${code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create competition room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      
      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Flame className="w-4 h-4 text-pink-500 animate-pulse" />
          Real-time Live Multiplayer Arena
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Quiz Competition Battle
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto mt-2">
          Gather 4, 5, or 10+ classmates in a real-time synchronized battle with live speed-bonus leaderboards.
        </p>
      </div>

      {/* Tabs: Join Code vs Host Room */}
      <div className="flex justify-center mb-8">
        <div className="p-1 rounded-2xl glass-panel border border-white/10 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'join'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Enter Room Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('host')}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'host'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Host Competition
          </button>
        </div>
      </div>

      {/* TAB 1: JOIN WITH CODE */}
      {activeTab === 'join' && (
        <div className="max-w-lg mx-auto glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">Join with Room Code</h3>
            <p className="text-xs text-gray-400 mt-1">
              Ask the room host for the 8-character competition code
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. DBMS-7K29"
                required
                className="w-full text-center tracking-widest text-xl font-mono uppercase px-4 py-3 rounded-2xl bg-gray-900/80 border border-pink-500/30 text-pink-300 placeholder-gray-600 focus:outline-none focus:border-pink-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-xl shadow-pink-600/25 text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-current" />
              Join Waiting Room
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: HOST COMPETITION */}
      {activeTab === 'host' && (
        <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">Configure New Battle Room</h3>
            <p className="text-xs text-gray-400 mt-1">
              Set questions, synchronized countdown timers, and player limits
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleHost} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Competition Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/60 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Subject
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSubject(sub);
                      setTitle(`${sub} Speed Battle`);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      subject === sub
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-gray-900/60 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Questions Count
                </label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Per-Question Timer
                </label>
                <select
                  value={perQuestionTimeSeconds}
                  onChange={(e) => setPerQuestionTimeSeconds(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value={15}>15 Seconds</option>
                  <option value={20}>20 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={45}>45 Seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                  <option value={10}>10 Players</option>
                  <option value={20}>20 Players</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/25 text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {loading ? 'Creating Room...' : 'Create Competition & Get Code'}
            </button>
          </form>
        </div>
      )}

      {/* Active Public Rooms Showcase */}
      {activeRooms.length > 0 && (
        <div className="mt-14">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-pink-500" />
            Recent Competition Rooms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRooms.map((room) => (
              <div key={room._id} className="glass-card p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    {room.roomCode}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2 line-clamp-1">{room.title}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <span>{room.subject}</span> • 
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" />
                      Max {room.maxPlayers}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/competitions/arena/${room.roomCode}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white border border-pink-500/30 text-xs font-bold transition-all"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CompetitionLobby;
