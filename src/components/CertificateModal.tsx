import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Printer, Download, Award, Shield, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { PlayerSession, GameSettings } from '../types';
import badgeAssetImg from '../assets/images/scout_treasure_badge_1791784538360.jpg';
import { sound } from '../utils/audio';

interface CertificateModalProps {
  session: PlayerSession;
  settings: GameSettings;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  session,
  settings,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getTitleHonor = (score: number) => {
    if (score >= 650) return 'PENJELAJAH UTAMA TELADAN (GARUDA EMAS)';
    if (score >= 500) return 'PENJELAJAH TANGGUH BERPANDU';
    if (score >= 350) return 'PENJELAJAH MADYA BERPRESTASI';
    return 'PENJELAJAH MUDA BERSEMANGAT';
  };

  const handlePrint = () => {
    sound.playClick();
    try {
      window.print();
    } catch (e) {
      console.warn('Print blocked by iframe or browser:', e);
      setExportError('Fungsi cetak langsung dibatasi oleh browser. Silakan gunakan tombol "Simpan Gambar (PNG)" di sebelah untuk mengunduh berkas sertifikat.');
    }
  };

  const handleDownloadPng = async () => {
    const element = document.getElementById('certificate-print-area');
    if (!element || isExporting) return;

    sound.playClick();
    setIsExporting(true);
    setExportError('');
    setExportSuccess(false);

    try {
      // Generate high-resolution PNG
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#fffdfa',
      });

      const participantName = (session.mode === 'BEREGU' ? session.reguName || session.name : session.name)
        .replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Sertifikat_Pramuka_${participantName}_SDN1LoloanTimur.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sound.playSuccess();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to export certificate to PNG:', err);
      setExportError('Gagal mengonversi sertifikat ke PNG. Anda juga dapat mengambil tangkapan layar (screenshot) layar ini.');
      sound.playError();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-4xl w-full p-5 sm:p-8 text-stone-100 shadow-2xl relative my-auto print:border-none print:shadow-none print:bg-white print:text-black print:p-4">
        
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4 mb-5 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm sm:text-base text-white">Sertifikat Digital Resmi Pramuka</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Action: Download PNG */}
            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Membuat PNG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-stone-950" />
                  <span>Simpan Gambar (PNG)</span>
                </>
              )}
            </button>

            {/* Secondary Action: Print */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-stone-700 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak / PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {exportSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 print:hidden">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sertifikat berhasil diunduh dalam format gambar PNG resolusi tinggi!</span>
          </div>
        )}

        {exportError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/90 border border-amber-700 text-amber-200 text-xs flex items-center gap-2 print:hidden">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Printable & Exportable Certificate Canvas */}
        <div 
          id="certificate-print-area"
          className="relative bg-[#fffdfa] border-8 border-double border-amber-800 p-6 sm:p-12 text-stone-900 rounded-2xl shadow-inner text-center overflow-hidden print:border-amber-900"
        >
          {/* Watermark background emblem */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Shield className="w-96 h-96 text-amber-950" />
          </div>

          {/* Certificate Header */}
          <div className="space-y-1 mb-6">
            <div className="text-xs uppercase tracking-widest font-black text-amber-900">
              GERAKAN PRAMUKA GUGUS DEPAN
            </div>
            <div className="text-sm font-bold text-stone-800">
              {settings.schoolName}
            </div>
            <div className="text-[11px] text-stone-600">
              Kwartir Ranting Negara · Kabupaten Jembrana, Bali
            </div>
            <div className="w-32 h-1 bg-amber-700 mx-auto my-3 rounded-full" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wide text-amber-950 uppercase mb-2">
            SERTIFIKAT PENJELAJAH PRAMUKA
          </h1>
          <p className="text-xs sm:text-sm italic font-serif text-stone-700 mb-6">
            Diberikan sebagai penghargaan atas dedikasi, ketangkasan, dan nilai kepramukaan kepada:
          </p>

          {/* Name & Team Section */}
          <div className="my-6 space-y-1">
            <div className="text-2xl sm:text-4xl font-serif font-bold text-amber-900 underline decoration-amber-600 underline-offset-8">
              {session.mode === 'BEREGU' ? session.reguName || session.name : session.name}
            </div>
            {session.mode === 'BEREGU' && session.reguLeader && (
              <div className="text-xs sm:text-sm font-semibold text-stone-700 pt-2">
                Ketua Regu: {session.reguLeader} {session.reguMembers && `· Anggota: ${session.reguMembers.join(', ')}`}
              </div>
            )}
            <div className="text-xs text-stone-600 font-medium">
              {session.grade} · SD Negeri 1 Loloan Timur
            </div>
          </div>

          {/* Achievement Description */}
          <p className="text-xs sm:text-sm text-stone-800 max-w-2xl mx-auto leading-relaxed my-6 font-serif">
            Telah berhasil menyelesaikan seluruh 7 Pos Petualangan dalam kegiatan{' '}
            <strong>"{settings.eventName}"</strong> dengan menguasai Sandi Morse, Arah Kompas, Tanda Jejak, Tali-Temali, dan Pengamalan Dasa Darma Pramuka.
          </p>

          {/* Honor Title */}
          <div className="inline-block px-5 py-2 rounded-xl bg-amber-100 border-2 border-amber-700 text-amber-950 font-serif font-bold text-xs sm:text-sm tracking-wide my-4 shadow-sm">
            Gelar Kehormatan: {getTitleHonor(session.score)}
          </div>

          {/* Score & Seal Grid */}
          <div className="grid grid-cols-3 items-center gap-4 pt-6 mt-6 border-t border-amber-200">
            {/* Score */}
            <div className="text-center sm:text-left">
              <div className="text-[10px] uppercase font-bold text-stone-600">Total Skor Akhir</div>
              <div className="text-xl sm:text-3xl font-mono font-bold text-amber-900">
                {session.score} Poin
              </div>
              <div className="text-[11px] text-stone-600">
                {session.completedPosts.length} Pos Berhasil Dituntaskan
              </div>
            </div>

            {/* Seal / Badge asset */}
            <div className="flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-600 shadow-md">
                <img
                  src={badgeAssetImg}
                  alt="Segel Resmi Tunas Kelapa Pramuka"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Signatures */}
            <div className="text-center sm:text-right space-y-1">
              <div className="text-[11px] text-stone-600">Loloan Timur, {currentDate}</div>
              <div className="text-[11px] font-bold text-stone-800 pt-8">
                {settings.pembinaName}
              </div>
              <div className="text-[10px] text-stone-600">Pembina Gugus Depan Pramuka</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
