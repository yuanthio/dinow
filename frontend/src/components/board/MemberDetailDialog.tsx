"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MemberDetailDialogProps {
  member: {
    user: {
      id: number;
      username: string | null;
      email?: string;
    };
    role: string;
  };
  children: React.ReactNode;
}

export default function MemberDetailDialog({ member, children }: MemberDetailDialogProps) {
  const getInitials = (username: string | null, email?: string) => {
    // Use email as fallback if username is null
    const name = username || email || `User`;
    return name.charAt(0).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "EDITOR":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "VIEWER":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Full access to all board features";
      case "EDITOR":
        return "Can edit cards and columns";
      case "VIEWER":
        return "Can only view the board";
      default:
        return "Limited access";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {getInitials(member.user.username, member.user.email)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {member.user.username || member.user.email || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500">
                {member.user.email || 'No email available'}
              </p>
            </div>
          </div>

          {/* Role Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Role & Permissions</h4>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 font-medium border rounded-full ${getRoleColor(member.role)}`}>
                {member.role}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {getRoleDescription(member.role)}
            </p>
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Member Since:</span>
                <span className="text-gray-900">Board created</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Actions (for future implementation) */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              Member management options available to board owners
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
