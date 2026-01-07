"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  GripVertical, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Check,
  X,
  Plus,
  CheckSquare
} from "lucide-react";
import { ChecklistItem } from "./types";

interface ChecklistSectionProps {
  cardId: number;
  items: ChecklistItem[];
  progress: {
    progress: number;
    total: number;
    completed: number;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (cardId: number, itemId: number) => void;
  onUpdateItem: (cardId: number, itemId: number, text: string) => void;
  onDeleteItem: (cardId: number, itemId: number) => void;
  onCreateItem: (cardId: number, text: string) => void;
  onReorderItem: (cardId: number, itemId: number, targetIndex: number) => void;
  onDragStart: (e: React.DragEvent, itemId: number, cardId: number) => void;
  onDragEnd: () => void;
}

export default function ChecklistSection({
  cardId,
  items = [],
  progress,
  isExpanded,
  onToggleExpand,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onCreateItem,
  onReorderItem,
  onDragStart,
  onDragEnd
}: ChecklistSectionProps) {
  const [checklistInput, setChecklistInput] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-blue-50/50", "dark:bg-blue-900/10", "border-l-2", "border-blue-500");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-blue-50/50", "dark:bg-blue-900/10", "border-l-2", "border-blue-500");
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-blue-50/50", "dark:bg-blue-900/10", "border-l-2", "border-blue-500");
    
    const itemId = parseInt(e.dataTransfer.getData("itemId"));
    const sourceCardId = parseInt(e.dataTransfer.getData("cardId"));
    
    if (sourceCardId === cardId) {
      onReorderItem(cardId, itemId, targetIndex);
    }
  };

  const handleCreateItem = () => {
    if (checklistInput.trim()) {
      onCreateItem(cardId, checklistInput);
      setChecklistInput("");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-3 group/header">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Checklist
          </span>
          {progress.total > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
              {progress.completed}/{progress.total}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {progress.total > 0 && (
            <span className={`text-[10px] font-black ${progress.progress === 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
              {progress.progress}%
            </span>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-400 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      {/* Progress Bar Visual */}
      {progress.total > 0 && (
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              progress.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      )}
      
      {/* Items Area */}
      {isExpanded && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/20">
              <Plus className="w-4 h-4 text-gray-300 mb-1" />
              <p className="text-[10px] font-medium text-gray-400 uppercase">Empty Task List</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {items.map((item, index) => (
                <div 
                  key={item.id}
                  className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800/50 hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all duration-200"
                  draggable
                  onDragStart={(e) => onDragStart(e, item.id, cardId)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* Drag Handle */}
                  <div 
                    className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-opacity"
                    onDragStart={(e) => onDragStart(e, item.id, cardId)}
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => onToggleItem(cardId, item.id)}
                    className="flex-shrink-0 transition-transform active:scale-90"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-sm" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 hover:text-blue-400 transition-colors" />
                    )}
                  </button>
                  
                  {/* Item Content */}
                  {editingItemId === item.id ? (
                    <div className="flex-1 flex items-center gap-1 animate-in zoom-in-95 duration-150">
                      <Input
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 h-7 text-xs bg-white dark:bg-gray-900 border-blue-500 focus-visible:ring-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateItem(cardId, item.id, editingText);
                            setEditingItemId(null);
                          }
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                      />
                      <button 
                        onClick={() => { onUpdateItem(cardId, item.id, editingText); setEditingItemId(null); }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className={`flex-1 text-[13px] transition-all cursor-text ${
                        item.completed 
                        ? 'line-through text-gray-400 dark:text-gray-500' 
                        : 'text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => {
                        setEditingItemId(item.id);
                        setEditingText(item.text);
                      }}
                    >
                      {item.text}
                    </div>
                  )}
                  
                  <button
                    onClick={() => onDeleteItem(cardId, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Item Form */}
          <div className="flex items-center gap-2 mt-3 pl-7">
            <div className="flex-1 relative group/input">
              <Input
                placeholder="Add a task..."
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                className="h-8 text-xs bg-gray-50 dark:bg-gray-900/50 border-transparent focus:border-blue-500/50 transition-all rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateItem();
                }}
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreateItem}
              disabled={!checklistInput.trim()}
              className="h-8 px-3 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
            >
              ADD
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}