import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
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
  Sparkles
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

  const isHost = roomData?.hostId === user?._id || roomData?.host === user?._id;

  // Socket Connection Lifecycle
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // Join room
    socket.emit('join_room', {
      roomCode: code,
      userId: user._id,
      name: user.name,
    });

    // Room update event
    socket.on('room_updated', (data) => {
      setRoomData(data);
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

      // Reset timer
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
      setLeaderboard(data.leaderboard);
      setLastActivity(data);
    });

    // Competition Finished
    socket.on('competition_finished', (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('FINISHED');
      setFinishData(data);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
      });
    });

    // Error
    socket.on('error_message', (msg) => {
      setError(msg);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

  // Host advances question
  const handleNextQuestion = () => {
    socketRef.current.emit('next_question', {
      roomCode: code,
    });
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 glass-panel rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Room Notice</h3>
        <p className="text-sm text-gray-400 mt-2 mb-6">{error}</p>
        <button
          onClick={() => navigate('/competitions')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // 1. WAITING ROOM PHASE
  if (gameState === 'WAITING') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative">
          
          {/* Room Code Card */}
          <div className="text-center pb-8 border-b border-white/10">
            <span className="text-xs font-bold uppercase tracking-widest text-pink-400">
              Battle Room Lobby
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              {roomData?.title || 'Multiplayer Quiz Battle'}
            </h1>

            {/* Room Code Banner */}
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-900/80 border border-pink-500/40 shadow-inner">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Room Code:
              </span>
              <span className="font-mono text-2xl font-black text-pink-400 tracking-wider">
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors ml-2"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Share this code with your friends to join</p>
          </div>

            {/* Joined Players List */}
            <div className="py-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Players Joined ({
                    (roomData?.players || []).filter((p, i, arr) => {
                      const uid = typeof p.user === 'object' ? p.user?._id : p.user;
                      return arr.findIndex(x => (typeof x.user === 'object' ? x.user?._id : x.user) === uid) === i;
                    }).length || 1
                  })
                </h3>
                <span className="text-xs text-gray-400">
                  Waiting for host to start...
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(roomData?.players || [])
                  .filter((p, i, arr) => {
                    const uid = typeof p.user === 'object' ? p.user?._id : p.user;
                    return arr.findIndex(x => (typeof x.user === 'object' ? x.user?._id : x.user) === uid) === i;
                  })
                  .map((player) => {
                    const playerUserId = typeof player.user === 'object' ? player.user?._id : player.user;
                    const hostId = typeof roomData.host === 'object' ? roomData.host?._id : (roomData.hostId || roomData.host);
                    const isPlayerHost = playerUserId === hostId;
                    const isCurrentUser = playerUserId === user?._id;
                    return (
                      <div
                        key={playerUserId || player.socketId}
                    className="p-4 rounded-2xl bg-gray-900/60 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-white">{player.name}</span>
                          {isPlayerHost && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {player.user === user._id ? '(You)' : 'Player'}
                        </span>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Ready
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/competitions')}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Leave Room
            </button>

            {isHost ? (
              <button
                type="button"
                onClick={handleStartQuiz}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-xl shadow-pink-600/25 text-sm transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Competition Battle
              </button>
            ) : (
              <div className="text-xs text-indigo-400 font-medium animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Waiting for host to launch the battle...
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 2. ACTIVE LIVE QUIZ PHASE
  if (gameState === 'ACTIVE') {
    const totalQ = currentQuestion?.totalQuestions || 10;
    const qIndex = (currentQuestion?.questionIndex || 0) + 1;
    const progressPercent = ((currentQuestion?.perQuestionTimeSeconds - perQTimeLeft) / currentQuestion?.perQuestionTimeSeconds) * 100;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col flex-1">
        
        {/* Synchronized Header */}
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center justify-between gap-4 mb-6 border border-white/10">
          <div>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Question {qIndex} of {totalQ}
            </span>
            <h2 className="text-lg font-bold text-white">Live Multiplayer Arena</h2>
          </div>

          {/* Per-Question Live Countdown */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/40 font-mono font-bold text-sm text-pink-300">
            <Clock className="w-4 h-4" />
            <span>00:{String(perQTimeLeft).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-1000 linear"
            style={{ width: `${100 - progressPercent}%` }}
          />
        </div>

        {/* Main Grid: Question & Live Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          
          {/* Active Question Box */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="pb-4 mb-6 border-b border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span className="uppercase font-semibold tracking-wider text-indigo-400">
                  {currentQuestion?.difficulty} Question
                </span>
                <span>Speed Bonus Active: +{Math.round(perQTimeLeft * 2.5)} pts</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-8 leading-snug">
                {currentQuestion?.questionText}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion?.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === opt;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasAnswered || perQTimeLeft <= 0}
                      onClick={() => handleAnswerSubmit(opt)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                        isSelected
                          ? 'bg-pink-600/30 border-pink-500 text-white shadow-lg shadow-pink-600/20'
                          : 'bg-gray-900/40 border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {letter}
                      </div>
                      <span className="text-base font-normal">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Answer Status / Host Next Control */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              {hasAnswered ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Answer locked in! Waiting for round to end...
                </span>
              ) : perQTimeLeft === 0 ? (
                <span className="text-xs font-semibold text-rose-400">
                  Time expired for this question!
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  Tap your answer quickly for maximum speed bonus points!
                </span>
              )}

              {isHost && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all ml-auto"
                >
                  Next Question
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Live Dynamic Leaderboard */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Live Leaderboard
            </h4>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {(leaderboard.length > 0 ? leaderboard : roomData?.players || []).map((pl, idx) => {
                const rank = pl.rank || idx + 1;
                const isYou = pl.userId === user._id || pl.user === user._id;

                let badgeColor = 'bg-gray-800 text-gray-400';
                if (rank === 1) badgeColor = 'bg-amber-500 text-black font-black';
                else if (rank === 2) badgeColor = 'bg-slate-300 text-black font-bold';
                else if (rank === 3) badgeColor = 'bg-amber-700 text-white font-bold';

                return (
                  <div
                    key={pl.userId || pl.user || idx}
                    className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                      isYou
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white shadow-md'
                        : 'bg-gray-900/60 border border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center ${badgeColor}`}>
                        {rank}
                      </div>
                      <span className="text-xs font-semibold line-clamp-1">
                        {pl.name} {isYou && '(You)'}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-bold text-amber-300">
                      {pl.score || 0} pts
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Micro alert for last answered player */}
            {lastActivity && (
              <div className="mt-4 p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 text-center animate-fade-in">
                ⚡ <strong className="text-white">{lastActivity.lastAnsweredBy}</strong> just answered!
              </div>
            )}
          </div>

        </div>

      </div>
    );
  }

  // 3. FINISHED / WINNER PODIUM PHASE
  if (gameState === 'FINISHED' && finishData) {
    const { winner, podium, fullResults } = finishData;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full text-center">
        
        {/* Winner Hero Banner */}
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-pink-500/30 shadow-2xl relative overflow-hidden mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <Trophy className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Battle Champion
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white mt-1">
            {winner?.name || 'Top Competitor'}
          </h1>

          <p className="font-mono text-2xl font-bold text-amber-300 mt-2">
            {winner?.score} Total Points
          </p>

          {/* Podium 1st, 2nd, 3rd */}
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg mx-auto items-end">
            
            {/* 2nd Place */}
            {podium[1] && (
              <div className="p-4 rounded-2xl bg-gray-800/80 border border-slate-400/30 h-36 flex flex-col justify-end">
                <span className="text-lg">🥈</span>
                <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{podium[1].name}</h4>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{podium[1].score} pts</p>
                <div className="w-full h-8 bg-slate-500/30 rounded-lg mt-2 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  #2
                </div>
              </div>
            )}

            {/* 1st Place */}
            {podium[0] && (
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-400/50 h-44 flex flex-col justify-end shadow-xl shadow-amber-500/10">
                <span className="text-2xl">🥇</span>
                <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{podium[0].name}</h4>
                <p className="text-[11px] text-amber-300 font-mono mt-0.5">{podium[0].score} pts</p>
                <div className="w-full h-14 bg-amber-500/40 rounded-lg mt-2 flex items-center justify-center text-xs font-black text-amber-200">
                  #1
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {podium[2] && (
              <div className="p-4 rounded-2xl bg-gray-800/80 border border-amber-700/30 h-28 flex flex-col justify-end">
                <span className="text-base">🥉</span>
                <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{podium[2].name}</h4>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{podium[2].score} pts</p>
                <div className="w-full h-6 bg-amber-800/30 rounded-lg mt-2 flex items-center justify-center text-[10px] font-bold text-amber-400">
                  #3
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/competitions')}
            className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-lg shadow-pink-600/20 text-xs transition-all hover:scale-105"
          >
            Play Another Battle
          </button>
          <button
            type="button"
            onClick={() => navigate('/leaderboard')}
            className="px-6 py-3 rounded-2xl font-bold text-gray-300 glass-card hover:bg-white/10 text-xs transition-colors"
          >
            View Global Rankings
          </button>
        </div>

      </div>
    );
  }

  return null;
};

export default CompetitionArena;
