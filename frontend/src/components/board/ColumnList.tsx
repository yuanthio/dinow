import { Column, Card, ChecklistItem } from "./types";
import ColumnItem from "./ColumnItem";
import AddColumnButton from "./AddColumnButton";

interface ColumnListProps {
  columns: Column[];
  boardId: string;
  editingColumnId: number | null;
  editingCardId: number | null;
  expandedCardId: number | null;
  showCardDialog: number | null;
  cardTitle: string;
  cardDescription: string;
  checklistItems: Record<number, ChecklistItem[]>;
  draggedCard: { id: number; columnId: number } | null;
  draggedColumn: { id: number; order: number } | null;
  isDraggingColumn: boolean;
  apiOrigin: string;
  getFallbackCoverClass: (seed: number) => string;
  
  // Event handlers
  onEditColumnStart: (columnId: number, title: string) => void;
  onEditColumnSave: (columnId: number, title: string) => void;
  onEditColumnCancel: () => void;
  onDeleteColumn: (columnId: number) => void;
  onColumnDragStart: (e: React.DragEvent, columnId: number, order: number) => void;
  onColumnDragEnd: () => void;
  onColumnDrop: (e: React.DragEvent, columnId: number) => void;
  
  // Card handlers
  onCardEditStart: (card: Card, columnId: number) => void;
  onCardEditSave: (cardId: number, title: string, description: string) => void;
  onCardEditCancel: () => void;
  onCardDelete: (cardId: number) => void;
  onCardOpenEditDialog: (card: Card) => void;
  onCardDragStart: (e: React.DragEvent, cardId: number, columnId: number) => void;
  onCardDragEnd: () => void;
  onCardDrop: (e: React.DragEvent, columnId: number) => void;
  onCardDropOnCard: (e: React.DragEvent, toCardId: number, toColumnId: number, toOrder: number) => void;
  
  // Checklist handlers
  onToggleChecklistExpand: (cardId: number) => void;
  onToggleChecklistItem: (cardId: number, itemId: number) => void;
  onUpdateChecklistItem: (cardId: number, itemId: number, text: string) => void;
  onDeleteChecklistItem: (cardId: number, itemId: number) => void;
  onCreateChecklistItem: (cardId: number, text: string) => void;
  onReorderChecklistItem: (cardId: number, itemId: number, targetIndex: number) => void;
  onChecklistDragStart: (e: React.DragEvent, itemId: number, cardId: number) => void;
  onChecklistDragEnd: () => void;
  
  // Add card
  onCardTitleChange: (value: string) => void;
  onCardDescriptionChange: (value: string) => void;
  onCreateCard: (columnId: number) => void;
  onShowCardDialog: (columnId: number | null) => void;
  
  // Add column
  onAddColumn: () => void;
}

export default function ColumnList({
  columns,
  boardId,
  editingColumnId,
  editingCardId,
  expandedCardId,
  showCardDialog,
  cardTitle,
  cardDescription,
  checklistItems,
  draggedCard,
  draggedColumn,
  isDraggingColumn,
  apiOrigin,
  getFallbackCoverClass,
  
  onEditColumnStart,
  onEditColumnSave,
  onEditColumnCancel,
  onDeleteColumn,
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDrop,
  
  onCardEditStart,
  onCardEditSave,
  onCardEditCancel,
  onCardDelete,
  onCardOpenEditDialog,
  onCardDragStart,
  onCardDragEnd,
  onCardDrop,
  onCardDropOnCard,
  
  onToggleChecklistExpand,
  onToggleChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
  onCreateChecklistItem,
  onReorderChecklistItem,
  onChecklistDragStart,
  onChecklistDragEnd,
  
  onCardTitleChange,
  onCardDescriptionChange,
  onCreateCard,
  onShowCardDialog,
  
  onAddColumn
}: ColumnListProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-xl p-4">
      {sortedColumns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No columns yet</p>
          <p className="text-gray-400 mb-6">This board is empty. Start by adding your first column!</p>
          <button
            onClick={onAddColumn}
            className="gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create First Column
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {sortedColumns.map((column) => (
            <ColumnItem
              key={column.id}
              column={column}
              boardId={boardId}
              isEditing={editingColumnId === column.id}
              editingCardId={editingCardId}
              expandedCardId={expandedCardId}
              showCardDialog={showCardDialog}
              cardTitle={cardTitle}
              cardDescription={cardDescription}
              checklistItems={checklistItems}
              draggedCard={draggedCard}
              apiOrigin={apiOrigin}
              getFallbackCoverClass={getFallbackCoverClass}
              
              onEditStart={onEditColumnStart}
              onEditSave={onEditColumnSave}
              onEditCancel={onEditColumnCancel}
              onDelete={onDeleteColumn}
              onDragStart={onColumnDragStart}
              onDragEnd={onColumnDragEnd}
              onDrop={onColumnDrop}
              
              onCardEditStart={onCardEditStart}
              onCardEditSave={onCardEditSave}
              onCardEditCancel={onCardEditCancel}
              onCardDelete={onCardDelete}
              onCardOpenEditDialog={onCardOpenEditDialog}
              onCardDragStart={onCardDragStart}
              onCardDragEnd={onCardDragEnd}
              onCardDrop={onCardDrop}
              onCardDropOnCard={onCardDropOnCard}
              
              onToggleChecklistExpand={onToggleChecklistExpand}
              onToggleChecklistItem={onToggleChecklistItem}
              onUpdateChecklistItem={onUpdateChecklistItem}
              onDeleteChecklistItem={onDeleteChecklistItem}
              onCreateChecklistItem={onCreateChecklistItem}
              onReorderChecklistItem={onReorderChecklistItem}
              onChecklistDragStart={onChecklistDragStart}
              onChecklistDragEnd={onChecklistDragEnd}
              
              onCardTitleChange={onCardTitleChange}
              onCardDescriptionChange={onCardDescriptionChange}
              onCreateCard={onCreateCard}
              onShowCardDialog={onShowCardDialog}
            />
          ))}
          
          <AddColumnButton
            isDraggingColumn={isDraggingColumn}
            columns={sortedColumns}
            onAddColumn={onAddColumn}
            onColumnDrop={onColumnDrop}
          />
        </div>
      )}
    </div>
  );
}