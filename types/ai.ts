/** Structured AI insight attached to a content item. */
export interface AIInsights {
  whatHappened: string;
  whyItMatters: string;
  implications: string;
}

export interface MorningDevelopment {
  title: string;
  summary: string;
  whyItMatters: string;
  category: string;
  sourceUrl?: string;
}

/** Output of the Good Morning / "Things You Should Know Today" pipeline. */
export interface MorningBrief {
  greeting: string;
  date: string;
  headline: string;
  developments: MorningDevelopment[];
  readingTimeSeconds: number;
  generatedAt: string;
}

export type AISignalType = "tech" | "startup" | "creator" | "github";
export type AISignalStatus = "pending" | "confirmed" | "wrong";

/** A labeled, evidence-backed prediction surfaced in the AI Signals Lab. */
export interface AISignal {
  id: string;
  signalType: AISignalType;
  title: string;
  prediction: string;
  confidenceScore: number;
  evidence: string[];
  rationale: string;
  status: AISignalStatus;
  generatedAt: string;
}
