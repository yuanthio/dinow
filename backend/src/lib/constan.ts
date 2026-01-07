// Indonesian comments: Definisi role AccessRole dari schema.prisma untuk TypeScript
import { AccessRole } from "@prisma/client";

// Indonesian comments: Template column default untuk board baru
export const defaultBoardTemplate = [
    { title: "To Do" },
    { title: "Doing" },
    { title: "Done" },
];

// Indonesian comments: Mendefinisikan hierarki akses untuk RBAC
// OWNER > EDITOR > VIEWER
// Kita gunakan object ini untuk membandingkan role.
// Semakin kecil angkanya, semakin tinggi hak aksesnya.
export const RoleHierarchy: Record<AccessRole, number> = {
    OWNER: 0,
    EDITOR: 1,
    VIEWER: 2,
};