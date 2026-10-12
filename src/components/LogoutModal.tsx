import React from 'react';
import { LogOut, X, ShieldAlert, Award, Compass, ArrowRight } from 'lucide-react';
import { PlayerSession } from '../types';

interface LogoutModalProps {
  isOpen: boolean;
  session: PlayerSession | null;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  session,
  onClose,
  onConfirmLogout,
}) => {
  if (!isOpen) return null;

  const displayName = session 
    ? (session.mode === 'BEREGU' ? `Regu ${session.reguName || session.name}` : session.name)
    : 'Siswa / Regu';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 shadow-inner">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Keluar ke Aplikasi Awal?
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Konfirmasi untuk mengakhiri sesi aktif saat ini
            </p>
          </div>
        </div>

        {/* Current Session Summary */}
        {session && (
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Akun Aktif:</span>
              <span className="font-bold text-amber-400">{displayName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Tingkat / Kelas:</span>
              <span className="text-stone-200 font-medium">{session.grade}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800">
              <span className="text-stone-400">Poin & Pos:</span>
              <span className="font-semibold text-emerald-400">
                {session.score} Poin ({session.completedPosts.length}/7 Pos)
              </span>
            </div>
          </div>
        )}

        {/* Reassurance Message */}
        <div className="flex items-start gap-2.5 text-xs text-stone-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Data kemajuan latihan kamu tetap tersimpan di perangkat ini. Kamu dapat masuk kembali kapan saja dengan regu atau nama siswa baru.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs sm:text-sm transition-colors border border-stone-700 order-2 sm:order-1"
          >
            Batal
          </button>
          
          <button
            type="button"
            onClick={onConfirmLogout}
            className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition-all active:scale-95 order-1 sm:order-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Ya, Keluar ke Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
