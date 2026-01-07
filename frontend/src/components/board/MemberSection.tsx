import { BoardDetails } from "./types";

interface MembersSectionProps {
  members: BoardDetails['members'];
}

export default function MembersSection({ members = [] }: MembersSectionProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Members</h3>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <div 
            key={member.user.id} 
            className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
          >
            <span className="font-medium">{member.user.username || `User ${member.user.id}`}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              member.role === 'OWNER' 
                ? 'bg-purple-100 text-purple-700' 
                : member.role === 'EDITOR'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}