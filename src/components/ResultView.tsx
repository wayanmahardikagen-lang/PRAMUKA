import React, { useState } from 'react';
import { 
  Award, Trophy, Clock, CheckCircle2, RotateCcw, 
  FileText, ArrowRight, Sparkles, BookOpen, Home, MapPin, Download 
} from 'lucide-react';
import { PlayerSession, ScoutBadge, GameSettings, ScoutPost } from '../types';
import badgeAssetImg from '../assets/images/scout_treasure_badge_1791784538360.jpg';
import { CertificateModal } from './CertificateModal';
import { sound } from '../utils/audio';

interface ResultViewProps {
  session: PlayerSession;
  badges: ScoutBadge[];
  posts: ScoutPost[];
  settings: GameSettings;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onGoHome: () => void;
  onViewMap: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  session,
  badges,
  posts,
  settings,
  onPlayAgain,
  onViewLeaderboard,
  onGoHome,
  onViewMap,
}) => {
  const [showCertificate, setShowCertificate] = useState(false);

  const durationSeconds = Math.max(
    60,
    Math.round(((session.endTime || Date.now()) - session.startTime) / 1000)
  );
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  const earnedBadgeList = badges.filter(b => session.earnedBadges.includes(b.id));

  // Mastery feedback
  const getMasteryAnalysis = () => {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (session.hintsUsed === 0) {
      strengths.push('Ketajaman Logika: Menyelesaikan semua sandi & kompas tanpa bantuan petunjuk.');
    } else {
      strengths.push('Ketekunan Berpikir: Mampu memanfaatkan petunjuk dengan taktis.');
      improvements.push('Kecepatan Analisis Sandi: Tingkatkan latihan membaca kode morse tanpa bantuan.');
    }

    if (session.completedPosts.length === posts.length) {
      strengths.push('Daya Juang Penjelajah: Menuntaskan seluruh 7 pos dari Gerbang Rimba hingga Peti Akhir.');
    }

    if (session.mode === 'BEREGU') {
      strengths.push('Kekompakan Regu: Koordinasi pemecahan masalah bersama seluruh anggota tim.');
    } else {
      strengths.push('Kemandirian Pandu: Kemampuan navigasi mandiri yang luar biasa.');
    }

    strengths.push('Penguasaan Tali-Temali & Nilai Dasa Darma dalam perkemahan.');
    improvements.push('Keterampilan Pionering Lanjutan: Berlatihlah membuat dragbar tandu darurat dan menara pandang.');

    return { strengths, improvements };
  };

  const { strengths, improvements } = getMasteryAnalysis();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Top Quick Navigation Bar */}
      <div className="flex items-center justify-between bg-stone-900 border border-stone-800 rounded-2xl p-4 text-xs">
        <button
          onClick={() => {
            sound.playClick();
            onGoHome();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Halaman Awal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onViewMap();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Lihat Peta Pos</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onViewLeaderboard();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Peringkat</span>
          </button>
        </div>
      </div>

      {/* Hero Victory Card */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 border-2 border-amber-600/60 rounded-3xl p-6 sm:p-10 text-stone-100 shadow-2xl text-center space-y-4 relative overflow-hidden">
        {/* Glow light effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border-4 border-amber-400 shadow-xl mb-2">
          <img
            src={badgeAssetImg}
            alt="Piala Kelulusan Penjelajah Pramuka"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Misi Penjelajah Selesai dengan Gemilang!</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white">
          Selamat, {session.mode === 'BEREGU' ? session.reguName || session.name : session.name}!
        </h1>

        <p className="text-stone-300 text-sm max-w-lg mx-auto leading-relaxed">
          Kamu telah menaklukkan seluruh rintangan pos kepramukaan di{' '}
          <strong className="text-white">{settings.schoolName}</strong> dengan penuh semangat dan kehormatan.
        </p>

        {/* 4 Stats KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto text-left">
          <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Total Skor</div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
              {session.score}
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Pos Tuntas</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {session.completedPosts.length}/{posts.length}
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Waktu Jelajah</div>
            <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
              {minutes}m {seconds}s
            </div>
          </div>

          <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800">
            <div className="text-[10px] text-stone-400 uppercase font-bold">Lencana</div>
            <div className="text-2xl font-mono font-bold text-yellow-400 tabular-nums">
              {earnedBadgeList.length}
            </div>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="pt-4 flex flex-wrap justify-center gap-3">
          {/* Certificate & PNG button */}
          <button
            onClick={() => {
              sound.playClick();
              setShowCertificate(true);
            }}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <Download className="w-5 h-5 text-stone-950" />
            <span>Simpan Sertifikat (PNG / Cetak)</span>
          </button>

          {/* Go to Home button */}
          <button
            onClick={() => {
              sound.playClick();
              onGoHome();
            }}
            className="px-5 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm flex items-center gap-2 border border-stone-700 active:scale-95 transition-all"
          >
            <Home className="w-5 h-5 text-amber-400" />
            <span>Kembali ke Halaman Awal</span>
          </button>

          {/* Leaderboard button */}
          <button
            onClick={() => {
              sound.playClick();
              onViewLeaderboard();
            }}
            className="px-5 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm flex items-center gap-2 border border-stone-700 active:scale-95 transition-all"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Papan Peringkat</span>
          </button>
        </div>
      </div>

      {/* Badges Earned Showcase */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-stone-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base text-white">Lencana Kehormatan yang Diraih</h2>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {earnedBadgeList.length} dari {badges.length} Lencana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const isEarned = session.earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  isEarned
                    ? 'bg-stone-950 border-amber-600/60 text-stone-200'
                    : 'bg-stone-950/40 border-stone-800 text-stone-600 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow ${
                    isEarned
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950'
                      : 'bg-stone-800 text-stone-600'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{badge.name}</div>
                  <div className="text-[11px] text-stone-400 leading-snug mt-0.5">
                    {badge.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mastery Review & Improvement Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-stone-100 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Materi yang Sudah Dikuasai
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-stone-300">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Practice */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 text-stone-100 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Saran Latihan Mandiri Berikutnya
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-stone-300">
            {improvements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Restart / Replay option */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-stone-800 text-xs">
        <button
          onClick={() => {
            sound.playClick();
            onGoHome();
          }}
          className="text-stone-300 hover:text-white flex items-center gap-1.5 underline decoration-stone-600 underline-offset-4"
        >
          <Home className="w-3.5 h-3.5 text-amber-400" />
          <span>Kembali ke Halaman Awal / Beranda</span>
        </button>
        <span className="text-stone-600 hidden sm:inline">·</span>
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="text-stone-400 hover:text-white flex items-center gap-1.5 underline decoration-stone-600 underline-offset-4"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mulai Petualangan Baru / Ganti Regu</span>
        </button>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal
          session={session}
          settings={settings}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};
