import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateColumnDialogProps {
  isOpen: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (value: string) => void;
  onCreate: () => void;
}

export default function CreateColumnDialog({
  isOpen,
  title,
  onOpenChange,
  onTitleChange,
  onCreate
}: CreateColumnDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Column</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Input
            placeholder="Column title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreate();
              if (e.key === 'Escape') onOpenChange(false);
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={onCreate}
              className="flex-1"
            >
              Create Column
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}