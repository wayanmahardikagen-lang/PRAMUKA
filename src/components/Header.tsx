import React from 'react';
import { Volume2, VolumeX, QrCode, LogOut, Compass } from 'lucide-react';
import { PlayerSession } from '../types';

interface HeaderProps {
  currentTab: 'home' | 'map' | 'result' | 'leaderboard' | 'pembina';
  onNavigate: (tab: 'home' | 'map' | 'result' | 'leaderboard' | 'pembina') => void;
  session: PlayerSession | null;
  onOpenScanner: () => void;
  onLogout: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  session,
  onOpenScanner,
  onLogout,
  isAudioMuted,
  onToggleAudio,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Single element brand wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group shrink-0 focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-black shadow-md shadow-amber-900/40">
            <Compass className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-amber-100 whitespace-nowrap block leading-tight">
              Jelajah Pramuka
            </span>
            <span className="text-[11px] text-stone-400 font-medium hidden sm:block leading-none">
              SD Negeri 1 Loloan Timur
            </span>
          </div>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-stone-300">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'home' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'hover:text-amber-200'
            }`}
          >
            Beranda
          </button>
          
          <button
            onClick={() => onNavigate('map')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'map' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'hover:text-amber-200'
            }`}
          >
            Peta Pos
          </button>

          {session && session.completedPosts.length >= 7 && (
            <button
              onClick={() => onNavigate('result')}
              className={`whitespace-nowrap transition-colors py-1 ${
                currentTab === 'result' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'hover:text-amber-200'
              }`}
            >
              Hasil & Sertifikat
            </button>
          )}

          <button
            onClick={() => onNavigate('leaderboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'leaderboard' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'hover:text-amber-200'
            }`}
          >
            Peringkat
          </button>

          <button
            onClick={() => onNavigate('pembina')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'pembina' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : 'hover:text-amber-200'
            }`}
          >
            Panel Pembina
          </button>

          {session && (
            <button
              onClick={onLogout}
              className="text-stone-400 hover:text-red-300 whitespace-nowrap transition-colors py-1 flex items-center gap-1 sm:hidden"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Keluar</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Audio toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Audio toggle button */}
          <button
            onClick={onToggleAudio}
            title={isAudioMuted ? 'Nyalakan Suara Game' : 'Matikan Suara'}
            className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={isAudioMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {session ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenScanner}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR</span>
              </button>

              <button
                onClick={onLogout}
                title="Keluar / Log Out Sesi"
                className="px-2.5 sm:px-3 py-2 text-xs font-bold rounded-lg bg-stone-800 hover:bg-red-950/80 hover:text-red-200 border border-stone-700 hover:border-red-800 text-stone-300 flex items-center gap-1.5 transition-colors shadow-sm"
                aria-label="Keluar / Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all whitespace-nowrap active:scale-95 shadow-sm"
            >
              Masuk Siswa
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
