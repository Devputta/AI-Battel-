import { GoogleGenAI, Type } from '@google/genai';
import { JudgeResult, RoastCategory, RoastIntensity, RoastMode } from './types.js';
import { getRandomFallbackRoast, heuristicEvaluateComeback } from './fallbackRoasts.js';
import { db } from './db.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in preference order (fast, highly available)
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

// Track rate limit / capacity cooldown timestamps per model
const modelCooldownUntil = new Map<string, number>();

function isQuotaOrCapacityError(error: any): boolean {
  if (!error) return false;
  const status = error?.status;
  const code = error?.code || error?.error?.code;
  const str = String(error?.message || error || '');
  return (
    status === 429 ||
    status === 503 ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'UNAVAILABLE' ||
    code === 429 ||
    code === 503 ||
    str.includes('429') ||
    str.includes('503') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('UNAVAILABLE') ||
    str.includes('Quota exceeded') ||
    str.includes('quota') ||
    str.includes('high demand') ||
    str.includes('rate-limit') ||
    str.includes('AI_TIMEOUT')
  );
}

function handleModelFailure(model: string, error: any) {
  const str = String(error?.message || error || '');
  const is429 = 
    error?.status === 429 || 
    error?.code === 429 || 
    str.includes('429') || 
    str.includes('RESOURCE_EXHAUSTED') || 
    str.includes('Quota exceeded');

  let cooldownMs = 15_000;
  if (is429) {
    cooldownMs = 45_000;
    const match = str.match(/retry in\s+([\d.]+)\s*s/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed > 0) {
        cooldownMs = Math.ceil(parsed * 1000) + 2000;
      }
    }
  }

  modelCooldownUntil.set(model, Date.now() + cooldownMs);
}

// Helper with timeout
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`AI_TIMEOUT: ${operationName} exceeded ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

function recordAIOutageAudit(operation: string, error: any) {
  try {
    const is503 = error?.status === 503 || String(error?.message || '').includes('503') || String(error?.message || '').includes('high demand');
    const isTimeout = String(error?.message || '').includes('AI_TIMEOUT');
    const is429 = error?.status === 429 || String(error?.message || '').includes('429') || String(error?.message || '').includes('Quota');
    
    db.recordAuditLog({
      id: `audit-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      failureId: is429 ? 'FAIL_AI_QUOTA_COOLDOWN' : is503 ? 'FAIL_AI_503_SURGE' : isTimeout ? 'FAIL_AI_TIMEOUT' : 'FAIL_AI_API_FALLBACK',
      trigger: is429 
        ? `Gemini upstream free tier quota reached during ${operation}` 
        : is503 
        ? `Gemini upstream model surge (HTTP 503 High Demand during ${operation})` 
        : `AI gateway failure during ${operation}`,
      expectedBehavior: 'Intercept upstream AI outage, cascade through alternate models, and smoothly route to offline indie roast engine with zero crash',
      observedBehavior: 'Gracefully intercepted upstream provider unavailability and supplied top-tier offline roast content',
      recoveryMechanism: 'Multi-model fallback cascade + local offline comedy heuristic engine',
      userVisibleResult: 'Seamless battle gameplay without interruption, loading freeze, or crash',
      dataIntegrityResult: 'State maintained; battle records stored cleanly with fallback provider telemetry',
      severity: is429 || is503 ? 'MEDIUM' : 'LOW',
      status: 'RECOVERED',
      details: {
        operation,
        status: is429 ? 429 : is503 ? 503 : undefined,
      },
    });
  } catch {
    // Non-critical audit record
  }
}

/**
 * Generate an opening roast based on mode, category, intensity, and optional modifier.
 */
export async function generateOpeningRoast(
  mode: RoastMode,
  category: RoastCategory,
  intensity: RoastIntensity,
  modifier?: string,
  userTopic?: string
): Promise<{ roast: string; isFallback: boolean; provider: string }> {
  const hasUserTopic = Boolean(userTopic && userTopic.trim().length > 0);
  const cleanTopic = hasUserTopic ? userTopic!.trim().slice(0, 300) : '';

  // If no API key configured, return high-quality fallback immediately
  if (!process.env.GEMINI_API_KEY) {
    return {
      roast: getRandomFallbackRoast(category, intensity, cleanTopic),
      isFallback: true,
      provider: 'fallback_engine',
    };
  }

  const systemInstruction = `You are the resident insult comic in "AI Roast Battle", a witty, punchy, high-energy browser game.
Generate ONE punchy, hilarious opening roast aimed directly at the player.
${cleanTopic ? `THE PLAYER PROVIDED THIS EXACT INFO/CONTEXT ABOUT THEMSELVES TO ROAST: "${cleanTopic}".\nCRITICAL: You MUST write your opening roast specifically targeting and mocking this exact info they provided!` : `Category: ${category}`}
Intensity: ${intensity} (${intensity === 'mild' ? 'playful, gentle teasing' : intensity === 'spicy' ? 'sharp, stinging comedic jab' : 'savage, devastating takedown'})
${modifier ? `Mode Modifier: ${modifier}` : ''}

RULES:
1. Deliver ONLY the roast line itself (1-2 sentences max). No preamble, no quotes, no conversational filler like "Here is your roast:".
2. If player info was provided, make the roast directly address what they confessed or described.
3. Keep it strictly situational, behavioral, or relatable fictional absurdity.
4. NEVER attack protected classes, real personal traits, race, gender, sexual orientation, disability, or real trauma.
5. Keep it funny before being clever. Make it sharp like an indie comedy club roast.`;

  for (const model of CANDIDATE_MODELS) {
    const cooldown = modelCooldownUntil.get(model);
    if (cooldown && cooldown > Date.now()) {
      continue;
    }

    try {
      const promptContent = cleanTopic
        ? `Roast me based on this info I provided about myself: "${cleanTopic}". Heat level: ${intensity}.`
        : `Drop your opening roast now for a ${category} battle at ${intensity} intensity.`;

      const apiCall = ai.models.generateContent({
        model,
        contents: promptContent,
        config: {
          systemInstruction,
          temperature: 1.0,
          topP: 0.95,
        },
      });

      const response = await withTimeout(apiCall, 5000, `generateOpeningRoast[${model}]`);
      const text = response.text?.trim();

      if (!text || text.length < 5) {
        continue;
      }

      // Strip quotation marks if model wrapped it in quotes
      const cleanRoast = text.replace(/^["']|["']$/g, '').trim();

      return {
        roast: cleanRoast,
        isFallback: false,
        provider: model,
      };
    } catch (error: any) {
      handleModelFailure(model, error);
      // Continue to next candidate model or fallback
    }
  }

  // If all candidate models were unavailable or in high demand, engage fallback
  recordAIOutageAudit('generateOpeningRoast', { status: 503, message: 'Upstream models currently in high demand' });
  return {
    roast: getRandomFallbackRoast(category, intensity, cleanTopic),
    isFallback: true,
    provider: 'fallback_engine',
  };
}

/**
 * Judge a player comeback using Gemini structured JSON response with cascade & heuristic fallback.
 */
export async function judgeComeback(
  openingRoast: string,
  playerComeback: string,
  mode: RoastMode,
  intensity: RoastIntensity,
  modifier?: string,
  isTimedOut = false
): Promise<{ result: JudgeResult; isFallback: boolean; provider: string }> {
  if (isTimedOut || !playerComeback || playerComeback.trim().length === 0) {
    return {
      result: heuristicEvaluateComeback(openingRoast, '', true, modifier),
      isFallback: false,
      provider: 'rule_engine',
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      result: heuristicEvaluateComeback(openingRoast, playerComeback, false, modifier),
      isFallback: true,
      provider: 'fallback_engine',
    };
  }

  const systemInstruction = `You are the ruthless, witty, and hilarious AI Judge of "AI Roast Battle".
You evaluate the player's comeback to an opening roast.

Evaluate across:
1. creativity (integer 0-100): originality, wordplay, unorthodoxy.
2. comedy (integer 0-100): punchiness, laugh-out-loud factor, timing.
3. damage (integer 0-100): how effectively it countered and scorched the opponent.
4. overall (integer 0-100): weighted performance (creativity*0.3 + comedy*0.4 + damage*0.3 rounded).
5. verdict (string): a memorable punchy indie game title (e.g. "Critical Burn", "Mic Drop", "Mild Singe", "Tactical Counter", "Glancing Blow", "Self-Inflicted Wound").
6. feedback (string): 1 to 2 sentences of witty, authentic comedy judge commentary directed to the player.

Context:
- Opening Roast: "${openingRoast}"
- Player Comeback: "${playerComeback}"
${modifier ? `- Modifier in play: "${modifier}". If they honored it, give bonus points!` : ''}

Rules:
- Be fair and honest. If the comeback was weak or just "no you", give low scores (under 30).
- If it was a genuinely hilarious counter-punch, reward high scores (80-98).
- Do not use fake statistical claims.`;

  for (const model of CANDIDATE_MODELS) {
    const cooldown = modelCooldownUntil.get(model);
    if (cooldown && cooldown > Date.now()) {
      continue;
    }

    try {
      const apiCall = ai.models.generateContent({
        model,
        contents: 'Score this battle comeback.',
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              creativity: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              comedy: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              damage: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              overall: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              verdict: { type: Type.STRING, description: 'A catchy battle outcome verdict title' },
              feedback: { type: Type.STRING, description: '1-2 sentence comedy judge commentary' },
            },
            required: ['creativity', 'comedy', 'damage', 'overall', 'verdict', 'feedback'],
          },
        },
      });

      const response = await withTimeout(apiCall, 5000, `judgeComeback[${model}]`);
      const jsonText = response.text?.trim();

      if (!jsonText) {
        continue;
      }

      const parsed = JSON.parse(jsonText) as JudgeResult;

      // Normalize bounds
      const normalized: JudgeResult = {
        creativity: Math.min(100, Math.max(0, Number(parsed.creativity) || 50)),
        comedy: Math.min(100, Math.max(0, Number(parsed.comedy) || 50)),
        damage: Math.min(100, Math.max(0, Number(parsed.damage) || 50)),
        overall: Math.min(100, Math.max(0, Number(parsed.overall) || 50)),
        verdict: parsed.verdict || 'Clean Counter',
        feedback: parsed.feedback || 'A solid exchange on both sides.',
      };

      return {
        result: normalized,
        isFallback: false,
        provider: model,
      };
    } catch (error: any) {
      handleModelFailure(model, error);
      // Continue to next candidate model or fallback
    }
  }

  // If all models failed or were unavailable, fall back smoothly
  recordAIOutageAudit('judgeComeback', { status: 503, message: 'Upstream models currently in high demand' });
  return {
    result: heuristicEvaluateComeback(openingRoast, playerComeback, false, modifier),
    isFallback: true,
    provider: 'fallback_engine',
  };
}
