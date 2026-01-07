"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit } from "lucide-react";
import {useBoard} from "@/lib/store";
import { Priority, Category, BoardType } from "@/types/board";

const priorityOptions = [
  { value: "HIGH" as Priority, label: "High" },
  { value: "MEDIUM" as Priority, label: "Medium" },
  { value: "LOW" as Priority, label: "Low" },
];

const categoryOptions = [
  { value: "PERSONAL" as Category, label: "Personal" },
  { value: "WORK" as Category, label: "Work" },
  { value: "STUDY" as Category, label: "Study" },
  { value: "HEALTH" as Category, label: "Health" },
  { value: "FINANCE" as Category, label: "Finance" },
  { value: "HOBBY" as Category, label: "Hobby" },
  { value: "OTHER" as Category, label: "Other" },
];

const boardTypeOptions = [
  { value: "template" as BoardType, label: "Template (To Do, Doing, Done)" },
  { value: "custom" as BoardType, label: "Custom (Empty board)" },
];

interface BoardDialogProps {
  mode?: 'create' | 'edit';
  boardId?: number;
  boardData?: {
    name: string;
    priority: Priority;
    category: Category;
    deadline: string;
    type?: BoardType;
  };
  children?: React.ReactNode;
}

const BoardDialog = ({ 
  mode = 'create', 
  boardId, 
  boardData, 
  children 
}: BoardDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    priority: "LOW" as Priority,
    category: "PERSONAL" as Category,
    deadline: "",
    type: "template" as BoardType,
  });
  const [loading, setLoading] = useState(false);

  const createBoard = useBoard((state) => state.createBoard);
  const updateBoard = useBoard((state) => state.updateBoard);
  const fetchBoards = useBoard((state) => state.fetchBoards);

  // Isi form dengan data board jika mode edit
  useEffect(() => {
    if (mode === 'edit' && boardData && open) {
      setFormData({
        name: boardData.name || "",
        priority: boardData.priority || "LOW",
        category: boardData.category || "PERSONAL",
        deadline: boardData.deadline ? boardData.deadline.split('T')[0] : "",
        type: boardData.type || "template",
      });
    }
    
    // Reset form jika mode create
    if (mode === 'create' && open) {
      setFormData({
        name: "",
        priority: "LOW",
        category: "PERSONAL",
        deadline: "",
        type: "template",
      });
    }
  }, [open, mode, boardData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Board name is required");
      return;
    }

    setLoading(true);
    try {
      // Siapkan data untuk dikirim ke backend
      const boardPayload = {
        name: formData.name,
        priority: formData.priority,
        category: formData.category,
        deadline: formData.deadline || undefined,
        type: formData.type,
      };

      let result;
      if (mode === 'create') {
        result = await createBoard(boardPayload);
        if (!result.success) {
          throw new Error(result.message || "Failed to create board");
        }
      } else if (mode === 'edit' && boardId) {
        // Untuk edit, kita tidak mengirim type karena board sudah dibuat
        const editPayload = {
          name: formData.name,
          priority: formData.priority,
          category: formData.category,
          deadline: formData.deadline || undefined,
        };
        result = await updateBoard(boardId, editPayload);
        if (!result.success) {
          throw new Error(result.message || "Failed to update board");
        }
      }
      
      // Refresh list boards
      await fetchBoards();
      
      // Tutup dialog
      setOpen(false);
    } catch (error: any) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} board:`, error);
      alert(error.message || `Failed to ${mode === 'create' ? 'create' : 'update'} board`);
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle = mode === 'create' ? "Create New Board" : "Edit Board";
  const submitButtonText = loading 
    ? (mode === 'create' ? "Creating..." : "Updating...") 
    : (mode === 'create' ? "Create Board" : "Update Board");

  // Jika ada children, gunakan sebagai trigger
  const TriggerComponent = children ? (
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      {mode === 'create' ? (
        <button className="flex items-center gap-3 px-6 py-3 text-white font-medium hover:bg-green-600 rounded-xl border bg-green-500 transition">
          <Plus />
          Create Board
        </button>
      ) : (
        <button className="flex items-center gap-2 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg border border-blue-200 transition">
          <Edit className="w-4 h-4" />
          Edit
        </button>
      )}
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {TriggerComponent}

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Board Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Board Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter board name"
              className="w-full border p-3 rounded-lg"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Board Type (only for create) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Board Type
              </label>
              <select
                name="type"
                className="w-full border p-3 rounded-lg"
                value={formData.type}
                onChange={handleChange}
              >
                {boardTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-sm">
                {formData.type === 'template' ? (
                  <div className="text-green-600 bg-green-50 p-2 rounded">
                    ✓ Board will be created with default columns: To Do, Doing, Done
                  </div>
                ) : (
                  <div className="text-blue-600 bg-blue-50 p-2 rounded">
                    ✓ Empty board, you can add columns as needed
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Priority
            </label>
            <select
              name="priority"
              className="w-full border p-3 rounded-lg"
              value={formData.priority}
              onChange={handleChange}
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              name="category"
              className="w-full border p-3 rounded-lg"
              value={formData.category}
              onChange={handleChange}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Deadline (Optional)
            </label>
            <input
              type="date"
              name="deadline"
              className="w-full border p-3 rounded-lg"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 w-full text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitButtonText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoardDialog;
