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

export interface BookAccountLink {
  bookId: number;
  accountId: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookAccountConfigInput {
  accountIds: number[];
  defaultAccountId: number;
}
