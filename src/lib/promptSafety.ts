const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // Prompt injection attempts
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i, reason: "Invalid prompt" },
  { pattern: /system\s*prompt/i, reason: "Invalid prompt" },
  { pattern: /you\s+are\s+(now|a)\s+/i, reason: "Invalid prompt" },
  { pattern: /\bDAN\b.*\bmode/i, reason: "Invalid prompt" },
  { pattern: /jailbreak/i, reason: "Invalid prompt" },
  { pattern: /bypass\s+(safety|filter|content)/i, reason: "Invalid prompt" },

  // Explicit / sexual
  { pattern: /\b(nude|naked|nsfw|pornograph|hentai|xxx)\b/i, reason: "This prompt contains inappropriate content" },
  { pattern: /\b(genitalia|penis|vagina|erotic)\b/i, reason: "This prompt contains inappropriate content" },

  // Graphic violence
  { pattern: /\b(gore|gory|dismember|decapitat|mutilat)\b/i, reason: "This prompt contains violent content" },
  { pattern: /\b(torture|torturing)\b/i, reason: "This prompt contains violent content" },

  // Hate symbols / extremism
  { pattern: /\b(swastika|nazi|white\s*supremac|ethnic\s*cleansing)\b/i, reason: "This prompt contains hateful content" },

  // Slurs (abbreviated patterns to catch common variants)
  { pattern: /\bn[i1]gg/i, reason: "This prompt contains inappropriate language" },
  { pattern: /\bf[a@]gg/i, reason: "This prompt contains inappropriate language" },
  { pattern: /\bk[i1]ke\b/i, reason: "This prompt contains inappropriate language" },
  { pattern: /\bsp[i1]c\b/i, reason: "This prompt contains inappropriate language" },
  { pattern: /\bch[i1]nk\b/i, reason: "This prompt contains inappropriate language" },
  { pattern: /\bretard/i, reason: "This prompt contains inappropriate language" },
];

export function checkPromptSafety(prompt: string): { safe: boolean; reason?: string } {
  const normalized = prompt.trim();

  if (normalized.length === 0) {
    return { safe: false, reason: "Prompt cannot be empty" };
  }

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { safe: false, reason };
    }
  }

  return { safe: true };
}
