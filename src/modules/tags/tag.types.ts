export interface Tag {
  id: number;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagInput {
  name: string;
  color?: string | null;
  sortOrder?: number;
}
