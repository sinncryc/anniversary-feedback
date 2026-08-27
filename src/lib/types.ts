export type FeedbackRow = {
  id: number;
  message: string;
  created_at: string;
  is_visible: boolean;
};

export type TopThreeItem = {
  rank: 1 | 2 | 3;
  title: string;
  count: number;
  summary: string;
};

export type AiResultPayload = {
  top_3: TopThreeItem[];
};

export type DisplayState = {
  /** Most recent visible feedback, newest first. */
  feedback: { id: number; text: string; created_at: string }[];
  top3: TopThreeItem[];
  top3UpdatedAt: string | null;
  totalResponses: number;
  /** true when Supabase env vars are missing and the in-memory demo store is used. */
  demoMode: boolean;
};

export type ExportPayload = {
  responses: { id: number; text: string; created_at: string }[];
};
