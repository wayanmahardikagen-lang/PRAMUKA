import React, { useState } from 'react';
import { Users, User, X, CheckCircle, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { GameMode, PlayerSession } from '../types';
import { sound } from '../utils/audio';

interface LoginModalProps {
  initialMode: GameMode;
  sessionCode: string;
  onClose: () => void;
  onLoginSuccess: (session: PlayerSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  initialMode,
  sessionCode,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Kelas 5A');
  const [inputSessionCode, setInputSessionCode] = useState(sessionCode);
  const [reguName, setReguName] = useState('');
  const [reguLeader, setReguLeader] = useState('');
  const [reguMembers, setReguMembers] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFillDemo = (type: 'regu' | 'individu') => {
    sound.playClick();
    if (type === 'regu') {
      setMode('BEREGU');
      setReguName('Regu Rajawali');
      setReguLeader('I Made Arya');
      setReguMembers('Bagus, Ketut, Putu, Dewa');
      setGrade('Kelas 5A');
      setName('Regu Rajawali');
      setInputSessionCode(sessionCode);
    } else {
      setMode('INDIVIDU');
      setName('Ni Kadek Sari Dewi');
      setGrade('Kelas 4B');
      setInputSessionCode(sessionCode);
    }
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'INDIVIDU') {
      if (!name.trim()) {
        setErrorMsg('Silakan masukkan nama siswa terlebih dahulu.');
        sound.playError();
        return;
      }
    } else {
      if (!reguName.trim()) {
        setErrorMsg('Silakan masukkan nama regu.');
        sound.playError();
        return;
      }
      if (!reguLeader.trim()) {
        setErrorMsg('Silakan masukkan nama ketua regu.');
        sound.playError();
        return;
      }
    }

    if (!inputSessionCode.trim()) {
      setErrorMsg('Kode sesi permainan wajib diisi.');
      sound.playError();
      return;
    }

    sound.playSuccess();

    const newSession: PlayerSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      mode,
      name: mode === 'INDIVIDU' ? name.trim() : reguName.trim(),
      grade,
      reguName: mode === 'BEREGU' ? reguName.trim() : undefined,
      reguLeader: mode === 'BEREGU' ? reguLeader.trim() : undefined,
      reguMembers: mode === 'BEREGU' && reguMembers.trim() ? reguMembers.split(',').map(s => s.trim()) : undefined,
      sessionCode: inputSessionCode.trim(),
      startTime: Date.now(),
      score: 0,
      hintsUsed: 0,
      completedPosts: [],
      earnedBadges: [],
      answersHistory: {},
    };

    onLoginSuccess(newSession);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Pendaftaran Penjelajah</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Masuk Petualangan Pramuka
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Gugus Depan SD Negeri 1 Loloan Timur
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 rounded-xl mb-5 border border-stone-800">
          <button
            type="button"
            onClick={() => {
              setMode('BEREGU');
              sound.playClick();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'BEREGU'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mode Beregu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('INDIVIDU');
              sound.playClick();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'INDIVIDU'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mode Individu</span>
          </button>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-800/80 border border-stone-700/80 mb-5 text-xs">
          <div className="flex items-center gap-1.5 text-stone-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Uji Coba Cepat:</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('regu')}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Demo Regu
            </button>
            <span className="text-stone-600">·</span>
            <button
              type="button"
              onClick={() => handleFillDemo('individu')}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Demo Individu
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'INDIVIDU' ? (
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Nama Lengkap Siswa *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: I Putu Bagus Pratama"
                className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white placeholder-stone-500 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Nama Regu Pramuka *
                </label>
                <input
                  type="text"
                  required
                  value={reguName}
                  onChange={(e) => setReguName(e.target.value)}
                  placeholder="Contoh: Regu Rajawali / Regu Melati"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white placeholder-stone-500 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Nama Ketua / Pemimpin Regu *
                </label>
                <input
                  type="text"
                  required
                  value={reguLeader}
                  onChange={(e) => setReguLeader(e.target.value)}
                  placeholder="Contoh: I Made Arya"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white placeholder-stone-500 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Anggota Regu (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={reguMembers}
                  onChange={(e) => setReguMembers(e.target.value)}
                  placeholder="Contoh: Bagus, Ketut, Putu, Dewa"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white placeholder-stone-500 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Kelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Kelas
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="Kelas 3">Kelas 3</option>
                <option value="Kelas 4A">Kelas 4A</option>
                <option value="Kelas 4B">Kelas 4B</option>
                <option value="Kelas 5A">Kelas 5A</option>
                <option value="Kelas 5B">Kelas 5B</option>
                <option value="Kelas 6A">Kelas 6A</option>
                <option value="Kelas 6B">Kelas 6B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Kode Sesi Permainan
              </label>
              <input
                type="text"
                required
                value={inputSessionCode}
                onChange={(e) => setInputSessionCode(e.target.value.toUpperCase())}
                placeholder="LOLTIM-2026"
                className="w-full px-3 py-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white text-sm font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Transparency note about Local Storage */}
          <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] text-stone-400 leading-normal">
            <span className="font-semibold text-stone-300">Catatan Demo Sesi:</span>{' '}
            Kemajuan tersimpan lokal di perangkat ini (siap diintegrasikan dengan Firebase Auth & Firestore untuk sinkronisasi cloud real-time).
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mulai Petualangan Misi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
