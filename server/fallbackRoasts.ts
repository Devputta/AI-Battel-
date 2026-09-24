import { RoastCategory, RoastIntensity, RoastMode, JudgeResult } from './types.js';

export const CHAOS_MODIFIERS = [
  "Must rhyme your comeback in couplets",
  "Must include an innocent animal in the insult",
  "Must write like a corporate LinkedIn thought leader",
  "Must sound like an overly dramatic Victorian aristocrat",
  "Must insult my Wi-Fi speed and nothing else",
  "Must frame your roast as an apology",
  "Must sound like a sports commentator losing their mind",
];

export const FALLBACK_ROASTS: Record<RoastCategory, Record<RoastIntensity, string[]>> = {
  general: {
    mild: [
      "You have the energy of a room-temperature cup of tap water on a Tuesday morning.",
      "You're like the human version of aTerms and Conditions popup: everyone skips you without reading.",
      "I’ve seen more charisma in a buffering loading spinner.",
      "You look like you apologize to automated doors when they take half a second to slide open."
    ],
    spicy: [
      "You bring the exact same vibe to social gatherings as an unscheduled fire drill.",
      "If you were any more predictable, your life would come with an 'Autoplay Next' countdown.",
      "You give off major 'replies all to company-wide emails' energy.",
      "Your confidence is admirable, especially considering the total absence of evidence supporting it."
    ],
    savage: [
      "You're proof that even evolutionary biology occasionally runs in compatibility mode.",
      "Conversations with you make me wish I was an unplugged toaster in an abandoned storage unit.",
      "You're not even the main character in your own daydream; you're the NPC selling bruised cabbage.",
      "I'd challenge you to a battle of wits, but it violates my ethics to fight an unarmed civilian."
    ]
  },
  tech_work: {
    mild: [
      "You have 47 browser tabs open right now and not a single one is making you any smarter.",
      "Your screen time report isn't a statistic; it's a cry for adult supervision.",
      "You definitely mute yourself in meetings just so you can crunch chips without shame.",
      "You think clearing your browser cache counts as preventative digital hygiene."
    ],
    spicy: [
      "Your calendar is stacked with meetings that could have been emails, and emails that could have been silence.",
      "You say 'let's circle back' because you don't even know what circle we're in.",
      "You treat keyboard shortcuts like ancient mystical sorcery that belongs in museum archives.",
      "Your resume is 80% buzzwords, 15% optimism, and 5% actual deliverables."
    ],
    savage: [
      "You deploy code straight to production on Friday at 4:55 PM and call it 'agile methodology'.",
      "Your entire career is held together by Stack Overflow snippets you don't even understand.",
      "Even your dual monitors are embarrassed to be reflecting your work output right now.",
      "If your productivity was an investment portfolio, the SEC would shut you down for fraud."
    ]
  },
  developer: {
    mild: [
      "You still inspect element to pretend you're hacking the Pentagon in coffee shops.",
      "You spent 6 hours configuring your Neovim themes and 4 minutes actually writing code.",
      "Your commit messages oscillate between 'Initial commit' and 'asdjkhfsd fixed please work'.",
      "You call it 'microservices architecture' because no single component can bear the shame alone."
    ],
    spicy: [
      "You have 2,000 unread pull requests and your solution was to filter the notifications to Spam.",
      "You rely so heavily on auto-complete that if your IDE crashed, you'd forget your own syntax.",
      "Your Docker container is 4.8 gigabytes just to serve a static HTML 'Under Construction' badge.",
      "You've been rewriting your portfolio website since 2019 and you haven't shipped a single project."
    ],
    savage: [
      "Your codebase is an archeological disaster site; even git blame wants anonymity out of pity.",
      "You spent three sprint cycles debating tabs vs spaces only to push an uncaught null pointer exception.",
      "Your test coverage is like your social life on a Saturday night: completely non-existent.",
      "The only thing more deprecated than your npm dependencies is your understanding of Big O notation."
    ]
  },
  lifestyle: {
    mild: [
      "You own a gym membership solely to sponsor someone else's athletic dreams.",
      "You buy fresh produce with the sole intention of watching it decompose in your crisper drawer.",
      "You set seven alarms in the morning with nine-minute intervals just to feel something.",
      "You consider folding laundry a multi-day psychological endurance marathon."
    ],
    spicy: [
      "Your idea of meal prep is ordering takeout in a quantity that leaves leftovers for breakfast.",
      "You’ve started reading the same self-help book four times and haven't made it past the introduction.",
      "You drink iced oat lattes at 5 PM and wonder why sleep feels like a mythical folklore creature.",
      "Your living room plant isn't thirsty; it's actively filing for political asylum."
    ],
    savage: [
      "Your personal brand is 'exhausted by normal tasks that children perform without complaining'.",
      "You spend 40 minutes researching the optimal air fryer only to cook frozen nuggets in the microwave.",
      "Your life is an endless loop of 'next week I’ll get my life together' followed by immediate regression.",
      "If indecisiveness burned calories, you'd be an Olympic triathlete by lunch time."
    ]
  },
  gaming: {
    mild: [
      "You blame input lag every time someone outplays you in a turn-based board game.",
      "Your Steam library has 300 games and you spend your free time watching other people play Minecraft.",
      "You bought a $200 mechanical keyboard just to mistype 'GG' after a devastating loss.",
      "You rage quit single-player tutorial levels because the prompt asked you to press spacebar."
    ],
    spicy: [
      "You're the reason casual lobbies exist, yet you still manage to finish in the bottom percentile.",
      "You spent 45 minutes designing your character's jawline only to wear a full-face helmet 2 seconds later.",
      "Your kill/death ratio in games mirrors your success rate at holding eye contact in real life.",
      "You own a secret gaming chair with RGB lights and you still get sniped by bots on Easy difficulty."
    ],
    savage: [
      "You carry your squad backwards directly into enemy crossfire like an undercover double agent.",
      "Even the NPCs in your favorite RPG look disappointed when you approach them for side quests.",
      "You claim you're 'lagging' when your ping is 12ms and your reaction time is measured in business days.",
      "Your gaming headset exists primarily so your teammates can hear your heavy sigh of resignation."
    ]
  }
};

export function getRandomFallbackRoast(category: RoastCategory, intensity: RoastIntensity, userTopic?: string): string {
  if (userTopic && userTopic.trim().length > 0) {
    const topic = userTopic.trim().replace(/[.!?]+$/, '');
    const customRoasts = [
      `You really confessed that "${topic}" thinking anyone would respect that? Even your keyboard wanted you to hit backspace.`,
      `Hearing "${topic}" makes me wish my language model had an ad-blocker installed.`,
      `You said "${topic}" with your whole chest, and that's genuinely the most tragic cry for help I've processed today.`,
      `"${topic}"? That's not a personality trait, that's a cautionary tale told to freshman interns.`,
      `If "${topic}" is your strong suit, I'd hate to see the hobbies you abandoned in disgrace.`,
      `You brought "${topic}" to a roast battle like bringing a plastic spoon to a sword duel.`
    ];
    return customRoasts[Math.floor(Math.random() * customRoasts.length)];
  }

  const catList = FALLBACK_ROASTS[category] || FALLBACK_ROASTS.general;
  const list = catList[intensity] || catList.spicy;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

// Predictable Daily Roasts based on day of year
export const DAILY_ROASTS = [
  { category: 'tech_work', roast: "You check your work email on weekends just to feel like someone in this universe needs you." },
  { category: 'lifestyle', roast: "Your water bottle has been sitting at half-capacity on your desk for three consecutive business days." },
  { category: 'developer', roast: "You think writing console.log('here') is an advanced telemetry monitoring framework." },
  { category: 'general', roast: "You have the quiet, devastating presence of a Zoom call where nobody knows who is supposed to talk." },
  { category: 'gaming', roast: "You bought an ultrawide monitor exclusively to watch yourself lose in higher panoramic fidelity." },
  { category: 'tech_work', roast: "You put 'proficient in Excel' on your resume because you once managed to make a column yellow." },
  { category: 'developer', roast: "Your git commit history looks like a Morse code SOS message tapped out by a trapped raccoon." },
  { category: 'lifestyle', roast: "You bought athletic running shoes and immediately used them exclusively to walk to the mailbox." }
];

export function getDailyRoast(dateStr: string) {
  // Use simple hash of YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_ROASTS.length;
  return DAILY_ROASTS[index];
}

export function heuristicEvaluateComeback(
  openingRoast: string,
  comeback: string,
  isTimedOut: boolean,
  modifier?: string
): JudgeResult {
  if (isTimedOut || !comeback || comeback.trim().length === 0) {
    return {
      creativity: 12,
      comedy: 15,
      damage: 10,
      overall: 12,
      verdict: "Clock Burnout",
      feedback: "Time's up. The roast machine coughed while you were still staring at the keyboard."
    };
  }

  const clean = comeback.trim();
  const wordCount = clean.split(/\s+/).length;
  const len = clean.length;

  // Check for modifier adherence if provided
  let modifierBonus = 0;
  if (modifier) {
    if (modifier.includes('animal') && /(dog|cat|racoon|badger|pigeon|hamster|sloth|possum|bear|duck|llama)/i.test(clean)) {
      modifierBonus += 15;
    } else if (modifier.includes('LinkedIn') && /(synergy|leverage|deliverable|circle back|proud to announce|leadership|growth)/i.test(clean)) {
      modifierBonus += 15;
    } else if (modifier.includes('rhyme')) {
      modifierBonus += 10;
    }
  }

  // Length & punchiness scoring
  let creativity = Math.min(95, Math.max(30, 45 + Math.floor(Math.random() * 25) + (wordCount >= 5 && wordCount <= 22 ? 15 : 0)));
  let comedy = Math.min(96, Math.max(35, 50 + Math.floor(Math.random() * 25) + modifierBonus));
  let damage = Math.min(98, Math.max(25, 45 + Math.floor(Math.random() * 28)));

  // If extremely short e.g. "no you"
  if (wordCount <= 2) {
    creativity = Math.min(creativity, 25);
    comedy = Math.min(comedy, 30);
    damage = Math.min(damage, 20);
  }

  const overall = Math.round((creativity * 0.3) + (comedy * 0.4) + (damage * 0.3));

  let verdict = "Clean Counter";
  let feedback = "A solid, respectable response. You landed a sharp blow without stumbling.";

  if (overall >= 85) {
    verdict = "Critical Burn";
    feedback = "Surgical. That comeback scorched the stage.";
  } else if (overall >= 72) {
    verdict = "Mic Drop";
    feedback = "Congratulations. You hurt the robot's feelings.";
  } else if (overall >= 55) {
    verdict = "Mild Singe";
    feedback = "Solid jab. Definitely left a mark.";
  } else if (overall >= 40) {
    verdict = "Glancing Blow";
    feedback = "It touched a nerve, but the opponent barely blinked.";
  } else {
    verdict = "Self-Inflicted Wound";
    feedback = "That comeback needed another 10 seconds. Unfortunately, the clock disagreed.";
  }

  return {
    creativity,
    comedy,
    damage,
    overall,
    verdict,
    feedback
  };
}
