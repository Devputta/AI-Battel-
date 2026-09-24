/**
 * Safety and Input Sanitization for AI Roast Battle
 * Enforces safety boundaries, length checks, and prompt injection defense.
 */

export interface SafetyCheckResult {
  isValid: boolean;
  sanitizedText: string;
  flaggedReason?: 'TOO_SHORT' | 'TOO_LONG' | 'PROMPT_INJECTION' | 'TOXIC_CONTENT' | 'EMPTY';
  userMessage?: string;
  deflectionRoast?: string;
}

const FORBIDDEN_PATTERNS = [
  /\b(ignore (all )?previous instructions)\b/i,
  /\b(you are now (an? )?unfiltered)\b/i,
  /\b(system prompt)\b/i,
  /\b(override (system|rules|score))\b/i,
  /\b(give me (a )?(perfect|100|max) score)\b/i,
  /\b(dan mode|jailbreak)\b/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /\b(eval\(|process\.env|GEMINI_API_KEY)\b/i,
];

const HARMFUL_HARASSMENT_KEYWORDS = [
  // Harassment, hate speech, explicit slurs, self-harm, doxxing
  /\b(kill your\w*|kys|hang your\w*)\b/i,
  /\b(doxx(ing)?|leak (his|her|their) address)\b/i,
];

export function validateAndSanitizeComeback(rawInput: unknown): SafetyCheckResult {
  if (typeof rawInput !== 'string') {
    return {
      isValid: false,
      sanitizedText: '',
      flaggedReason: 'EMPTY',
      userMessage: "That's not enough ammunition. Give me an actual comeback.",
    };
  }

  const trimmed = rawInput.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      sanitizedText: '',
      flaggedReason: 'TOO_SHORT',
      userMessage: "That's barely a whisper. Stand tall and deliver a real roast!",
    };
  }

  if (trimmed.length > 300) {
    return {
      isValid: false,
      sanitizedText: trimmed.slice(0, 300),
      flaggedReason: 'TOO_LONG',
      userMessage: "This is a roast battle, not your memoir! Keep it under 300 characters.",
    };
  }

  // Check prompt injection patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        sanitizedText: trimmed,
        flaggedReason: 'PROMPT_INJECTION',
        userMessage: "Prompt injection detected. The comedy referee saw your sly terminal tricks!",
        deflectionRoast: "Nice try writing code in the punchline box. Even my syntax highlighter rejected that.",
      };
    }
  }

  // Check toxic harassment patterns
  for (const pattern of HARMFUL_HARASSMENT_KEYWORDS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        sanitizedText: trimmed,
        flaggedReason: 'TOXIC_CONTENT',
        userMessage: "Keep it playful! Real threats and harassment are disqualified.",
        deflectionRoast: "Woah there, partner. We roast egos here, not souls. Keep it in good fun.",
      };
    }
  }

  // Strip non-printable / control characters
  const clean = trimmed.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  return {
    isValid: true,
    sanitizedText: clean,
  };
}
