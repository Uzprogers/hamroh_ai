import type { WorkspaceNavItem } from "../../components/WorkspaceNav";

export const STUDENT_NAV: WorkspaceNavItem[] = [
  { to: "/", icon: "overview", label: "student.nav.overview" },
  { to: "/lessons", icon: "lessons", label: "student.myLessons" },
  { to: "/results", icon: "stats", label: "student.myResults" },
  { to: "/profile", icon: "user", label: "nav.profile" },
];
