import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BattleSession, DailyChallengeRecord, AuditLogEntry, PlayerStats } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '.data');
const DB_FILE = path.join(DATA_DIR, 'roast_battle.db.json');

interface DatabaseSchema {
  battles: Record<string, BattleSession>;
  dailyChallenges: Record<string, DailyChallengeRecord>; // key: YYYY-MM-DD
  auditLogs: AuditLogEntry[];
  playerStats: PlayerStats;
}

const DEFAULT_DB: DatabaseSchema = {
  battles: {},
  dailyChallenges: {},
  auditLogs: [],
  playerStats: {
    totalBattles: 0,
    wins: 0,
    losses: 0,
    highestScore: 0,
    bestVerdict: 'None',
    dailyStreak: 0,
  }
};

let memoryDb: DatabaseSchema = { ...DEFAULT_DB };

// Initialize directory and load on boot
function initDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = { ...DEFAULT_DB, ...JSON.parse(content) };
    } else {
      flushToDisk();
    }
  } catch (err) {
    console.error('[DB] Failed to load DB file, using clean memory DB:', err);
    memoryDb = { ...DEFAULT_DB };
  }
}

// Atomic write with temp file
function flushToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Failed to flush DB to disk:', err);
    throw err;
  }
}

initDb();

export const db = {
  saveBattle(battle: BattleSession): void {
    memoryDb.battles[battle.id] = { ...battle };
    this.updateStatsFromBattle(battle);
    flushToDisk();
  },

  getBattle(id: string): BattleSession | null {
    return memoryDb.battles[id] || null;
  },

  getRecentBattles(limit = 10): BattleSession[] {
    return Object.values(memoryDb.battles)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  },

  getDailyProgress(dateKey: string): DailyChallengeRecord | null {
    return memoryDb.dailyChallenges[dateKey] || null;
  },

  saveDailyProgress(record: DailyChallengeRecord): void {
    memoryDb.dailyChallenges[record.dateKey] = { ...record };
    
    // Update daily streak
    const stats = memoryDb.playerStats;
    if (stats.lastDailyDate !== record.dateKey) {
      stats.dailyStreak = (stats.dailyStreak || 0) + 1;
      stats.lastDailyDate = record.dateKey;
    }

    flushToDisk();
  },

  recordAuditLog(entry: AuditLogEntry): void {
    memoryDb.auditLogs.unshift(entry);
    // Keep last 100 audit entries
    if (memoryDb.auditLogs.length > 100) {
      memoryDb.auditLogs = memoryDb.auditLogs.slice(0, 100);
    }
    flushToDisk();
  },

  getAuditLogs(): AuditLogEntry[] {
    return [...memoryDb.auditLogs];
  },

  clearAuditLogs(): void {
    memoryDb.auditLogs = [];
    flushToDisk();
  },

  getPlayerStats(): PlayerStats {
    return { ...memoryDb.playerStats };
  },

  updateStatsFromBattle(battle: BattleSession): void {
    if (battle.status !== 'completed' || !battle.judgeResult) return;

    const stats = memoryDb.playerStats;
    stats.totalBattles += 1;

    if (battle.judgeResult.overall >= 60) {
      stats.wins += 1;
    } else {
      stats.losses += 1;
    }

    if (battle.judgeResult.overall > stats.highestScore) {
      stats.highestScore = battle.judgeResult.overall;
      stats.bestVerdict = battle.judgeResult.verdict;
    }
  },

  // Helper for simulating DB write failures in resilience audits
  simulateWriteFailure(): void {
    throw new Error('SIMULATED_DATABASE_IO_ERROR: Disk write lock timeout');
  }
};
