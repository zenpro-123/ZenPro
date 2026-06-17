/** Pipeline stages for a tracked job/opportunity application. */
export type OpportunityStatus =
  | "interested"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offer"
  | "archived";

export const OPPORTUNITY_STATUSES: OpportunityStatus[] = [
  "interested",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "archived",
];

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived",
};

/** A single tracked opportunity in the Placement Tracker (manual job-application CRM). */
export interface OpportunityEntry {
  id: string;
  title: string;
  company?: string;
  url?: string;
  opportunityType?: string;
  status: OpportunityStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating/updating an entry. */
export interface OpportunityInput {
  title: string;
  company?: string;
  url?: string;
  opportunityType?: string;
  status?: OpportunityStatus;
  notes?: string;
}
