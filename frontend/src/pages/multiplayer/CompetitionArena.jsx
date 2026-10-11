import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import API from '../../services/api';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Flame, 
  Clock, 
  Trophy, 
  Copy, 
  Check, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Crown,
  ArrowRight,
  Sparkles,
  Mail,
  Send,
  Award,
  Zap,
  Target
} from 'lucide-react';

const CompetitionArena = () => {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [roomData, setRoomData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Game States: 'WAITING' | 'ACTIVE' | 'FINISHED'
  const [gameState, setGameState] = useState('WAITING');

  // Email Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Active Question
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [perQTimeLeft, setPerQTimeLeft] = useState(20);
  const timerRef = useRef(null);

  // Live Leaderboard & Results
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);
  const [finishData, setFinishData] = useState(null);

  const isHost = roomData?.hostId === user?._id || 
    roomData?.host === user?._id || 
    (typeof roomData?.host === 'object' && roomData?.host?._id === user?._id);

  // Initial HTTP Fetch of Room Data
  useEffect(() => {
    const fetchInitialRoom = async () => {
      try {
        const cleanCode = code?.trim().toUpperCase();
        const res = await API.get(`/competitions/code/${cleanCode}`);
        const cData = res.data.data;
        setRoomData(cData);
        if (cData.status === 'COMPLETED') {
          setGameState('FINISHED');
          setFinishData({
            winner: cData.winner,
            podium: [...cData.players].sort((a,b) => b.score - a.score).slice(0, 3),
            fullResults: cData.players,
          });
        }
      } catch (err) {
        console.warn('Initial room fetch warning:', err.message);
      }
    };
    if (code) fetchInitialRoom();
  }, [code]);

  // Socket Connection Lifecycle
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const joinRoomPayload = {
      roomCode: code?.trim().toUpperCase(),
      userId: user._id,
      name: user.name,
    };

    const emitJoin = () => {
      socket.emit('join_room', joinRoomPayload);
    };

    if (socket.connected) {
      emitJoin();
    } else {
      socket.on('connect', emitJoin);
    }

    // Room update event
    socket.on('room_updated', (data) => {
      setRoomData((prev) => ({
        ...prev,
        ...data,
      }));
      if (data.status === 'IN_PROGRESS' || data.status === 'QUESTION_ACTIVE') {
        setGameState('ACTIVE');
      }
    });

    // Question Started
    socket.on('question_started', (qPayload) => {
      setGameState('ACTIVE');
      setCurrentQuestion(qPayload);
      setSelectedOption(null);
      setHasAnswered(false);
      setPerQTimeLeft(qPayload.perQuestionTimeSeconds || 20);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setPerQTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // Live Leaderboard Update
    socket.on('live_leaderboard_update', (data) => {
      setLeaderboard(data.leaderboard || []);
      setLastActivity(data);
    });

    // Competition Finished
    socket.on('competition_finished', (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('FINISHED');
      setFinishData(data);

      try {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    });

    // Error
    socket.on('error_message', (msg) => {
      setError(msg);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('connect', emitJoin);
      socket.off('room_updated');
      socket.off('question_started');
      socket.off('live_leaderboard_update');
      socket.off('competition_finished');
      socket.off('error_message');
    };
  }, [code, user]);

  // Copy Room Code Helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle Ready
  const handleToggleReady = () => {
    socketRef.current.emit('toggle_ready', {
      roomCode: code,
      userId: user._id,
    });
  };

  // Host starts quiz
  const handleStartQuiz = () => {
    socketRef.current.emit('start_quiz', {
      roomCode: code,
      hostId: user._id,
    });
  };

  // Submit Answer
  const handleAnswerSubmit = (optionText) => {
    if (hasAnswered || !currentQuestion || perQTimeLeft <= 0) return;
    setSelectedOption(optionText);
    setHasAnswered(true);

    socketRef.current.emit('submit_answer', {
      roomCode: code,
      userId: user._id,
      questionIndex: currentQuestion.questionIndex,
      selectedOption: optionText,
      timeRemainingSeconds: perQTimeLeft,
    });
  };

  // Send Email Invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteMsg('');
    try {
      const res = await API.post('/competitions/invite', {
        roomCode: code,
        email: inviteEmail.trim(),
      });
      setInviteMsg(res.data.message || 'Invitation sent successfully!');
      setInviteEmail('');
      setTimeout(() => setInviteMsg(''), 4000);
    } catch (err) {
      alert('Failed to send invite: ' + (err.response?.data?.message || err.message));
    } finally {
      setInviteLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Room Notice</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">{error}</p>
        <button
          onClick={() => navigate('/competitions')}
          className="btn-gradient-primary px-5 py-2.5 rounded-xl text-white font-semibold text-xs"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // Deduplicate and sanitize player list
  const uniquePlayers = (roomData?.players || []).reduce((acc, current) => {
    const rawId = current.user 
      ? (typeof current.user === 'object' ? current.user._id?.toString() : current.user.toString())
      : current.socketId;
    
    if (rawId && !acc.some(p => {
      const pRawId = p.user 
        ? (typeof p.user === 'object' ? p.user._id?.toString() : p.user.toString())
        : p.socketId;
      return pRawId === rawId;
    })) {
      acc.push(current);
    }
    return acc;
  }, []);

  // 1. WAITING ROOM PHASE
  if (gameState === 'WAITING') {
    const currentHostId = typeof roomData?.host === 'object' 
      ? roomData?.host?._id?.toString() 
      : (roomData?.hostId || roomData?.host)?.toString();

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border-subtle)] shadow-2xl relative">
          
          {/* Room Header */}
          <div className="text-center pb-6 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center justify-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 animate-pulse" /> Live Battle Arena Lobby
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] mt-1">
              {roomData?.title || 'Multiplayer Quiz Battle'}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Topic: <strong className="text-blue-500">{roomData?.subject || 'Competitive Exam'}</strong>
            </p>

            {/* Room Code Card */}
            <div className="mt-5 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[var(--bg-main)] border border-amber-500/40 shadow-inner">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Room Code:
              </span>
              <span className="font-mono text-2xl font-black text-amber-500 tracking-wider">
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 hover:bg-amber-500/30 transition-colors ml-2 cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Share this code with your opponent or invite them via email below</p>
          </div>

          {/* Email Invite Box */}
          <div className="py-6 border-b border-[var(--border-subtle)]">
            <form onSubmit={handleSendInvite} className="max-w-xl mx-auto">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Invite Opponent Directly via Email:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter opponent's email (e.g. friend@gmail.com)..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="btn-gradient-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {inviteLoading ? 'Sending...' : 'Send Invite Link'}
                </button>
              </div>
              {inviteMsg && (
                <p className="text-xs text-emerald-500 font-semibold mt-2 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {inviteMsg}
                </p>
              )}
            </form>
          </div>

          {/* Joined Players List */}
          <div className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Contestants In Lobby ({uniquePlayers.length})
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                {uniquePlayers.length < 2 ? 'Waiting for opponent to join...' : 'Both ready for battle!'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uniquePlayers.map((player) => {
                const playerUserId = player.user 
                  ? (typeof player.user === 'object' ? player.user._id?.toString() : player.user.toString())
                  : player.socketId;

                const isPlayerHost = currentHostId && playerUserId === currentHostId;
                const isCurrentUser = user?._id && playerUserId === user._id.toString();

                return (
                  <div
                    key={playerUserId || player.socketId}
                    className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center uppercase shadow">
                        {player.name ? player.name.charAt(0) : 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {player.name || 'Competitor'}
                          </span>
                          {isPlayerHost && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                              <Crown className="w-3 h-3 fill-amber-500" /> Host
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {isCurrentUser ? '(You)' : 'Opponent'}
                        </span>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Room
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/competitions')}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Leave Room
            </button>

            {isHost ? (
              <button
                type="button"
                onClick={handleStartQuiz}
                className="btn-gradient-battle flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white shadow-xl text-sm transition-all hover:scale-105 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch Live Battle!
              </button>
            ) : (
              <div className="text-xs text-blue-500 font-bold animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Waiting for host to launch the battle...
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 2. ACTIVE LIVE GAME PHASE
  if (gameState === 'ACTIVE' && currentQuestion) {
    const qIndex = (currentQuestion.questionIndex || 0) + 1;
    const totalQ = currentQuestion.totalQuestions || 10;
    const timeRatio = perQTimeLeft / (currentQuestion.perQuestionTimeSeconds || 20);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full">
        
        {/* Top Battle HUD */}
        <div className="glass-panel p-4 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between mb-6 shadow-md">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-600 dark:text-cyan-400 font-bold text-xs">
              Question {qIndex} of {totalQ}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-semibold hidden sm:inline">
              Room #{code}
            </span>
          </div>

          {/* Synchronized Timer */}
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${perQTimeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-500'}`} />
            <span className={`font-mono font-black text-lg ${perQTimeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-[var(--text-primary)]'}`}>
              {perQTimeLeft}s
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xl mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] leading-snug mb-8">
            {currentQuestion.questionText}
          </h2>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQuestion.options.map((optText, optIdx) => {
              const isSelected = selectedOption === optText;
              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={hasAnswered || perQTimeLeft <= 0}
                  onClick={() => handleAnswerSubmit(optText)}
                  className={`p-4 rounded-2xl text-left font-semibold text-xs sm:text-sm transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 scale-[1.01]'
                      : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-blue-500/40 hover:bg-slate-200/50 dark:hover:bg-white/5'
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-white text-blue-600' : 'bg-slate-300/50 dark:bg-white/10 text-[var(--text-muted)]'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{optText}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <p className="text-center text-xs text-emerald-500 font-bold mt-6 flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Response locked in! Waiting for round completion...
            </p>
          )}
        </div>

        {/* Live Mini Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="glass-card p-4 rounded-2xl border border-[var(--border-subtle)]">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Live Standings
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {leaderboard.map((lb, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)] truncate max-w-[120px]">
                    #{lb.rank} {lb.name}
                  </span>
                  <span className="font-mono font-bold text-amber-500">
                    {lb.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  // 3. FINISHED / WINNER PODIUM PHASE
  if (gameState === 'FINISHED' && finishData) {
    const { winner, podium = [], fullResults = [] } = finishData;

    // Determine current user placement
    const currentUserId = user?._id?.toString();
    const sortedList = (fullResults.length > 0 ? fullResults : podium).sort((a, b) => (b.score || 0) - (a.score || 0));
    const userResult = sortedList.find((p) => {
      const pId = p.user ? (typeof p.user === 'object' ? p.user._id?.toString() : p.user.toString()) : p.socketId;
      return pId === currentUserId;
    });

    const isWinner = winner && (
      (winner.user && (typeof winner.user === 'object' ? winner.user._id?.toString() : winner.user.toString()) === currentUserId) ||
      winner.name === user?.name
    );

    const isDraw = sortedList.length >= 2 && sortedList[0].score === sortedList[1].score && sortedList[0].score > 0;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full text-center">
        
        {/* Main Winner Card */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-amber-500/40 shadow-2xl relative overflow-hidden mb-8">
          
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <Trophy className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            {isDraw ? 'Match Result' : 'Battle Champion'}
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] mt-1">
            {isDraw ? "It's a Draw! 🤝" : (winner?.name || sortedList[0]?.name || 'Battle Champion')}
          </h1>

          <p className="font-mono text-2xl font-bold text-amber-500 mt-2">
            {winner?.score !== undefined ? winner.score : (sortedList[0]?.score || 0)} Total Points
          </p>

          {/* Personalized User Status Banner */}
          <div className="mt-6 max-w-sm mx-auto p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-subtle)]">
            {isWinner ? (
              <span className="text-emerald-500 font-extrabold text-sm flex items-center justify-center gap-1.5">
                <Crown className="w-4 h-4 fill-emerald-500" /> VICTORY! You won this match! 🎉
              </span>
            ) : isDraw ? (
              <span className="text-amber-500 font-bold text-sm">
                Both players scored equally! Well matched!
              </span>
            ) : (
              <span className="text-blue-500 font-bold text-sm">
                Good fight! You scored {userResult?.score || 0} points!
              </span>
            )}
          </div>

          {/* Direct 1v1 Comparison Board */}
          <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Final Scoreboard
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {sortedList.slice(0, 4).map((p, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center justify-between text-left ${
                    idx === 0 
                      ? 'bg-amber-500/10 border-amber-500/40' 
                      : 'bg-[var(--bg-main)] border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-[var(--text-primary)] block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {p.correctCount || 0} correct answers
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-black text-sm text-[var(--text-primary)]">
                    {p.score || 0} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/competitions')}
            className="btn-gradient-battle px-6 py-3 rounded-2xl font-bold text-white text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            Play Another Battle
          </button>
          <button
            type="button"
            onClick={() => navigate('/leaderboard')}
            className="px-6 py-3 rounded-2xl font-bold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-blue-500/40 text-xs transition-colors cursor-pointer"
          >
            Global Rankings
          </button>
        </div>

      </div>
    );
  }

  return null;
};

export default CompetitionArena;
