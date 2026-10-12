import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, HelpCircle, CheckCircle2, AlertCircle, Volume2, 
  Compass, Award, ArrowRight, Lightbulb, Sparkles, RefreshCw
} from 'lucide-react';
import { Challenge, ScoutPost, ScoutBadge, PlayerSession } from '../types';
import { sound } from '../utils/audio';

interface ChallengeModalProps {
  post: ScoutPost;
  challenge: Challenge;
  badge: ScoutBadge | undefined;
  session: PlayerSession;
  onClose: () => void;
  onChallengeCompleted: (result: {
    pointsAwarded: number;
    hintsUsed: number;
  }) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  post,
  challenge,
  badge,
  session,
  onClose,
  onChallengeCompleted,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [selectedCompassDir, setSelectedCompassDir] = useState<string>('');
  const [matchingState, setMatchingState] = useState<Record<string, string>>({});
  const [activeLeftPair, setActiveLeftPair] = useState<string | null>(null);

  const [hintsUnlocked, setHintsUnlocked] = useState<number>(0);
  const [isPlayingMorse, setIsPlayingMorse] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Feedback state
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    points: number;
  }>({
    status: 'idle',
    message: '',
    points: 100,
  });

  // Calculate current potential points
  const calculateCurrentPoints = () => {
    if (hintsUnlocked === 0) return 100;
    if (hintsUnlocked === 1) return 75;
    return 50;
  };

  const handleUnlockHint = () => {
    sound.playClick();
    if (hintsUnlocked < challenge.hints.length) {
      setHintsUnlocked(prev => prev + 1);
    }
  };

  const handlePlayMorse = () => {
    if (!challenge.morseAudioString || isPlayingMorse) return;
    setIsPlayingMorse(true);
    sound.playMorseCode(challenge.morseAudioString, () => {
      setIsPlayingMorse(false);
    });
  };

  const handleCompassSelect = (dir: string) => {
    sound.playClick();
    setSelectedCompassDir(dir);
  };

  const handlePairMatch = (rightSide: string) => {
    if (!activeLeftPair) return;
    sound.playClick();
    setMatchingState(prev => ({
      ...prev,
      [activeLeftPair]: rightSide
    }));
    setActiveLeftPair(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let userAnswer = '';

    if (challenge.type === 'MULTIPLE_CHOICE' || challenge.type === 'MORSE_DECODE' || challenge.type === 'CIPHER_NUMBER') {
      userAnswer = selectedOption;
    } else if (challenge.type === 'COMPASS_PICKER') {
      userAnswer = selectedCompassDir;
    } else if (challenge.type === 'SHORT_INPUT') {
      userAnswer = textAnswer.trim().toUpperCase();
    } else if (challenge.type === 'MATCHING_PAIRS') {
      // Check if all pairs are filled
      const pairs = challenge.matchingPairs || [];
      const isComplete = pairs.every(p => matchingState[p.left]);
      if (!isComplete) {
        setFeedback({
          status: 'error',
          message: 'Silakan pasangkan semua simpul dengan kegunaannya sebelum memeriksa jawaban.',
          points: 0,
        });
        sound.playError();
        return;
      }
      // Check correctness
      const isAllCorrect = pairs.every(p => matchingState[p.left] === p.right);
      if (isAllCorrect) {
        triggerSuccess();
      } else {
        triggerError('Masih ada pasangan simpul yang kurang tepat. Periksa kembali dan coba pasangkan ulang!');
      }
      return;
    }

    if (!userAnswer) {
      setFeedback({
        status: 'error',
        message: 'Silakan pilih atau masukkan jawabanmu terlebih dahulu.',
        points: 0,
      });
      sound.playError();
      return;
    }

    // Validate string answer
    const isCorrect = Array.isArray(challenge.correctAnswer)
      ? challenge.correctAnswer.includes(userAnswer)
      : challenge.correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();

    if (isCorrect) {
      triggerSuccess();
    } else {
      triggerError('Jawaban belum tepat! Diskusikan kembali bersama regu atau gunakan petunjuk di atas.');
    }
  };

  const triggerSuccess = () => {
    setIsSubmitting(true);
    sound.playVictoryFanfare();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    const earnedPoints = calculateCurrentPoints();

    setFeedback({
      status: 'success',
      message: `Luar Biasa! Jawabanmu Tepat! Berhasil mendapatkan ${earnedPoints} poin untuk ${session.mode === 'BEREGU' ? session.reguName : session.name}.`,
      points: earnedPoints,
    });
  };

  const triggerError = (msg: string) => {
    sound.playError();
    setFeedback({
      status: 'error',
      message: msg,
      points: 0,
    });
  };

  const handleFinish = () => {
    sound.playClick();
    onChallengeCompleted({
      pointsAwarded: feedback.points,
      hintsUsed: hintsUnlocked,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 text-stone-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm shadow">
              {post.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  {challenge.category}
                </span>
                <span className="text-xs text-stone-400">· Tingkat: {challenge.difficulty}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Pos {post.number}: {post.name}
              </h2>
            </div>
          </div>

          {feedback.status !== 'success' && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Potential Score & Hint Bar */}
        <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-800 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-stone-300">Nilai Misi Ini:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {calculateCurrentPoints()} Poin
            </span>
          </div>

          {hintsUnlocked < challenge.hints.length && feedback.status !== 'success' && (
            <button
              type="button"
              onClick={handleUnlockHint}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 underline decoration-amber-500/50"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Buka Petunjuk (-25 Poin)</span>
            </button>
          )}
        </div>

        {/* Display Unlocked Hints if any */}
        {hintsUnlocked > 0 && (
          <div className="mb-4 space-y-2">
            {challenge.hints.slice(0, hintsUnlocked).map((hint, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Petunjuk #{i + 1}:</span> {hint}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompt Question */}
        <div className="space-y-3 mb-5">
          <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
            {challenge.prompt}
          </h3>

          {/* Special Detail: Morse Audio or Cipher String */}
          {challenge.detailText && (
            <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/40 font-mono text-center tracking-widest text-base sm:text-lg text-amber-300 shadow-inner">
              {challenge.detailText}
            </div>
          )}

          {/* Interactive Morse Audio Button */}
          {challenge.morseAudioString && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handlePlayMorse}
                disabled={isPlayingMorse}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  isPlayingMorse
                    ? 'bg-amber-600 text-stone-950 animate-pulse'
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/50'
                }`}
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>{isPlayingMorse ? 'Memutar Kode Morse...' : 'Dengarkan Bunyi Morse (Titik-Garis)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Answer Input Form */}
        {feedback.status !== 'success' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Type 1 & 2: Multiple Choice / Morse Decoded options / Cipher Options */}
            {(challenge.type === 'MULTIPLE_CHOICE' ||
              challenge.type === 'MORSE_DECODE' ||
              challenge.type === 'CIPHER_NUMBER') &&
              challenge.options && (
                <div className="space-y-2">
                  {challenge.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedOption(opt);
                      }}
                      className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all flex items-start gap-3 ${
                        selectedOption === opt
                          ? 'bg-amber-500/20 border-amber-500 text-amber-100 shadow-sm ring-1 ring-amber-500'
                          : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-800/40'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="pt-0.5 leading-snug">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

            {/* Type 3: Interactive Compass Direction Picker */}
            {challenge.type === 'COMPASS_PICKER' && (
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-4">
                <div className="text-center text-xs text-stone-400">
                  Pilih salah satu arah mata angin pada lingkaran navigasi:
                </div>

                <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-stone-700 bg-stone-900 flex items-center justify-center shadow-inner">
                  {/* Compass needle indicator */}
                  <div className="absolute w-1 h-36 bg-gradient-to-t from-stone-600 via-transparent to-red-600 pointer-events-none rounded-full" />
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md z-10 text-xs">
                    <Compass className="w-5 h-5 text-stone-950" />
                  </div>

                  {/* 4 Cardinal buttons */}
                  <button
                    type="button"
                    onClick={() => handleCompassSelect('Utara')}
                    className={`absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      selectedCompassDir === 'Utara'
                        ? 'bg-red-600 text-white ring-2 ring-white'
                        : 'bg-stone-800 text-red-400 hover:bg-stone-700'
                    }`}
                  >
                    U (Utara)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompassSelect('Timur')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      selectedCompassDir === 'Timur'
                        ? 'bg-amber-500 text-stone-950 ring-2 ring-white'
                        : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    T (Timur)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompassSelect('Selatan')}
                    className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      selectedCompassDir === 'Selatan'
                        ? 'bg-amber-500 text-stone-950 ring-2 ring-white'
                        : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    S (Selatan)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompassSelect('Barat')}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      selectedCompassDir === 'Barat'
                        ? 'bg-amber-500 text-stone-950 ring-2 ring-white'
                        : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    B (Barat)
                  </button>
                </div>

                <div className="text-center font-bold text-sm text-amber-300">
                  {selectedCompassDir ? `Arah Terpilih: ${selectedCompassDir}` : 'Belum ada arah dipilih'}
                </div>
              </div>
            )}

            {/* Type 4: Matching Pairs (Tali-Temali Simpul) */}
            {challenge.type === 'MATCHING_PAIRS' && challenge.matchingPairs && (
              <div className="space-y-4">
                <div className="text-xs text-stone-400">
                  Langkah 1: Klik nama Simpul di kiri. Langkah 2: Klik kegunaan yang cocok di kanan.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Left items */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Nama Simpul:
                    </span>
                    {challenge.matchingPairs.map((pair, idx) => {
                      const isMatched = !!matchingState[pair.left];
                      const isSelected = activeLeftPair === pair.left;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setActiveLeftPair(pair.left);
                          }}
                          className={`w-full p-2.5 rounded-lg text-left text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-stone-950 border-amber-400'
                              : isMatched
                              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                              : 'bg-stone-950 border-stone-800 text-stone-200 hover:border-stone-700'
                          }`}
                        >
                          {pair.left} {isMatched && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right items */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Kegunaan Simpul:
                    </span>
                    {challenge.matchingPairs.map((pair, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePairMatch(pair.right)}
                        className={`w-full p-2.5 rounded-lg text-left text-xs border transition-all ${
                          activeLeftPair
                            ? 'bg-stone-900 border-amber-500/80 hover:bg-amber-950/40 text-stone-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400'
                        }`}
                      >
                        {pair.right}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset matching button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMatchingState({});
                      setActiveLeftPair(null);
                    }}
                    className="text-[11px] text-stone-400 hover:text-white underline"
                  >
                    Ulangi Pasangan
                  </button>
                </div>
              </div>
            )}

            {/* Type 5: Short Input */}
            {challenge.type === 'SHORT_INPUT' && (
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Tuliskan Jawaban Rahasiamu:
                </label>
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Ketik kata jawaban di sini..."
                  className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono text-base uppercase focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Error Feedback Banner */}
            {feedback.status === 'error' && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Check Answer Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Periksa Jawaban Sekarang</span>
            </button>
          </form>
        ) : (
          /* Victory & Explanation State */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-100 space-y-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="font-bold text-base text-white">
                  {feedback.message}
                </div>
              </div>

              {/* Badge celebration */}
              {badge && (
                <div className="p-3 bg-stone-950/80 rounded-xl border border-amber-500/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center shadow">
                    <Sparkles className="w-5 h-5 text-stone-950" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                      Lencana Baru Dibuka!
                    </div>
                    <div className="font-bold text-white text-sm">{badge.name}</div>
                    <div className="text-[11px] text-stone-300">{badge.description}</div>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="text-xs text-emerald-200/90 leading-relaxed pt-1 border-t border-emerald-800/80">
                <span className="font-bold text-white">Penjelasan Materi: </span>
                {challenge.explanation}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
            >
              <span>Lanjut ke Peta Petualangan</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
