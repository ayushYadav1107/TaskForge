import {
  CheckSquare,
  Building2,
  History,
  LayoutGrid,
  ListTodo,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Single-key shortcut, pressed after `g` (g-then-o for Overview, vim style). */
  shortcut?: string;
  managerOnly?: boolean;
  adminOnly?: boolean;
  title: string;
  subtitle: string;
}

/** One source of truth for the sidebar, the command palette, and page titles. */
export const NAV_ITEMS: NavItem[] = [
  {
    to: "/overview",
    label: "Overview",
    icon: LayoutGrid,
    shortcut: "G O",
    managerOnly: true,
    title: "Overview",
    subtitle: "How the workspace is tracking",
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: ListTodo,
    shortcut: "G T",
    managerOnly: true,
    title: "Tasks",
    subtitle: "Create work and assign it",
  },
  {
    to: "/employees",
    label: "People",
    icon: Users,
    shortcut: "G P",
    managerOnly: true,
    title: "People",
    subtitle: "Everyone with an account",
  },
  {
    to: "/departments",
    label: "Departments",
    icon: Building2,
    shortcut: "G D",
    managerOnly: true,
    title: "Departments",
    subtitle: "How the organisation is divided",
  },
  {
    to: "/activity",
    label: "Audit log",
    icon: History,
    shortcut: "G A",
    adminOnly: true,
    title: "Audit log",
    subtitle: "Every change, who made it, and when",
  },
  {
    to: "/my-tasks",
    label: "My tasks",
    icon: CheckSquare,
    shortcut: "G M",
    title: "My tasks",
    subtitle: "Everything currently on your plate",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: User,
    title: "Profile",
    subtitle: "Your account details and password",
  },
];

export function metaFor(pathname: string) {
  return (
    NAV_ITEMS.find((item) => item.to === pathname) ?? {
      title: "TaskForge",
      subtitle: "",
    }
  );
}
