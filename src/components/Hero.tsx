import React, { useState } from 'react';
import { Compass, Users, User, ArrowRight, ShieldCheck, MapPin, QrCode, Sparkles, BookOpen, ChevronRight, Award, LogOut } from 'lucide-react';
import { GameMode, PlayerSession, ScoutPost } from '../types';
import heroImg from '../assets/images/hero_scout_adventure_1791784516990.jpg';

interface HeroProps {
  session: PlayerSession | null;
  posts: ScoutPost[];
  onStartGame: (mode: GameMode) => void;
  onResumeGame: () => void;
  onOpenScanner: () => void;
  onNavigateMap: () => void;
  onViewResult?: () => void;
  onLogout?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  session,
  posts,
  onStartGame,
  onResumeGame,
  onOpenScanner,
  onNavigateMap,
  onViewResult,
  onLogout,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const completedCount = session?.completedPosts.length || 0;
  const progressPercent = Math.round((completedCount / posts.length) * 100);
  const isAllDone = completedCount === posts.length && posts.length > 0;

  return (
    <div className="w-full">
      {/* Hero Visual Banner & Title Section */}
      <section className="relative overflow-hidden bg-stone-900 border-b border-stone-800 text-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-400">
              <span className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
                Ekstrakurikuler Pramuka
              </span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-300">Gugus Depan SD Negeri 1 Loloan Timur</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              JELAJAH PRAMUKA:<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                MISI PENJELAJAH
              </span>
            </h1>

            <p className="text-stone-300 text-base sm:text-lg max-w-xl font-medium leading-relaxed">
              "Temukan Petunjuk, Pecahkan Sandi, Taklukkan Tantangan!"
            </p>

            <p className="text-stone-400 text-sm max-w-xl leading-relaxed">
              Petualangan kepramukaan interaktif di lingkungan sekolah. Jelajahi 7 pos pos petualangan, pindai QR Code di setiap pos dengan kamera HP, pecahkan sandi morse dan teka-teki, serta kumpulkan lencana kehormatan!
            </p>

            {/* Active Session Card or Quick Start */}
            {session ? (
              <div className="p-4 sm:p-5 rounded-xl bg-stone-800/90 border border-amber-600/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs uppercase tracking-wider font-bold block ${
                      isAllDone ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {isAllDone ? '🎉 Seluruh Pos Berhasil Dituntaskan!' : 'Petualangan Sedang Berlangsung'}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white">
                      {session.mode === 'BEREGU' ? `Regu: ${session.reguName || session.name}` : session.name}
                    </span>
                    <span className="text-xs text-stone-400 ml-2">({session.grade})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-mono font-bold text-amber-400 tabular-nums">
                      {session.score} Poin
                    </div>
                    <div className="text-xs text-stone-400">
                      {completedCount} dari {posts.length} Pos Selesai
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {isAllDone && onViewResult ? (
                    <button
                      onClick={onViewResult}
                      className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow active:scale-95"
                    >
                      <Award className="w-4 h-4 text-stone-950" />
                      <span>Buka Hasil & Sertifikat</span>
                    </button>
                  ) : (
                    <button
                      onClick={onResumeGame}
                      className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow active:scale-95"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Lanjutkan Peta</span>
                    </button>
                  )}

                  {!isAllDone && (
                    <button
                      onClick={onOpenScanner}
                      className="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Scan QR di Pos</span>
                    </button>
                  )}

                  {isAllDone && (
                    <button
                      onClick={onResumeGame}
                      className="px-4 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm flex items-center justify-center gap-2 transition-all border border-stone-700 active:scale-95"
                    >
                      <Compass className="w-4 h-4 text-amber-400" />
                      <span>Peta Pos</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-3.5 py-2.5 rounded-lg bg-stone-900 hover:bg-red-950/80 hover:text-red-200 border border-stone-700 hover:border-red-800 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-sm"
                      title="Keluar / Ganti Akun Siswa atau Regu"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span>Keluar</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Pilih Mode Permainan Siswa:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    onClick={() => onStartGame('BEREGU')}
                    className="p-4 rounded-xl bg-gradient-to-br from-amber-700/40 to-stone-800 border border-amber-600/50 hover:border-amber-400 text-left transition-all hover:translate-y-[-2px] group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-bold text-white text-base">Mode Beregu</div>
                    <p className="text-xs text-stone-300 mt-1">
                      1 HP untuk satu regu Pramuka. Berdiskusi, pecahkan sandi, dan raih kemenangan bersama!
                    </p>
                  </button>

                  <button
                    onClick={() => onStartGame('INDIVIDU')}
                    className="p-4 rounded-xl bg-gradient-to-br from-stone-800 to-stone-850 border border-stone-700 hover:border-amber-400 text-left transition-all hover:translate-y-[-2px] group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-stone-700 text-amber-300 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="font-bold text-white text-base">Mode Individu</div>
                    <p className="text-xs text-stone-300 mt-1">
                      Tantangan mandiri untuk menguji kecakapan dan ketangkasan pengetahuan kepramukaanmu.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Quick guide trigger */}
            <div className="pt-1 flex items-center gap-4 text-xs text-stone-400">
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
              >
                <BookOpen className="w-4 h-4" />
                <span>Petunjuk & Aturan Main Siswa</span>
              </button>
              <span>·</span>
              <button
                onClick={onNavigateMap}
                className="hover:text-stone-300 transition-colors"
              >
                Lihat 7 Pos Petualangan
              </button>
            </div>
          </div>

          {/* Right Visual Image Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border-2 border-stone-700 shadow-2xl bg-stone-800 aspect-[16/10] lg:aspect-auto lg:h-[420px]">
              <img
                src={heroImg}
                alt="Pramuka Cilik SD Negeri 1 Loloan Timur Berpetualang di Hutan Rimba"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />
              
              {/* Bottom Badge Floating Info */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-stone-900/90 backdrop-blur-md border border-stone-700/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">7 Pos Lapangan</div>
                    <div className="text-[11px] text-stone-400">Sandi · Kompas · Simpul · Jejak</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    Sistem QR Code
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps Highlight Section */}
      <section className="bg-stone-950 py-10 px-4 sm:px-6 border-b border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs uppercase tracking-wider text-amber-500 font-bold">
              Cara Kerja Misi
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Alur Petualangan di Lapangan Sekolah
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-lg mb-3">
                1
              </div>
              <h3 className="font-bold text-white text-base">Cari Pos & Scan QR</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Temukan poster pos yang tersebar di halaman SDN 1 Loloan Timur. Tekan tombol kamera untuk memindai kode QR unik di setiap pos.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-lg mb-3">
                2
              </div>
              <h3 className="font-bold text-white text-base">Pecahkan Tantangan</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Tantangan terbuka otomatis! Bunyikan kode Morse, tentukan jarum kompas, cocokkan simpul tali, dan pilih tindakan Dasa Darma.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono font-bold text-lg mb-3">
                3
              </div>
              <h3 className="font-bold text-white text-base">Raih Poin & Sertifikat</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Dapatkan 100 poin penuh pada percobaan pertama, kumpulkan 7 lencana kehormatan, dan cetak sertifikat resmi digital!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 text-stone-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">Panduan Bermain Penjelajah</h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-stone-400 hover:text-white text-sm font-semibold p-1"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              <div className="p-3 bg-stone-800/80 rounded-lg space-y-1">
                <span className="font-bold text-amber-300 block">1. Izin Kamera & QR Code</span>
                <p>
                  Pastikan browser HP memberikan izin kamera saat menekan tombol "Scan QR". Jika kamera bermasalah, gunakan opsi ketik kode pos manual atau unggah foto QR.
                </p>
              </div>

              <div className="p-3 bg-stone-800/80 rounded-lg space-y-1">
                <span className="font-bold text-amber-300 block">2. Sistem Skor Jujur</span>
                <p>
                  Jawaban benar tanpa petunjuk bernilai 100 poin. Menggunakan 1 petunjuk bernilai 75 poin, dan 2 petunjuk bernilai 50 poin. Setiap pos hanya dapat diselesaikan satu kali.
                </p>
              </div>

              <div className="p-3 bg-stone-800/80 rounded-lg space-y-1">
                <span className="font-bold text-amber-300 block">3. Kerja Sama Regu</span>
                <p>
                  Untuk mode regu, diskusikan jawaban bersama teman regu. Satu anggota dapat memegang HP sambil mencatat petunjuk berikutnya.
                </p>
              </div>

              <div className="p-3 bg-stone-800/80 rounded-lg space-y-1">
                <span className="font-bold text-amber-300 block">4. Keselamatan & Etika</span>
                <p>
                  Berjalanlah dengan tertib, jangan berlari membahayakan diri di area sekolah, jaga kebersihan, dan junjung Tri Satya serta Dasa Darma Pramuka!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all"
            >
              Saya Siap Bertualang!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
