"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  columnId?: number | null; // Ubah ke number | null
  cardData?: {
    id?: number;
    title: string;
    description: string;
  };
  onSubmit: (data: { title: string; description: string }) => Promise<void>;
}

export default function CardDialog({
  open,
  onOpenChange,
  mode,
  columnId,
  cardData,
  onSubmit
}: CardDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && cardData) {
        setTitle(cardData.title);
        setDescription(cardData.description || "");
      } else {
        setTitle("");
        setDescription("");
      }
    }
  }, [open, mode, cardData]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Card title is required");
      return;
    }

    // Untuk mode create, columnId harus ada
    if (mode === 'create' && !columnId) {
      alert("Column ID is required to create a card");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ title, description });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save card:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Card' : 'Edit Card'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new card to your board' 
              : 'Update your card details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter card description (optional)"
              className="min-h-[120px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !title.trim() || (mode === 'create' && !columnId)}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Card' : 'Update Card'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}