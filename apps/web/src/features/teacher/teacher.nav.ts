import type { WorkspaceNavItem } from "../../components/WorkspaceNav";

export const TEACHER_NAV: WorkspaceNavItem[] = [
  { to: "/", icon: "overview", label: "teacher.nav.overview" },
  { to: "/groups", icon: "groups", label: "teacher.groups" },
  { to: "/lessons", icon: "lessons", label: "teacher.lessons" },
  { to: "/profile", icon: "user", label: "nav.profile" },
];
