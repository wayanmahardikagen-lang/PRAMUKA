import { PlayerSession, Challenge, ScoutPost, GameSettings, LeaderboardEntry } from '../types';
import { DEFAULT_CHALLENGES, DEFAULT_POSTS, DEFAULT_SETTINGS, SAMPLE_LEADERBOARD } from '../data/defaultData';

const SESSION_KEY = 'pramuka_active_session_v1';
const SETTINGS_KEY = 'pramuka_settings_v1';
const CHALLENGES_KEY = 'pramuka_challenges_v3';
const POSTS_KEY = 'pramuka_posts_v1';
const LEADERBOARD_KEY = 'pramuka_leaderboard_v1';
const AUDIO_MUTED_KEY = 'pramuka_audio_muted_v1';

export const storage = {
  // Session
  getSession: (): PlayerSession | null => {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  saveSession: (session: PlayerSession | null) => {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  },

  // Settings
  getSettings: (): GameSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { 
          ...DEFAULT_SETTINGS, 
          ...parsed, 
          // Pos dikerjakan secara acak / bebas default
          isSequential: parsed.isSequential === true ? true : false 
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  saveSettings: (settings: GameSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  },

  // Challenges
  getChallenges: (): Challenge[] => {
    try {
      const data = localStorage.getItem(CHALLENGES_KEY);
      return data ? JSON.parse(data) : DEFAULT_CHALLENGES;
    } catch {
      return DEFAULT_CHALLENGES;
    }
  },
  saveChallenges: (challenges: Challenge[]) => {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    } catch (e) {
      console.error('Failed to save challenges to localStorage', e);
    }
  },
  resetChallengesToDefault: (): Challenge[] => {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(DEFAULT_CHALLENGES));
      return DEFAULT_CHALLENGES;
    } catch (e) {
      console.error('Failed to reset challenges', e);
      return DEFAULT_CHALLENGES;
    }
  },
  importChallenges: (challenges: Challenge[]): Challenge[] => {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
      return challenges;
    } catch (e) {
      console.error('Failed to import challenges', e);
      return challenges;
    }
  },

  // Posts
  getPosts: (): ScoutPost[] => {
    try {
      const data = localStorage.getItem(POSTS_KEY);
      return data ? JSON.parse(data) : DEFAULT_POSTS;
    } catch {
      return DEFAULT_POSTS;
    }
  },
  savePosts: (posts: ScoutPost[]) => {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save posts to localStorage', e);
    }
  },

  // Leaderboard
  getLeaderboard: (): LeaderboardEntry[] => {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      return data ? JSON.parse(data) : SAMPLE_LEADERBOARD;
    } catch {
      return SAMPLE_LEADERBOARD;
    }
  },
  addLeaderboardEntry: (entry: LeaderboardEntry) => {
    try {
      const current = storage.getLeaderboard();
      // Avoid duplicate entry with exact same id or name+score
      const filtered = current.filter(item => item.id !== entry.id);
      const updated = [entry, ...filtered].sort((a, b) => b.score - a.score || a.totalTimeSeconds - b.totalTimeSeconds);
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save leaderboard entry', e);
      return SAMPLE_LEADERBOARD;
    }
  },

  // Audio State
  getAudioMuted: (): boolean => {
    try {
      return localStorage.getItem(AUDIO_MUTED_KEY) === 'true';
    } catch {
      return false;
    }
  },
  setAudioMuted: (muted: boolean) => {
    try {
      localStorage.setItem(AUDIO_MUTED_KEY, muted ? 'true' : 'false');
    } catch {
      // ignore
    }
  },

  // Clear Leaderboard results
  clearLeaderboard: () => {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
      return [];
    } catch (e) {
      console.error('Failed to clear leaderboard', e);
      return [];
    }
  },

  // Reset to default
  resetAll: () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(LEADERBOARD_KEY);
      localStorage.removeItem(CHALLENGES_KEY);
      localStorage.removeItem(POSTS_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // ignore
    }
  }
};
