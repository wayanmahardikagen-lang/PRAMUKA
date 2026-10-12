import React, { useState } from 'react';
import { 
  Lock, CheckCircle2, QrCode, Compass, Award, 
  MapPin, Sparkles, ChevronRight, Info, AlertTriangle, KeyRound
} from 'lucide-react';
import { PlayerSession, ScoutPost, ScoutBadge, GameSettings } from '../types';
import mapAssetImg from '../assets/images/scout_map_compass_1791784528430.jpg';
import { sound } from '../utils/audio';

interface AdventureMapProps {
  posts: ScoutPost[];
  badges: ScoutBadge[];
  session: PlayerSession | null;
  settings: GameSettings;
  onOpenScanner: (targetPost?: ScoutPost) => void;
  onSelectPost: (post: ScoutPost) => void;
  onStartLogin: () => void;
  onToggleSequential?: () => void;
}

export const AdventureMap: React.FC<AdventureMapProps> = ({
  posts,
  badges,
  session,
  settings,
  onOpenScanner,
  onSelectPost,
  onStartLogin,
  onToggleSequential,
}) => {
  const [selectedPost, setSelectedPost] = useState<ScoutPost | null>(null);

  const completedPostIds = new Set(session?.completedPosts || []);

  const getPostStatus = (post: ScoutPost, index: number) => {
    if (!session) return 'locked';
    if (completedPostIds.has(post.id)) return 'completed';
    
    // In free-roam mode, all uncompleted posts are unlocked
    if (!settings.isSequential) return 'unlocked';
    
    // In sequential mode, pos 1 is always unlocked; subsequent pos requires previous pos completed
    if (index === 0) return 'unlocked';
    const prevPost = posts[index - 1];
    if (prevPost && completedPostIds.has(prevPost.id)) {
      return 'unlocked';
    }
    return 'locked';
  };

  const getBadgeForPost = (badgeId: string) => {
    return badges.find(b => b.id === badgeId);
  };

  const handlePostClick = (post: ScoutPost, index: number) => {
    sound.playClick();
    setSelectedPost(post);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Top Banner & Stats Strip */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 text-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Peta Penjelajahan 7 Pos Pramuka</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {settings.eventName}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-stone-400">
            <span>Lokasi: Lingkungan {settings.schoolName}</span>
            <span>·</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                settings.isSequential 
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300' 
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              }`}>
                {settings.isSequential ? 'Mode: Berurutan (Pos 1 ➔ 7)' : 'Mode: Bebas / Acak (Semua Pos Terbuka)'}
              </span>
              {onToggleSequential && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onToggleSequential();
                  }}
                  className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline"
                >
                  Ubah ke {settings.isSequential ? 'Acak' : 'Berurutan'}
                </button>
              )}
            </div>
          </div>
        </div>

        {session ? (
          <div className="flex items-center gap-4 bg-stone-950/80 p-3 sm:p-4 rounded-xl border border-stone-800 w-full md:w-auto justify-between md:justify-end">
            <div>
              <div className="text-[11px] text-stone-400 uppercase tracking-wider">
                {session.mode === 'BEREGU' ? `Regu: ${session.reguName}` : `Pramuka: ${session.name}`}
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {session.score} Poin
              </div>
            </div>
            <div className="border-l border-stone-800 pl-4 text-right">
              <div className="text-[11px] text-stone-400 uppercase tracking-wider">Pos Diselesaikan</div>
              <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                {session.completedPosts.length} / {posts.length}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full md:w-auto">
            <button
              onClick={onStartLogin}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Masuk Siswa untuk Mulai</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Map Visual & Interaction Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-stone-800 bg-stone-950 shadow-2xl">
        
        {/* Map Background with parchment asset */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[560px] overflow-hidden select-none">
          <img
            src={mapAssetImg}
            alt="Peta Petualangan Harta Karun Pramuka SD Negeri 1 Loloan Timur"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter saturate-[0.85] contrast-[1.1] brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-stone-950/40 backdrop-contrast-125" />

          {/* SVG Trail Connectors between consecutive posts */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline
              points={posts.map(p => `${p.coordinates.x}%,${p.coordinates.y}%`).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray="6 6"
              className="opacity-70 animate-pulse"
            />
          </svg>

          {/* Interactive Post Markers plotted on coordinates */}
          {posts.map((post, idx) => {
            const status = getPostStatus(post, idx);
            const isCompleted = status === 'completed';
            const isUnlocked = status === 'unlocked';
            const isSelected = selectedPost?.id === post.id;

            return (
              <div
                key={post.id}
                style={{
                  left: `${post.coordinates.x}%`,
                  top: `${post.coordinates.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-20 group"
              >
                <button
                  type="button"
                  onClick={() => handlePostClick(post, idx)}
                  aria-label={`${post.name} - Status: ${status}`}
                  className={`relative flex items-center justify-center transition-all duration-300 focus:outline-none ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                >
                  {/* Ping effect for current active unlocked post */}
                  {isUnlocked && (
                    <span className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping" />
                  )}

                  {/* Marker Pin Circle */}
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 shadow-xl transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 border-white text-white'
                        : isUnlocked
                        ? 'bg-amber-500 border-stone-900 text-stone-950 ring-4 ring-amber-400/50'
                        : 'bg-stone-800 border-stone-600 text-stone-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : isUnlocked ? (
                      <span>{post.number}</span>
                    ) : (
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  {/* Label Tooltip */}
                  <div
                    className={`absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-md pointer-events-none transition-all ${
                      isCompleted
                        ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
                        : isUnlocked
                        ? 'bg-amber-950/90 text-amber-200 border border-amber-600'
                        : 'bg-stone-900/90 text-stone-400 border border-stone-700'
                    }`}
                  >
                    Pos {post.number}: {post.name}
                  </div>
                </button>
              </div>
            );
          })}

          {/* Map Overlay Badge & Quick Instructions */}
          <div className="absolute bottom-3 left-3 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 px-3 py-2 rounded-xl text-[11px] text-stone-300 hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Selesai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Tersedia / Siap Scan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-600" />
              Terkunci
            </span>
          </div>

          <div className="absolute top-3 right-3 bg-stone-900/90 backdrop-blur-md border border-stone-700 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-300 hidden sm:block">
            Sentuh Pos untuk Melihat Info
          </div>
        </div>

        {/* Selected Post Detail Drawer / Box */}
        {selectedPost ? (
          <div className="p-4 sm:p-6 bg-stone-900 border-t border-stone-800 text-stone-200">
            {(() => {
              const idx = posts.findIndex(p => p.id === selectedPost.id);
              const status = getPostStatus(selectedPost, idx);
              const isCompleted = status === 'completed';
              const isUnlocked = status === 'unlocked';
              const badge = getBadgeForPost(selectedPost.badgeId);

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Pos {selectedPost.number}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {selectedPost.name}
                        </h3>
                      </div>
                      <div className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Petunjuk Lokasi: {selectedPost.locationHint}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Pos Sudah Selesai
                        </span>
                      ) : isUnlocked ? (
                        <span className="px-3 py-1 rounded-lg bg-amber-950 border border-amber-800 text-amber-300 font-bold text-xs flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          Siap Dikerjakan
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-400 font-bold text-xs flex items-center gap-1.5">
                          <Lock className="w-4 h-4" />
                          Pos Masih Terkunci
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-stone-300 leading-relaxed">
                    {selectedPost.description}
                  </p>

                  {/* Badge & Points Reward info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-950 p-3 rounded-xl border border-stone-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Lencana Hadiah</div>
                        <div className="text-stone-400">{badge?.name || 'Lencana Penjelajah'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <span className="font-mono text-sm">+100</span>
                      </div>
                      <div>
                        <div className="font-bold text-white">Maksimal Skor</div>
                        <div className="text-stone-400">100 Poin (Murni Percobaan 1)</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {isCompleted ? (
                      <div className="text-xs text-emerald-400 flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Misi pos ini telah berhasil diselesaikan oleh {session?.mode === 'BEREGU' ? 'regu' : 'siswa'}. Lanjutkan ke pos berikutnya!</span>
                      </div>
                    ) : isUnlocked ? (
                      <>
                        <button
                          onClick={() => onOpenScanner(selectedPost)}
                          className="flex-1 min-w-[200px] py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Pindai QR Code di Pos {selectedPost.number}</span>
                        </button>

                        <button
                          onClick={() => onOpenScanner(selectedPost)}
                          className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors border border-stone-700"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>Input Manual (Perlu Sandi Pembina)</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-400 flex items-center gap-2 w-full">
                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          Pos ini masih terkunci! Anda harus menyelesaikan{' '}
                          <strong className="text-stone-300">Pos {posts[idx - 1]?.number || 1}</strong> terlebih dahulu dalam mode berurutan.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-4 bg-stone-900 border-t border-stone-800 text-center text-xs text-stone-400">
            💡 Sentuh salah satu lingkaran nomor pos pada peta di atas untuk melihat misi, petunjuk lokasi, dan membuka scanner QR.
          </div>
        )}
      </div>

      {/* Grid List of 7 Posts below map for quick browsing */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400">
          Daftar 7 Pos Petualangan Pramuka
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {posts.map((post, idx) => {
            const status = getPostStatus(post, idx);
            const isCompleted = status === 'completed';
            const isUnlocked = status === 'unlocked';

            return (
              <div
                key={post.id}
                onClick={() => handlePostClick(post, idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100'
                    : isUnlocked
                    ? 'bg-stone-900 border-amber-600/60 hover:border-amber-400 text-stone-100 shadow'
                    : 'bg-stone-950 border-stone-800 text-stone-400 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Pos {post.number}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isUnlocked ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">
                      Buka
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                  )}
                </div>
                <div className="font-bold text-sm text-white truncate">{post.name}</div>
                <div className="text-[11px] text-stone-400 truncate mt-1">
                  {post.locationHint}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
