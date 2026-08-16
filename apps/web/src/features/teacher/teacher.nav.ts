import type { NavIconName } from "../../components/NavIcon";
import type { TranslationKey } from "../../i18n/dictionary";

export interface TeacherNavItem {
  to: string;
  icon: NavIconName;
  label: TranslationKey;
}

export const TEACHER_NAV: TeacherNavItem[] = [
  { to: "/", icon: "overview", label: "teacher.nav.overview" },
  { to: "/groups", icon: "groups", label: "teacher.groups" },
  { to: "/lessons", icon: "lessons", label: "teacher.lessons" },
  { to: "/profile", icon: "stats", label: "nav.profile" },
];
