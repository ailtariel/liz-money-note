export interface Book {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
}
