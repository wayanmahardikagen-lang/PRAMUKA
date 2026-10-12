import React, { useState, useEffect } from 'react';
import { 
  GameMode, PlayerSession, ScoutPost, Challenge, 
  GameSettings, LeaderboardEntry 
} from './types';
import { DEFAULT_BADGES } from './data/defaultData';
import { storage } from './utils/storage';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LoginModal } from './components/LoginModal';
import { AdventureMap } from './components/AdventureMap';
import { QRScannerModal } from './components/QRScannerModal';
import { ChallengeModal } from './components/ChallengeModal';
import { ResultView } from './components/ResultView';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PembinaDashboard } from './components/PembinaDashboard';

export default function App() {
  // Global Data State
  const [posts, setPosts] = useState<ScoutPost[]>(() => storage.getPosts());
  const [challenges, setChallenges] = useState<Challenge[]>(() => storage.getChallenges());
  const [settings, setSettings] = useState<GameSettings>(() => storage.getSettings());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => storage.getLeaderboard());
  const [session, setSession] = useState<PlayerSession | null>(() => storage.getSession());
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => storage.getAudioMuted());

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'map' | 'result' | 'leaderboard' | 'pembina'>('home');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<GameMode>('BEREGU');
  
  // Modals & Challenge State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [targetPostForScanner, setTargetPostForScanner] = useState<ScoutPost | null>(null);
  const [activeChallengePost, setActiveChallengePost] = useState<ScoutPost | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Sync Audio Mute
  useEffect(() => {
    sound.setMuted(isAudioMuted);
    storage.setAudioMuted(isAudioMuted);
  }, [isAudioMuted]);

  // Audio Toggle
  const handleToggleAudio = () => {
    setIsAudioMuted(prev => !prev);
  };

  // Start Game Button clicked from Hero
  const handleStartGame = (mode: GameMode) => {
    sound.playClick();
    setLoginMode(mode);
    setIsLoginOpen(true);
  };

  // Successful Login
  const handleLoginSuccess = (newSession: PlayerSession) => {
    setSession(newSession);
    storage.saveSession(newSession);
    setIsLoginOpen(false);
    setCurrentTab('map');
  };

  // Logout
  const handleLogout = () => {
    if (confirm('Keluar dari sesi permainan saat ini? Kemajuan lokalmu tetap tersimpan.')) {
      sound.playClick();
      setSession(null);
      storage.saveSession(null);
      setCurrentTab('home');
    }
  };

  // Open QR Scanner
  const handleOpenScanner = (post?: ScoutPost) => {
    sound.playClick();
    setTargetPostForScanner(post || null);
    setIsScannerOpen(true);
  };

  // When Post is scanned or picked
  const handlePostScanned = (scannedPost: ScoutPost) => {
    setIsScannerOpen(false);
    setActiveChallengePost(scannedPost);
  };

  // When challenge is solved
  const handleChallengeCompleted = ({ pointsAwarded, hintsUsed }: { pointsAwarded: number; hintsUsed: number }) => {
    if (!session || !activeChallengePost) return;

    const postId = activeChallengePost.id;
    const badgeId = activeChallengePost.badgeId;

    // Avoid duplicate scoring
    if (session.completedPosts.includes(postId)) {
      setActiveChallengePost(null);
      return;
    }

    const updatedCompletedPosts = [...session.completedPosts, postId];
    const updatedBadges = session.earnedBadges.includes(badgeId)
      ? session.earnedBadges
      : [...session.earnedBadges, badgeId];

    const updatedScore = session.score + pointsAwarded;
    const updatedHints = session.hintsUsed + hintsUsed;

    const isAllFinished = updatedCompletedPosts.length === posts.length;
    const now = Date.now();

    const updatedSession: PlayerSession = {
      ...session,
      score: updatedScore,
      hintsUsed: updatedHints,
      completedPosts: updatedCompletedPosts,
      earnedBadges: updatedBadges,
      endTime: isAllFinished ? now : undefined,
      answersHistory: {
        ...session.answersHistory,
        [postId]: {
          challengeId: activeChallengePost.challengeId,
          postId,
          answeredAt: now,
          pointsAwarded,
          hintsUsed,
          isCorrect: true,
        },
      },
    };

    setSession(updatedSession);
    storage.saveSession(updatedSession);
    setActiveChallengePost(null);

    // If all posts finished, add to leaderboard and open result view
    if (isAllFinished) {
      const durationSeconds = Math.round((now - session.startTime) / 1000);
      const entry: LeaderboardEntry = {
        id: session.id,
        name: session.mode === 'BEREGU' ? `Regu ${session.reguName || session.name}` : session.name,
        mode: session.mode,
        grade: session.grade,
        reguName: session.reguName,
        score: updatedScore,
        completedPostsCount: updatedCompletedPosts.length,
        totalTimeSeconds: durationSeconds,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      const updatedLeaderboard = storage.addLeaderboardEntry(entry);
      setLeaderboard(updatedLeaderboard);
      setCurrentTab('result');
    }
  };

  // Pembina Dashboard Settings update
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  // Pembina Dashboard Challenges update
  const handleUpdateChallenges = (newChallenges: Challenge[]) => {
    setChallenges(newChallenges);
    storage.saveChallenges(newChallenges);
  };

  // Reset Session
  const handleResetSession = () => {
    storage.saveSession(null);
    setSession(null);
    setCurrentTab('home');
  };

  // Clear Leaderboard
  const handleClearLeaderboard = () => {
    storage.clearLeaderboard();
    setLeaderboard([]);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          sound.playClick();
          if (tab === 'leaderboard') {
            setIsLeaderboardOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        session={session}
        onOpenScanner={() => handleOpenScanner()}
        onLogout={handleLogout}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Body Routing */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <Hero
            session={session}
            posts={posts}
            onStartGame={handleStartGame}
            onResumeGame={() => setCurrentTab('map')}
            onOpenScanner={() => handleOpenScanner()}
            onNavigateMap={() => setCurrentTab('map')}
            onViewResult={() => setCurrentTab('result')}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'map' && (
          <AdventureMap
            posts={posts}
            badges={DEFAULT_BADGES}
            session={session}
            settings={settings}
            onOpenScanner={handleOpenScanner}
            onSelectPost={(p) => handlePostScanned(p)}
            onStartLogin={() => {
              setLoginMode('BEREGU');
              setIsLoginOpen(true);
            }}
            onToggleSequential={() => {
              const updated = { ...settings, isSequential: !settings.isSequential };
              handleUpdateSettings(updated);
            }}
          />
        )}

        {currentTab === 'result' && session && (
          <ResultView
            session={session}
            badges={DEFAULT_BADGES}
            posts={posts}
            settings={settings}
            onPlayAgain={() => {
              storage.saveSession(null);
              setSession(null);
              setIsLoginOpen(true);
            }}
            onViewLeaderboard={() => setIsLeaderboardOpen(true)}
            onGoHome={() => setCurrentTab('home')}
            onViewMap={() => setCurrentTab('map')}
          />
        )}

        {currentTab === 'pembina' && (
          <PembinaDashboard
            posts={posts}
            challenges={challenges}
            settings={settings}
            leaderboard={leaderboard}
            onUpdateSettings={handleUpdateSettings}
            onUpdateChallenges={handleUpdateChallenges}
            onResetChallengesToDefault={() => {
              const refreshed = storage.resetChallengesToDefault();
              setChallenges(refreshed);
              return refreshed;
            }}
            onImportChallenges={(imported) => {
              const saved = storage.importChallenges(imported);
              setChallenges(saved);
              return saved;
            }}
            onResetSession={handleResetSession}
            onClearLeaderboard={handleClearLeaderboard}
            onBackToApp={() => setCurrentTab('home')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-900 py-6 px-4 text-center text-xs text-stone-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-200">Jelajah Pramuka</span>
            <span>· Gugus Depan SD Negeri 1 Loloan Timur</span>
          </div>
          <div className="text-stone-400">
            Dasa Darma Pramuka: Suci dalam pikiran, perkataan, dan perbuatan.
          </div>
        </div>
      </footer>

      {/* MODAL 1: Login Modal */}
      {isLoginOpen && (
        <LoginModal
          initialMode={loginMode}
          sessionCode={settings.sessionCode}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* MODAL 2: QR Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal
          posts={posts}
          session={session}
          settings={settings}
          targetPost={targetPostForScanner}
          onClose={() => setIsScannerOpen(false)}
          onPostScanned={handlePostScanned}
        />
      )}

      {/* MODAL 3: Active Challenge Runner */}
      {activeChallengePost && session && (() => {
        const chal = challenges.find(c => c.postId === activeChallengePost.id) 
          || challenges.find(c => c.id === activeChallengePost.challengeId) 
          || challenges[0];
        const badge = DEFAULT_BADGES.find(b => b.id === activeChallengePost.badgeId);
        return (
          <ChallengeModal
            post={activeChallengePost}
            challenge={chal}
            badge={badge}
            session={session}
            onClose={() => setActiveChallengePost(null)}
            onChallengeCompleted={handleChallengeCompleted}
          />
        );
      })()}

      {/* MODAL 4: Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          entries={leaderboard}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}
    </div>
  );
}
