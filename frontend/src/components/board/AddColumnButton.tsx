import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Column } from "./types";

interface AddColumnButtonProps {
  isDraggingColumn: boolean;
  columns: Column[];
  onAddColumn: () => void;
  onColumnDrop: (e: React.DragEvent, columnId: number) => void;
}

export default function AddColumnButton({
  isDraggingColumn,
  columns,
  onAddColumn,
  onColumnDrop
}: AddColumnButtonProps) {
  return (
    <div 
      className="min-w-[320px] max-w-[320px] flex items-center justify-center"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-blue-400");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove("border-blue-400");
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (columns.length > 0) {
          const lastColumn = columns[columns.length - 1];
          onColumnDrop(e, lastColumn.id);
        }
      }}
    >
      <div className="w-full h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 hover:border-blue-400 hover:bg-blue-50/20 transition-colors">
        <Plus className="w-10 h-10 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-1">Add new column</p>
        <p className="text-gray-500 text-sm text-center mb-4">
          {isDraggingColumn ? "Drop column here" : "Or drag column to reorder"}
        </p>
        <Button
          variant="outline"
          onClick={onAddColumn}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Column
        </Button>
      </div>
    </div>
  );
}