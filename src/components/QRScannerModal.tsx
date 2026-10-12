import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { 
  Camera, X, KeyRound, Upload, AlertCircle, 
  CheckCircle, RefreshCw, Sparkles, HelpCircle, 
  Lock, Unlock, ShieldAlert, SwitchCamera, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { ScoutPost, PlayerSession, GameSettings } from '../types';
import { sound } from '../utils/audio';

interface QRScannerModalProps {
  posts: ScoutPost[];
  session: PlayerSession | null;
  settings: GameSettings;
  targetPost?: ScoutPost | null;
  onClose: () => void;
  onPostScanned: (post: ScoutPost) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  posts,
  session,
  settings,
  targetPost,
  onClose,
  onPostScanned,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'manual' | 'file'>('camera');
  const [manualCode, setManualCode] = useState(targetPost ? targetPost.code : '');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported'>('idle');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Password Protection for Manual Input (PIN Pembina: 1961 or sessionCode)
  const [isManualUnlocked, setIsManualUnlocked] = useState(false);
  const [pembinaPasswordInput, setPembinaPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Scanner references
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Check if running inside iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Smart post matcher for QR code texts
  const matchPostFromScanned = useCallback((rawText: string): ScoutPost | null => {
    const text = rawText.trim();
    if (!text) return null;
    const upper = text.toUpperCase();

    // 1. Exact match on post.code
    for (const p of posts) {
      if (upper === p.code.toUpperCase()) return p;
    }

    // 2. Contains post.code
    for (const p of posts) {
      if (upper.includes(p.code.toUpperCase())) return p;
    }

    // 3. Post ID (e.g. POS-1, POS-2)
    for (const p of posts) {
      if (upper.includes(p.id.toUpperCase())) return p;
    }

    // 4. Keyword matching for the 7 standard posts
    const keywords: Record<number, string[]> = {
      1: ['GERBANG', 'RIMBA', 'GERBANG-01', 'POS 1', 'POS-1', 'POS1'],
      2: ['SANDI', 'HUTAN SANDI', 'SANDI-02', 'POS 2', 'POS-2', 'POS2', 'MORSE'],
      3: ['JEJAK', 'RAHASIA', 'JEJAK-03', 'POS 3', 'POS-3', 'POS3'],
      4: ['KOMPAS', 'PENJELAJAH', 'KOMPAS-04', 'POS 4', 'POS-4', 'POS4', 'ARAH'],
      5: ['SIMPUL', 'JEMBATAN', 'TALI', 'SIMPUL-05', 'POS 5', 'POS-5', 'POS5'],
      6: ['CERDAS', 'PERKEMAHAN', 'CERDAS-06', 'POS 6', 'POS-6', 'POS6', 'P3K'],
      7: ['FINAL', 'HARTA', 'KARUN', 'PETI', 'FINAL-07', 'POS 7', 'POS-7', 'POS7'],
    };

    for (const p of posts) {
      const postKeywords = keywords[p.number] || [];
      for (const kw of postKeywords) {
        if (upper.includes(kw)) return p;
      }
    }

    // 5. Query string params like ?code=... or ?pos=...
    try {
      const url = new URL(text);
      const codeParam = url.searchParams.get('code') || url.searchParams.get('pos');
      if (codeParam) {
        const found = posts.find(p => 
          p.code.toUpperCase() === codeParam.toUpperCase() || 
          p.id.toUpperCase() === codeParam.toUpperCase() ||
          String(p.number) === codeParam
        );
        if (found) return found;
      }
    } catch {
      // not a url
    }

    // 6. Number only matching (if scanned text is just "1" or "01")
    const cleanNum = text.replace(/[^0-9]/g, '');
    if (cleanNum) {
      const numOnly = parseInt(cleanNum, 10);
      if (numOnly >= 1 && numOnly <= posts.length) {
        const byNum = posts.find(p => p.number === numOnly);
        if (byNum) return byNum;
      }
    }

    return null;
  }, [posts]);

  // Handle detected decoded text
  const handleCodeDetected = useCallback((rawCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const matchedPost = matchPostFromScanned(rawCode);

    if (!matchedPost) {
      sound.playError();
      setErrorMessage(`Kode QR "${rawCode}" tidak terdaftar sebagai pos resmi Jelajah Pramuka SD Negeri 1 Loloan Timur.`);
      setIsProcessing(false);
      return;
    }

    // Check if post is already completed
    if (session && session.completedPosts.includes(matchedPost.id)) {
      sound.playError();
      setErrorMessage(
        `Pos ${matchedPost.number}: ${matchedPost.name} sudah diselesaikan sebelumnya oleh ${
          session.mode === 'BEREGU' ? 'regu' : 'kamu'
        }. Silakan cari pos berikutnya!`
      );
      setIsProcessing(false);
      return;
    }

    // Successful scan!
    sound.playSuccess();
    stopCamera();
    onPostScanned(matchedPost);
  }, [isProcessing, matchPostFromScanned, session, onPostScanned]);

  // Stop camera stream safely
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          isScanningRef.current = false;
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  // Start Html5Qrcode live camera
  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    setErrorMessage('');
    await stopCamera();

    const element = document.getElementById('scout-qr-viewport');
    if (!element) {
      setTimeout(() => startCamera(), 100);
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('scout-qr-viewport', {
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edge = Math.max(180, Math.floor(minEdge * 0.72));
        return { width: edge, height: edge };
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: qrboxFunction,
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // Frame scan miss - silently ignore
        }
      );

      isScanningRef.current = true;
      setCameraState('active');
    } catch (err: any) {
      console.warn('Html5Qrcode camera error:', err);
      setCameraState('denied');

      const errStr = String(err?.message || err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
        setErrorMessage('Izin kamera ditolak oleh browser. Tekan tombol "Izinkan & Aktifkan Kamera" di bawah atau gunakan tombol Ambil Foto.');
      } else if (errStr.includes('NotFoundError') || errStr.includes('device not found')) {
        setErrorMessage('Perangkat kamera tidak ditemukan. Gunakan tombol Unggah Foto atau Masukkan Sandi Pembina.');
      } else {
        setErrorMessage('Tidak dapat membuka kamera langsung. Gunakan tombol "Foto QR dengan Kamera HP" di bawah agar pasti berhasil.');
      }
    }
  }, [facingMode, handleCodeDetected, stopCamera]);

  // Mode Effect
  useEffect(() => {
    if (activeMode === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [activeMode, facingMode, startCamera, stopCamera]);

  // Toggle Camera Facing Mode (Depan / Belakang)
  const handleToggleFacingMode = async () => {
    sound.playClick();
    await stopCamera();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process image file through Html5Qrcode & jsQR fallback
  const processImageFile = async (file: File) => {
    setErrorMessage('');
    setIsProcessing(true);

    try {
      // 1. Try Html5Qrcode scanFile
      let tempScanner = scannerRef.current;
      let createdTemp = false;
      if (!tempScanner) {
        tempScanner = new Html5Qrcode('hidden-file-decoder', { verbose: false });
        createdTemp = true;
      }

      try {
        const decodedText = await tempScanner.scanFile(file, true);
        if (createdTemp) await tempScanner.clear();
        if (decodedText) {
          handleCodeDetected(decodedText);
          return;
        }
      } catch (err1) {
        if (createdTemp) {
          try { await tempScanner.clear(); } catch { /* ignore */ }
        }
      }

      // 2. Fallback to jsQR with Canvas
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (qrResult && qrResult.data) {
              handleCodeDetected(qrResult.data);
              return;
            }
          }

          sound.playError();
          setErrorMessage('Tidak menemukan QR Code pada foto. Pastikan foto tegak lurus, fokus, dan kode QR terlihat utuh.');
          setIsProcessing(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      sound.playError();
      setErrorMessage('Gagal memproses gambar foto. Coba ambil ulang foto dengan pencahayaan yang cukup.');
      setIsProcessing(false);
    }
  };

  // Password Verification for Manual Input Mode
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const cleanPass = pembinaPasswordInput.trim().toUpperCase();
    const isCorrect = cleanPass === '1961' || cleanPass === settings.sessionCode.toUpperCase();

    if (isCorrect) {
      sound.playSuccess();
      setIsManualUnlocked(true);
      setPasswordError('');
    } else {
      sound.playError();
      setPasswordError('Kata sandi pembina salah! Masukkan PIN Pembina yang benar (PIN Pembina: 1961).');
    }
  };

  const handleManualSelectPost = (p: ScoutPost) => {
    sound.playClick();
    handleCodeDetected(p.code);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualUnlocked) {
      setErrorMessage('Input manual dikunci! Masukkan kata sandi pembina terlebih dahulu.');
      return;
    }
    if (!manualCode.trim()) {
      setErrorMessage('Silakan pilih atau ketik kode pos.');
      return;
    }
    handleCodeDetected(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      {/* Hidden container for file decoding */}
      <div id="hidden-file-decoder" className="hidden" />

      {/* Hidden native camera capture input */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImageFile(file);
        }}
      />

      {/* Hidden file upload input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImageFile(file);
        }}
      />

      <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-md w-full p-5 sm:p-6 text-stone-100 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pemindai QR Code Pos</h2>
              <p className="text-[11px] text-stone-400">Arahkan kamera ke poster QR Pos Pramuka</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Modes: Camera / Manual Code / Upload Image */}
        <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 rounded-xl mb-4 text-xs font-semibold border border-stone-800">
          <button
            onClick={() => {
              setActiveMode('camera');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'camera'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Live</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('file');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'file'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Foto / Galeri</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('manual');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'manual'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            {!isManualUnlocked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
            <span>Kunci Manual</span>
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Mode 1: High Performance Live Camera Viewfinder */}
        {activeMode === 'camera' && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-stone-800 aspect-square flex items-center justify-center shadow-inner">
              
              {/* Html5Qrcode container */}
              <div
                id="scout-qr-viewport"
                className="w-full h-full overflow-hidden flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />

              {/* Requesting Camera Loading State */}
              {cameraState === 'requesting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/90 text-stone-300 text-xs p-4 text-center space-y-2 z-20">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="font-semibold text-white">Menghubungkan ke Kamera...</span>
                  <span className="text-[11px] text-stone-400">Tekan "Izinkan" saat browser meminta izin kamera HP Anda.</span>
                </div>
              )}

              {/* Camera Access Denied / Blocked State */}
              {(cameraState === 'denied' || cameraState === 'unsupported') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/95 text-stone-300 text-xs p-5 text-center space-y-3 z-20">
                  <Camera className="w-10 h-10 text-amber-400 animate-pulse" />
                  <div>
                    <p className="font-bold text-white text-sm">Akses Kamera Belum Aktif</p>
                    <p className="text-stone-400 leading-relaxed text-[11px] mt-1">
                      Browser atau iframe membatasi akses kamera otomatis. Gunakan salah satu opsi di bawah:
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📷 Foto QR dengan Kamera HP (Pasti Bisa)</span>
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Coba Ulang Kamera Live</span>
                    </button>

                    {isInIframe && (
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-semibold text-xs flex items-center justify-center gap-1.5 border border-amber-600/40"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka di Tab Baru agar Kamera Lancar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* In-viewfinder Controls: Switch Camera & Direct Snap button */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs">
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1.5 transition-colors border border-stone-700"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-amber-400" />
                <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
              </button>

              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 font-bold transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Foto Langsung</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400 text-center leading-normal">
              Arahkan kamera ke poster QR Code yang ditempel di Pos Pramuka SDN 1 Loloan Timur.
            </div>
          </div>
        )}

        {/* Mode 2: Photo Upload or Direct Camera Snapshot */}
        {activeMode === 'file' && (
          <div className="space-y-4 text-center py-2">
            <div className="p-6 rounded-2xl bg-stone-950 border-2 border-dashed border-stone-700 hover:border-amber-500 transition-colors space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 mx-auto flex items-center justify-center">
                <ImageIcon className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">Ambil Foto atau Pilih Gambar QR</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Gunakan kamera HP untuk memotret poster QR di pos, atau pilih gambar QR yang tersimpan di galeri perangkat.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Potret dengan Kamera HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Pilih dari Galeri</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-stone-400 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              💡 <strong>Tips:</strong> Fitur potret foto ini bekerja 100% pada semua HP Android dan iPhone tanpa perlu izin khusus browser.
            </div>
          </div>
        )}

        {/* Mode 3: Password-Protected Manual Code Input */}
        {activeMode === 'manual' && (
          <div className="space-y-4">
            {!isManualUnlocked ? (
              /* Locked view requiring Pembina Password */
              <div className="p-5 rounded-2xl bg-stone-950 border border-amber-600/50 space-y-3.5 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm">
                    Pintu Masuk Manual Terkunci
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Sesuai instruksi kejujuran Pramuka, siswa wajib mendatangi pos dan memindai QR Code. Masuk manual hanya dapat dibuka dengan <strong>Kata Sandi Pembina</strong> jika kamera terkendala.
                  </p>
                </div>

                {passwordError && (
                  <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2 text-left">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyPassword} className="space-y-3 pt-1">
                  <div>
                    <input
                      type="password"
                      value={pembinaPasswordInput}
                      onChange={(e) => setPembinaPasswordInput(e.target.value)}
                      placeholder="Ketik PIN Pembina (Demo: 1961)"
                      className="w-full text-center tracking-widest font-mono px-4 py-3 rounded-xl bg-stone-900 border border-stone-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all active:scale-95"
                  >
                    Buka Akses Manual
                  </button>
                </form>

                <div className="p-2 rounded-xl bg-stone-900 text-[11px] text-stone-400">
                  Kunci Pembina: <strong className="text-amber-400">1961</strong> atau Kode Sesi: <strong className="text-amber-400">{settings.sessionCode}</strong>
                </div>
              </div>
            ) : (
              /* Unlocked view */
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Akses Manual Dibuka oleh Pembina</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualUnlocked(false)}
                    className="text-[11px] text-emerald-300 hover:underline"
                  >
                    Kunci Kembali
                  </button>
                </div>

                {/* Quick Post Picker Buttons */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-2">
                    Pilih Pos yang Sedang Dikerjakan:
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {posts.map((p) => {
                      const isCompleted = session?.completedPosts.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleManualSelectPost(p)}
                          className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                            isCompleted
                              ? 'bg-stone-950/40 border-stone-800 text-stone-400 cursor-default'
                              : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-200 hover:border-amber-500'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center shrink-0">
                              {p.number}
                            </span>
                            <div>
                              <div className="font-bold text-xs text-white">{p.name}</div>
                              <div className="text-[10px] text-stone-400 font-mono">{p.code}</div>
                            </div>
                          </div>
                          {isCompleted ? (
                            <span className="text-[10px] text-emerald-400 font-semibold">Selesai</span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-semibold">Buka Pos ➔</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Code Input Form */}
                <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 border-t border-stone-800">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Atau Ketik Kode Pos Manual:
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: PRAMUKA-GERBANG-01"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all active:scale-95"
                  >
                    Buka Tantangan Pos Ini
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
