"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, Calendar, Tag } from "lucide-react";
import { BoardDetails } from "./types";
import InviteMemberDialog from "./InviteMemberDialog";
import MemberDetailDialog from "./MemberDetailDialog";

interface BoardHeaderProps {
  board: BoardDetails;
  onBack: () => void;
  onMemberAdded?: () => void;
}

export default function BoardHeader({
  board,
  onBack,
  onMemberAdded,
}: BoardHeaderProps) {
  return (
    <div className="flex flex-col gap-6 mb-6">
      {/* Back Button - Ringkas di Mobile */}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        {/* Info Section */}
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="group -ml-3 gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {board.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            <span
              className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${
                board.priority === "HIGH"
                  ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : board.priority === "MEDIUM"
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              }`}
            >
              {board.priority}
            </span>

            {/* Category Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-[11px] font-bold uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              {board.category}
            </div>

            {/* Deadline Badge */}
            {board.deadline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-[11px] font-bold uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                {new Date(board.deadline).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
          </div>
        </div>

        {/* Members Section - Avatar Stack Style */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1 md:ml-0">
            Board Members
          </p>
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-3">
              {board.members &&
                board.members.map((member) => (
                  <MemberDetailDialog key={member.user.id} member={member}>
                    <div className="relative z-10 w-9 h-9 border-2 border-white dark:border-gray-950 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 hover:z-20 transition-all shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {(member.user.username || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </MemberDetailDialog>
                ))}
            </div>

            {/* Invite Button */}
            <InviteMemberDialog
              boardId={board.id.toString()}
              onMemberAdded={onMemberAdded}
            >
              <button className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-gray-500 dark:text-gray-400 hover:text-white rounded-full transition-all border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-transparent active:scale-95 shadow-sm">
                <UserPlus size={16} />
              </button>
            </InviteMemberDialog>
          </div>
        </div>
      </div>

      {/* Divider tipis biar clean */}
      <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-800 mt-2" />
    </div>
  );
}
