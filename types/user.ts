export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  onboardingComplete: boolean;
  busyMode: boolean;
  createdAt: string;
}

/** User's interest selections plus the derived weighted interest vector. */
export interface UserPreferences {
  userId: string;
  interests: string[];
  favoriteTopics: string[];
  favoriteCompanies: string[];
  favoriteCreators: string[];
  /** Map of category/tag -> weight (0-1), used to score content relevance. */
  interestVector: Record<string, number>;
  updatedAt: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  itemId: string;
  collection: string;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export interface DailyMission {
  id: string;
  type: "read" | "explore" | "discover" | "learn";
  title: string;
  description: string;
  xp: number;
  target: number;
  progress: number;
}

export interface UserMissions {
  userId: string;
  missionDate: string;
  missions: DailyMission[];
  completedMissionIds: string[];
  xpEarned: number;
  streakCount: number;
}

export interface IntelligenceScore {
  userId: string;
  scoreDate: string;
  readingScore: number;
  learningScore: number;
  explorationScore: number;
  consistencyScore: number;
  totalScore: number;
}
