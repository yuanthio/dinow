"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, GripVertical, AlignLeft, CheckSquare } from "lucide-react";
import ChecklistSection from "./ChecklistSection";
import { Card, ChecklistItem } from "./types";

interface CardItemProps {
  card: Card;
  columnId: number;
  columnName: string;
  index: number;
  isEditing: boolean;
  apiOrigin: string;
  fallbackCoverClass: (seed: number) => string;
  onEditStart: (card: Card, columnId: number) => void;
  onEditSave: (cardId: number, title: string, description: string) => void;
  onEditCancel: () => void;
  onDelete: (cardId: number) => void;
  onOpenEditDialog: (card: Card) => void;
  onDragStart: (e: React.DragEvent, cardId: number, columnId: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, toCardId: number, toColumnId: number, toOrder: number) => void;
  
  // Checklist props
  checklistItems: ChecklistItem[];
  isChecklistExpanded: boolean;
  onToggleChecklistExpand: (cardId: number) => void;
  onToggleChecklistItem: (cardId: number, itemId: number) => void;
  onUpdateChecklistItem: (cardId: number, itemId: number, text: string) => void;
  onDeleteChecklistItem: (cardId: number, itemId: number) => void;
  onCreateChecklistItem: (cardId: number, text: string) => void;
  onReorderChecklistItem: (cardId: number, itemId: number, targetIndex: number) => void;
  onChecklistDragStart: (e: React.DragEvent, itemId: number, cardId: number) => void;
  onChecklistDragEnd: () => void;
}

export default function CardItem({
  card,
  columnId,
  columnName,
  index,
  isEditing,
  apiOrigin,
  fallbackCoverClass,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onOpenEditDialog,
  onDragStart,
  onDragEnd,
  onDrop,
  checklistItems = [],
  isChecklistExpanded,
  onToggleChecklistExpand,
  onToggleChecklistItem,
  onUpdateChecklistItem,
  onDeleteChecklistItem,
  onCreateChecklistItem,
  onReorderChecklistItem,
  onChecklistDragStart,
  onChecklistDragEnd
}: CardItemProps) {
  const [cardTitle, setCardTitle] = useState(card.title);
  const [cardDescription, setCardDescription] = useState(card.description || "");

  const progress = {
    progress: card.checklist?.progress || 0,
    total: card.checklist?.total || 0,
    completed: card.checklist?.completed || 0
  };

  const hasChecklist = progress.total > 0;
  const isExpanded = isChecklistExpanded;

  const handleSave = () => {
    onEditSave(card.id, cardTitle, cardDescription);
  };

  const handleCancel = () => {
    onEditCancel();
    setCardTitle(card.title);
    setCardDescription(card.description || "");
  };

  return (
    <div 
      className={`
        relative flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 
        transition-all duration-200 cursor-grab active:cursor-grabbing group
      `}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e, card.id, columnId);
        e.currentTarget.classList.add("opacity-50");
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd();
        e.currentTarget.classList.remove("opacity-50");
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add("ring-2", "ring-blue-500", "scale-[1.02]");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("ring-2", "ring-blue-500", "scale-[1.02]");
      }}
      onDrop={(e) => {
        e.stopPropagation();
        e.currentTarget.classList.remove("ring-2", "ring-blue-500", "scale-[1.02]");
        onDrop(e, card.id, columnId, index);
      }}
    >
      {isEditing ? (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <Input
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            className="h-8 text-sm font-bold dark:bg-gray-900 border-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Textarea
            value={cardDescription}
            onChange={(e) => setCardDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            rows={3}
            className="text-xs resize-none dark:bg-gray-900"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs">Save</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="flex-1 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Cover Image / Gradient */}
          <div className="relative mb-3 aspect-video rounded-lg overflow-hidden group/cover">
            {card.imageUrl ? (
              <img
                src={card.imageUrl.startsWith('http') ? card.imageUrl : `${apiOrigin}${card.imageUrl}`}
                alt={card.title}
                className="w-full h-full object-cover transition-transform group-hover/cover:scale-110 duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add(...fallbackCoverClass(card.id).split(' '));
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white/50 text-center px-2 ${fallbackCoverClass(card.id)}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest">{card.title}</span>
              </div>
            )}
            
            {/* Hover Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-4px] group-hover:translate-y-0">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenEditDialog(card); }}
                className="p-1.5 bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 rounded-md hover:text-blue-600 transition-colors shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                className="p-1.5 bg-white/90 dark:bg-gray-900/90 text-red-500 rounded-md hover:bg-red-50 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Content */}
          <div className="px-1">
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {card.title}
            </h4>
            
            {card.description && (
              <div className="flex items-start gap-1.5 text-gray-500 dark:text-gray-400 mb-3">
                <AlignLeft className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] line-clamp-2 leading-relaxed">{card.description}</p>
              </div>
            )}

            {/* Badges / Progress */}
            <div className="flex flex-wrap items-center gap-3">
              {hasChecklist && (
                <div 
                  className={`
                    flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors
                    ${progress.progress === 100 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}
                  `}
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>{progress.completed}/{progress.total}</span>
                </div>
              )}
            </div>

            {/* Checklist Section */}
            <div className="mt-2">
              <ChecklistSection
                cardId={card.id}
                items={checklistItems}
                progress={progress}
                isExpanded={isExpanded}
                onToggleExpand={() => onToggleChecklistExpand(card.id)}
                onToggleItem={onToggleChecklistItem}
                onUpdateItem={onUpdateChecklistItem}
                onDeleteItem={onDeleteChecklistItem}
                onCreateItem={onCreateChecklistItem}
                onReorderItem={onReorderChecklistItem}
                onDragStart={onChecklistDragStart}
                onDragEnd={onChecklistDragEnd}
              />
            </div>

            {/* Quick Add Checklist (Subtle) */}
            {!hasChecklist && !isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleChecklistExpand(card.id); }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold text-gray-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-900 transition-all opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                ADD CHECKLIST
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}