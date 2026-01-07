export type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  order: number;
  cardId: number;
  createdAt: string;
  updatedAt: string;
};

export type Card = {
  id: number;
  title: string;
  description: string | null;
  imageUrl?: string | null;
  checklist?: {
    total: number;
    completed: number;
    progress: number;
  };
  order: number;
  columnId: number;
  boardId: number;
  checklistItems?: ChecklistItem[];
};

export type Column = {
  id: number;
  title: string;
  order: number;
  cards: Card[];
};

export type BoardDetails = {
  id: number;
  name: string;
  priority: string;
  category: string;
  deadline: string | null;
  columns?: Column[];
  members?: Array<{ role: string; user: { id: number; username: string | null } }>;
};

export type DragItem = {
  id: number;
  columnId?: number;
  order?: number;
};

export type SocketCardChange = {
  boardId: number;
  type: "CREATED" | "UPDATED" | "DELETED" | "MOVED";
  cardId?: number;
  card?: Card;
  fromColumnId?: number;
  toColumnId?: number;
  newOrder?: number;
};

export type SocketColumnChange = {
  boardId: number;
  type: "CREATED" | "UPDATED" | "DELETED" | "MOVED";
  columnId?: number;
  column?: Column;
  newOrder?: number;
};

export type SocketChecklistUpdate = {
  boardId: number;
  type: "ITEM_CREATED" | "ITEM_UPDATED" | "ITEM_TOGGLED" | "ITEM_DELETED" | "ITEMS_REORDERED";
  cardId: number;
  columnId: number;
  itemId?: number;
  item?: ChecklistItem;
  items?: Array<{ id: number; order: number }>;
  progress?: {
    total: number;
    completed: number;
    progress: number;
  };
};