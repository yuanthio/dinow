import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, GripHorizontal, Trash2, Plus, X } from "lucide-react";
import { Card, ChecklistItem } from "./types";

interface EditCardDialogProps {
  isOpen: boolean;
  cardId: number | null;
  cardData: {
    title: string;
    description: string;
  };
  imageUrl: string | null;
  checklistItems: ChecklistItem[];
  uploadingImage: boolean;
  apiOrigin: string;
  getFallbackCoverClass: (seed: number) => string;
  onClose: () => void;
  onUpdate: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onChecklistToggle: (itemId: number) => void;
  onChecklistUpdate: (itemId: number, text: string) => void;
  onChecklistDelete: (itemId: number) => void;
  onChecklistCreate: (text: string) => void;
  onChecklistDragStart: (e: React.DragEvent, itemId: number, cardId: number) => void;
  onChecklistDragEnd: () => void;
  onChecklistDrop: (targetIndex: number) => void;
}

export default function EditCardDialog({
  isOpen,
  cardId,
  cardData,
  imageUrl,
  checklistItems = [],
  uploadingImage,
  apiOrigin,
  getFallbackCoverClass,
  onClose,
  onUpdate,
  onTitleChange,
  onDescriptionChange,
  onImageUpload,
  onImageRemove,
  onChecklistToggle,
  onChecklistUpdate,
  onChecklistDelete,
  onChecklistCreate,
  onChecklistDragStart,
  onChecklistDragEnd,
  onChecklistDrop
}: EditCardDialogProps) {
  const [checklistInput, setChecklistInput] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showChecklistForm, setShowChecklistForm] = useState(false);

  const progress = {
    total: checklistItems.length,
    completed: checklistItems.filter(item => item.completed).length,
    progress: checklistItems.length > 0 
      ? Math.round((checklistItems.filter(item => item.completed).length / checklistItems.length) * 100)
      : 0
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-l-2", "border-blue-400");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-l-2", "border-blue-400");
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-l-2", "border-blue-400");
    onChecklistDrop(targetIndex);
  };

  const handleCreateItem = () => {
    if (checklistInput.trim()) {
      onChecklistCreate(checklistInput);
      setChecklistInput("");
      setShowChecklistForm(false);
    }
  };

  const handleUpdateItem = (itemId: number) => {
    if (editingText.trim()) {
      onChecklistUpdate(itemId, editingText);
      setEditingItemId(null);
      setEditingText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Card Image */}
          <div className="space-y-3">
            <div className="h-36 rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={`${apiOrigin}${imageUrl}`}
                  alt="Card cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-white font-semibold text-center px-4 ${getFallbackCoverClass(cardId || 0)}`}
                >
                  {cardData.title}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <input
                type="file"
                accept="image/*"
                id="card-image-input"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                  e.currentTarget.value = "";
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById("card-image-input") as HTMLInputElement | null;
                    el?.click();
                  }}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                </Button>
                {imageUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onImageRemove}
                    disabled={uploadingImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Card Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <Input
                value={cardData.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Card title"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea
                value={cardData.description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Card description (optional)"
                rows={3}
                className="w-full"
              />
            </div>
          </div>

          {/* Checklist Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Checklist</h3>
              <Button
                size="sm"
                onClick={() => setShowChecklistForm(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            {/* Checklist Progress */}
            {progress.total > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progress.completed}/{progress.total} ({progress.progress}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checklist Items */}
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                  draggable
                  onDragStart={(e) => cardId && onChecklistDragStart(e, item.id, cardId)}
                  onDragEnd={onChecklistDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <GripHorizontal className="w-4 h-4 text-gray-400 cursor-grab" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onChecklistToggle(item.id)}
                    className="h-6 w-6 p-0"
                  >
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  
                  {editingItemId === item.id ? (
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleUpdateItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateItem(item.id);
                        if (e.key === 'Escape') {
                          setEditingItemId(null);
                          setEditingText("");
                        }
                      }}
                      className="flex-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`flex-1 text-sm cursor-pointer ${
                        item.completed ? 'line-through text-gray-500' : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setEditingItemId(item.id);
                        setEditingText(item.text);
                      }}
                    >
                      {item.text}
                    </span>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onChecklistDelete(item.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Add Checklist Form */}
              {showChecklistForm && (
                <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
                  <Input
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="Add checklist item..."
                    className="flex-1 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateItem();
                      if (e.key === 'Escape') {
                        setShowChecklistForm(false);
                        setChecklistInput("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateItem}
                    disabled={!checklistInput.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowChecklistForm(false);
                      setChecklistInput("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {checklistItems.length === 0 && !showChecklistForm && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No checklist items yet</p>
                  <p className="text-xs mt-1">Click "Add Item" to create one</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onUpdate}
            disabled={!cardData.title.trim()}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}