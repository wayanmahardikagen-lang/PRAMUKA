import React, { useState } from 'react';
import { Trophy, Medal, Users, User, Clock, CheckCircle2, Search, X } from 'lucide-react';
import { LeaderboardEntry, GameMode } from '../types';
import { sound } from '../utils/audio';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  onClose,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | GameMode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = entries
    .filter(e => {
      if (filterMode !== 'ALL' && e.mode !== filterMode) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.grade.toLowerCase().includes(q) ||
          (e.reguName && e.reguName.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => b.score - a.score || a.totalTimeSeconds - b.totalTimeSeconds);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xs shadow-md">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300 text-stone-950 font-black flex items-center justify-center text-xs shadow-md">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center text-xs shadow-md">
          3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 font-mono font-bold flex items-center justify-center text-xs">
        {rank}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-3xl w-full p-5 sm:p-7 text-stone-100 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Papan Peringkat Penjelajah Pramuka
              </h2>
              <p className="text-xs text-stone-400">
                Gugus Depan SD Negeri 1 Loloan Timur
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800 w-full sm:w-auto">
            <button
              onClick={() => {
                sound.playClick();
                setFilterMode('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Semua Peserta
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setFilterMode('BEREGU');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                filterMode === 'BEREGU'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Regu</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setFilterMode('INDIVIDU');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                filterMode === 'INDIVIDU'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Individu</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama regu/siswa..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-y-auto flex-1 rounded-xl border border-stone-800 bg-stone-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-900/90 text-stone-400 sticky top-0 border-b border-stone-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-center w-12">Posisi</th>
                <th className="py-2.5 px-3 font-semibold">Nama / Regu</th>
                <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Kelas</th>
                <th className="py-2.5 px-3 font-semibold text-center">Pos</th>
                <th className="py-2.5 px-3 font-semibold text-center hidden sm:table-cell">Waktu</th>
                <th className="py-2.5 px-3 font-semibold text-right pr-4">Total Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850">
              {filtered.length > 0 ? (
                filtered.map((item, index) => {
                  const minutes = Math.floor(item.totalTimeSeconds / 60);
                  const seconds = item.totalTimeSeconds % 60;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-900/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center">
                        <div className="flex justify-center">
                          {getRankBadge(index + 1)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{item.mode.toLowerCase()}</span>
                          <span className="sm:hidden">· {item.grade}</span>
                          <span>· {item.date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-300 hidden sm:table-cell">
                        {item.grade}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-400">
                        {item.completedPostsCount}/7
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-stone-400 hidden sm:table-cell">
                        {minutes}m {seconds}s
                      </td>
                      <td className="py-3 px-3 text-right pr-4">
                        <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
                          {item.score}
                        </span>
                        <span className="text-[10px] text-stone-400 ml-1">pts</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    Belum ada data penjelajah yang sesuai pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-3 mt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>Peringkat diperbarui secara otomatis berdasarkan skor dan kecepatan waktu.</span>
          <span className="text-amber-400 font-medium">Jujur & Tangguh</span>
        </div>
      </div>
    </div>
  );
};
