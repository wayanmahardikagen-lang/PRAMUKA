import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Settings, QrCode, Download, Printer, Plus, Trash2, Edit3, 
  RotateCcw, FileSpreadsheet, Lock, Unlock, Eye, Check, AlertTriangle, 
  Users, Award, Sparkles, BookOpen, Layers, Shield, RefreshCw,
  FileCode, Copy, CheckCircle2, ListOrdered, LogOut
} from 'lucide-react';
import { ScoutPost, Challenge, GameSettings, LeaderboardEntry } from '../types';
import { sound } from '../utils/audio';

interface PembinaDashboardProps {
  posts: ScoutPost[];
  challenges: Challenge[];
  settings: GameSettings;
  leaderboard: LeaderboardEntry[];
  onUpdateSettings: (newSettings: GameSettings) => void;
  onUpdateChallenges: (newChallenges: Challenge[]) => void;
  onResetChallengesToDefault?: () => void;
  onImportChallenges?: (newChallenges: Challenge[]) => void;
  onResetSession: () => void;
  onClearLeaderboard: () => void;
  onBackToApp: () => void;
}

export const PembinaDashboard: React.FC<PembinaDashboardProps> = ({
  posts,
  challenges,
  settings,
  leaderboard,
  onUpdateSettings,
  onUpdateChallenges,
  onResetChallengesToDefault,
  onImportChallenges,
  onResetSession,
  onClearLeaderboard,
  onBackToApp,
}) => {
  // Simple PIN guard for Pembina
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [challengeNotice, setChallengeNotice] = useState('');

  // Custom confirmation modal (replaces browser confirm() which fails in iframes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  // Active Tab in Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'qr_generator' | 'question_bank' | 'settings'>('overview');

  // QR Generator State
  const [selectedQRPostId, setSelectedQRPostId] = useState<string>(posts[0]?.id || 'pos-1');
  const [customQRCode, setCustomQRCode] = useState('');
  const [generatedQRDataUrl, setGeneratedQRDataUrl] = useState<string>('');
  const [allQRCards, setAllQRCards] = useState<{ post: ScoutPost; dataUrl: string }[]>([]);

  // Question Editor Modal State
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  // JSON Import / Export Modal State
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  // Quick PIN check (Demo PIN: 1961 - tahun lahir Gerakan Pramuka Indonesia)
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1961') {
      sound.playSuccess();
      setIsAuthenticated(true);
      setPinError('');
    } else {
      sound.playError();
      setPinError('PIN salah! Petunjuk: Gunakan PIN demo "1961" (Tahun Lahir Pramuka).');
    }
  };

  // Generate single QR code
  useEffect(() => {
    const post = posts.find(p => p.id === selectedQRPostId);
    const codeToEncode = customQRCode.trim() || post?.code || 'PRAMUKA-START';

    QRCode.toDataURL(codeToEncode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then(url => setGeneratedQRDataUrl(url))
      .catch(err => console.error(err));
  }, [selectedQRPostId, customQRCode, posts]);

  // Generate all 7 QR cards for bulk print
  useEffect(() => {
    const generateAll = async () => {
      const items = await Promise.all(
        posts.map(async post => {
          const dataUrl = await QRCode.toDataURL(post.code, {
            width: 320,
            margin: 2,
            color: { dark: '#1c1917', light: '#ffffff' },
          });
          return { post, dataUrl };
        })
      );
      setAllQRCards(items);
    };
    generateAll();
  }, [posts]);

  // Export Leaderboard to CSV
  const handleExportCSV = () => {
    sound.playClick();
    const headers = ['Peringkat', 'Nama / Regu', 'Mode', 'Kelas', 'Skor', 'Pos Selesai', 'Waktu (detik)', 'Tanggal'];
    const rows = leaderboard.map((e, idx) => [
      idx + 1,
      `"${e.name.replace(/"/g, '""')}"`,
      e.mode,
      e.grade,
      e.score,
      e.completedPostsCount,
      e.totalTimeSeconds,
      e.date,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_hasil_pramuka_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Single QR Image
  const handleDownloadQR = () => {
    sound.playClick();
    const post = posts.find(p => p.id === selectedQRPostId);
    const filename = `QR_${post?.code || 'PRAMUKA'}.png`;
    const link = document.createElement('a');
    link.href = generatedQRDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print all QR post posters
  const handlePrintPosters = () => {
    sound.playClick();
    window.print();
  };

  // Delete challenge
  const handleDeleteChallenge = (id: string) => {
    sound.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Soal dari Bank Materi?',
      message: 'Soal ini akan dihapus dari daftar tantangan pos penjelajah.',
      confirmLabel: 'Ya, Hapus Soal',
      confirmVariant: 'danger',
      onConfirm: () => {
        sound.playClick();
        const updated = challenges.filter(c => c.id !== id);
        onUpdateChallenges(updated);
        setChallengeNotice('Soal berhasil dihapus dari bank materi.');
        setTimeout(() => setChallengeNotice(''), 4000);
      },
    });
  };

  // Reset to default challenges
  const handleResetToDefaultChallenges = () => {
    sound.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Muat Ulang Soal Standar?',
      message: 'Semua soal akan diperbarui kembali ke bank soal standar kepramukaan (7 pos lengkap). Perubahan manual sebelumnya akan digantikan.',
      confirmLabel: 'Ya, Muat Ulang Soal',
      confirmVariant: 'warning',
      onConfirm: () => {
        sound.playSuccess();
        if (onResetChallengesToDefault) {
          onResetChallengesToDefault();
        }
        setChallengeNotice('Berhasil! Seluruh soal telah dimuat ulang ke versi standar dari sistem.');
        setTimeout(() => setChallengeNotice(''), 5000);
      },
    });
  };

  // Open JSON import/export modal
  const handleOpenJsonModal = () => {
    sound.playClick();
    setJsonInput(JSON.stringify(challenges, null, 2));
    setJsonError('');
    setCopiedJson(false);
    setIsJsonModalOpen(true);
  };

  // Apply JSON challenges
  const handleApplyJson = (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setJsonError('Format JSON harus berupa daftar array soal (minimal 1 soal).');
        sound.playError();
        return;
      }
      // Basic check
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.id || !item.postId || !item.prompt || !item.correctAnswer) {
          setJsonError(`Soal ke-${i + 1} tidak valid: wajib memiliki 'id', 'postId', 'prompt', dan 'correctAnswer'.`);
          sound.playError();
          return;
        }
      }

      sound.playSuccess();
      if (onImportChallenges) {
        onImportChallenges(parsed);
      } else {
        onUpdateChallenges(parsed);
      }
      setIsJsonModalOpen(false);
      setChallengeNotice(`Berhasil menerapkan ${parsed.length} soal lengkap dari JSON!`);
      setTimeout(() => setChallengeNotice(''), 5000);
    } catch (err: any) {
      setJsonError(`Sintaks JSON tidak valid: ${err.message}`);
      sound.playError();
    }
  };

  // Save edited or new challenge
  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;
    sound.playSuccess();

    let updatedChallenges: Challenge[];
    if (isNewQuestion) {
      updatedChallenges = [...challenges, editingChallenge];
    } else {
      updatedChallenges = challenges.map(c => (c.id === editingChallenge.id ? editingChallenge : c));
    }

    onUpdateChallenges(updatedChallenges);
    setEditingChallenge(null);
    setChallengeNotice(`Misi "${editingChallenge.title}" berhasil disimpan dan langsung aktif!`);
    setTimeout(() => setChallengeNotice(''), 5000);
  };

  // If not authenticated, show PIN prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-stone-100">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Gerakan Pramuka SDN 1 Loloan Timur
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Portal Akses Pembina
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Masukkan PIN Pembina untuk mengelola bank soal, mencetak QR Code, dan memantau hasil kegiatan.
            </p>
          </div>

          {pinError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ketik PIN Pembina (Demo: 1961)"
                className="w-full text-center tracking-widest text-lg font-mono px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow transition-all active:scale-95"
            >
              Masuk Dashboard Pembina
            </button>
          </form>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400">
            💡 Untuk evaluasi, gunakan PIN resmi: <strong className="text-amber-400">1961</strong>
          </div>

          <button
            type="button"
            onClick={onBackToApp}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs border border-stone-700 flex items-center justify-center gap-2 transition-colors active:scale-95 shadow"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Keluar ke Aplikasi Awal</span>
          </button>
        </div>
      </div>
    );
  }

  // Authenticated Pembina Portal
  const selectedPost = posts.find(p => p.id === selectedQRPostId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-stone-100">
      
      {/* Top Banner & Title Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Panel Pembina Pramuka
            </span>
            <span className="text-xs text-stone-400">· {settings.schoolName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Manajemen Latihan & Pos Penjelajah
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Kelola kode pos QR, edit materi soal & kunci jawaban, atur sesi kegiatan, dan rekap skor.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              sound.playClick();
              setIsAuthenticated(false);
              onBackToApp();
            }}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-800 transition-colors flex items-center justify-center gap-1.5 shadow active:scale-95"
            title="Keluar dari Panel Pembina dan kembali ke Aplikasi Awal"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Keluar ke Aplikasi Awal</span>
          </button>
          <button
            onClick={onBackToApp}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors"
          >
            Halaman Siswa
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setIsAuthenticated(false);
            }}
            className="flex-1 md:flex-none px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold border border-stone-800 transition-colors"
          >
            Kunci PIN
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {challengeNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 shadow print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{challengeNotice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-800 space-x-2 sm:space-x-4 print:hidden overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('overview');
          }}
          className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Ringkasan & Hasil ({leaderboard.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('qr_generator');
          }}
          className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'qr_generator'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Cetak & Unduh QR Pos</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('question_bank');
          }}
          className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'question_bank'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bank Soal & Materi ({challenges.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('settings');
          }}
          className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-stone-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan & Reset</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & LIVE RESULTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow">
              <span className="text-xs text-stone-400">Total Peserta Selesai</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {leaderboard.length}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Regu & Siswa Mandiri</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow">
              <span className="text-xs text-stone-400">Jumlah Pos Aktif</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                {posts.length} Pos
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Gerbang Rimba s.d. Peti Rahasia</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow">
              <span className="text-xs text-stone-400">Total Bank Soal</span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
                {challenges.length} Soal
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Tersedia di 7 Pos</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow">
              <span className="text-xs text-stone-400">Kode Sesi Permainan</span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-yellow-400 mt-1">
                {settings.sessionCode}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Bagikan ke peserta</div>
            </div>
          </div>

          {/* Quick Rekap Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Rekapitulasi Nilai & Waktu Peserta</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Data otomatis terbarui saat siswa menyelesaikan seluruh pos penjelajahan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-2 border border-stone-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Ekspor Rekap (CSV/Excel)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-bold">
                    <th className="py-2 px-3">Nama / Regu</th>
                    <th className="py-2 px-3">Mode</th>
                    <th className="py-2 px-3">Kelas</th>
                    <th className="py-2 px-3 text-center">Pos Selesai</th>
                    <th className="py-2 px-3 text-right">Skor Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {leaderboard.slice(0, 8).map(p => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-bold text-white">{p.name}</td>
                      <td className="py-2.5 px-3 text-stone-300 capitalize">{p.mode.toLowerCase()}</td>
                      <td className="py-2.5 px-3 text-stone-400">{p.grade}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-400">{p.completedPostsCount}/7</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 tabular-nums">{p.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QR GENERATOR & BULK POSTER PRINT */}
      {activeTab === 'qr_generator' && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
            
            {/* Left Controls */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Generator QR Code Pos Pramuka</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Pilih pos untuk menghasilkan QR Code beresolusi tinggi, unduh gambar PNG, atau cetak semua poster pos untuk ditempel di lokasi kegiatan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Pilih Pos Target:
                </label>
                <select
                  value={selectedQRPostId}
                  onChange={(e) => {
                    setSelectedQRPostId(e.target.value);
                    setCustomQRCode('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                >
                  {posts.map(p => (
                    <option key={p.id} value={p.id}>
                      Pos {p.number}: {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Kode Identitas QR (Otomatis):
                </label>
                <input
                  type="text"
                  value={customQRCode || selectedPost?.code || ''}
                  onChange={(e) => setCustomQRCode(e.target.value.toUpperCase())}
                  placeholder="PRAMUKA-GERBANG-01"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {selectedPost && (
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-400 space-y-1">
                  <div><strong className="text-stone-300">Lokasi Pemasangan:</strong> {selectedPost.locationHint}</div>
                  <div><strong className="text-stone-300">Misi:</strong> {selectedPost.description}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-stone-700"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Unduh PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPosters}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak 7 Poster Pos (A4)</span>
                </button>
              </div>
            </div>

            {/* Right Live Preview of Selected QR */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-6 bg-stone-950 rounded-2xl border border-stone-800 text-center">
              <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mb-3">
                {generatedQRDataUrl ? (
                  <img
                    src={generatedQRDataUrl}
                    alt={`QR Code ${selectedPost?.name}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-stone-400">
                    Membuat QR...
                  </div>
                )}
              </div>

              <div className="font-mono font-bold text-amber-400 text-base">
                {customQRCode || selectedPost?.code}
              </div>
              <div className="text-xs font-bold text-white mt-0.5">
                Pos {selectedPost?.number}: {selectedPost?.name}
              </div>
              <div className="text-[11px] text-stone-400 mt-1 max-w-xs">
                SD Negeri 1 Loloan Timur
              </div>
            </div>
          </div>

          {/* Printable Posters Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                Pratinjau Lembar Poster 7 Pos Siap Cetak
              </h3>
              <span className="text-xs text-stone-400">
                Tekan tombol "Cetak 7 Poster Pos" di atas untuk mencetak ke kertas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:block">
              {allQRCards.map(({ post, dataUrl }) => (
                <div
                  key={post.id}
                  className="bg-white text-stone-900 border-4 border-stone-900 rounded-2xl p-6 text-center shadow-lg print:break-after-page print:border-8 print:p-10 print:mb-8 print:h-[95vh] print:flex print:flex-col print:justify-between"
                >
                  <div className="space-y-1 border-b-2 border-stone-300 pb-3">
                    <div className="text-xs font-black uppercase tracking-widest text-amber-900">
                      GERAKAN PRAMUKA · SD NEGERI 1 LOLOAN TIMUR
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-stone-900 uppercase">
                      POS {post.number}: {post.name}
                    </div>
                    <div className="text-xs font-semibold text-stone-600">
                      Petunjuk Lokasi: {post.locationHint}
                    </div>
                  </div>

                  <div className="my-6 flex justify-center">
                    <div className="p-3 bg-stone-100 rounded-2xl border-2 border-stone-300 inline-block shadow-inner">
                      <img
                        src={dataUrl}
                        alt={`QR Code Pos ${post.number}`}
                        className="w-48 h-48 sm:w-60 sm:h-60 object-contain mx-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t-2 border-stone-300">
                    <div className="font-mono text-sm font-bold bg-stone-100 py-1 px-3 rounded-lg inline-block border border-stone-300">
                      KODE POS: {post.code}
                    </div>
                    <p className="text-xs text-stone-700 italic max-w-sm mx-auto">
                      "Buka game Jelajah Pramuka di HP, tekan tombol Scan QR, dan arahkan kamera ke kode di atas!"
                    </p>
                    <div className="pt-2 print:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.download = `Poster_Pos_${post.number}_${post.code}.png`;
                          link.href = dataUrl;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          sound.playSuccess();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>Simpan Gambar (PNG) Pos {post.number}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK & EDITOR */}
      {activeTab === 'question_bank' && (
        <div className="space-y-5 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Bank Soal & Misi Penjelajah</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Kelola pertanyaan, pilihan ganda A-D, sandi morse, petunjuk, dan kunci jawaban setiap pos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefaultChallenges}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-1.5 border border-stone-700 transition-colors"
                title="Muat ulang soal terbaru dari kode program"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Muat Ulang Soal Asli</span>
              </button>

              <button
                type="button"
                onClick={handleOpenJsonModal}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 border border-amber-600/40 transition-colors"
                title="Salin atau tempel daftar soal lengkap sekaligus"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Salin / Impor JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsNewQuestion(true);
                  setEditingChallenge({
                    id: `chal_${Date.now()}`,
                    postId: posts[0].id,
                    title: 'Misi Baru Pramuka',
                    category: 'Pengetahuan Umum',
                    gradeLevel: 'Semua',
                    difficulty: 'Mudah',
                    type: 'MULTIPLE_CHOICE',
                    prompt: 'Tuliskan pertanyaan baru di sini...',
                    options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                    correctAnswer: 'Pilihan A',
                    hints: ['Ingat prinsip Dasa Darma Pramuka.', 'Perhatikan pilihan dengan saksama.'],
                    explanation: 'Penjelasan mengapa jawaban benar.',
                    maxPoints: 100,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Soal Baru</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {challenges.map((chal) => {
              const post = posts.find(p => p.id === chal.postId);
              return (
                <div
                  key={chal.id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Pos {post?.number || '?'}: {post?.name || 'Umum'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                        {chal.type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' :
                         chal.type === 'MORSE_DECODE' ? 'Sandi Morse' :
                         chal.type === 'CIPHER_NUMBER' ? 'Sandi Angka' :
                         chal.type === 'COMPASS_PICKER' ? 'Kompas' :
                         chal.type === 'MATCHING_PAIRS' ? 'Menjodohkan' : 'Isian Singkat'}
                      </span>
                      <span className="text-xs text-stone-400">· {chal.category}</span>
                      <span className="text-xs text-stone-400">· {chal.difficulty}</span>
                    </div>

                    <div className="font-bold text-white text-sm">{chal.title}</div>
                    <div className="text-xs text-stone-300 line-clamp-2 leading-relaxed">{chal.prompt}</div>

                    {/* Options Preview */}
                    {chal.options && chal.options.length > 0 && (
                      <div className="text-[11px] text-stone-400 pt-1 flex flex-wrap gap-2 items-center">
                        <span className="font-semibold text-stone-300">Pilihan:</span>
                        {chal.options.map((opt, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded ${
                              (Array.isArray(chal.correctAnswer) ? chal.correctAnswer.includes(opt) : chal.correctAnswer === opt)
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                                : 'bg-stone-950 text-stone-400'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setIsNewQuestion(false);
                        setEditingChallenge({
                          ...chal,
                          options: chal.options || ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                          hints: chal.hints || ['Petunjuk 1'],
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1 border border-stone-700 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit Lengkap</span>
                    </button>

                    <button
                      onClick={() => handleDeleteChallenge(chal.id)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-900/60 text-stone-400 hover:text-red-300 transition-colors border border-stone-700"
                      aria-label="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & RESET */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl print:hidden">
          {resetNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 shadow">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resetNotice}</span>
            </div>
          )}

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Konfigurasi Sesi Permainan</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  value={settings.eventName}
                  onChange={(e) => onUpdateSettings({ ...settings, eventName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Pangkalan / Sekolah
                </label>
                <input
                  type="text"
                  value={settings.schoolName}
                  onChange={(e) => onUpdateSettings({ ...settings, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Nama Pembina
                </label>
                <input
                  type="text"
                  value={settings.pembinaName}
                  onChange={(e) => onUpdateSettings({ ...settings, pembinaName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Kode Sesi Permainan
                </label>
                <input
                  type="text"
                  value={settings.sessionCode}
                  onChange={(e) => onUpdateSettings({ ...settings, sessionCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Mode Sequential vs Free Roam */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isSequential}
                    onChange={(e) => onUpdateSettings({ ...settings, isSequential: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span className="text-xs font-bold text-stone-200">
                    Wajib Selesaikan Pos Secara Berurutan (Pos 1 ➔ Pos 7)
                  </span>
                </label>
                <p className="text-[11px] text-stone-400 ml-6 mt-0.5">
                  Jika dinonaktifkan, siswa bebas mengerjakan pos secara acak / memilih pos mana saja terlebih dahulu.
                </p>
              </div>
            </div>
          </div>

          {/* Reset Challenges Card */}
          <div className="bg-stone-900 border border-amber-800/60 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <RefreshCw className="w-5 h-5" />
              <span>Muat Ulang Soal ke Versi Sistem (Reset Bank Soal)</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Jika Anda mengganti soal di kode program atau ingin mengembalikan 7 pos ke soal materi standar terbaru, gunakan tombol ini.
            </p>
            <button
              type="button"
              onClick={handleResetToDefaultChallenges}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 transition-colors shadow"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Seluruh Soal dari Sistem</span>
            </button>
          </div>

          {/* Reset All Results Card */}
          <div className="bg-stone-900 border border-red-800/80 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Hapus Semua Hasil Kelompok & Individu (Papan Peringkat)</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Menghapus seluruh rekaman skor, waktu, dan riwayat yang telah diselesaikan oleh semua regu dan siswa ({leaderboard.length} data tersimpan). Gunakan tombol ini untuk mengosongkan papan skor saat memulai latihan atau lomba baru.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setConfirmModal({
                  isOpen: true,
                  title: 'Hapus Semua Hasil Kelompok & Individu?',
                  message: `Sebanyak ${leaderboard.length} data skor kelompok dan individu akan dihapus permanen dari papan peringkat. Tindakan ini tidak dapat dibatalkan.`,
                  confirmLabel: `Ya, Hapus Semua (${leaderboard.length} Data)`,
                  confirmVariant: 'danger',
                  onConfirm: () => {
                    sound.playSuccess();
                    onClearLeaderboard();
                    setResetNotice(`Berhasil! Seluruh ${leaderboard.length} data hasil kelompok dan individu telah dihapus.`);
                    setTimeout(() => setResetNotice(''), 5000);
                  },
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Hasil Kelompok & Individu ({leaderboard.length} Data)</span>
            </button>
          </div>

          {/* Reset Session Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <RotateCcw className="w-5 h-5" />
              <span>Reset Sesi Siswa Aktif</span>
            </div>
            <p className="text-xs text-stone-400">
              Mengeluarkan akun siswa/regu yang sedang aktif di perangkat ini dan menyiapkan form pendaftaran baru.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setConfirmModal({
                  isOpen: true,
                  title: 'Reset Sesi Siswa Aktif?',
                  message: 'Mengeluarkan akun siswa/regu yang sedang aktif di perangkat ini dan menyiapkan form pendaftaran baru.',
                  confirmLabel: 'Ya, Reset Sesi Siswa',
                  confirmVariant: 'warning',
                  onConfirm: () => {
                    sound.playClick();
                    onResetSession();
                    setResetNotice('Sesi aktif siswa berhasil di-reset.');
                    setTimeout(() => setResetNotice(''), 4000);
                  },
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-stone-700 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Sesi Siswa Aktif</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Full Question Editor */}
      {editingChallenge && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-xl w-full p-6 text-stone-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isNewQuestion ? 'Tambah Misi / Soal Baru' : 'Edit Misi Soal Lengkap'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  Ubah pertanyaan, pilihan A-D, kunci jawaban, dan petunjuk pos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingChallenge(null)}
                className="p-1.5 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="space-y-4 text-xs">
              
              {/* Pos & Tipe Soal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">Pos Tujuan:</label>
                  <select
                    value={editingChallenge.postId}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, postId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  >
                    {posts.map(p => (
                      <option key={p.id} value={p.id}>
                        Pos {p.number}: {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">Tipe Soal:</label>
                  <select
                    value={editingChallenge.type}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, type: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda (A, B, C, D)</option>
                    <option value="MORSE_DECODE">Sandi Morse Rimba</option>
                    <option value="CIPHER_NUMBER">Sandi Angka Rahasia</option>
                    <option value="COMPASS_PICKER">Arah Mata Angin Kompas</option>
                    <option value="SHORT_INPUT">Isian Singkat</option>
                    <option value="MATCHING_PAIRS">Menjodohkan Pasangan</option>
                  </select>
                </div>
              </div>

              {/* Judul & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-300 mb-1">Judul Misi:</label>
                  <input
                    type="text"
                    required
                    value={editingChallenge.title}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                    placeholder="Contoh: Sikap & Dasa Darma Pramuka"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">Kategori:</label>
                  <input
                    type="text"
                    value={editingChallenge.category}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, category: e.target.value })}
                    placeholder="Nilai Kepramukaan"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pertanyaan */}
              <div>
                <label className="block font-bold text-stone-300 mb-1">Pertanyaan / Tantangan:</label>
                <textarea
                  rows={3}
                  required
                  value={editingChallenge.prompt}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, prompt: e.target.value })}
                  placeholder="Tuliskan pertanyaan atau deskripsi tantangan pos..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Options A, B, C, D if Multiple Choice / Morse / Cipher */}
              {(editingChallenge.type === 'MULTIPLE_CHOICE' ||
                editingChallenge.type === 'MORSE_DECODE' ||
                editingChallenge.type === 'CIPHER_NUMBER') && (
                <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-300">Pilihan Jawaban (A, B, C, D):</span>
                    <span className="text-[11px] text-amber-400">Klik tombol lingkaran untuk menandai kunci jawaban benar</span>
                  </div>

                  {[0, 1, 2, 3].map((idx) => {
                    const optValue = editingChallenge.options?.[idx] || '';
                    const isCorrect = editingChallenge.correctAnswer === optValue && optValue !== '';

                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (optValue) {
                              setEditingChallenge({ ...editingChallenge, correctAnswer: optValue });
                            }
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition-all ${
                            isCorrect
                              ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow'
                              : 'bg-stone-900 text-stone-400 border-stone-700 hover:border-amber-500'
                          }`}
                          title="Jadikan Kunci Jawaban Benar"
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>

                        <input
                          type="text"
                          required
                          value={optValue}
                          onChange={(e) => {
                            const newOpts = [...(editingChallenge.options || ['', '', '', ''])];
                            const oldVal = newOpts[idx];
                            newOpts[idx] = e.target.value;
                            // Update correct answer if this was the correct one
                            let newCorrect = editingChallenge.correctAnswer;
                            if (newCorrect === oldVal) {
                              newCorrect = e.target.value;
                            }
                            setEditingChallenge({
                              ...editingChallenge,
                              options: newOpts,
                              correctAnswer: newCorrect,
                            });
                          }}
                          placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                        />

                        {isCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-950 border border-emerald-800 shrink-0">
                            ✓ Kunci
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Kunci Jawaban Benar (Manual Input if needed) */}
              <div>
                <label className="block font-bold text-stone-300 mb-1">
                  Kunci Jawaban Benar (Teks Eksak):
                </label>
                <input
                  type="text"
                  required
                  value={Array.isArray(editingChallenge.correctAnswer) ? editingChallenge.correctAnswer.join(', ') : editingChallenge.correctAnswer}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, correctAnswer: e.target.value })}
                  placeholder="Kunci jawaban benar..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-emerald-600/60 text-emerald-300 font-bold text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* Detail Morse / Cipher text */}
              {(editingChallenge.type === 'MORSE_DECODE' || editingChallenge.type === 'CIPHER_NUMBER') && (
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    Detail Sandi / Kode Ditampilkan:
                  </label>
                  <input
                    type="text"
                    value={editingChallenge.detailText || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, detailText: e.target.value })}
                    placeholder="Contoh: .- / .--. / .. atau 16 - 18 - 1 - 13"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Hints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">Petunjuk 1 (Hint #1):</label>
                  <input
                    type="text"
                    value={editingChallenge.hints?.[0] || ''}
                    onChange={(e) => {
                      const newHints = [...(editingChallenge.hints || [])];
                      newHints[0] = e.target.value;
                      setEditingChallenge({ ...editingChallenge, hints: newHints });
                    }}
                    placeholder="Petunjuk pertama jika siswa ragu..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-300 mb-1">Petunjuk 2 (Hint #2):</label>
                  <input
                    type="text"
                    value={editingChallenge.hints?.[1] || ''}
                    onChange={(e) => {
                      const newHints = [...(editingChallenge.hints || [])];
                      newHints[1] = e.target.value;
                      setEditingChallenge({ ...editingChallenge, hints: newHints });
                    }}
                    placeholder="Petunjuk kedua..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Penjelasan Materi */}
              <div>
                <label className="block font-bold text-stone-300 mb-1">Penjelasan / Pembahasan Materi:</label>
                <textarea
                  rows={2}
                  value={editingChallenge.explanation || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, explanation: e.target.value })}
                  placeholder="Materi edukatif yang muncul setelah siswa menjawab benar..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingChallenge(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all active:scale-95"
                >
                  Simpan & Terapkan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: JSON Import / Export */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-stone-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-amber-400" />
                  <span>Salin / Tempel Seluruh Soal (Format JSON)</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Salin semua soal untuk dicadangkan, atau tempel daftar soal lengkap sekaligus untuk memperbarui seluruh pos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {jsonError && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <form onSubmit={handleApplyJson} className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-300">Data JSON ({challenges.length} soal aktif):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(jsonInput);
                    setCopiedJson(true);
                    sound.playClick();
                    setTimeout(() => setCopiedJson(false), 2500);
                  }}
                  className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-stone-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedJson ? 'Tersalin ke Clipboard!' : 'Salin Semua Soal'}</span>
                </button>
              </div>

              <textarea
                rows={14}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-stone-950 border border-stone-700 text-stone-200 font-mono text-[11px] leading-relaxed focus:border-amber-500 focus:outline-none"
              />

              <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold"
                >
                  Tutup
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all active:scale-95"
                >
                  Terapkan & Perbarui Seluruh Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL (In-app, iframe-safe) */}
      {confirmModal && confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                confirmModal.confirmVariant === 'danger'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition-colors border border-stone-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-950/50'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
