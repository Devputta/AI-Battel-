export type RoastMode = 'standard' | 'chaos' | 'developer' | 'daily';

export type RoastIntensity = 'mild' | 'spicy' | 'savage';

export type RoastCategory = 'general' | 'tech_work' | 'lifestyle' | 'gaming' | 'developer';

export interface JudgeResult {
  creativity: number; // 0-100
  comedy: number;     // 0-100
  damage: number;     // 0-100
  overall: number;    // 0-100
  verdict: string;    // e.g. "Critical Burn", "Mic Drop", "Mild Singe", "Self-Inflicted Wound", "Clean Counter"
  feedback: string;   // 1-2 sentence snappy comedy critique
}

export interface BattleSession {
  id: string;
  mode: RoastMode;
  category: RoastCategory;
  intensity: RoastIntensity;
  modifier?: string; // for chaos mode
  userTopic?: string; // user provided info/context to roast
  openingRoast: string;
  startedAt: number;
  expiresAt: number;
  status: 'active' | 'completed' | 'expired';
  playerComeback?: string;
  judgeResult?: JudgeResult;
  elapsedSeconds?: number;
  isTimedOut?: boolean;
}

export interface DailyChallengeRecord {
  dateKey: string; // YYYY-MM-DD
  openingRoast: string;
  category: string;
  bestScore: number;
  bestVerdict: string;
  attemptsCount: number;
  completedAt: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  failureId: string;
  trigger: string;
  expectedBehavior: string;
  observedBehavior: string;
  recoveryMechanism: string;
  userVisibleResult: string;
  dataIntegrityResult: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'RECOVERED' | 'HANDLED' | 'PREVENTED';
  details?: Record<string, unknown>;
}

export interface PlayerStats {
  totalBattles: number;
  wins: number; // overall >= 65
  losses: number;
  highestScore: number;
  bestVerdict: string;
  dailyStreak: number;
  lastDailyDate?: string;
}
