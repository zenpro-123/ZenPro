export interface Note {
  id: string;
  userId: string;
  contentItemId: string | null;
  opportunityId: string | null;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithTarget extends Note {
  target: {
    title: string;
    url: string | null;
    category?: string | null;
  };
}

export interface NoteLink {
  id: string;
  noteId: string;
  linkedType: "content_item" | "opportunity" | "weekly_review" | "note";
  linkedId: string;
  linkedTitle: string;
  linkedUrl: string | null;
  createdAt: string;
}

export interface NoteWithLinks extends NoteWithTarget {
  links: NoteLink[];
  backlinks: Backlink[];
}

export interface Backlink {
  noteId: string;
  noteBody: string;
  noteCreatedAt: string;
  sourceType: "note" | "content_item" | "opportunity" | "weekly_review";
  sourceTitle: string;
}
