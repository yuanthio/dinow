"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, GripVertical, Check, X, Layout } from "lucide-react";
import CardItem from "./CardItem";
import { Column, Card, ChecklistItem } from "./types";

interface ColumnItemProps {
  column: Column;
  boardId: string;
  isEditing: boolean;
  editingCardId: number | null;
  expandedCardId: number | null;
  showCardDialog: number | null;
  cardTitle: string;
  cardDescription: string;
  checklistItems: Record<number, ChecklistItem[]>;
  draggedCard: { id: number; columnId: number } | null;
  apiOrigin: string;
  getFallbackCoverClass: (seed: number) => string;
  
  // Event handlers
  onEditStart: (columnId: number, title: string) => void;
  onEditSave: (columnId: number, title: string) => void;
  onEditCancel: () => void;
  onDelete: (columnId: number) => void;
  onDragStart: (e: React.DragEvent, columnId: number, order: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, columnId: number) => void;
  
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
}

export default function ColumnItem({
  column,
  isEditing,
  editingCardId,
  expandedCardId,
  showCardDialog,
  cardTitle,
  cardDescription,
  checklistItems,
  apiOrigin,
  getFallbackCoverClass,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onDragStart,
  onDragEnd,
  onDrop,
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
  onShowCardDialog
}: ColumnItemProps) {
  const [columnTitle, setColumnTitle] = useState(column.title);

  const handleSave = () => {
    onEditSave(column.id, columnTitle);
  };

  const handleCancel = () => {
    onEditCancel();
    setColumnTitle(column.title);
  };

  return (
    <div 
      className="flex flex-col flex-shrink-0 w-[280px] sm:w-[320px] max-h-full bg-blue-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("ring-2", "ring-blue-500", "ring-inset");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("ring-2", "ring-blue-500", "ring-inset");
      }}
      onDrop={(e) => {
        e.currentTarget.classList.remove("ring-2", "ring-blue-500", "ring-inset");
        onDrop(e, column.id);
      }}
    >
      {/* Column Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing group"
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(e, column.id, column.order);
        }}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {isEditing ? (
            <div className="flex-1 flex gap-1 items-center">
              <Input
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                className="h-8 py-1 text-sm font-bold bg-white dark:bg-gray-800 focus-visible:ring-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <button onClick={handleSave} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-gray-700 dark:text-gray-200 truncate px-1">
                {column.title}
              </h3>
              {/* <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-500 rounded-full">
                {column.cards?.length || 0}
              </span> */}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={() => onEditStart(column.id, column.title)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(column.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cards Scroll Area */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar px-3 min-h-[50px] space-y-3 pb-4"
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove("bg-blue-50/50", "dark:bg-blue-900/10");
          onCardDrop(e, column.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("bg-blue-50/50", "dark:bg-blue-900/10");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("bg-blue-50/50", "dark:bg-blue-900/10");
        }}
      >
        {(!column.cards || column.cards.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-600">
            <Layout className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs font-medium">No cards yet</p>
          </div>
        ) : (
          column.cards
            .sort((a, b) => a.order - b.order)
            .map((card, index) => (
              <CardItem
                key={card.id}
                card={card}
                columnId={column.id}
                columnName={column.title}
                index={index}
                isEditing={editingCardId === card.id}
                apiOrigin={apiOrigin}
                fallbackCoverClass={getFallbackCoverClass}
                onEditStart={onCardEditStart}
                onEditSave={onCardEditSave}
                onEditCancel={onCardEditCancel}
                onDelete={onCardDelete}
                onOpenEditDialog={onCardOpenEditDialog}
                onDragStart={onCardDragStart}
                onDragEnd={onCardDragEnd}
                onDrop={onCardDropOnCard}
                checklistItems={checklistItems[card.id] || []}
                isChecklistExpanded={expandedCardId === card.id}
                onToggleChecklistExpand={onToggleChecklistExpand}
                onToggleChecklistItem={onToggleChecklistItem}
                onUpdateChecklistItem={onUpdateChecklistItem}
                onDeleteChecklistItem={onDeleteChecklistItem}
                onCreateChecklistItem={onCreateChecklistItem}
                onReorderChecklistItem={onReorderChecklistItem}
                onChecklistDragStart={onChecklistDragStart}
                onChecklistDragEnd={onChecklistDragEnd}
              />
            ))
        )}
      </div>

      {/* Footer / Add Card Area */}
      <div className="p-3">
        {showCardDialog === column.id ? (
          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <Input
              value={cardTitle}
              onChange={(e) => onCardTitleChange(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="h-9 text-sm border-none bg-gray-50 dark:bg-gray-800 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateCard(column.id);
                if (e.key === 'Escape') onShowCardDialog(null);
              }}
            />
            <Textarea
              value={cardDescription}
              onChange={(e) => onCardDescriptionChange(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="text-sm border-none bg-gray-50 dark:bg-gray-800 focus-visible:ring-0 resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onCreateCard(column.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-lg transition-all"
              >
                Add Card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onShowCardDialog(null)}
                className="px-3 text-xs font-bold rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            className="w-full flex items-center gap-2 p-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            onClick={() => onShowCardDialog(column.id)}
          >
            <div className="p-1 bg-gray-200 dark:bg-gray-800 group-hover:bg-blue-100 rounded-md transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}