export type GameMode = 'INDIVIDU' | 'BEREGU';

export interface PlayerSession {
  id: string;
  mode: GameMode;
  name: string;
  grade: string;
  reguName?: string;
  reguLeader?: string;
  reguMembers?: string[];
  sessionCode: string;
  startTime: number;
  endTime?: number;
  score: number;
  hintsUsed: number;
  completedPosts: string[]; // post IDs
  earnedBadges: string[]; // badge IDs
  answersHistory: Record<string, {
    challengeId: string;
    postId: string;
    answeredAt: number;
    pointsAwarded: number;
    hintsUsed: number;
    isCorrect: boolean;
  }>;
}

export type ChallengeType = 
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_INPUT'
  | 'MORSE_DECODE'
  | 'CIPHER_NUMBER'
  | 'COMPASS_PICKER'
  | 'MATCHING_PAIRS'
  | 'SEQUENCE_ORDER';

export interface Challenge {
  id: string;
  postId: string;
  title: string;
  category: string; // e.g., 'Sandi Morse', 'Dasa Darma', 'Tanda Jejak'
  gradeLevel: string; // 'SD Rendah' | 'SD Tinggi' | 'Semua'
  difficulty: 'Mudah' | 'Sedang' | 'Tantangan';
  type: ChallengeType;
  prompt: string;
  detailText?: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | string[]; // string or array for matching/ordering
  matchingPairs?: { left: string; right: string }[];
  sequenceItems?: string[];
  hints: string[];
  explanation: string;
  maxPoints: number;
  timeLimitSeconds?: number;
  morseAudioString?: string;
}

export interface ScoutPost {
  id: string;
  code: string; // e.g. PRAMUKA-GERBANG-01
  number: number;
  name: string;
  locationHint: string;
  description: string;
  challengeId: string;
  badgeId: string;
  maxPoints: number;
  coordinates: { x: number; y: number }; // percentage on map (0-100)
}

export interface ScoutBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  mode: GameMode;
  grade: string;
  reguName?: string;
  score: number;
  completedPostsCount: number;
  totalTimeSeconds: number;
  date: string;
}

export interface GameSettings {
  sessionCode: string;
  eventName: string;
  schoolName: string;
  pembinaName: string;
  isSequential: boolean; // if true, must unlock pos in order; if false, free roam
  allowManualCode: boolean;
  basePointsFirstTry: number;
  pointsWithOneHint: number;
  pointsWithTwoHints: number;
  activePostIds: string[];
}
