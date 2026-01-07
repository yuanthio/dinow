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
import { Label } from "@/components/ui/label";

interface ColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  columnData?: {
    id?: number;
    title: string;
  };
  onSubmit: (data: { title: string }) => Promise<void>;
}

export default function ColumnDialog({
  open,
  onOpenChange,
  mode,
  columnData,
  onSubmit
}: ColumnDialogProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && columnData) {
        setTitle(columnData.title);
      } else {
        setTitle("");
      }
    }
  }, [open, mode, columnData]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Column title is required");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ title });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save column:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Column' : 'Edit Column'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new column to your board' 
              : 'Update your column title'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter column title"
              className="w-full"
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
              disabled={loading || !title.trim()}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Column' : 'Update Column'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}