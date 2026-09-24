export type GameView =
  | 'TITLE_MENU'
  | 'ACTIVE_BATTLE'
  | 'JUDGING'
  | 'RESULT_SCREEN'
  | 'DAILY_CHALLENGE'
  | 'DEVELOPER_MODE'
  | 'CHAOS_MODE';

export type RoastMode = 'standard' | 'chaos' | 'developer' | 'daily';
export type RoastIntensity = 'mild' | 'spicy' | 'savage';
export type RoastCategory = 'general' | 'tech_work' | 'lifestyle' | 'gaming' | 'developer';

export interface JudgeResult {
  creativity: number;
  comedy: number;
  damage: number;
  overall: number;
  verdict: string;
  feedback: string;
}

export interface BattleSession {
  id: string;
  mode: RoastMode;
  category: RoastCategory;
  intensity: RoastIntensity;
  modifier?: string;
  userTopic?: string;
  openingRoast: string;
  startedAt: number;
  expiresAt: number;
  status: 'active' | 'completed' | 'expired';
  playerComeback?: string;
  judgeResult?: JudgeResult;
  elapsedSeconds?: number;
  isTimedOut?: boolean;
}

export interface PlayerStats {
  totalBattles: number;
  wins: number;
  losses: number;
  highestScore: number;
  bestVerdict: string;
  dailyStreak: number;
  lastDailyDate?: string;
}

export interface DailyData {
  dateKey: string;
  openingRoast: string;
  category: string;
  completed: boolean;
  bestScore: number;
  bestVerdict: string | null;
  streak: number;
  secondsUntilReset: number;
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
