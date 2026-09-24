import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { db } from './server/db.js';
import { generateOpeningRoast, judgeComeback } from './server/gemini.js';
import { validateAndSanitizeComeback } from './server/safety.js';
import { simulateFailure, SimulatedFailureType } from './server/auditEngine.js';
import { CHAOS_MODIFIERS, getDailyRoast } from './server/fallbackRoasts.js';
import { BattleSession, RoastCategory, RoastIntensity, RoastMode } from './server/types.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Request ID & Logging Middleware
  app.use((req, res, next) => {
    const requestId = crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const start = Date.now();
    res.on('finish', () => {
      if (req.url.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms) [${requestId}]`);
      }
    });
    next();
  });

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      game: 'AI Roast Battle',
      version: '1.0.0',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
      stats: db.getPlayerStats(),
      serverTime: new Date().toISOString(),
    });
  });

  // Start a new Battle
  app.post('/api/battle/start', async (req, res) => {
    try {
      const mode = (req.body.mode || 'standard') as RoastMode;
      const category = (req.body.category || (mode === 'developer' ? 'developer' : 'general')) as RoastCategory;
      const intensity = (req.body.intensity || 'spicy') as RoastIntensity;
      const userTopic = typeof req.body.userTopic === 'string' && req.body.userTopic.trim().length > 0
        ? req.body.userTopic.trim().slice(0, 300)
        : undefined;

      let modifier: string | undefined;
      if (mode === 'chaos') {
        const randomModIndex = Math.floor(Math.random() * CHAOS_MODIFIERS.length);
        modifier = CHAOS_MODIFIERS[randomModIndex];
      }

      const { roast, isFallback, provider } = await generateOpeningRoast(mode, category, intensity, modifier, userTopic);

      const sessionId = `battle_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const startedAt = Date.now();
      const durationSeconds = 30;
      // 30s response time + 5s network grace period
      const expiresAt = startedAt + (durationSeconds + 5) * 1000;

      const session: BattleSession = {
        id: sessionId,
        mode,
        category,
        intensity,
        modifier,
        userTopic,
        openingRoast: roast,
        startedAt,
        expiresAt,
        status: 'active',
      };

      db.saveBattle(session);

      res.json({
        sessionId,
        openingRoast: roast,
        mode,
        category,
        intensity,
        modifier,
        userTopic,
        startedAt,
        durationSeconds,
        isFallback,
        provider,
      });
    } catch (error: any) {
      console.error('[API] /api/battle/start error:', error);
      res.status(500).json({
        error: 'Failed to start roast battle',
        message: 'The roast machine coughed. Try starting another round.',
      });
    }
  });

  // Judge comeback
  app.post('/api/battle/judge', async (req, res) => {
    try {
      const { sessionId, comeback, elapsedSeconds, isTimedOut: clientTimedOut } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId' });
      }

      const session = db.getBattle(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
      }

      // Idempotency check: if already completed, return existing result without duplicate judging
      if (session.status === 'completed' && session.judgeResult) {
        return res.json({
          session,
          judgeResult: session.judgeResult,
          isDuplicate: true,
          message: 'Retrieved existing battle evaluation.',
        });
      }

      const now = Date.now();
      const isActuallyTimedOut = clientTimedOut || (now > session.expiresAt);

      // Input validation and safety check
      const safetyResult = validateAndSanitizeComeback(comeback || '');

      if (!isActuallyTimedOut && !safetyResult.isValid) {
        // If user submitted prompt injection or toxic content, handle with in-game comedy feedback
        if (safetyResult.flaggedReason === 'PROMPT_INJECTION') {
          simulateFailure('PROMPT_INJECTION', { text: comeback });
          const deflectionResult = {
            creativity: 15,
            comedy: 20,
            damage: 5,
            overall: 13,
            verdict: 'Technical Foul',
            feedback: safetyResult.deflectionRoast || 'Nice try hacking the judge box!',
          };

          session.status = 'completed';
          session.playerComeback = safetyResult.sanitizedText;
          session.judgeResult = deflectionResult;
          session.elapsedSeconds = elapsedSeconds || 30;
          db.saveBattle(session);

          return res.json({
            session,
            judgeResult: deflectionResult,
            flagged: true,
            warning: safetyResult.userMessage,
          });
        }

        return res.status(400).json({
          error: safetyResult.flaggedReason,
          message: safetyResult.userMessage,
        });
      }

      // Execute judging
      const sanitizedComeback = safetyResult.sanitizedText;
      const { result, isFallback, provider } = await judgeComeback(
        session.openingRoast,
        isActuallyTimedOut ? '' : sanitizedComeback,
        session.mode,
        session.intensity,
        session.modifier,
        isActuallyTimedOut
      );

      session.status = 'completed';
      session.playerComeback = sanitizedComeback;
      session.judgeResult = result;
      session.elapsedSeconds = elapsedSeconds || Math.round((now - session.startedAt) / 1000);
      session.isTimedOut = isActuallyTimedOut;

      db.saveBattle(session);

      res.json({
        session,
        judgeResult: result,
        isFallback,
        provider,
      });
    } catch (error: any) {
      console.error('[API] /api/battle/judge error:', error);
      res.status(500).json({
        error: 'Failed to judge comeback',
        message: 'The judge choked on their water. Please retry your submission.',
      });
    }
  });

  // Battle history & stats
  app.get('/api/battle/history', (_req, res) => {
    const battles = db.getRecentBattles(15);
    const stats = db.getPlayerStats();
    res.json({ battles, stats });
  });

  // Daily challenge data
  app.get('/api/daily', (_req, res) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyRoast = getDailyRoast(today);
    const progress = db.getDailyProgress(today);
    const stats = db.getPlayerStats();

    // calculate seconds until midnight UTC
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secondsUntilReset = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

    res.json({
      dateKey: today,
      openingRoast: dailyRoast.roast,
      category: dailyRoast.category,
      completed: Boolean(progress),
      bestScore: progress?.bestScore || 0,
      bestVerdict: progress?.bestVerdict || null,
      streak: stats.dailyStreak || 0,
      secondsUntilReset,
    });
  });

  // Submit Daily Challenge
  app.post('/api/daily/submit', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { comeback } = req.body;
      const dailyRoast = getDailyRoast(today);

      const safetyResult = validateAndSanitizeComeback(comeback || '');
      if (!safetyResult.isValid) {
        return res.status(400).json({
          error: safetyResult.flaggedReason,
          message: safetyResult.userMessage,
        });
      }

      const { result } = await judgeComeback(
        dailyRoast.roast,
        safetyResult.sanitizedText,
        'daily',
        'spicy'
      );

      const existing = db.getDailyProgress(today);
      const attemptsCount = (existing?.attemptsCount || 0) + 1;
      const bestScore = existing ? Math.max(existing.bestScore, result.overall) : result.overall;
      const bestVerdict = bestScore === result.overall ? result.verdict : existing!.bestVerdict;

      db.saveDailyProgress({
        dateKey: today,
        openingRoast: dailyRoast.roast,
        category: dailyRoast.category,
        bestScore,
        bestVerdict,
        attemptsCount,
        completedAt: Date.now(),
      });

      res.json({
        judgeResult: result,
        bestScore,
        bestVerdict,
        attemptsCount,
        streak: db.getPlayerStats().dailyStreak,
      });
    } catch (error: any) {
      console.error('[API] /api/daily/submit error:', error);
      res.status(500).json({ error: 'Daily evaluation failed' });
    }
  });

  // Resilience Audit Engine API
  app.get('/api/audit/system-status', (_req, res) => {
    const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    res.json({
      aiGateway: {
        status: 'Healthy',
        detail: process.env.GEMINI_API_KEY
          ? 'Active (Gemini 3.8 / 3.1 cascade + heuristic engine)'
          : 'Active (Offline Heuristic Engine)',
      },
      gameState: {
        status: 'Healthy',
        detail: `Active memory journal (${memUsage}MB heap)`,
      },
      database: {
        status: 'Healthy',
        detail: 'Atomic JSON journal (.data/roast_battle.db.json)',
      },
    });
  });

  app.get('/api/audit/logs', (_req, res) => {
    res.json({ logs: db.getAuditLogs() });
  });

  app.post('/api/audit/simulate', (req, res) => {
    const { failureType, payload } = req.body;
    if (!failureType) {
      return res.status(400).json({ error: 'Missing failureType' });
    }

    try {
      const simulation = simulateFailure(failureType as SimulatedFailureType, payload);
      res.json(simulation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/audit/clear', (_req, res) => {
    db.clearAuditLogs();
    res.json({ success: true, message: 'Audit logs cleared' });
  });

  // Mount Vite or static dist
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Roast Battle] Server active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
  process.exit(1);
});
