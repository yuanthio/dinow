"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";

interface InviteMemberDialogProps {
  boardId: string;
  onMemberAdded?: () => void;
  children?: React.ReactNode;
}

type AccessRole = "OWNER" | "EDITOR" | "VIEWER";

const roleOptions = [
  { value: "EDITOR" as AccessRole, label: "Editor", description: "Can edit cards and columns" },
  { value: "VIEWER" as AccessRole, label: "Viewer", description: "Can only view the board" },
];

export default function InviteMemberDialog({ 
  boardId, 
  onMemberAdded,
  children 
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccessRole>("EDITOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!role) {
      setError("Role is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/boards/${boardId}/access/member`, {
        recipientEmail: email.trim(),
        targetRole: role,
      });

      if (response.data) {
        // Reset form
        setEmail("");
        setRole("EDITOR");
        setOpen(false);
        
        // Callback to refresh members list
        if (onMemberAdded) {
          onMemberAdded();
        }
      }
    } catch (error: any) {
      console.error("Error adding member:", error);
      setError(error.response?.data?.error || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setRole("EDITOR");
    setError("");
  };

  // Default trigger button
  const TriggerComponent = children ? (
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2">
        <UserPlus className="w-4 h-4" />
        Invite Member
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {TriggerComponent}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member to Board</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member's email"
              className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Role *
            </label>
            <div className="space-y-2">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(e) => setRole(e.target.value as AccessRole)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
