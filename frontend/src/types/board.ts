export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type Category = 'PERSONAL' | 'WORK' | 'STUDY' | 'HEALTH' | 'FINANCE' | 'HOBBY' | 'OTHER';
export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type BoardType = 'template' | 'custom';

export interface Card {
  id: number;
  title: string;
  description: string | null;
  checklist?: any;
  order: number;
  columnId: number;
  boardId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: number;
  title: string;
  order: number;
  boardId: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  role: AccessRole;
  user: {
    id: number;
    username: string | null;
    email?: string;
  };
}

export interface Board {
  id: number;
  name: string;
  priority: Priority;
  category: Category;
  deadline: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  columns?: Column[];
  members?: BoardMember[];
}

export interface BoardDetails extends Board {
  columns: Column[];
  members: BoardMember[];
  user: {
    id: number;
    username: string | null;
  };
}

// Request/Response types
export interface CreateBoardRequest {
  name: string;
  priority: Priority;
  category: Category;
  deadline?: string;
  type?: BoardType;
}

export interface UpdateBoardRequest {
  name?: string;
  priority?: Priority;
  category?: Category;
  deadline?: string | null;
}

export interface CreateColumnRequest {
  title: string;
}

export interface UpdateColumnRequest {
  title?: string;
  order?: number;
}

export interface MoveColumnRequest {
  order: number;
}

export interface CreateCardRequest {
  columnId: number;
  title: string;
  description?: string;
  checklist?: any;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string | null;
  checklist?: any;
  order?: number;
  columnId?: number;
}

export interface MoveCardRequest {
  columnId?: number;
  order?: number;
}

// Store types
export interface BoardStore {
  boards: Board[];
  currentBoard: BoardDetails | null;
  loading: boolean;
  error: string | null;
}

export interface ColumnStore {
  columns: Column[];
  currentColumn: Column | null;
  loading: boolean;
  error: string | null;
}

export interface CardStore {
  cards: Card[];
  currentCard: Card | null;
  loading: boolean;
  error: string | null;
}
