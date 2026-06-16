export interface Note {
  id: string;
  userId: string;
  contentItemId: string | null;
  opportunityId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithTarget extends Note {
  target: {
    title: string;
    url: string | null;
  };
}
